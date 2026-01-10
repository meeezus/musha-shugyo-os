# Session Recall (Kuato)

Use this skill when the user asks about previous sessions, what was discussed, where we left off, or wants to resume work.

## Trigger Phrases

- "where did we leave off"
- "what did we discuss about X"
- "find the session where we"
- "when did we work on"
- "what were we doing with"
- "what have we done on X"

## How to Search

Query the Kuato API at `http://localhost:3847`:

```bash
# Search by topic
curl -s "http://localhost:3847/sessions?search=TOPIC&days=14&limit=5"

# Search by file pattern
curl -s "http://localhost:3847/sessions?file_pattern=src/components&days=14"

# Search by tools used
curl -s "http://localhost:3847/sessions?tools=Edit,Bash&days=14"

# Combine filters
curl -s "http://localhost:3847/sessions?search=refactor&tools=Edit&days=7"
```

## Understanding Results

The `user_messages` array contains all user inputs - this tells the story:
- Requests: "Let's build X", "I need to"
- Confirmations: "Yes", "Do it"
- Corrections: "Actually", "Instead"
- Completions: "Commit this", "Done"

Cross-reference with:
- `files_touched` - What code was modified
- `tools_used` - What operations were performed
- `ended_at` - When session ended

## Get Full Transcript (if needed)

```bash
curl -s "http://localhost:3847/sessions/SESSION_ID?with_transcript=true"
```

## Response Format

Summarize in 3-5 bullets, then offer next actions:

> **Topic (Date)**
> - What was accomplished
> - Key decisions made
> - Where we stopped
>
> Would you like to continue, see transcript, or search related sessions?
