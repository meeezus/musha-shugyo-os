import Anthropic from '@anthropic-ai/sdk';
import { getPersonalContext, formatContextSummary } from '../utils/markdown-parser';
import { writeEpisodeLog, appendObservation } from '../utils/file-writer';
import dayjs from 'dayjs';

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

interface ImageData {
  data: string; // base64 encoded
  media_type: string;
}

interface ChatRequest {
  message: string;
  history: Message[];
  context: ChatContext;
  model?: string;
  image?: ImageData;
  images?: ImageData[]; // Support for multiple images
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
}

// ============================================
// ANTHROPIC CLIENT
// ============================================

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

function buildSystemPrompt(apiContext: ChatContext): string {
  // Load the 5-layer context from markdown files
  const personalContext = getPersonalContext();
  const contextSummary = formatContextSummary(personalContext);

  const today = dayjs().format('dddd, MMMM D, YYYY');

  // Format API data with null safety
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

  // Format recent conversation history
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
YOUR CAPABILITIES
=============================================================================

You can help ${apiContext.user_name} by:
1. Discussing goals, tasks, priorities, and strategy
2. Adding new tasks to the system
3. Logging observations and patterns
4. Creating episode logs to capture session context
5. Updating goal progress
6. Providing accountability and motivation

When you need to take an action (modify data), include it in your response using this format:
[ACTION:add_task|{"title":"Task title","priority":"high"}]
[ACTION:complete_task|{"task_id":123}]
[ACTION:update_goal|{"goal_id":456,"current":50}]
[ACTION:log_observation|{"content":"Pattern noticed..."}]
[ACTION:create_episode|{"title":"Session title","content":"What happened..."}]

Only include actions when the user explicitly asks you to do something (add a task, log something, etc.).
For regular conversation, just respond naturally without actions.

=============================================================================
COMMUNICATION STYLE
=============================================================================

- Be concise and direct (hunter-brain-friendly)
- Use natural language, no rigid syntax
- Focus on action over perfect planning
- Non-judgmental about resistance or procrastination
- When resistance is mentioned, acknowledge it and log it if appropriate
- Reference context from the 5 layers when relevant
- Keep responses under 300 words unless more detail is needed`;
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

  // Remove action tags from response
  const cleanResponse = response.replace(actionRegex, '').trim();

  return { cleanResponse, actions };
}

// ============================================
// HANDLE FILE WRITE ACTIONS
// ============================================

async function handleFileActions(actions: Action[]): Promise<Action[]> {
  const processedActions: Action[] = [];

  for (const action of actions) {
    switch (action.type) {
      case 'log_observation':
        if (action.data.content) {
          const success = appendObservation(action.data.content);
          processedActions.push({
            type: 'log_observation',
            data: { ...action.data, success, handled: true },
          });
        }
        break;

      case 'create_episode':
        if (action.data.title && action.data.content) {
          const filePath = writeEpisodeLog(action.data.title, action.data.content);
          processedActions.push({
            type: 'create_episode',
            data: { ...action.data, filePath, success: !!filePath, handled: true },
          });
        }
        break;

      default:
        // Pass through to Laravel for database actions
        processedActions.push(action);
    }
  }

  return processedActions;
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const systemPrompt = buildSystemPrompt(request.context);

  // Build message history for Claude
  const messages: Anthropic.MessageParam[] = request.history.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Add current message (with images if present)
  const imagesToSend = request.images || (request.image ? [request.image] : []);

  if (imagesToSend.length > 0) {
    const contentParts: Anthropic.ContentBlockParam[] = [];

    // Add all images first
    for (const img of imagesToSend) {
      contentParts.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.media_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: img.data,
        },
      });
    }

    // Add the text message
    contentParts.push({
      type: 'text',
      text: request.message,
    });

    messages.push({
      role: 'user',
      content: contentParts,
    });
  } else {
    messages.push({
      role: 'user',
      content: request.message,
    });
  }

  // Use requested model or default to Sonnet 4
  const validModels = [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-opus-4-20250514',
  ];
  const model = request.model && validModels.includes(request.model)
    ? request.model
    : 'claude-sonnet-4-20250514';

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const rawResponse = response.content[0]?.type === 'text'
      ? response.content[0].text
      : '';

    // Parse out any actions
    const { cleanResponse, actions } = parseActions(rawResponse);

    // Handle file-based actions (observations, episodes)
    const processedActions = await handleFileActions(actions);

    // Extract usage info
    const usage = response.usage ? {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      model,
    } : undefined;

    return {
      response: cleanResponse,
      actions: processedActions,
      usage,
    };

  } catch (error) {
    console.error('Iori chat error:', error);
    throw error;
  }
}

// ============================================
// EXPORT
// ============================================

export default { chat };
