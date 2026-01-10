import { spawn, ChildProcess } from 'child_process';
import { getPersonalContext, formatContextSummary } from '../utils/markdown-parser';
import dayjs from 'dayjs';

// ============================================
// TYPES
// ============================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  goals: any[];
  tasks: any[];
  contacts: any[];
  user_name: string;
  recent_sessions?: any[];
}

type IoriMode = 'default' | 'focus' | 'recovery' | 'hustle';

interface ChatRequest {
  message: string;
  history: Message[];
  context: ChatContext;
  model?: string;
  session_id?: string;
  mode?: IoriMode;
}

interface Action {
  type: string;
  data: Record<string, any>;
}

interface ChatResponse {
  response: string;
  actions: Action[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    model: string;
  };
  session_id?: string;
}

interface StreamMessage {
  type: string;
  subtype?: string;
  result?: string;
  session_id?: string;
  message?: string;
  content?: string;
}

// ============================================
// PERSISTENT CLAUDE CODE PROCESS
// ============================================

let claudeProcess: ChildProcess | null = null;
let isProcessReady = false;
let pendingRequests: Map<string, {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  buffer: string;
}> = new Map();

function startClaudeProcess(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (claudeProcess && isProcessReady) {
      resolve();
      return;
    }

    console.log('[Iori/Persistent] Starting Claude Code process...');

    // Start Claude Code in streaming JSON mode for bidirectional communication
    claudeProcess = spawn('/opt/homebrew/bin/claude', [
      '--input-format', 'stream-json',
      '--output-format', 'stream-json',
      '--verbose',
      '--model', 'sonnet',
      '--add-dir', '/Users/michaelenriquez/business',
      '--add-dir', '/Users/michaelenriquez/PersonalOS',
      '--dangerously-skip-permissions',
    ], {
      cwd: '/Users/michaelenriquez',
      stdio: ['pipe', 'pipe', 'pipe'],
      // Inherit environment but remove ANTHROPIC_API_KEY to force OAuth
      env: (() => {
        const env = { ...process.env };
        console.log('[Iori/Persistent] Before delete, ANTHROPIC_API_KEY:', env.ANTHROPIC_API_KEY?.substring(0, 20) || 'NOT SET');
        delete env.ANTHROPIC_API_KEY;
        console.log('[Iori/Persistent] After delete, ANTHROPIC_API_KEY:', env.ANTHROPIC_API_KEY || 'DELETED');
        console.log('[Iori/Persistent] HOME:', env.HOME);
        return env;
      })(),
    });

    let startupBuffer = '';
    let startupTimeout: NodeJS.Timeout;

    // Handle stdout - parse streaming JSON messages
    claudeProcess.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();

      // During startup, wait for ready signal
      if (!isProcessReady) {
        startupBuffer += chunk;
        // Claude Code sends a system message when ready
        if (startupBuffer.includes('"type":"system"') || startupBuffer.includes('"type":"result"')) {
          isProcessReady = true;
          clearTimeout(startupTimeout);
          console.log('[Iori/Persistent] Claude Code process ready');
          resolve();
        }
        return;
      }

      // Parse incoming messages and route to pending requests
      const lines = chunk.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const msg: StreamMessage = JSON.parse(line);
          handleStreamMessage(msg);
        } catch {
          // Not JSON, ignore
        }
      }
    });

    claudeProcess.stderr?.on('data', (data: Buffer) => {
      console.error('[Iori/Persistent] stderr:', data.toString());
    });

    claudeProcess.on('error', (error) => {
      console.error('[Iori/Persistent] Process error:', error);
      isProcessReady = false;
      claudeProcess = null;
      reject(error);
    });

    claudeProcess.on('exit', (code) => {
      console.log('[Iori/Persistent] Process exited with code:', code);
      isProcessReady = false;
      claudeProcess = null;
    });

    // Timeout for startup
    startupTimeout = setTimeout(() => {
      if (!isProcessReady) {
        console.log('[Iori/Persistent] Startup timeout, assuming ready');
        isProcessReady = true;
        resolve();
      }
    }, 5000);
  });
}

function handleStreamMessage(msg: StreamMessage) {
  // For now, we'll use a simple approach - accumulate all messages for the current request
  // In a more complex implementation, we'd track request IDs

  if (msg.type === 'assistant' && msg.subtype === 'text') {
    // Accumulate text content
    for (const [id, req] of pendingRequests) {
      req.buffer += msg.message || msg.content || '';
    }
  } else if (msg.type === 'result') {
    // Final result - resolve the pending request
    for (const [id, req] of pendingRequests) {
      const finalResponse = msg.result || req.buffer;
      req.resolve(finalResponse);
      pendingRequests.delete(id);
    }
  }
}

async function sendMessage(message: string): Promise<string> {
  if (!claudeProcess || !isProcessReady) {
    await startClaudeProcess();
  }

  return new Promise((resolve, reject) => {
    const requestId = Date.now().toString();

    pendingRequests.set(requestId, {
      resolve,
      reject,
      buffer: '',
    });

    // Send message in stream-json format
    const streamMsg = JSON.stringify({
      type: 'user',
      message: message,
    }) + '\n';

    console.log('[Iori/Persistent] Sending message:', message.substring(0, 50) + '...');

    claudeProcess!.stdin?.write(streamMsg, (err) => {
      if (err) {
        pendingRequests.delete(requestId);
        reject(err);
      }
    });

    // Timeout for response
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        const req = pendingRequests.get(requestId)!;
        pendingRequests.delete(requestId);
        if (req.buffer) {
          resolve(req.buffer); // Return partial response if we got any
        } else {
          reject(new Error('Request timeout'));
        }
      }
    }, 300000); // 5 minute timeout
  });
}

// ============================================
// MODE INSTRUCTIONS (same as before)
// ============================================

const MODE_INSTRUCTIONS: Record<IoriMode, string> = {
  default: '',
  focus: `FOCUS MODE: Single task, deep work. Block distractions, 25-min blocks.`,
  recovery: `RECOVERY MODE: Easy wins only, protect energy, no hard problems.`,
  hustle: `HUSTLE MODE: Peak day! Ship fast, stack wins, momentum over planning.`,
};

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

function buildSystemPrompt(apiContext: ChatContext, mode: IoriMode = 'default'): string {
  const personalContext = getPersonalContext();
  const today = dayjs().format('dddd, MMMM D, YYYY');

  return `You are Iori, ${apiContext.user_name}'s Personal AI Assistant.
TODAY: ${today}
${MODE_INSTRUCTIONS[mode]}
Be concise, action-oriented, hunter-brain-friendly. Keep responses under 300 words.`;
}

// ============================================
// ACTION PARSER
// ============================================

function parseActions(response: string): { cleanResponse: string; actions: Action[] } {
  const actionRegex = /\[ACTION:(\w+)\|({[^}]+})\]/g;
  const actions: Action[] = [];
  let match;

  while ((match = actionRegex.exec(response)) !== null) {
    try {
      const type = match[1]!;
      const data = JSON.parse(match[2]!);
      actions.push({ type, data });
    } catch {
      // Ignore parse errors
    }
  }

  const cleanResponse = response.replace(actionRegex, '').trim();
  return { cleanResponse, actions };
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  console.log('[Iori/Persistent] ===== CHAT FUNCTION CALLED =====');
  const mode = request.mode || 'default';
  const systemContext = buildSystemPrompt(request.context, mode);

  // Build the full prompt with context
  let fullPrompt = systemContext + '\n\n';

  // Add history if present
  if (request.history && request.history.length > 0) {
    for (const msg of request.history.slice(-4)) { // Last 4 messages for context
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Iori'}: ${msg.content}\n\n`;
    }
  }

  fullPrompt += `User: ${request.message}`;

  try {
    const response = await sendMessage(fullPrompt);
    const { cleanResponse, actions } = parseActions(response);

    return {
      response: cleanResponse,
      actions,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        model: 'sonnet',
      },
      session_id: request.session_id,
    };
  } catch (error) {
    console.error('[Iori/Persistent] Chat error:', error);
    throw error;
  }
}

// ============================================
// INITIALIZE ON IMPORT
// ============================================

// Start the process when this module is loaded
startClaudeProcess().catch(err => {
  console.error('[Iori/Persistent] Failed to start Claude process:', err);
});

export default { chat };
