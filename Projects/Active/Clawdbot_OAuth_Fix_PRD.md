# PRD: Fix Clawdbot OAuth for Iori iMessage Instance (v2)

> **Docs Reference:** https://docs.clawd.bot/concepts/oauth, https://docs.clawd.bot/providers/imessage

---

## HOW TO RUN THIS WITH RALPH

**Step 1:** Start Claude Code with permissions bypassed:
```bash
claude --dangerously-skip-permissions
```

**Step 2:** Tell Claude:
```
Run the Ralph task from this PRD. Execute Phase 1 (host Mac setup) using /ralph-loop with the command in this file. Use --max-iterations 20 and --completion-promise "HOST_SETUP_COMPLETE"
```

**Step 3:** Walk away. Ralph will loop until done.

---

## Problem Statement
Iori (macOS VM running iMessage bot via Clawdbot) has OAuth issues. Root causes:
1. Host clawdbot is 1600 commits behind upstream (`steipete/clawdis`)
2. OAuth credentials may not be syncing from Claude Code
3. Need to verify auth-profiles.json setup (new location per docs)

## Key Documentation Findings

### OAuth Storage (Per Official Docs)
- **New location:** `~/.clawdbot/agents/<agentId>/agent/auth-profiles.json`
- **Legacy (import-only):** `~/.clawdbot/credentials/oauth.json`
- **Auto-sync from Claude Code:**
  - macOS: Keychain item "Claude Code-credentials"
  - Linux/Windows: `~/.claude/.credentials.json`

### iMessage Auth (Separate from OAuth)
- Uses **pairing-based access control**, NOT OAuth
- Default: `imessage.dmPolicy = "pairing"`
- Requires `imsg` CLI: `brew install steipete/tap/imsg`
- Requires Full Disk Access + Automation permissions

## Success Criteria
- [ ] Host clawdbot updated to latest upstream
- [ ] Auth-profiles correctly syncing from Claude Code keychain
- [ ] imsg CLI installed and configured
- [ ] iMessage pairing working on Iori VM

---

## Beads Task Structure

```
bd-001: Update host clawdbot from upstream [RALPH-AUTOMATABLE]
    |
bd-002: Verify auth-profiles.json syncs from Claude Code [VERIFY]
    |
bd-003: Install/verify imsg CLI [RALPH-AUTOMATABLE]
    |
bd-004: Set up UTM shared folder [MANUAL - requires UTM GUI]
    |
bd-005: Update clawdbot on Iori VM [MANUAL - requires VM access]
    |
bd-006: Configure iMessage pairing on Iori [MANUAL - requires VM access]
    |
bd-007: Test iMessage integration [MANUAL]
```

---

## Phase 1: Host Mac Setup (Ralph-Automatable)

### Ralph Loop Command
```
/ralph-loop "Fix Clawdbot OAuth on host Mac:

PHASE 1: Update clawdbot from upstream
1. cd /Users/michaelenriquez/clawdbot
2. Run: source ~/.nvm/nvm.sh && nvm install 22 && nvm use 22
3. Run: git stash (if needed)
4. Run: git fetch origin && git pull origin main
5. Run: pnpm install
6. Run: pnpm build
7. Verify build succeeded

PHASE 2: Verify OAuth auto-sync
1. Check if Claude Code credentials exist in keychain (macOS) or ~/.claude/.credentials.json
2. Run: clawdbot models status
3. Run: clawdbot providers list --json
4. Verify auth profiles show Anthropic OAuth is connected
5. If not synced, check ~/.clawdbot/agents/main/agent/auth-profiles.json

PHASE 3: Verify imsg CLI
1. Check if imsg is installed: which imsg
2. If not: brew install steipete/tap/imsg
3. Verify imsg works: imsg --version

Output <promise>HOST_SETUP_COMPLETE</promise> when all 3 phases done."
--max-iterations 20 --completion-promise "HOST_SETUP_COMPLETE"
```

### Credential Locations (Per Docs)
| Purpose | Location |
|---------|----------|
| Claude Code source | macOS Keychain "Claude Code-credentials" OR `~/.claude/.credentials.json` |
| Clawdbot auth profiles | `~/.clawdbot/agents/<agentId>/agent/auth-profiles.json` |
| Legacy (import-only) | `~/.clawdbot/credentials/oauth.json` |

### Verification Commands
```bash
clawdbot models status          # Check model availability
clawdbot providers list --json  # See auth profiles under auth[] field
```

---

## Phase 2: VM Setup (SSH-Automated OR Manual)

### OPTION A: Fully Automated via SSH (Preferred)

**Prerequisites:**
- SSH enabled on Iori VM: `System Settings > General > Sharing > Remote Login`
- VM IP address known (check UTM network settings or run `ifconfig` in VM)
- SSH key copied to VM OR password auth enabled

**To enable SSH on Iori (one-time manual step in VM):**
```bash
sudo systemsetup -setremotelogin on
```

**Ralph Loop Command for VM Setup (run after Phase 1 completes):**
```
/ralph-loop "Fix Clawdbot OAuth on Iori VM via SSH (IP: 192.168.64.2, User: michaelenriquez):

1. Test SSH connection: ssh michaelenriquez@192.168.64.2 'echo connected'
2. Copy Claude credentials to VM:
   scp ~/.claude/.credentials.json michaelenriquez@192.168.64.2:~/.claude/.credentials.json
3. Update clawdbot on VM:
   ssh michaelenriquez@192.168.64.2 'cd ~/clawdbot && git fetch origin && git pull origin main && npm install && npm run build'
4. Verify OAuth on VM:
   ssh michaelenriquez@192.168.64.2 'cd ~/clawdbot && pnpm clawdbot models status'
5. Install imsg if needed:
   ssh michaelenriquez@192.168.64.2 'which imsg || brew install steipete/tap/imsg'
6. Verify imsg:
   ssh michaelenriquez@192.168.64.2 'imsg --version'
7. Start gateway (in background):
   ssh michaelenriquez@192.168.64.2 'cd ~/clawdbot && nohup pnpm clawdbot gateway --port 18789 > ~/clawdbot-gateway.log 2>&1 &'
8. Verify gateway running:
   ssh michaelenriquez@192.168.64.2 'curl -s http://localhost:18789/health'

Output <promise>VM_SETUP_COMPLETE</promise> when all steps succeed."
--max-iterations 15 --completion-promise "VM_SETUP_COMPLETE"
```

**VM SSH Details:**
- VM IP: `192.168.64.2`
- VM User: `michaelenriquez` (same as host)
- Auth: SSH key (already in known_hosts)

---

### OPTION B: Manual VM Setup (If SSH Not Available)

### Step 1: Enable UTM Shared Folder
1. Open UTM
2. Select `iori-vm` -> Edit (gear icon)
3. Go to **Sharing** tab
4. Enable **Directory Sharing**
5. Add shared directory: `~/shared-with-vm`
6. Start/restart VM

### Step 2: Inside Iori VM - Update Clawdbot
```bash
# Update clawdbot
cd ~/clawdbot
git fetch origin && git pull origin main
npm install  # or pnpm install
npm run build  # or pnpm build
```

### Step 3: Inside Iori VM - Set Up Claude OAuth
```bash
# Option A: Copy credentials file from host (via shared folder)
mkdir -p ~/.clawdbot/agents/main/agent
cp /Volumes/My\ Mac/.claude/.credentials.json ~/.claude/.credentials.json

# Option B: Run OAuth login directly in VM
clawdbot login anthropic

# Verify OAuth is working
clawdbot models status
clawdbot providers list --json
```

### Step 4: Inside Iori VM - Set Up iMessage
```bash
# Install imsg CLI
brew install steipete/tap/imsg

# Grant Full Disk Access to Terminal + imsg in System Settings > Privacy

# Configure iMessage in clawdbot.json
cat >> ~/.clawdbot/clawdbot.json << 'EOF'
{
  "imessage": {
    "enabled": true,
    "dmPolicy": "pairing"
  }
}
EOF

# Start gateway
clawdbot gateway --port 18789 --verbose
```

### Step 5: Approve iMessage Pairing
```bash
# List pending pairing requests
clawdbot pairing list --provider imessage

# Approve a pairing code
clawdbot pairing approve --provider imessage <CODE>
```

### Step 6: Verify
```bash
# Check gateway health
curl http://localhost:18789/health

# Check models are available
clawdbot models status

# Test iMessage (send yourself a message)
```

---

## Verification Checklist

**Host Mac:**
- [ ] `git log -1` shows latest upstream commit
- [ ] `clawdbot models status` shows Claude models available
- [ ] `clawdbot providers list --json` shows auth profiles

**Iori VM:**
- [ ] `clawdbot models status` shows Claude models available
- [ ] `imsg --version` works
- [ ] `curl localhost:18789/health` returns healthy status
- [ ] Send test iMessage -> Claude responds
- [ ] No OAuth errors in gateway logs

---

## Files Modified
- `~/.clawdbot/agents/main/agent/auth-profiles.json` (auto-synced from Claude Code)
- `~/.clawdbot/clawdbot.json` (iMessage config)
- `~/.claude/.credentials.json` (VM - copied from host or fresh login)

## Dependencies
- Node.js 22+ (via nvm)
- pnpm
- imsg CLI: `brew install steipete/tap/imsg`
- Full Disk Access permission for imsg
- UTM with directory sharing enabled

---

*Updated: 2026-01-10*
*Status: Ready for execution*
