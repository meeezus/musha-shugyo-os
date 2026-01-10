# Claude Workflow for PersonalOS

This directory contains the claude-workflow plugin customized for PersonalOS (Musha Shugyo OS).

## Installation Summary

Installed from: https://github.com/CloudAI-X/claude-workflow
Customized for: PersonalOS life management system

## Directory Structure

```
.claude/
├── agents/                      # 8 Specialized Agents
│   ├── orchestrator.md          # Multi-step task coordination
│   ├── code-reviewer.md         # Quality and best practices
│   ├── debugger.md              # Bug investigation
│   ├── docs-writer.md           # Documentation
│   ├── security-auditor.md      # Vulnerability detection
│   ├── refactorer.md            # Code improvements
│   ├── test-architect.md        # Test strategy
│   └── personalos-architect.md  # 🆕 PersonalOS system expert
│
├── skills/                      # 7 Knowledge Domains
│   ├── project-analysis/        # Codebase understanding
│   ├── architecture-patterns/   # Design patterns
│   ├── api-design/              # REST/GraphQL design
│   ├── testing-strategy/        # Test approaches
│   ├── performance-optimization/# Speed improvements
│   ├── git-workflow/            # Version control
│   └── biometric-intelligence/  # 🆕 Oura data for scheduling
│
├── commands/                    # 7 Mode Commands
│   ├── architect.md             # Design-first mode
│   ├── rapid.md                 # Fast iteration mode
│   ├── mentor.md                # Teaching mode
│   ├── review.md                # Strict review mode
│   ├── iori-focus.md            # 🆕 Deep work mode
│   ├── iori-recovery.md         # 🆕 Low-energy mode
│   └── iori-hustle.md           # 🆕 Sprint mode
│
├── hooks/                       # Automation
│   ├── hooks.json               # Hook configuration
│   └── scripts/                 # Hook implementations
│       ├── security-check.py    # Block secrets in code
│       ├── protect-files.py     # Prevent dangerous edits
│       ├── format-on-edit.py    # Auto-format code
│       ├── log-commands.sh      # Track bash commands
│       └── validate-environment.py
│
└── settings.local.json          # Permissions & config
```

## Available Slash Commands

### Development Modes (from claude-workflow)
| Command | Description |
|---------|-------------|
| `/architect` | Design-first approach, create ADRs before code |
| `/rapid` | Fast iteration, ship quickly |
| `/mentor` | Teaching mode, explain concepts |
| `/review` | Strict quality review mode |

### PersonalOS Modes (custom)
| Command | Description |
|---------|-------------|
| `/iori-focus` | Deep work mode, single task focus, log resistance |
| `/iori-recovery` | Low-energy mode, easy wins only |
| `/iori-hustle` | Sprint mode, maximum execution speed |

## When Agents Auto-Trigger

| Agent | Triggers On |
|-------|-------------|
| `orchestrator` | Complex multi-step tasks, "improve", "refactor", "add feature" |
| `code-reviewer` | After significant code changes |
| `debugger` | "why doesn't", "bug", "broken", stack traces |
| `security-auditor` | Auth changes, API keys, security keywords |
| `test-architect` | "add tests", "test strategy", new features |
| `personalos-architect` | PersonalOS-specific questions, dashboard, agent system |

## Active Hooks

### PreToolUse (Before Edit/Write)
1. **security-check.py** - Blocks commits with secrets (API keys, passwords)
2. **protect-files.py** - Prevents dangerous file modifications

### PostToolUse (After Edit/Write)
1. **format-on-edit.py** - Auto-formats edited files

### SessionStart
1. **validate-environment.py** - Checks required tools are available

## PersonalOS-Specific Features

### personalos-architect Agent
Expert on the system architecture:
- Laravel backend (Controllers, Models, API)
- React dashboard (Pages, Components, Inertia)
- Agent system (Iori, Discord bot, Jobs)
- Oura integration (biometrics, energy)

### biometric-intelligence Skill
Uses Oura ring data for:
- Energy-aware task scheduling
- Recovery recommendations
- Hunter-brain pattern awareness
- HRV-based decision making

### Iori Modes
Three energy states for different days:
- **Focus**: Deep work, single task, resist context switching
- **Recovery**: Rest day, easy wins, no hard problems
- **Hustle**: Peak day, maximum output, ship fast

## Usage Examples

### Using Orchestrator for Complex Tasks
```
"Add user authentication to PersonalOS"
→ Orchestrator activates, creates plan, delegates to specialists
```

### Using Focus Mode
```
/iori-focus
"I need to finish the email scanner"
→ Focuses on one task, logs resistance, tracks progress
```

### Using Recovery Mode
```
/iori-recovery
"What should I work on today?"
→ Suggests easy wins, blocks complex work
```

### Using personalos-architect
When working on PersonalOS components, the agent provides:
- Correct file paths and patterns
- Integration point knowledge
- Hunter-brain-friendly suggestions

## Customization

### Adding New Agents
Create `.claude/agents/your-agent.md`:
```markdown
---
name: your-agent
description: What it does and when to use it
tools: Read, Write, Edit, Bash, Task
model: sonnet
---

# Your Agent Name

Instructions for the agent...
```

### Adding New Skills
Create `.claude/skills/your-skill/SKILL.md`:
```markdown
---
name: your-skill
description: Domain knowledge description
---

# Skill Name

Knowledge content...
```

### Adding New Commands
Create `.claude/commands/your-command.md`:
```markdown
---
name: Your Mode Name
description: What this mode does
---

# Your Mode

Behavior instructions...
```

## Troubleshooting

### Hooks Not Running
- Check `.claude/settings.local.json` has `hooks.enabled: true`
- Verify scripts are executable: `chmod +x .claude/hooks/scripts/*`
- Check Python 3 is available: `python3 --version`

### Agent Not Triggering
- Agents trigger on matching keywords in description
- Use Task tool explicitly: `Task(subagent_type='agent-name')`

### Mode Not Switching
- Use exact command: `/iori-focus` not `/focus`
- Commands are in `.claude/commands/` directory
