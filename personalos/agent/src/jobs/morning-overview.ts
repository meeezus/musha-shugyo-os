import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ override: true, path: path.join(__dirname, '../../.env') });

import { callClaude } from '../utils/claude';
import { logger } from '../utils/logger';
import { getPersonalContext, formatContextSummary } from '../utils/markdown-parser';
import { getTodayEvents, formatEventsForOverview, CalendarEvent } from '../mcp/calendar';
import axios from 'axios';
import dayjs from 'dayjs';

// ============================================
// TYPES
// ============================================

interface Goal {
  id: number;
  name: string;
  current_value: number;
  target_value: number;
  unit: string;
}

interface Task {
  id: number;
  title: string;
  priority: string;
  status: string;
}

interface Contact {
  id: number;
  name: string;
  relationship: string;
  last_contact?: string;
}

interface StaleContact {
  name: string;
  relationship: string;
  daysSince: number;
}

// ============================================
// API FETCHERS
// ============================================

async function fetchGoals(): Promise<Goal[]> {
  try {
    const response = await axios.get(
      `${process.env.LARAVEL_API_URL}/goals`,
      {
        headers: { Authorization: `Bearer ${process.env.LARAVEL_API_TOKEN}` },
        timeout: 5000,
      }
    );
    return response.data.data || response.data || [];
  } catch (err) {
    logger.warn('Could not fetch goals from API');
    return [];
  }
}

async function fetchTasks(): Promise<Task[]> {
  try {
    const response = await axios.get(
      `${process.env.LARAVEL_API_URL}/tasks`,
      {
        headers: { Authorization: `Bearer ${process.env.LARAVEL_API_TOKEN}` },
        timeout: 5000,
      }
    );
    return response.data.data || response.data || [];
  } catch (err) {
    logger.warn('Could not fetch tasks from API');
    return [];
  }
}

async function fetchContacts(): Promise<Contact[]> {
  try {
    const response = await axios.get(
      `${process.env.LARAVEL_API_URL}/contacts`,
      {
        headers: { Authorization: `Bearer ${process.env.LARAVEL_API_TOKEN}` },
        timeout: 5000,
      }
    );
    return response.data.data || response.data || [];
  } catch (err) {
    logger.warn('Could not fetch contacts from API');
    return [];
  }
}

// ============================================
// STALE CONTACTS CHECK
// ============================================

function getStaleContacts(contacts: Contact[], thresholdDays: number = 30): StaleContact[] {
  const now = dayjs();
  const stale: StaleContact[] = [];

  for (const contact of contacts) {
    if (!contact.last_contact) continue;

    const lastContact = dayjs(contact.last_contact);
    const daysSince = now.diff(lastContact, 'day');

    if (daysSince >= thresholdDays) {
      stale.push({
        name: contact.name,
        relationship: contact.relationship,
        daysSince,
      });
    }
  }

  // Sort by days since contact (most stale first)
  stale.sort((a, b) => b.daysSince - a.daysSince);

  return stale.slice(0, 3); // Top 3 most stale
}

// ============================================
// MORNING OVERVIEW
// ============================================

export async function morningOverview(): Promise<string> {
  console.log('\n');
  console.log('============================================');
  console.log('   PERSONALOS MORNING OVERVIEW');
  console.log('============================================\n');

  logger.info('Running Morning Overview...');

  // Load 5-layer context from PersonalOS markdown files
  const context = getPersonalContext();

  // Fetch data from all sources in parallel
  logger.info('Fetching data from APIs...');

  let calendarEvents: CalendarEvent[] = [];
  try {
    calendarEvents = await getTodayEvents();
  } catch (err) {
    logger.warn('Could not fetch calendar events');
  }

  const [goals, tasks, contacts] = await Promise.all([
    fetchGoals(),
    fetchTasks(),
    fetchContacts(),
  ]);

  logger.info(`API data: ${goals.length} goals, ${tasks.length} tasks, ${contacts.length} contacts, ${calendarEvents.length} calendar events`);

  // Get stale contacts for relationship nudge
  const staleContacts = getStaleContacts(contacts, 30);

  // Build the context summary
  const contextSummary = formatContextSummary(context);

  // Format calendar events
  const calendarSection = calendarEvents.length > 0
    ? `TODAY'S CALENDAR:\n${formatEventsForOverview(calendarEvents)}`
    : 'No calendar events today.';

  // Format stale contacts
  const relationshipSection = staleContacts.length > 0
    ? `RELATIONSHIP NUDGE (haven't contacted in 30+ days):\n${staleContacts.map(c => `- ${c.name} (${c.relationship}) - ${c.daysSince} days`).join('\n')}`
    : '';

  // Generate the strategic prompt
  const today = dayjs();
  const todayFormatted = today.format('dddd, MMMM D, YYYY');

  const prompt = `You are Michael's Personal AI Assistant for PersonalOS.

TODAY IS: ${todayFormatted}

YOUR ROLE (from CLAUDE.md):
- Executive function support (track tasks, projects, people)
- Resistance logger (capture without judgment)
- Evidence builder (prove "I CAN make shit happen")
- Context keeper (maintain continuity across sessions)

HOW YOU OPERATE:
- Natural language, no rigid syntax
- Quick captures (30 seconds or less)
- Non-judgmental about resistance
- Action over perfect planning
- NEVER lecture or guilt-trip
- NEVER require "proper" usage
- NEVER suggest elaborate planning
- NEVER fight resistance, just log it

============================================
CONTEXT FROM PERSONALOS (5 LAYERS)
============================================

${contextSummary}

============================================
TODAY'S SCHEDULE
============================================

${calendarSection}

============================================
DASHBOARD DATA
============================================

${goals.length > 0 ? `GOALS:\n${goals.map(g => `- ${g.name}: ${g.current_value}/${g.target_value} ${g.unit}`).join('\n')}` : 'No goals set in dashboard yet.'}

${tasks.length > 0 ? `PENDING TASKS:\n${tasks.filter(t => t.status !== 'completed').map(t => `- [${t.priority}] ${t.title}`).join('\n')}` : 'No pending tasks in dashboard.'}

${relationshipSection}

============================================
YOUR TASK
============================================

Generate a strategic morning overview. Format your response EXACTLY like this:

---

**TODAY'S CONTEXT** - ${todayFormatted}

[One sentence about what week/phase we're in and what the focus is]

**CALENDAR**

[Brief summary of today's scheduled events, or note that it's a clear day]

**WHERE WE LEFT OFF**

[2-3 sentences summarizing the latest episode log and current status]

**IMMEDIATE PRIORITY**

[The ONE thing that matters most today based on the plan]

**OPTION 1:** [First approach for today]
- [Specific action 1]
- [Specific action 2]

**OPTION 2:** [Alternative approach]
- [Specific action 1]
- [Specific action 2]

${staleContacts.length > 0 ? `**RELATIONSHIP NUDGE**

[Suggest one person from the stale contacts list to reach out to briefly]

` : ''}**MY RECOMMENDATION**

[Direct, tactical recommendation - one clear path forward with reasoning]

---

What feels right? Or is there something else on your mind today?

---

IMPORTANT GUIDELINES:
- Be direct and tactical, not flowery
- Under 350 words total
- Reference specific items from the plan and calendar
- Acknowledge hunter-brain patterns without lecturing
- End with an open question that invites dialogue
- Remember: Action over perfect planning`;

  logger.info('Calling Claude for strategic analysis...');
  const overview = await callClaude(prompt, 'sonnet');

  // Post to Discord
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await axios.post(process.env.DISCORD_WEBHOOK_URL, {
        content: `## PERSONALOS MORNING OVERVIEW\n\n${overview}`,
      });
      logger.info('Posted to Discord');
    } catch (err) {
      logger.error('Failed to post to Discord', err);
    }
  }

  logger.info('Morning Overview complete');

  console.log('\n============================================');
  console.log('   OVERVIEW');
  console.log('============================================\n');
  console.log(overview);
  console.log('\n============================================\n');

  return overview;
}

// ============================================
// RUN IF EXECUTED DIRECTLY
// ============================================

if (require.main === module) {
  morningOverview()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Morning overview failed:', err);
      process.exit(1);
    });
}
