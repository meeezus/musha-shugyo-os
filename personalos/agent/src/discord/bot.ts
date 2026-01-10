/**
 * Discord Bot for PersonalOS
 *
 * Provides interactive commands for quick captures, status checks,
 * and on-demand job triggers.
 *
 * Commands:
 * !status - Current system status
 * !capture <text> - Quick task capture
 * !overview - Run morning overview now
 * !goals - Show current goals
 * !contacts - Show recent contacts
 */

import { Client, GatewayIntentBits, Message, TextChannel, Partials } from 'discord.js';
import { logger } from '../utils/logger';
import { callClaude } from '../utils/claude';
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
  email: string;
  relationship: string;
  last_contact: string | null;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ============================================
// CONVERSATION MEMORY
// ============================================

// Store conversation history per channel/DM (key = channel ID)
const conversationHistory = new Map<string, ConversationMessage[]>();
const MAX_HISTORY_LENGTH = 20;
const HISTORY_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getConversationHistory(channelId: string): ConversationMessage[] {
  const history = conversationHistory.get(channelId) || [];
  // Filter out stale messages
  const now = Date.now();
  return history.filter(msg => now - msg.timestamp < HISTORY_TTL_MS);
}

function addToConversationHistory(channelId: string, role: 'user' | 'assistant', content: string): void {
  let history = getConversationHistory(channelId);
  history.push({ role, content, timestamp: Date.now() });
  // Keep only the last N messages
  if (history.length > MAX_HISTORY_LENGTH) {
    history = history.slice(-MAX_HISTORY_LENGTH);
  }
  conversationHistory.set(channelId, history);
}

function clearConversationHistory(channelId: string): void {
  conversationHistory.delete(channelId);
}

// ============================================
// DISCORD CLIENT
// ============================================

let client: Client | null = null;

export function getDiscordClient(): Client {
  if (client) return client;

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel], // Required for DM support
  });

  return client;
}

// ============================================
// API HELPERS
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
    return [];
  }
}

async function createTask(title: string, priority: string = 'medium'): Promise<boolean> {
  try {
    await axios.post(
      `${process.env.LARAVEL_API_URL}/tasks`,
      { title, priority, status: 'pending' },
      {
        headers: {
          Authorization: `Bearer ${process.env.LARAVEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    return true;
  } catch (err) {
    return false;
  }
}

// ============================================
// COMMAND HANDLERS
// ============================================

async function handleStatus(message: Message): Promise<void> {
  const [goals, tasks, contacts] = await Promise.all([
    fetchGoals(),
    fetchTasks(),
    fetchContacts(),
  ]);

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const today = dayjs().format('dddd, MMM D');

  let response = `## PersonalOS Status\n\n`;
  response += `**Date:** ${today}\n\n`;
  response += `**Goals:** ${goals.length} tracked\n`;
  response += `**Tasks:** ${pendingTasks.length} pending\n`;
  response += `**Contacts:** ${contacts.length} in CRM\n\n`;

  if (goals.length > 0) {
    response += `**Goal Progress:**\n`;
    for (const g of goals.slice(0, 3)) {
      const pct = Math.round((g.current_value / g.target_value) * 100);
      response += `- ${g.name}: ${g.current_value}/${g.target_value} ${g.unit} (${pct}%)\n`;
    }
  }

  await message.reply(response);
}

async function handleCapture(message: Message, text: string): Promise<void> {
  if (!text.trim()) {
    await message.reply('Usage: `!capture <task description>`');
    return;
  }

  // Determine priority from keywords
  let priority = 'medium';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('important')) {
    priority = 'high';
  } else if (lowerText.includes('someday') || lowerText.includes('maybe') || lowerText.includes('later')) {
    priority = 'low';
  }

  const success = await createTask(text, priority);

  if (success) {
    await message.reply(`Captured: "${text}" [${priority}]`);
  } else {
    await message.reply(`Failed to capture task. API may be down.`);
  }
}

async function handleGoals(message: Message): Promise<void> {
  const goals = await fetchGoals();

  if (goals.length === 0) {
    await message.reply('No goals set yet.');
    return;
  }

  let response = `## Current Goals\n\n`;
  for (const g of goals) {
    const pct = Math.round((g.current_value / g.target_value) * 100);
    const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
    response += `**${g.name}**\n`;
    response += `${bar} ${g.current_value}/${g.target_value} ${g.unit} (${pct}%)\n\n`;
  }

  await message.reply(response);
}

async function handleContacts(message: Message): Promise<void> {
  const contacts = await fetchContacts();

  if (contacts.length === 0) {
    await message.reply('No contacts in CRM yet.');
    return;
  }

  let response = `## Recent Contacts\n\n`;
  for (const c of contacts.slice(0, 10)) {
    const lastContact = c.last_contact
      ? dayjs(c.last_contact).format('MMM D')
      : 'Never';
    response += `- **${c.name}** (${c.relationship}) - Last: ${lastContact}\n`;
  }

  await message.reply(response);
}

async function handleHelp(message: Message): Promise<void> {
  const response = `## PersonalOS Commands

**!iori <message>** (or **!i**) - Chat with Iori (full context AI)
**!status** - System overview
**!capture <text>** - Quick task capture
**!goals** - Current goal progress
**!contacts** - Recent contacts
**!ask <question>** - Quick Claude query
**!help** - This message

*Iori has full context of your goals, tasks, and PersonalOS memory.*`;

  await message.reply(response);
}

async function handleAsk(message: Message, question: string): Promise<void> {
  if (!question.trim()) {
    await message.reply('Usage: `!ask <question>`');
    return;
  }

  await message.reply('Thinking...');

  try {
    const response = await callClaude(
      `You are Michael's AI assistant. Answer briefly and directly (under 200 words): ${question}`,
      'haiku'
    );
    if (message.channel.isSendable()) {
      await message.channel.send(response);
    }
  } catch (err) {
    if (message.channel.isSendable()) {
      await message.channel.send('Failed to get response from Claude.');
    }
  }
}

async function handleIori(message: Message, text: string): Promise<void> {
  if (!text.trim()) {
    await message.reply('Usage: `!iori <message>` or just DM me!');
    return;
  }

  const channelId = message.channel.id;

  // Check for clear command
  if (text.toLowerCase() === 'clear' || text.toLowerCase() === 'reset') {
    clearConversationHistory(channelId);
    await message.reply('🏯 Conversation cleared. Starting fresh!');
    return;
  }

  // Add user message to history
  addToConversationHistory(channelId, 'user', text);

  // Show typing indicator
  await message.reply('🏯 *Iori is thinking...*');

  try {
    // Fetch context for Iori
    const [goals, tasks, contacts] = await Promise.all([
      fetchGoals(),
      fetchTasks(),
      fetchContacts(),
    ]);

    // Get conversation history for this channel
    const history = getConversationHistory(channelId).slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Iori server
    const response = await axios.post(
      'http://localhost:3002/chat',
      {
        message: text,
        history: history,
        context: {
          goals: goals.map(g => ({
            title: g.name,
            current: g.current_value,
            target: g.target_value,
            unit: g.unit,
          })),
          tasks: tasks.filter(t => t.status !== 'completed').map(t => ({
            title: t.title,
            priority: t.priority,
          })),
          contacts: contacts.slice(0, 10).map(c => ({
            name: c.name,
            last_contact: c.last_contact,
          })),
          user_name: 'Michael',
        },
      },
      { timeout: 120000 }
    );

    const ioriResponse = response.data.response || 'No response from Iori';

    // Add assistant response to history
    addToConversationHistory(channelId, 'assistant', ioriResponse);

    // Discord has a 2000 char limit, split if needed
    if (ioriResponse.length > 1900) {
      const chunks = ioriResponse.match(/.{1,1900}/gs) || [];
      for (const chunk of chunks) {
        if (message.channel.isSendable()) {
          await message.channel.send(chunk);
        }
      }
    } else {
      if (message.channel.isSendable()) {
        await message.channel.send(ioriResponse);
      }
    }

    // Handle any actions Iori wants to take
    if (response.data.actions?.length > 0) {
      for (const action of response.data.actions) {
        if (action.type === 'add_task' && action.data?.title) {
          await createTask(action.data.title, action.data.priority || 'medium');
          if (message.channel.isSendable()) {
            await message.channel.send(`✅ Task added: "${action.data.title}"`);
          }
        }
      }
    }
  } catch (err: any) {
    logger.error('Iori error:', err.message);
    if (message.channel.isSendable()) {
      await message.channel.send('Failed to reach Iori. Is the agent running?');
    }
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

async function handleMessage(message: Message): Promise<void> {
  // Ignore bot messages
  if (message.author.bot) return;

  // Handle DMs - route directly to Iori for natural conversation
  if (message.channel.isDMBased()) {
    logger.info(`Discord DM from ${message.author.tag}: "${message.content.substring(0, 50)}..."`);
    await handleIori(message, message.content);
    return;
  }

  // Check for command prefix in servers
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();
  const text = args.join(' ');

  logger.info(`Discord command: !${command} ${text}`);

  try {
    switch (command) {
      case 'status':
        await handleStatus(message);
        break;
      case 'capture':
      case 'c':
        await handleCapture(message, text);
        break;
      case 'goals':
        await handleGoals(message);
        break;
      case 'contacts':
        await handleContacts(message);
        break;
      case 'ask':
        await handleAsk(message, text);
        break;
      case 'iori':
      case 'i':
        await handleIori(message, text);
        break;
      case 'help':
        await handleHelp(message);
        break;
      default:
        // Unknown command - ignore
        break;
    }
  } catch (err) {
    logger.error(`Error handling command !${command}:`, err);
    await message.reply('Something went wrong. Check the logs.');
  }
}

// ============================================
// BOT STARTUP
// ============================================

export async function startDiscordBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    logger.warn('DISCORD_BOT_TOKEN not set - bot disabled');
    return;
  }

  const discordClient = getDiscordClient();

  discordClient.on('ready', () => {
    logger.info(`Discord bot logged in as ${discordClient.user?.tag}`);
  });

  discordClient.on('messageCreate', handleMessage);

  try {
    await discordClient.login(token);
  } catch (err) {
    logger.error('Failed to start Discord bot:', err);
  }
}

// ============================================
// TEST
// ============================================

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env'), override: true });

  console.log('\n============================================');
  console.log('   DISCORD BOT TEST');
  console.log('============================================\n');

  if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('DISCORD_BOT_TOKEN not set in .env');
    console.log('\nTo enable the Discord bot:');
    console.log('1. Go to https://discord.com/developers/applications');
    console.log('2. Create a new application');
    console.log('3. Go to Bot section, create bot, copy token');
    console.log('4. Add DISCORD_BOT_TOKEN=your-token to agent/.env');
    console.log('5. Invite bot to your server with Message Content intent\n');
    process.exit(0);
  }

  startDiscordBot()
    .then(() => {
      console.log('Bot started! Send !help in Discord to test.\n');
    })
    .catch(err => {
      console.error('Failed to start bot:', err);
      process.exit(1);
    });
}
