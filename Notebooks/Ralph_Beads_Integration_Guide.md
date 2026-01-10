# Ralph + Beads: The Complete Integration Guide

## Overview

**Ralph** is Claude's autopilot mode - loops on a task until complete so you can walk away.

**Beads** is a git-backed task graph system that gives AI agents persistent memory across sessions.

**Together:** Ralph becomes dramatically more powerful - surviving crashes, tracking dependencies, and maintaining context across days/weeks.

---

## The Synergy

### Ralph Alone
- Loops autonomously until task complete
- Uses completion promise to know when done
- Lives in working memory (forgets on crash)
- No dependency awareness

### Ralph + Beads
- Loops autonomously through entire task graphs
- Queries Beads for next ready task
- Survives crashes (Beads remembers state in git)
- Respects dependencies automatically
- Multi-session memory with context decay
- Git-backed so you can branch/merge work

---

## Core Concepts

### 1. The .md File (The "Why")

**Purpose:** Provides context, rationale, and overall strategy

**Contains:**
- Goal and success criteria
- Why we're doing this
- Technical background
- Implementation approach
- Testing strategy

**Example:** `Iori_Kuato_Integration.md`

This is your **design document** - Ralph reads it to understand the big picture.

### 2. Beads Issues (The "What")

**Purpose:** Structured, trackable tasks with dependencies

**Contains:**
- Specific actionable tasks
- Dependencies (what blocks what)
- Status (ready, in_progress, closed)
- Priority levels

**Example:**
```bash
bd create "Parse Clawdbot sessions" -p 1
bd create "Sync VM to Mac" -p 2 --blocks-on bd-abc
```

This is your **task graph** - Ralph queries it to know what to do next.

### 3. The Pattern: .md + Beads

**Best practice:** Use BOTH together

1. Write .md file with context and plan
2. Initialize Beads based on that plan
3. Ralph reads .md for understanding
4. Ralph queries Beads for execution

**Why not just Beads?**
- Beads tasks are terse by design
- .md provides nuance, rationale, examples
- Ralph needs context to make smart decisions

**Why not just .md?**
- .md checklists don't survive crashes
- No dependency tracking
- Manual state management
- Context window bloat

---

## Setup: Installing Beads

### Installation

```bash
# Clone and install
git clone https://github.com/steveyegge/beads.git
cd beads
cargo install --path .

# Verify installation
bd --version
```

### Initialize in Your Project

```bash
# Navigate to project
cd ~/PersonalOS/Projects/Active/

# Initialize Beads
bd init

# This creates:
# - .beads/ directory
# - issues.jsonl file (tracked in git)
# - SQLite cache
```

---

## Workflow: Ralph + Beads Step-by-Step

### Step 1: Write the Plan (.md file)

Create your design document with:
- Goal and success criteria
- Context and rationale
- Implementation phases
- Technical details

**Example:** `~/PersonalOS/Projects/Active/My_Project.md`

### Step 2: Initialize Beads Tasks

Based on your .md file, create Beads issues:

```bash
# Navigate to project
cd ~/PersonalOS/Projects/Active/

# Initialize if not done
bd init

# Create tasks with dependencies
bd create "Phase 1: Parse data" -p 1
bd create "Phase 2: Process data" -p 2 --blocks-on bd-abc
bd create "Phase 3: Export results" -p 3 --blocks-on bd-xyz
bd create "Phase 4: Validate output" -p 4 --blocks-on bd-123

# View task graph
bd list
bd list --ready  # Show only tasks ready to work on
```

**Priority levels:**
- `p1` = Critical
- `p2` = Important
- `p3` = Nice to have

**Dependencies:**
```bash
# Task B blocks on Task A (A must finish first)
bd create "Task B" --blocks-on bd-abc

# Task C blocks on multiple tasks
bd create "Task C" --blocks-on bd-abc,bd-xyz
```

### Step 3: Launch Ralph

```bash
/ralph-loop "Follow the plan in ~/PersonalOS/Projects/Active/My_Project.md. Each iteration: (1) Run 'bd list --ready' to get next task, (2) Execute that task, (3) Run 'bd close <id> --reason \"Completed\"', (4) Run 'bd sync' to save. When 'bd list --open' returns empty, output <promise>ALL_COMPLETE</promise>" --max-iterations 50 --completion-promise "ALL_COMPLETE"
```

### Step 4: Walk Away

Ralph will:
1. Query Beads for ready tasks
2. Execute work
3. Close completed tasks
4. Sync to git
5. Move to next ready task
6. Repeat until done

### Step 5: Check Progress

While Ralph runs (or after crash):

```bash
# See all tasks
bd list

# See only ready tasks
bd list --ready

# See completed tasks
bd list --closed

# Check git sync
bd sync
git log --oneline
```

---

## Key Beads Commands for Ralph

### Task Creation

```bash
# Basic task
bd create "Task description"

# With priority
bd create "Critical task" -p 1

# With dependencies
bd create "Task B" --blocks-on bd-abc

# With labels
bd create "Bug fix" --label bug

# With assignee
bd create "Feature" --assignee michael
```

### Task Management

```bash
# Update status
bd update bd-abc --status in_progress
bd update bd-abc --status blocked

# Close task
bd close bd-abc --reason "Completed successfully"
bd close bd-xyz --reason "Duplicate of bd-abc"

# Add notes
bd update bd-abc --comment "Found edge case, handled in XYZ"
```

### Querying Tasks

```bash
# List all open tasks
bd list
bd list --open

# List ready tasks (no blockers)
bd list --ready

# List by status
bd list --status in_progress
bd list --closed

# List by priority
bd list --priority 1

# Show task details
bd show bd-abc
```

### Syncing

```bash
# Force immediate sync (don't wait for debounce)
bd sync

# Always run before session end
bd sync
git push
```

---

## Ralph + Beads Patterns

### Pattern 1: Simple Sequential Tasks

**Use case:** Tasks must happen in order, no parallelization

```bash
# Setup
bd create "Step 1" -p 1
bd create "Step 2" -p 1 --blocks-on bd-abc
bd create "Step 3" -p 1 --blocks-on bd-xyz
bd create "Step 4" -p 1 --blocks-on bd-123

# Execute
/ralph-loop "Work through Beads tasks sequentially. Each iteration: get next ready task with 'bd list --ready', execute, close with 'bd close', sync with 'bd sync'. When no open tasks remain, output <promise>COMPLETE</promise>" --max-iterations 20 --completion-promise "COMPLETE"
```

### Pattern 2: Parallel Tracks

**Use case:** Multiple independent work streams

```bash
# Track A: Data pipeline
bd create "Track A: Parse input" -p 1 --label pipeline
bd create "Track A: Transform data" -p 1 --blocks-on bd-abc --label pipeline
bd create "Track A: Export output" -p 1 --blocks-on bd-xyz --label pipeline

# Track B: Documentation
bd create "Track B: Write API docs" -p 2 --label docs
bd create "Track B: Add examples" -p 2 --blocks-on bd-123 --label docs

# Track C: Testing
bd create "Track C: Unit tests" -p 1 --label tests
bd create "Track C: Integration tests" -p 1 --blocks-on bd-456 --label tests

# Ralph can work on Track A, B, C in parallel (picks whatever is ready)
```

### Pattern 3: Research Then Execute

**Use case:** Need to explore before knowing exact tasks

```bash
# Phase 1: Research
bd create "Research existing codebase" -p 1
bd create "Identify integration points" -p 1 --blocks-on bd-abc
bd create "Document findings" -p 1 --blocks-on bd-xyz

# Phase 2: Placeholder for execution (created after research)
bd create "Execution phase (TBD after research)" -p 1 --blocks-on bd-123

# Ralph will:
# 1. Complete research tasks
# 2. When hitting "Execution phase (TBD)", create new subtasks based on findings
# 3. Continue execution
```

### Pattern 4: Multi-Session Long Projects

**Use case:** Project spans multiple days/sessions

```bash
# Day 1: Setup
bd create "Phase 1: Environment setup" -p 1
bd create "Phase 2: Core implementation" -p 1 --blocks-on bd-abc
bd create "Phase 3: Testing" -p 1 --blocks-on bd-xyz
bd create "Phase 4: Documentation" -p 2 --blocks-on bd-123

# Launch Ralph (works for 2 hours, VM crashes)
/ralph-loop "..." --max-iterations 30

# Day 2: Resume
bd list --ready  # See what's ready to work on
bd sync  # Pull latest from git
/ralph-loop "..." --max-iterations 30  # Picks up where left off
```

### Pattern 5: Quality Gates

**Use case:** Must pass tests/checks before proceeding

```bash
bd create "Implement feature" -p 1
bd create "Run tests" -p 1 --blocks-on bd-abc
bd create "Fix test failures" -p 1 --blocks-on bd-xyz
bd create "Run build" -p 1 --blocks-on bd-123
bd create "Deploy" -p 1 --blocks-on bd-456

# If tests fail, Ralph creates "Fix test failures" task and blocks deployment
```

---

## The Ralph Command Template

### Basic Template

```bash
/ralph-loop "Follow ~/PersonalOS/Projects/Active/PROJECT_NAME.md. Each iteration: (1) 'bd list --ready' to get next task, (2) Execute task, (3) 'bd close ID --reason \"Done\"', (4) 'bd sync'. When 'bd list --open' is empty, output <promise>COMPLETE</promise>" --max-iterations MAX --completion-promise "COMPLETE"
```

### With Error Handling

```bash
/ralph-loop "Follow ~/PersonalOS/Projects/Active/PROJECT_NAME.md. Each iteration: (1) 'bd list --ready', (2) Execute task, (3) If task fails, create new issue with 'bd create \"Fix: ERROR\"' and block original task, (4) If task succeeds, 'bd close ID --reason \"Done\"', (5) 'bd sync'. When no ready tasks remain, output <promise>COMPLETE</promise>" --max-iterations MAX --completion-promise "COMPLETE"
```

### With Progress Logging

```bash
/ralph-loop "Follow ~/PersonalOS/Projects/Active/PROJECT_NAME.md. Each iteration: (1) 'bd list --ready', (2) Execute task, (3) Update .md with progress notes, (4) 'bd close ID --reason \"Done\"', (5) 'bd sync' and 'git commit -am \"Progress on ID\"'. When complete, output <promise>COMPLETE</promise>" --max-iterations MAX --completion-promise "COMPLETE"
```

---

## Landing the Plane: Session End Checklist

When Ralph completes (or you interrupt), ensure clean state:

```bash
# 1. Sync Beads
bd sync

# 2. Check git status
git status  # Should be clean

# 3. Push to remote
git push

# 4. Verify no orphaned work
bd doctor

# 5. Review what's left
bd list --open
```

**Critical:** Don't end session with unpushed work. Beads only survives crashes if synced to git.

---

## Crash Recovery

### If Ralph Crashes Mid-Task

```bash
# 1. Check Beads state
cd ~/PersonalOS/Projects/Active/
bd list

# 2. See what was in progress
bd list --status in_progress

# 3. Sync from git (in case changes were pushed)
git pull
bd sync

# 4. Resume Ralph
/ralph-loop "..." --max-iterations 50
```

**Beads will show exactly where Ralph was.** No need to re-read .md or figure out progress.

### If Git Conflicts

```bash
# 1. Pull changes
git pull  # May show conflicts in issues.jsonl

# 2. Run Beads doctor
bd doctor  # Auto-resolves most conflicts

# 3. Manual resolution if needed
bd list  # Verify tasks look correct

# 4. Continue
/ralph-loop "..." --max-iterations 50
```

---

## Example: Iori-Kuato Integration with Ralph + Beads

### 1. The .md File (Already Created)

`~/PersonalOS/Projects/Active/Iori_Kuato_Integration.md` contains:
- Goal and context
- Implementation phases
- Technical details
- Testing plan

### 2. Initialize Beads

```bash
cd ~/PersonalOS/Projects/Active/
bd init

# Phase 1: Parse Clawdbot Sessions
bd create "Create Clawdbot parser for Kuato" -p 1 --label phase1
bd create "Test parser with sample session" -p 1 --blocks-on bd-abc --label phase1
bd create "Integrate parser into Kuato pipeline" -p 1 --blocks-on bd-xyz --label phase1

# Phase 2: Sync VM to Mac
bd create "Create rsync script for sessions" -p 1 --blocks-on bd-123 --label phase2
bd create "Add cron job for periodic sync" -p 1 --blocks-on bd-456 --label phase2
bd create "Test sync manually" -p 1 --blocks-on bd-789 --label phase2

# Phase 3: Query Capability
bd create "Create Kuato query wrapper script" -p 1 --blocks-on bd-abc1 --label phase3
bd create "Update Iori AGENTS.md with query instructions" -p 1 --blocks-on bd-xyz2 --label phase3
bd create "Test query from VM via SSH" -p 1 --blocks-on bd-123a --label phase3

# Phase 4: Auto-Archive
bd create "Add token monitoring to Clawdbot" -p 2 --blocks-on bd-456b --label phase4
bd create "Implement summary generation" -p 2 --blocks-on bd-789c --label phase4
bd create "Test auto-archive at 150K limit" -p 2 --blocks-on bd-abc2 --label phase4

# Integration test
bd create "End-to-end integration test" -p 1 --blocks-on bd-abc2 --label validation
```

### 3. Launch Ralph

```bash
/ralph-loop "Complete Iori-Kuato integration following ~/PersonalOS/Projects/Active/Iori_Kuato_Integration.md. Each iteration: (1) Run 'bd list --ready' to get next task, (2) Execute that task, (3) Update .md checklist for visibility, (4) Run 'bd close ID --reason \"Completed\"', (5) Run 'bd sync' to save progress. When 'bd list --open' returns empty, output <promise>INTEGRATION_COMPLETE</promise>" --max-iterations 30 --completion-promise "INTEGRATION_COMPLETE"
```

### 4. Monitor Progress

```bash
# Check what Ralph is working on
bd list --status in_progress

# See what's left
bd list --ready

# Check git history
git log --oneline --grep="bd-"
```

### 5. Resume After Interrupt

```bash
# Next day or after crash
cd ~/PersonalOS/Projects/Active/
bd sync
bd list --ready

# Ralph picks up exactly where he left off
/ralph-loop "..." --max-iterations 30
```

---

## Best Practices

### Do's

✅ **Always sync before ending session:** `bd sync && git push`

✅ **Use descriptive task names:** "Parse Clawdbot sessions in Kuato" not "Phase 1"

✅ **Set realistic max-iterations:** Better to resume than timeout mid-task

✅ **Create blocking relationships:** Let Beads enforce dependencies

✅ **Keep .md file updated:** Ralph and you both benefit from context

✅ **Use labels for organization:** `--label phase1`, `--label bug`, etc.

✅ **Test sync before long runs:** Ensure git push works

### Don'ts

❌ **Don't end session without bd sync:** You'll lose progress

❌ **Don't ignore blockers:** If a task is blocked, Ralph should handle it or escalate

❌ **Don't create circular dependencies:** Beads will catch this but wastes iterations

❌ **Don't make tasks too granular:** "Write line 1 of function" is overkill

❌ **Don't skip the .md file:** Beads alone lacks context

❌ **Don't forget git push:** Beads only survives crashes if in git

---

## Troubleshooting

### Ralph keeps working on same task

**Issue:** Task isn't being closed properly

```bash
# Check task status
bd show bd-abc

# Manually close if needed
bd close bd-abc --reason "Completed by Ralph"
bd sync
```

### "No ready tasks" but work remains

**Issue:** Tasks are blocked

```bash
# Check what's blocking
bd list --blocked

# Identify bottleneck
bd show bd-abc  # Look at "blocks" field

# Unblock if blocker is done
bd close bd-xyz --reason "Blocker resolved"
```

### Git conflicts in issues.jsonl

**Issue:** Multiple agents/sessions modified same tasks

```bash
# Run doctor
bd doctor

# Check resolution
bd list

# If still broken, manual merge
git checkout --theirs .beads/issues.jsonl
bd sync
```

### Ralph creates duplicate tasks

**Issue:** Task already exists in Beads

```bash
# Find duplicates
bd list | grep "Task name"

# Close duplicates
bd close bd-dup1 --reason "Duplicate of bd-abc"
bd close bd-dup2 --reason "Duplicate of bd-abc"
```

---

## Advanced: Multi-Agent Coordination

### Use case: Multiple Claude instances working on same project

**Setup:**

```bash
# Initialize Beads in project
bd init

# Create tasks with clear ownership
bd create "Backend API" -p 1 --assignee claude-backend
bd create "Frontend UI" -p 1 --assignee claude-frontend
bd create "Integration tests" -p 1 --blocks-on bd-abc,bd-xyz --assignee claude-test

# Each agent syncs frequently
bd sync  # Every 5-10 minutes
```

**Ralph command per agent:**

```bash
# Backend Ralph
/ralph-loop "Work on tasks assigned to claude-backend. Run 'bd list --ready --assignee claude-backend', execute, close, sync. When no tasks remain, output <promise>DONE</promise>" --max-iterations 20 --completion-promise "DONE"

# Frontend Ralph
/ralph-loop "Work on tasks assigned to claude-frontend. Run 'bd list --ready --assignee claude-frontend', execute, close, sync. When no tasks remain, output <promise>DONE</promise>" --max-iterations 20 --completion-promise "DONE"
```

**Benefits:**
- Agents don't step on each other
- Beads handles merge conflicts
- Integration tests block on both tracks completing

---

## Summary: When to Use Ralph + Beads

### Use Ralph Alone (simple .md)
- Quick one-off tasks (< 5 steps)
- Single session work
- No dependencies
- Low crash risk

### Use Ralph + Beads
- Multi-phase projects
- Work spanning multiple sessions
- Complex dependencies
- Crash-prone environments (VMs, long-running)
- Multi-agent coordination
- Need git history of task completion

---

## Quick Reference Card

```bash
# SETUP
bd init                                    # Initialize in project
bd create "Task" -p 1                      # Create task
bd create "Task B" --blocks-on bd-abc      # Create with dependency

# EXECUTION
bd list --ready                            # What can I work on?
bd update bd-abc --status in_progress      # Mark task started
bd close bd-abc --reason "Done"            # Mark task complete
bd sync                                    # Save to git

# MONITORING
bd list                                    # All tasks
bd list --open                             # Incomplete tasks
bd list --closed                           # Completed tasks
bd show bd-abc                             # Task details

# CLEANUP
bd sync && git push                        # End session
bd doctor                                  # Fix conflicts

# RALPH
/ralph-loop "Work through Beads tasks..." --max-iterations 50 --completion-promise "DONE"
```

---

## Additional Resources

- **Beads GitHub:** https://github.com/steveyegge/beads
- **Ralph Guide:** `~/PersonalOS/Ralph_Practical_Guide.md`
- **Example Projects:** `~/PersonalOS/Projects/Active/`

---

## Changelog

- **2026-01-08:** Initial guide created
- Document combines Ralph autopilot with Beads task tracking
- Covers setup, workflows, patterns, troubleshooting

---

**Remember:** The .md file is the "why," Beads is the "what," and Ralph is the "how." Use all three together for maximum power.
