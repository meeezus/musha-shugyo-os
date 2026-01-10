import Anthropic from '@anthropic-ai/sdk';
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

  return `You are Iori, ${apiContext.user_name}'s Personal AI Assistant in MSOS (Musha Shugyo OS).

Named after the Japanese concept of "庵" (Iori) - a hermit's hut, representing simplicity, discipline, and focused mastery.
You embody the Musashi philosophy: discipline, execution, sovereignty.

TODAY IS: ${today}

=============================================================================
YOUR ROLE & OPERATING PRINCIPLES
=============================================================================

${personalContext.claude ? personalContext.claude.substring(0, 2000) : 'Help Michael execute despite hunter-brain resistance patterns. Be action-oriented, non-judgmental about resistance, and focused on quick captures.'}

=============================================================================
CONTEXT FROM PERSONALOS
=============================================================================

${contextSummary.substring(0, 1500)}

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
COMMUNICATION STYLE
=============================================================================

- Be concise and direct (hunter-brain-friendly)
- Use natural language, no rigid syntax
- Focus on action over perfect planning
- Non-judgmental about resistance or procrastination
- Keep responses under 300 words unless more detail is needed

NOTE: In this mode, you are a conversational assistant without file access. For coding tasks, suggest Michael use Claude Code directly.
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
// ANTHROPIC CLIENT
// ============================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in environment');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const mode = request.mode || 'default';
  const systemPrompt = buildSystemPrompt(request.context, mode);

  // Map model IDs to Anthropic model names
  const modelMap: Record<string, string> = {
    'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022',
    'claude-opus-4-20250514': 'claude-opus-4-20250514',
  };
  const model = request.model ? (modelMap[request.model] || request.model) : 'claude-sonnet-4-20250514';

  console.log('[Iori/Anthropic] Mode:', mode, 'Model:', model);

  // Build messages array
  const messages: Anthropic.MessageParam[] = [];

  // Add history
  if (request.history && request.history.length > 0) {
    for (const msg of request.history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add current message
  messages.push({
    role: 'user',
    content: request.message,
  });

  try {
    const client = getAnthropicClient();

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    // Extract text from response
    let result = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        result += block.text;
      }
    }

    // Parse out any actions
    const { cleanResponse, actions } = parseActions(result);

    return {
      response: cleanResponse,
      actions,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        model,
      },
      session_id: request.session_id,
    };

  } catch (error) {
    console.error('[Iori/Anthropic] Chat error:', error);
    throw error;
  }
}

// ============================================
// EXPORT
// ============================================

export default { chat };
