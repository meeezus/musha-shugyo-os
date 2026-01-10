# Iori-Kuato Integration Task

## Goal
Integrate Iori (Clawdbot on VM) with Kuato (session memory system on Mac) so Iori can query conversation history and avoid memory loss on session resets.

## Success Criteria
<promise>INTEGRATION_COMPLETE</promise>

When done, you should be able to:
1. Clawdbot sessions automatically sync to Kuato database
2. Iori can query Kuato via SSH ("where did we leave off?")
3. Both Claude Code and Iori sessions are searchable in one system

## Context

**Current state:**
- Kuato runs on Mac, indexes Claude Code sessions in PostgreSQL
- Iori runs on VM (192.168.64.2), stores sessions in `~/.clawdbot/sessions/`
- When Iori hits 200K token limit, sessions get archived but memory is lost

**Why integrate:**
- Unified memory instead of two separate systems
- Iori can recall past conversations (avoid "who are you again?")
- Cross-reference: Iori knows what was discussed in terminal, vice versa

## Implementation Steps

### Phase 1: Parse Clawdbot Sessions in Kuato

**File:** `~/kuato/parsers/clawdbot_parser.py` (or similar)

1. Read Iori's session format from VM: `~/.clawdbot/sessions/sessions.json`
2. Parse JSONL structure (similar to Claude Code sessions but Clawdbot format)
3. Extract:
   - Timestamp
   - Messages (user input + assistant responses)
   - Session ID
4. Transform into Kuato's database schema

**Validation:** Can parse a sample Clawdbot session and print structured output

### Phase 2: Sync VM Sessions to Mac

**Options:**
- A: Periodic rsync (cron job: VM → Mac every 30 mins)
- B: Real-time sync (inotify on VM watches session file)
- C: Manual trigger (Iori writes, then pings Mac to sync)

**Recommended:** Option A (periodic rsync) - simple and reliable

**Implementation:**
1. Create sync script: `~/kuato/sync/sync_iori_sessions.sh`
2. Add to crontab: `*/30 * * * * ~/kuato/sync/sync_iori_sessions.sh`
3. Script does:
   ```bash
   rsync -avz michaelenriquez@192.168.64.2:~/.clawdbot/sessions/ ~/kuato/data/iori_sessions/
   ~/kuato/parsers/clawdbot_parser.py ~/kuato/data/iori_sessions/
   ```

**Validation:** Manually run sync, verify sessions appear in Kuato DB

### Phase 3: Give Iori Kuato Query Capability

**File:** `~/.clawdbot/AGENTS.md` (on VM)

Add new skill/capability:
```markdown
## Memory: Kuato Integration

I can query past conversations via Kuato on Michael's Mac.

**When to use:**
- "Where did we leave off?"
- "What did we discuss about X?"
- "Remind me what I said about Y"

**How to query:**
```bash
ssh michaelenriquez@192.168.1.X "~/kuato/query.sh 'search term'"
```

Returns: Relevant session excerpts with timestamps
```

**Implementation:**
1. Create `~/kuato/query.sh` wrapper (calls PostgreSQL)
2. Test SSH query from VM works
3. Update Iori's AGENTS.md with instructions

**Validation:** Text Iori "where did we leave off?" and get relevant context

### Phase 4: Auto-Archive with Summary

**Goal:** Before Iori hits 200K limit, auto-archive and write summary

**File:** Update Clawdbot code or add monitoring script

**Implementation:**
1. Check token count before each response
2. If > 150K tokens:
   - Generate summary of session (key decisions, tasks, context)
   - Write to `~/PersonalOS/Memory/iori_sessions/YYYYMMDD-summary.md`
   - Archive sessions.json
   - Reset session
3. On new session start, Iori reads last 2-3 summaries

**Validation:** Force Iori past 150K, verify auto-archive + summary creation

## Technical Details

### Kuato Database Schema (Reference)
```sql
-- Likely structure (check actual schema)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    timestamp TIMESTAMP,
    source TEXT,  -- 'claude_code' or 'iori'
    messages JSONB
);

CREATE INDEX idx_sessions_search ON sessions USING gin(to_tsvector('english', messages));
```

### Clawdbot Session Format (Reference)
```json
{
  "sessionId": "...",
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "timestamp": "..."
}
```

## Files to Create/Modify

**On Mac:**
- [ ] `~/kuato/parsers/clawdbot_parser.py` - NEW
- [ ] `~/kuato/sync/sync_iori_sessions.sh` - NEW
- [ ] `~/kuato/query.sh` - NEW
- [ ] Crontab entry for sync

**On VM (192.168.64.2):**
- [ ] `~/.clawdbot/AGENTS.md` - MODIFY (add Kuato query instructions)
- [ ] Clawdbot config or monitoring script - MODIFY (auto-archive logic)

**PersonalOS:**
- [ ] `~/PersonalOS/Memory/iori_sessions/` - NEW directory for summaries

## Testing Plan

1. **Parse Test:** Take archived Iori session, run parser, verify DB entry
2. **Sync Test:** Run sync script manually, check sessions appear on Mac
3. **Query Test:** SSH from VM to Mac, query Kuato, get results
4. **Integration Test:** Text Iori "where did we leave off?", get accurate response
5. **Auto-Archive Test:** Trigger 150K limit, verify summary + reset

## Completion Checklist

- [ ] Clawdbot parser written and tested
- [ ] Sync script created and added to cron
- [ ] Query wrapper script works from VM
- [ ] Iori's AGENTS.md updated with Kuato instructions
- [ ] Auto-archive logic implemented
- [ ] End-to-end test: Text Iori, reset session, text again, Iori recalls context

<promise>INTEGRATION_COMPLETE</promise>

## Notes

- Start with Phase 1-2 (get sessions syncing to Kuato)
- Phase 3 enables the actual query capability
- Phase 4 is polish (auto-archive before hitting limit)

- If you get stuck, check:
  - Kuato's existing parsers for Claude Code sessions (copy that pattern)
  - Clawdbot's actual session format (may differ from example above)
  - SSH key auth is set up for VM → Mac communication

## Ralph Usage

To have Ralph execute this:
```bash
/ralph-loop "Complete Iori-Kuato integration following ~/PersonalOS/Projects/Active/Iori_Kuato_Integration.md. Mark each checklist item when done. When all phases complete, output <promise>INTEGRATION_COMPLETE</promise>" --max-iterations 30 --completion-promise "INTEGRATION_COMPLETE"
```
