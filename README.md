# Musha Shugyo OS (MSOS)

A personal operating system for discipline, execution, and sovereignty. Built for hunter brains that need structure without rigidity.

## What is MSOS?

MSOS is an AI-powered life operating system that combines:
- **Executive function support** - Task tracking, goal alignment, daily structure
- **Relationship management** - Contact tracking, stale relationship alerts
- **Health integration** - Oura Ring data for sleep/readiness
- **AI briefings** - Claude-powered morning overviews
- **Automation** - Scheduled jobs, Discord bot, email scanning

## Architecture

```
PersonalOS/
├── personalos/           # Laravel 11 API + Inertia frontend
│   ├── app/              # Models, Controllers, Services
│   ├── agent/            # TypeScript automation system
│   │   ├── src/jobs/     # Scheduled jobs (morning-overview, email-scanner)
│   │   ├── src/discord/  # Discord bot
│   │   └── src/mcp/      # Gmail, Calendar, Oura integrations
│   ├── database/         # SQLite + migrations
│   └── routes/           # API routes
├── Memory/               # Identity, goals, observations (Obsidian)
├── Tasks/                # Daily plans, weekly schedules
├── Projects/             # Active project notes
├── People/               # Contact notes
├── DecoponATX/           # Business focus (cold email challenge)
└── docs/references/      # JFDI, Andy-timeline, Abundance materials
```

## Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- SQLite

### Installation

```bash
cd personalos
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

### Running

```bash
# Start Laravel (API + Web UI)
cd personalos
php artisan serve

# Start Agent (in another terminal)
cd personalos/agent
npm run dev
```

**Access:** http://localhost:8000
**Login:** test@personalos.dev / password

## Core Modules

### Goals & Tasks
Track objectives with measurable targets. Tasks link to goals for alignment visibility.

### Contacts & Relationships
CRM-lite for personal relationships. Tracks last contact, relationship strength, context notes.

### Oura Integration
Syncs sleep, readiness, and activity scores. Morning briefings factor in your physical state.

### Agent System
TypeScript automation running on a scheduler:
- **Morning Overview** (8 AM) - AI briefing based on goals, tasks, calendar
- **Email Scanner** (4x daily) - Gmail analysis via MCP
- **Relationship Refresh** (Mondays) - Stale contact alerts

### Discord Bot
Commands: `!status`, `!overview`, `!goals`, `!capture`, `!contacts`

## Philosophy

Named after the Japanese concept of "warrior's pilgrimage" - a period of intense training and self-development. MSOS is built on three pillars:

1. **Sovereignty** - Own your data, your systems, your execution
2. **Discipline** - Structure that serves you, not constrains you
3. **Evidence** - Track wins to counter the "I can't make shit happen" voice

## Coming Soon

- **Abundance Warrior** - Daily mindset rituals for money/execution beliefs
- **Voice capture** - Quick logging via speech
- **Mobile PWA** - Full access from phone

## License

MIT
