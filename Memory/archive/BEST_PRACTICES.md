# Memory System - Best Practices & Optimization

## Token Usage Optimization

### What Costs Tokens (Ranked by Impact)

1. **Loading memory files** (~2,800 tokens/session with all files)
2. **Your prompts** (~500 tokens/session average)
3. **Claude's responses** (~3,000 tokens/session average)
4. **File operations** (minimal - only when reading/writing files)

**Optimized default:** Now loads only identity.md + latest episode (~1,500 tokens)
**Savings:** ~45% reduction in startup tokens

### Smart Loading Strategy

**Default (automatic):**
```
- identity.md (who Claude is)
- latest episode log (where you left off)
```

**Load more only when needed:**
```
Also read Memory/goals.md        # When planning
Also read Memory/observations.md  # When reviewing patterns
```

### Quick Sessions vs Deep Sessions

**Quick update (minimal tokens):**
```bash
go
"Update DecoponATX: sent 15 emails"
exit
```
Cost: ~$0.02

**Deep session (full context):**
```bash
go
"Read all memory files, then help me plan Week 2"
# Multiple back-and-forth exchanges
```
Cost: ~$0.10

## Episode Log Best Practices

### Keep Logs Concise

**Bad (too verbose):**
```markdown
Today I woke up and had breakfast, then I thought about
the email challenge and felt some resistance about it
because the voice was saying I can't do it, but then I
remembered the system...
```
Tokens: ~500

**Good (concise):**
```markdown
- Sent 15 emails (target: 15) ✅
- Resistance at email 8: "this isn't working" → sent anyway
- Win: Booked 2 calls
- Tomorrow: Send 20 emails
```
Tokens: ~80

### Archive Old Logs

**Weekly cleanup:**
```bash
# Keep last 7 days, archive the rest
mv Memory/episode_logs/2025-12-* Memory/episode_logs/archive/
```

**Or ask Claude:**
```
Summarize the last 10 episode logs into Memory/observations.md,
then move them to archive
```

## File Size Guidelines

**Target sizes:**
- identity.md: Keep under 500 tokens (~2KB)
- goals.md: Keep under 600 tokens (~2.5KB)
- observations.md: Keep under 1,000 tokens (~4KB)
- episode log: Keep under 200 tokens (~1KB each)

**Check file size:**
```bash
wc -w Memory/*.md  # Word count (rough token estimate)
```

## Cost-Saving Habits

### 1. Use Short, Specific Prompts

**Expensive:**
```
Can you please help me understand what I should be focusing
on today and also review my progress from yesterday and tell
me what tasks are pending and...
```

**Cheap:**
```
What's today's priority?
```

### 2. Batch Operations

**Expensive (3 sessions):**
```bash
go
"Add task: Email Sarah"
exit

go
"Add task: Call venue"
exit

go
"Add task: Update pricing"
exit
```

**Cheap (1 session):**
```bash
go
"Add these tasks:
- Email Sarah
- Call venue
- Update pricing"
exit
```

### 3. Use File Editing for Bulk Changes

**Expensive:**
Ask Claude to update 10 tasks individually

**Cheap:**
Edit Tasks/Active/MyFile.md directly in text editor

### 4. Exit When Done

Don't leave Claude running idle. Each response costs tokens.

```bash
go
"Quick update: sent 10 emails"
exit  # Don't stay in session unnecessarily
```

## When to Use Full Memory Load

**Load all files when:**
- Starting a new week
- Major planning session
- Reviewing patterns
- Making strategic decisions

**Use lightweight load when:**
- Quick updates
- Daily execution tracking
- Logging resistance
- Checking what's next

## Monitoring Your Usage

**Check OpenCode stats:**
```bash
opencode stats
```

Shows:
- Total tokens used
- Cost breakdown
- Sessions count

**Set a budget alert:**

Add to observations.md:
```
If monthly cost exceeds $10, review usage patterns
```

## Memory File Lifecycle

### Weekly Review (5 min)

```bash
go
"Review this week's episode logs and:
1. Update observations.md with patterns
2. Archive old episode logs
3. Update goals.md with progress
4. Keep identity.md unchanged unless core purpose shifts"
```

### Monthly Cleanup (10 min)

```bash
# Archive episodes older than 30 days
mkdir -p Memory/episode_logs/archive/2025-12
mv Memory/episode_logs/2025-12-* Memory/episode_logs/archive/2025-12/

# Condense observations if over 1,500 tokens
go
"Condense observations.md to keep only active patterns"
```

## Advanced: Context-Aware Loading

**Create different startup scripts for different needs:**

**go-quick** (minimal context, fast):
```bash
alias go-quick='opencode --prompt "What should I focus on now?"'
```

**go-full** (all context, slower):
```bash
alias go-full='opencode --prompt "Read all Memory files and show full context"'
```

**go-review** (weekly review):
```bash
alias go-review='opencode --prompt "Read all Memory files and help me review this week"'
```

## Cost Comparison

### Current Setup (Optimized)

**Daily usage (5 quick sessions):**
- Startup: 1,500 tokens × 5 = 7,500 tokens input
- Responses: 2,000 tokens × 5 = 10,000 tokens output
- **Daily cost:** ~$0.18 (18 cents)
- **Monthly cost:** ~$5.40

### Old Way (Without Memory)

**Daily usage (5 sessions, re-explaining each time):**
- Explaining context: 500 tokens × 5 = 2,500 tokens input
- Responses: 2,500 tokens × 5 = 12,500 tokens output
- **Daily cost:** ~$0.20 (20 cents)
- **Monthly cost:** ~$6.00

**Verdict:** Memory system is actually CHEAPER because you explain less!

## Emergency: Cost Too High?

**If hitting budget limits:**

1. **Switch to identity.md + episode only** (done!)
2. **Use `--continue` flag instead of new sessions**
   ```bash
   opencode --continue  # Resumes without reloading memory
   ```
3. **Batch your updates** (one session vs multiple)
4. **Edit files manually** for bulk changes
5. **Use shorter prompts**

## The Golden Rule

**Don't optimize prematurely.**

Start with default setup. If costs exceed $10/month, THEN optimize.

Most hunter-brain entrepreneurs waste more money in lost productivity from context switching than they'll ever spend on tokens.

**The system pays for itself if it helps you send even ONE more email.**

---

**Last Updated:** 2025-12-27
**Recommended Review:** Monthly
