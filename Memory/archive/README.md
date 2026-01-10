# Memory System - Persistent Context Across Sessions

## The Problem This Solves
OpenCode (Claude) loses context between sessions. Each time you start fresh, it doesn't remember what you were working on, what it learned about you, or where you left off.

**This memory system fixes that.**

## How It Works

### Memory Files
These files persist between sessions and create continuity:

1. **identity.md** - Who Claude is in this system
   - Core purpose and role
   - How it operates
   - What it's optimizing for

2. **goals.md** - What you're working toward
   - Immediate goals (Week 1 email challenge)
   - Short/medium/long-term objectives
   - Why this matters

3. **observations.md** - Learnings about patterns
   - Hunter brain patterns observed
   - What works/doesn't work
   - Resistance patterns
   - System evolution

4. **episode_logs/** - What happened recently
   - Daily or per-session logs
   - Wins, challenges, decisions
   - Open loops to close
   - Context for next session

## How to Use

### At the Start of Each Session

**In OpenCode, say:**
```
Read my memory files to get context:
- Memory/identity.md
- Memory/goals.md
- Memory/observations.md
- Memory/episode_logs/[latest file]

Then tell me what we should focus on today.
```

This loads your persistent context into the session.

### During the Session

**Update memory as needed:**
```
Add to observations: [Pattern you noticed]
Update goals: [Progress or changes]
Log this episode: [What happened today]
```

### At the End of Each Session

**Create episode log:**
```
Create today's episode log in Memory/episode_logs/

Include:
- What we accomplished
- Resistance moments
- Wins to celebrate
- Open loops
- Context for next session
```

## Memory File Lifecycle

### When to Update

**identity.md** - Rarely
- Only when core purpose shifts
- When you learn something fundamental

**goals.md** - Weekly
- Update after major milestones
- When priorities change
- Review at end of each week

**observations.md** - Weekly or when patterns emerge
- When you notice hunter brain patterns
- When system improvements discovered
- After trying new workflows

**episode_logs/** - Daily or per-session
- Create one at end of each significant session
- Name format: `YYYY-MM-DD_topic.md`
- Keep last 7-14 days, archive older ones

### Cleanup Strategy

**Episode logs grow over time. Options:**

1. **Keep rolling window** (recommended)
   - Keep last 2 weeks in episode_logs/
   - Move older to episode_logs/archive/

2. **Weekly summaries**
   - Create weekly summary from daily logs
   - Archive individual sessions

3. **Let Claude summarize**
   - Ask it to condense old logs into observations.md
   - Delete originals after summarizing

## Example Session Start

```
You: Read Memory/identity.md, Memory/goals.md, Memory/observations.md, and the latest episode log. What should we focus on today?

Claude: [Reads files, loads context]

I see we're in Week 1 of the DecoponATX email challenge (90 emails in 5 days).

Based on the latest episode log, we just finished system setup. Mobile access is ready but untested.

Today is December 27. Week 1 starts December 30.

Focus priorities:
1. Test mobile access end-to-end
2. Verify voice dictation workflow
3. Prepare for Week 1 start (Monday)

What would you like to tackle first?
```

**Now Claude has full context without you explaining everything!**

## Tips for Effective Memory

### Be Specific
❌ "Had a good session"
✅ "Sent 15 emails, resistance at email 8 ('this isn't working'), did it anyway, booked 2 calls"

### Capture Patterns
❌ "Email went well"
✅ "Voice capture after each email = 10x easier than batch logging later"

### Log Resistance
❌ "Struggled today"
✅ "Voice said 'you should research more' at email 3. Sent it anyway. Voice was wrong."

### Build Evidence
❌ "Made progress"
✅ "Week 1 Day 1: Target 15 emails, sent 18. Proof I CAN make shit happen."

## Integration with Daily Workflow

### Morning Routine
```bash
today          # Generate daily mission
pos            # Go to PersonalOS
opencode       # Start AI

# In OpenCode:
Load memory and show today's focus
```

### Evening Routine
```
Log today's episode:
- Emails sent: [count]
- Resistance moments: [when/what]
- Wins: [evidence built]
- Tomorrow's focus: [next priority]
```

## Why This Works

Traditional task managers lose context. You forget what you were doing, why it mattered, what you learned.

**File-based memory creates coherent narrative:**
- Identity = who the AI is for you
- Goals = where you're going
- Observations = what's working
- Episodes = story of progress

Each session picks up where you left off. No context loss. No re-explaining. Just continuity.

---

**Created:** 2025-12-27
**Purpose:** Maintain coherent AI assistance across sessions
**Review:** Update this README if system evolves
