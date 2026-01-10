# Iori VM Setup

## Quick Reference

| Component | Location/Value |
|-----------|----------------|
| VM Name | `Iori-VM` |
| VM IP | `192.168.64.2` (stored in `.vm_ip`) |
| iMessage account | `iorii.miyamoto@gmail.com` |
| Allowed users | Michael (+16263995496), Tricia (+13109093695) |

## Architecture

```
Mac (Host)                         VM (Iori-VM)
├── PersonalOS/         <──SSH──   ├── clawdbot/
├── ~/.claude/                     ├── ~/.clawdbot/credentials/oauth.json
└── Keychain (Claude creds)        └── ~/clawdbot-workspace/
```

**Key design**: VM accesses Mac via SSH (not file sync). All data lives on Mac.

## Credential Format (CRITICAL)

The pi-ai library expects **lowercase keys**:
```json
{"anthropic": {"access": "sk-ant-oat01-...", "refresh": "sk-ant-ort01-...", "expires": 1767797473952}}
```
NOT camelCase (`accessToken`, `refreshToken`, `expiresAt`).

## Persistence Mechanisms

| What | How | Location |
|------|-----|----------|
| Credential refresh | LaunchAgent (4hr) | `~/Library/LaunchAgents/com.iori.credentials.refresh.plist` |
| Gateway watchdog | VM cron (5min) | `*/5 * * * * ~/check-clawdbot.sh` |
| VM auto-start | LaunchAgent | `~/Library/LaunchAgents/com.iori.vm.autostart.plist` |
| Sleep prevention | System setting | Battery → Options → Prevent sleep on adapter |

## Common Commands

```bash
# Refresh credentials manually
~/PersonalOS/Scripts/iori-vm/refresh-iori-creds.sh

# SSH to VM
ssh michaelenriquez@192.168.64.2

# Restart Clawdbot on VM
ssh michaelenriquez@192.168.64.2 "pkill -f 'tsx.*gateway'; cd ~/clawdbot && PATH=/opt/homebrew/bin:\$PATH nohup pnpm clawdbot gateway >> ~/.clawdbot/logs/gateway.log 2>&1 &"

# Check logs
ssh michaelenriquez@192.168.64.2 "tail -50 ~/.clawdbot/logs/gateway.log"

# VM → Mac Claude Code (for Iori to use)
ssh michaelenriquez@192.168.64.1 "export PATH=/opt/homebrew/bin:\$PATH && cd ~/PersonalOS && claude --print 'request'"
```

## Troubleshooting

**"No API key found for provider anthropic"**
1. Run `~/PersonalOS/Scripts/iori-vm/refresh-iori-creds.sh`
2. Restart gateway (command above)
3. Verify format is lowercase keys (not camelCase)

**Iori not responding after Mac sleep**
- Mac sleeping breaks everything. Ensure "Prevent sleep when plugged in" is enabled.

**SSH from VM to Mac fails**
- Check Remote Login enabled: System Settings → General → Sharing → Remote Login
- Test: `ssh michaelenriquez@192.168.64.2 "ssh michaelenriquez@192.168.64.1 'echo OK'"`

## Iori's Capabilities

| Capability | How | Notes |
|------------|-----|-------|
| File access | SSH to Mac | Read/write PersonalOS files |
| Coding | Claude Code via SSH | Full IDE capabilities |
| Calendar | AppleScript via SSH | Create events |
| Web search | Claude Code via SSH | Current news, X/Twitter content |
| Web fetch | Claude Code via SSH | Static pages only (no JS) |

**Web access tip**: For X/Twitter, use web search (not direct fetch) since X requires JavaScript.

## Files

| File | Purpose |
|------|---------|
| `refresh-iori-creds.sh` | Copies OAuth from Keychain → VM |
| `.vm_ip` | VM IP address |
| VM: `~/.clawdbot/clawdbot.json` | Clawdbot config |
| VM: `~/clawdbot-workspace/AGENTS.md` | Iori's instructions |
| VM: `~/clawdbot-workspace/SOUL.md` | Clawdbot personality |
| VM: `~/clawdbot-workspace/WEB_ACCESS.md` | Web access guide |
| VM: `~/clawdbot-workspace/CALENDAR.md` | Calendar integration |
