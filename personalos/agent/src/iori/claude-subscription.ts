import { spawn } from 'child_process';
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

// ============================================
// MODE INSTRUCTIONS
// ============================================

const MODE_INSTRUCTIONS: Record<IoriMode, string> = {
  default: '',
  focus: `FOCUS MODE ACTIVE: Single task deep work. No context switching. 25-minute focused blocks. Minimize distractions.`,
  recovery: `RECOVERY MODE ACTIVE: Low energy day. Easy wins only. Protect energy reserves. Skip hard problems. Be gentle.`,
  hustle: `HUSTLE MODE ACTIVE: Peak energy! Ship fast. Stack wins. Momentum over perfection. Push hard while energy is high.`,
};

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

function buildSystemPrompt(apiContext: ChatContext, mode: IoriMode = 'default'): string {
  const personalContext = getPersonalContext();
  const today = dayjs().format('dddd, MMMM D, YYYY');

  let prompt = `You are Iori, ${apiContext.user_name}'s Personal AI Assistant.

TODAY: ${today}
${MODE_INSTRUCTIONS[mode] ? '\n' + MODE_INSTRUCTIONS[mode] + '\n' : ''}
CORE DIRECTIVES:
- Be concise and action-oriented
- Hunter-brain-friendly: short responses, clear next steps
- Keep responses under 300 words unless asked for detail
- Don't lecture or moralize
- Focus on execution, not planning

CONTEXT FROM PERSONALOS:
${formatContextSummary(personalContext)}

CURRENT STATE:
- Goals: ${apiContext.goals?.length || 0} active
- Tasks: ${apiContext.tasks?.length || 0} pending
- Recent contacts: ${apiContext.contacts?.length || 0}

You can take actions by including action tags in your response:
[ACTION:add_task|{"title":"Task name","priority":"high"}]
[ACTION:complete_task|{"task_id":123}]
[ACTION:update_goal|{"goal_id":123,"current":50}]`;

  return prompt;
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
// CLAUDE CLI PATH FINDER
// ============================================

function findClaudePath(): string {
  const paths = [
    '/opt/homebrew/bin/claude',
    '/usr/local/bin/claude',
    process.env.HOME + '/.npm/bin/claude',
    'claude', // Fallback to PATH
  ];

  // For now, just return the first one - could add existence check
  return paths[0];
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const mode = request.mode || 'default';
  const systemPrompt = buildSystemPrompt(request.context, mode);

  // Build the full prompt
  let fullPrompt = systemPrompt + '\n\n';

  // Add history
  if (request.history && request.history.length > 0) {
    fullPrompt += '--- CONVERSATION HISTORY ---\n';
    for (const msg of request.history.slice(-6)) {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Iori'}: ${msg.content}\n\n`;
    }
    fullPrompt += '--- END HISTORY ---\n\n';
  }

  fullPrompt += `User: ${request.message}\n\nIori:`;

  // Map model to Claude CLI model flag
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-20250514': 'sonnet',
    'claude-3-5-sonnet-20241022': 'sonnet',
    'claude-3-5-haiku-20241022': 'haiku',
    'claude-opus-4-20250514': 'opus',
  };
  const model = request.model ? (modelMap[request.model] || 'sonnet') : 'sonnet';

  console.log('[Iori/Subscription] Mode:', mode, 'Model:', model);

  return new Promise((resolve, reject) => {
    const claudePath = findClaudePath();

    // Build environment that forces subscription auth
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY; // Remove API key to force subscription
    env.CLAUDE_USE_SUBSCRIPTION = 'true';
    env.CLAUDE_BYPASS_BALANCE_CHECK = 'true';

    const args = [
      '--print',           // Non-interactive mode
      '--model', model,    // Use specified model
      '--dangerously-skip-permissions', // Skip permission prompts
      fullPrompt,
    ];

    console.log('[Iori/Subscription] Spawning Claude CLI...');
    const startTime = Date.now();

    const proc = spawn(claudePath, args, {
      env,
      cwd: process.env.HOME,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('error', (error) => {
      console.error('[Iori/Subscription] Process error:', error);
      reject(error);
    });

    proc.on('close', (code) => {
      const elapsed = Date.now() - startTime;
      console.log(`[Iori/Subscription] CLI finished in ${elapsed}ms, code: ${code}`);

      if (code !== 0) {
        console.error('[Iori/Subscription] stderr:', stderr);
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }

      // Parse response
      const { cleanResponse, actions } = parseActions(stdout.trim());

      resolve({
        response: cleanResponse,
        actions,
        usage: {
          input_tokens: 0, // CLI doesn't report tokens
          output_tokens: 0,
          model,
        },
        session_id: request.session_id,
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      proc.kill();
      reject(new Error('Claude CLI timeout'));
    }, 300000);
  });
}

export default { chat };
