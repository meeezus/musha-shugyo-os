# PersonalOS Agent System

AI-powered background automation for PersonalOS. Runs 24/7, providing morning briefings, email tracking, relationship management, and Discord commands.

## Features

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Morning Overview | 8:00 AM daily | Strategic daily briefing with 5-layer context |
| Email Scanner | Every 4 hours | Scans sent emails, updates contact last_contact |
| Relationship Refresh | Monday 9:00 AM | Identifies stale contacts needing attention |

### MCP Integrations

- **Gmail API**: Read sent emails, filter marketing, track relationships
- **Calendar API**: Read today's events, include in morning overview
- **Claude API**: AI-powered analysis and responses

### Discord Commands

| Command | Description |
|---------|-------------|
| `!status` | System overview (goals, tasks, contacts) |
| `!capture <text>` | Quick task capture with auto-priority |
| `!goals` | Current goal progress with visual bars |
| `!contacts` | Recent contacts list |
| `!ask <question>` | Ask Claude a quick question |
| `!help` | List all commands |

## Quick Start

```bash
# Navigate to agent directory
cd ~/PersonalOS/personalos/agent

# Install dependencies
npm install

# Generate Google OAuth token (first time only)
npm run oauth

# Test morning overview
npm run test:overview

# Start scheduler (runs in foreground)
npm run dev
```

## Test Commands

```bash
npm run test:overview      # Test morning overview
npm run test:email-scanner # Test email scanner
npm run test:relationship  # Test relationship refresh
npm run test:calendar      # Test calendar integration
npm run test:discord       # Test Discord bot
```

## Install as Background Service (macOS)

```bash
# Build and install
./scripts/install-service.sh

# Check status
launchctl list | grep personalos

# View logs
tail -f logs/agent.log

# Stop service
launchctl unload ~/Library/LaunchAgents/com.personalos.agent.plist

# Uninstall
./scripts/uninstall-service.sh
```

## Configuration

### Required Environment Variables (.env)

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_BOT_TOKEN=...  # Optional, for interactive commands

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...  # Generated via npm run oauth

# Laravel API
LARAVEL_API_URL=http://localhost:8000/api
LARAVEL_API_TOKEN=...
```

### Getting Credentials

1. **Claude API**: https://console.anthropic.com/settings/keys
2. **Discord Webhook**: Server Settings → Integrations → Webhooks
3. **Discord Bot Token**: https://discord.com/developers/applications
4. **Google OAuth**: https://console.cloud.google.com/apis/credentials

## File Structure

```
agent/
├── package.json
├── tsconfig.json
├── .env                    # Credentials (not in git)
├── .gitignore
├── README.md
├── src/
│   ├── index.ts            # Main entry point
│   ├── scheduler.ts        # Bree job scheduler
│   ├── jobs/
│   │   ├── morning-overview.ts
│   │   ├── email-scanner.ts
│   │   └── relationship-refresh.ts
│   ├── mcp/
│   │   ├── gmail.ts
│   │   └── calendar.ts
│   ├── discord/
│   │   └── bot.ts
│   └── utils/
│       ├── claude.ts
│       ├── logger.ts
│       └── markdown-parser.ts
├── jobs/                   # Bree worker wrappers
│   ├── morning-overview.js
│   ├── email-scanner.js
│   └── relationship-refresh.js
├── scripts/
│   ├── generate-oauth-token.ts
│   ├── install-service.sh
│   ├── uninstall-service.sh
│   └── com.personalos.agent.plist
├── data/
│   └── email-scanner-state.json
└── logs/                   # Created by service
    ├── agent.log
    └── agent-error.log
```

## 5-Layer Context System

The morning overview reads from PersonalOS markdown files:

1. `~/PersonalOS/CLAUDE.md` - Role, hunter-brain patterns, session flow
2. `~/PersonalOS/Memory/identity.md` - Philosophy on who you are
3. `~/PersonalOS/Memory/goals.md` - What we're working toward
4. `~/PersonalOS/Memory/observations.md` - Patterns and learnings
5. `~/PersonalOS/Memory/episode_logs/LATEST.md` - Where we left off

Plus today's plan from `Tasks/Active/Unified_Week1_Plan.md`.

## Troubleshooting

### OAuth Token Expired
```bash
npm run oauth
```

### Service Won't Start
```bash
# Check logs
tail -100 logs/agent-error.log

# Verify build
npm run build

# Test manually
npm run dev
```

### Discord Bot Not Responding
- Ensure `DISCORD_BOT_TOKEN` is set in `.env`
- Check bot has "Message Content Intent" enabled in Discord Developer Portal
- Verify bot is invited to server with proper permissions

---

Built for PersonalOS - Michael's AI-powered executive function support system.
