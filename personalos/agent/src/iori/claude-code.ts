import { spawn, execSync } from 'child_process';
import { getPersonalContext, formatContextSummary } from '../utils/markdown-parser';
import dayjs from 'dayjs';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RecentSession {
  session_id: string;
  started_at: string;
  preview: string;
  message_count: number;
}

interface ChatContext {
  goals: any[];
  tasks: any[];
  contacts: any[];
  user_name: string;
  recent_sessions?: RecentSession[];
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

interface ClaudeCodeResult {
  type: string;
  subtype?: string;
  result?: string;
  session_id?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  cost_usd?: number;
  duration_ms?: number;
  is_error?: boolean;
}

// ============================================
// MODE INSTRUCTIONS
// ============================================

const MODE_INSTRUCTIONS: Record<IoriMode, string> = {
  default: '',

  focus: `
=============================================================================
FOCUS MODE ACTIVE
=============================================================================

You are in FOCUS MODE - single task, deep work.

**Operating Principles:**
1. ONE TASK ONLY: Help maintain focus on a single task until completion
2. BLOCK DISTRACTIONS: Gently redirect if tangent topics arise
3. RESISTANCE LOGGING: If resistance appears, acknowledge and log it
4. 25-MIN BLOCKS: Suggest Pomodoro-style work blocks
5. EVIDENCE BUILDING: Celebrate each completion

**Behavior:**
- Ask: "What's the ONE thing you're focusing on?"
- Track time on task
- Redirect scope creep: "Good idea - I logged that for later. Back to [task]."
- When blocked: "What's the smallest next step?"
- On completion: "Done! That's evidence you can execute."

**Anti-Patterns:**
- Don't suggest "while you're at it..."
- Don't introduce new ideas mid-task
- Don't over-plan
`,

  recovery: `
=============================================================================
RECOVERY MODE ACTIVE
=============================================================================

You are in RECOVERY MODE - Oura shows low readiness or user is tired.

**Operating Principles:**
1. EASY WINS ONLY: Suggest tasks that require minimal energy
2. NO HARD PROBLEMS: Postpone complex decisions
3. PROTECT ENERGY: Short tasks, frequent breaks
4. GUILT-FREE REST: Validate that rest is productive
5. CAPTURE, DON'T EXECUTE: Log ideas for high-energy days

**Task Suggestions:**
- Email inbox zero (delete/archive only)
- File organization
- Reading/research (no decisions)
- Easy admin tasks
- Scheduling future tasks

**Response Style:**
- Calm, supportive
- "That can wait until you're rested"
- "Let's just capture that for later"
- "What's the easiest thing on your list?"

**Burnout Prevention:**
- Suggest stopping after 2 hours max
- No guilt about low output
- Celebrate small wins extra hard
`,

  hustle: `
=============================================================================
HUSTLE MODE ACTIVE
=============================================================================

Today is a PEAK DAY. Capitalize on high energy.

**Operating Principles:**
1. SHIP FAST: Bias toward "good enough" over perfect
2. PARALLEL PROGRESS: Work on multiple things if blocked
3. MOMENTUM > PLANNING: Execute, don't strategize
4. STACK WINS: Each completion fuels the next
5. CAPTURE EVIDENCE: Log accomplishments for "I CAN" proof

**Behavior:**
- Push for completion: "Ship it!"
- Keep energy high: "That's 3 wins. Keep going?"
- Quick decisions: "Good enough - moving on"
- 45-minute power blocks
- Celebrate EVERY completion

**Response Style:**
- Energetic, action-oriented
- Short, punchy responses
- "Done. Next?"
- "Ship it!"
- "Good enough - moving on"

**End-of-Day Protocol:**
- Summarize all wins
- Celebrate output
- Hard stop at declared end time
`,
};

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

function buildSystemPrompt(apiContext: ChatContext, mode: IoriMode = 'default'): string {
  const personalContext = getPersonalContext();
  const contextSummary = formatContextSummary(personalContext);
  const today = dayjs().format('dddd, MMMM D, YYYY');

  const goals = apiContext.goals || [];
  const tasks = apiContext.tasks || [];
  const contacts = apiContext.contacts || [];

  const goalsFormatted = goals.length > 0
    ? goals.map(g => `- ${g.title}: ${g.current}/${g.target} ${g.unit || ''}`).join('\n')
    : 'No goals set';

  const tasksFormatted = tasks.length > 0
    ? tasks.map(t => `- [${t.priority?.toUpperCase() || 'MEDIUM'}] ${t.title}${t.due_date ? ` (due: ${t.due_date})` : ''}`).join('\n')
    : 'No pending tasks';

  const contactsFormatted = contacts.length > 0
    ? contacts.slice(0, 5).map(c => `- ${c.name}${c.last_contact ? ` (last: ${dayjs(c.last_contact).format('MMM D')})` : ''}`).join('\n')
    : 'No recent contacts';

  const recentSessions = apiContext.recent_sessions || [];
  const conversationHistory = recentSessions.length > 0
    ? recentSessions.map(s => {
        const sessionDate = dayjs(s.started_at).format('MMM D, h:mm A');
        return `- [${sessionDate}] "${s.preview}" (${s.message_count} messages)`;
      }).join('\n')
    : 'No previous conversations';

  return `You are Iori, ${apiContext.user_name}'s Personal AI Assistant in MSOS (Musha Shugyo OS).

Named after the Japanese concept of "庵" (Iori) - a hermit's hut, representing simplicity, discipline, and focused mastery.
You embody the Musashi philosophy: discipline, execution, sovereignty.

TODAY IS: ${today}

=============================================================================
YOUR ROLE & OPERATING PRINCIPLES
=============================================================================

${personalContext.claude ? personalContext.claude.substring(0, 2500) : 'Help Michael execute despite hunter-brain resistance patterns. Be action-oriented, non-judgmental about resistance, and focused on quick captures (30 seconds or less).'}

=============================================================================
CONTEXT FROM PERSONALOS (5 LAYERS)
=============================================================================

${contextSummary}

=============================================================================
LIVE DASHBOARD DATA
=============================================================================

**GOALS:**
${goalsFormatted}

**PENDING TASKS:**
${tasksFormatted}

**RECENT CONTACTS:**
${contactsFormatted}

=============================================================================
RECENT CONVERSATIONS
=============================================================================

These are your recent conversations with ${apiContext.user_name}. Use this context to maintain continuity and reference past discussions when relevant:

${conversationHistory}

=============================================================================
YOUR CAPABILITIES (AGENTIC MODE)
=============================================================================

You have FULL AGENTIC capabilities. You can:
1. READ files anywhere in ~/PersonalOS or other directories Michael specifies
2. WRITE and EDIT files to make changes
3. RUN commands to build, test, or execute code
4. Search the codebase with Glob and Grep
5. Discuss goals, tasks, priorities, and strategy
6. Adding new tasks to the system
7. Logging observations and patterns
8. Creating episode logs to capture session context
9. Updating goal progress
10. Providing accountability and motivation

**IMPORTANT**: When Michael asks you to look at files, implement features, or make changes - DO IT. You have full access to read, write, and execute. Don't just describe what you would do - actually do it.

When you need to take an action (modify PersonalOS data), include it in your response using this format:
[ACTION:add_task|{"title":"Task title","priority":"high"}]
[ACTION:complete_task|{"task_id":123}]
[ACTION:update_goal|{"goal_id":456,"current":50}]
[ACTION:log_observation|{"content":"Pattern noticed..."}]
[ACTION:create_episode|{"title":"Session title","content":"What happened..."}]

Only include actions when the user explicitly asks you to do something (add a task, log something, etc.).
For regular conversation, just respond naturally without actions.

=============================================================================
HANDLING LARGE REQUESTS
=============================================================================

When Michael asks for complex, multi-part tasks (e.g., "integrate this into all dashboard sections", "update everything", "implement the full plan"), BREAK IT DOWN:

1. **Acknowledge the scope**: "That's a multi-step task. Let me break it down."
2. **Propose incremental steps**: "Let's start with [specific first step]. Ready?"
3. **Complete one piece at a time**: Finish each step before moving to the next
4. **Confirm before continuing**: "Done with X. Want me to continue with Y?"

This prevents timeouts and gives you control over the pace.

Example:
- Request: "Integrate the agency plan into dashboard - Projects, Schedule, Relationships, Knowledge"
- Response: "Let me start with the Projects section first. I'll read the plan and add the projects to your dashboard. Ready?"

=============================================================================
COMMUNICATION STYLE
=============================================================================

- Be concise and direct (hunter-brain-friendly)
- Use natural language, no rigid syntax
- Focus on action over perfect planning
- Non-judgmental about resistance or procrastination
- When resistance is mentioned, acknowledge it and log it if appropriate
- Reference context from the 5 layers when relevant
- Keep responses under 300 words unless more detail is needed
${MODE_INSTRUCTIONS[mode]}`;
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
    } catch (e) {
      console.error('Failed to parse action:', match[0]);
    }
  }

  const cleanResponse = response.replace(actionRegex, '').trim();
  return { cleanResponse, actions };
}

// ============================================
// KEYCHAIN CREDENTIALS HELPER
// ============================================

function ensureCredentialsFile(): void {
  const credentialsPath = path.join('/Users/michaelenriquez/.claude', '.credentials.json');

  // Check if credentials file exists and is recent (less than 1 hour old)
  try {
    const stats = fs.statSync(credentialsPath);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < 3600000) {
      // Credentials file is fresh, no need to update
      return;
    }
  } catch {
    // File doesn't exist, need to create it
  }

  // Extract credentials from macOS Keychain
  try {
    const keychainData = execSync(
      'security find-generic-password -s "Claude Code-credentials" -w',
      { encoding: 'utf-8' }
    ).trim();

    // Write to credentials file so Claude Code can read it
    fs.writeFileSync(credentialsPath, keychainData, { mode: 0o600 });
    console.log('[Iori/ClaudeCode] Extracted credentials from Keychain');
  } catch (error) {
    console.error('[Iori/ClaudeCode] Failed to extract Keychain credentials:', error);
  }
}

// ============================================
// CLAUDE CODE EXECUTION
// ============================================

async function executeClaudeCode(
  prompt: string,
  systemPrompt: string,
  sessionId?: string,
  model?: string
): Promise<{ result: string; usage?: any; sessionId?: string }> {
  // Build a concise context (truncate if needed to avoid CLI arg limits)
  const contextSummary = systemPrompt.length > 2000
    ? systemPrompt.substring(0, 2000) + '\n...[context truncated]'
    : systemPrompt;

  // Map model IDs to Claude Code model aliases
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-20250514': 'sonnet',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022': 'haiku',
    'claude-opus-4-20250514': 'opus',
  };
  const mappedModel = model ? (modelMap[model] || model) : 'sonnet';

  // Define allowed tools for agentic capabilities
  const allowedTools = [
    'Read',
    'Write',
    'Edit',
    'Bash',
    'Glob',
    'Grep',
    'TodoWrite',
  ].join(',');

  // Build command args
  const args = [
    '--print',
    '--output-format', 'json',
    '--model', mappedModel,
    '--allowedTools', allowedTools,
    '--add-dir', '/Users/michaelenriquez/business',
    '--add-dir', '/Users/michaelenriquez/PersonalOS',
    '--append-system-prompt',
    `You are Iori, Michael's personal AI assistant. Be concise and helpful. Context:\n${contextSummary}`,
  ];

  // Add session ID for conversation continuity
  if (sessionId) {
    args.push('--session-id', sessionId);
  }

  // Note: With --print, the prompt is passed via stdin, not as argument
  console.log('[Iori/ClaudeCode] Executing with model:', mappedModel, 'prompt length:', prompt.length);

  // Ensure credentials file exists (extract from Keychain if needed)
  ensureCredentialsFile();

  return new Promise((resolve, reject) => {
    // Create minimal env - only pass what's needed, explicitly exclude API key
    const cleanEnv: Record<string, string> = {
      HOME: '/Users/michaelenriquez',
      USER: 'michaelenriquez',
      LOGNAME: 'michaelenriquez',
      PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin',
      SHELL: '/bin/zsh',
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
    };

    console.log('[Iori/ClaudeCode] Using minimal env, HOME:', cleanEnv.HOME);
    console.log('[Iori/ClaudeCode] Calling:', '/opt/homebrew/bin/claude', args.slice(0, 3).join(' '));
    console.log('[Iori/ClaudeCode] Full env keys:', Object.keys(cleanEnv).join(', '));
    console.log('[Iori/ClaudeCode] ANTHROPIC_API_KEY in cleanEnv:', !!cleanEnv.ANTHROPIC_API_KEY);

    const proc = spawn('/opt/homebrew/bin/claude', args, {
      cwd: '/Users/michaelenriquez',
      env: cleanEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Write prompt to stdin and close it
    proc.stdin.on('error', (err) => {
      console.error('[Iori/ClaudeCode] stdin error:', err.message);
    });
    proc.stdin.write(prompt);
    proc.stdin.end();

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set a 10-minute timeout (complex agentic operations like dashboard integration need time)
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Claude Code execution timed out after 10 minutes. Try breaking down complex requests into smaller steps.'));
    }, 600000);

    proc.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0 && !stdout.trim()) {
        console.error('[Iori/ClaudeCode] Process exited with code:', code);
        console.error('[Iori/ClaudeCode] stderr:', stderr);
        reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
        return;
      }

      // Parse the JSON output
      const lines = stdout.trim().split('\n');
      let result = '';
      let usage: any = undefined;
      let returnedSessionId: string | undefined = undefined;

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed: ClaudeCodeResult = JSON.parse(line);

          if (parsed.type === 'result') {
            result = parsed.result || '';
            returnedSessionId = parsed.session_id;
            if (parsed.usage) {
              usage = {
                input_tokens: parsed.usage.input_tokens,
                output_tokens: parsed.usage.output_tokens,
                model: mappedModel,
              };
            }
          } else if (parsed.type === 'assistant' && parsed.subtype === 'text') {
            result += parsed.result || '';
          }
        } catch {
          // Not JSON, might be plain text
          result += line;
        }
      }

      resolve({ result, usage, sessionId: returnedSessionId });
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      console.error('[Iori/ClaudeCode] spawn error:', error.message);
      reject(error);
    });
  });
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  console.log('[Iori/ClaudeCode] ===== CHAT FUNCTION CALLED =====');
  const mode = request.mode || 'default';
  const systemPrompt = buildSystemPrompt(request.context, mode);

  console.log('[Iori/ClaudeCode] Mode:', mode);

  // Build conversation context from history
  let conversationContext = '';
  if (request.history && request.history.length > 0) {
    conversationContext = request.history
      .map(msg => `${msg.role === 'user' ? 'User' : 'Iori'}: ${msg.content}`)
      .join('\n\n');
    conversationContext += '\n\n';
  }

  const fullPrompt = conversationContext + request.message;

  try {
    const { result, usage, sessionId } = await executeClaudeCode(
      fullPrompt,
      systemPrompt,
      request.session_id,
      request.model
    );

    // Parse out any actions
    const { cleanResponse, actions } = parseActions(result);

    return {
      response: cleanResponse,
      actions,
      usage,
      session_id: sessionId,
    };

  } catch (error) {
    console.error('[Iori/ClaudeCode] Chat error:', error);
    throw error;
  }
}

// ============================================
// EXPORT
// ============================================

export default { chat };
