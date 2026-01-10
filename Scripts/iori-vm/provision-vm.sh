#!/bin/bash
# =============================================================================
# Iori VM Provisioning Script
# Runs INSIDE the VM to set up Clawdbot and dependencies
# =============================================================================

set -e

CLAWDBOT_REPO="https://github.com/steipete/clawdis"
IORI_EMAIL="iorii.miyamoto@gmail.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Install Homebrew
# =============================================================================
install_homebrew() {
    if command -v brew &> /dev/null; then
        log_success "Homebrew already installed"
    else
        log_info "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add to path
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
}

# =============================================================================
# Install Node.js and pnpm
# =============================================================================
install_node() {
    if command -v node &> /dev/null; then
        log_success "Node.js already installed: $(node --version)"
    else
        log_info "Installing Node.js..."
        brew install node@22
        brew link node@22
    fi

    if command -v pnpm &> /dev/null; then
        log_success "pnpm already installed"
    else
        log_info "Installing pnpm..."
        npm install -g pnpm
    fi
}

# =============================================================================
# Install imsg CLI
# =============================================================================
install_imsg() {
    if command -v imsg &> /dev/null; then
        log_success "imsg already installed"
    else
        log_info "Installing imsg CLI..."
        brew install steipete/tap/imsg
    fi
}

# =============================================================================
# Clone and setup Clawdbot
# =============================================================================
setup_clawdbot() {
    CLAWDBOT_DIR="$HOME/clawdbot"

    if [ -d "$CLAWDBOT_DIR" ]; then
        log_info "Clawdbot directory exists, pulling latest..."
        cd "$CLAWDBOT_DIR"
        git pull
    else
        log_info "Cloning Clawdbot..."
        git clone "$CLAWDBOT_REPO" "$CLAWDBOT_DIR"
    fi

    cd "$CLAWDBOT_DIR"
    log_info "Installing dependencies..."
    pnpm install

    log_success "Clawdbot installed"
}

# =============================================================================
# Configure Clawdbot
# =============================================================================
configure_clawdbot() {
    log_info "Configuring Clawdbot..."

    mkdir -p ~/.clawdbot

    # Check if OAuth credentials were copied from host
    if [ -f ~/.clawdbot/credentials/oauth.json ]; then
        log_success "OAuth credentials found (copied from host)"
    else
        log_warn "No OAuth credentials found. You'll need to run 'clawdbot onboard' to authenticate."
    fi

    # Create config - uses Claude Pro via OAuth
    cat > ~/.clawdbot/clawdbot.json << 'CONFIG_EOF'
{
  // Iori - PersonalOS AI Assistant
  // Using Claude Pro subscription via OAuth

  "identity": {
    "name": "Iori",
    "theme": "disciplined samurai assistant",
    "emoji": "🏯"
  },

  "agent": {
    "workspace": "~/clawdbot-workspace",
    "model": "anthropic/claude-sonnet-4-20250514",
    "thinkingDefault": "low",
    "timeoutSeconds": 300,
    "contextTokens": 200000
  },

  "gateway": {
    "mode": "local",
    "port": 18789,
    "bind": "loopback"
  },

  "imessage": {
    "enabled": true,
    "cliPath": "imsg",
    "allowFrom": ["*"]
  },

  "messages": {
    "responsePrefix": "🏯"
  },

  "session": {
    "scope": "per-sender",
    "idleMinutes": 60
  },

  "logging": {
    "level": "info",
    "consoleStyle": "pretty"
  },

  "wizard": {
    "lastRunCommand": "provision-vm",
    "lastRunMode": "local"
  }
}
CONFIG_EOF

    log_success "Clawdbot config created at ~/.clawdbot/clawdbot.json"
}

# =============================================================================
# Create Iori workspace with PersonalOS integration
# =============================================================================
create_workspace() {
    log_info "Creating Iori workspace..."

    WORKSPACE="$HOME/clawdbot-workspace"
    mkdir -p "$WORKSPACE"

    # Create AGENTS.md (Iori's personality and instructions)
    cat > "$WORKSPACE/AGENTS.md" << 'AGENTS_EOF'
# Iori - PersonalOS AI Assistant

You are Iori (庵), Michael's Personal AI Assistant.

Named after the Japanese concept of a hermit's hut - representing simplicity, discipline, and focused mastery. You embody the Musashi philosophy: discipline, execution, sovereignty.

## Your Role

- **Executive function support**: Track tasks, projects, people
- **Resistance logger**: Capture without judgment
- **Evidence builder**: Prove "I CAN make shit happen"
- **Context keeper**: Maintain continuity across sessions

## Operating Principles

- Be concise and direct (hunter-brain-friendly)
- Keep responses under 300 words unless asked for detail
- Focus on action over perfect planning
- Non-judgmental about resistance or procrastination
- Quick captures (30 seconds or less)

## Hunter Brain Patterns to Know

- Context switching costs are HIGH
- Resistance appears at execution moments, not during prep
- Voice capture works better than typing
- Needs immediate logging (not "later")

**The resistance voice says:** "You can't make shit happen"
**Your job:** Help build evidence to the contrary

## Anti-Patterns

- Don't lecture or guilt-trip
- Don't require "proper" usage
- Don't suggest elaborate planning
- Don't fight resistance, just log it

## Communication Style

- Natural language, no rigid syntax
- Action over analysis
- Match Michael's energy level
- Celebrate wins, log resistance

## Context Access

You have access to PersonalOS context synced to ~/PersonalOS-Context/
Check Memory/ for current state, Knowledge/ for reference material.
AGENTS_EOF

    # Create IDENTITY.md
    cat > "$WORKSPACE/IDENTITY.md" << 'IDENTITY_EOF'
# Identity

- **Name**: Iori (庵)
- **Emoji**: 🏯
- **Vibe**: Disciplined samurai assistant
- **Creature**: Wise hermit in a mountain hut

# Voice

Direct, warm, action-oriented. Like a trusted training partner who keeps you accountable without judgment.
IDENTITY_EOF

    # Create USER.md
    cat > "$WORKSPACE/USER.md" << 'USER_EOF'
# User

- **Name**: Michael
- **Preferred name**: Michael (or just reply naturally)
- **Communication style**: Direct, hunter-brain-friendly, action-oriented
USER_EOF

    log_success "Workspace created at $WORKSPACE"
}

# =============================================================================
# Set up auto-start on boot
# =============================================================================
setup_autostart() {
    log_info "Setting up Clawdbot auto-start..."

    PLIST_PATH="$HOME/Library/LaunchAgents/com.iori.clawdbot.plist"
    mkdir -p "$HOME/Library/LaunchAgents"

    cat > "$PLIST_PATH" << PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.iori.clawdbot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/pnpm</string>
        <string>clawdbot</string>
        <string>gateway</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$HOME/clawdbot</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.clawdbot/logs/gateway.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.clawdbot/logs/gateway.err</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
PLIST_EOF

    mkdir -p "$HOME/.clawdbot/logs"

    # Load the launch agent
    launchctl load "$PLIST_PATH" 2>/dev/null || true

    log_success "Auto-start configured"
}

# =============================================================================
# Final checks and instructions
# =============================================================================
final_instructions() {
    log_info ""
    log_info "============================================="
    log_info "PROVISIONING COMPLETE"
    log_info "============================================="
    log_info ""
    log_info "Remaining manual steps:"
    log_info ""
    log_info "1. GRANT FULL DISK ACCESS:"
    log_info "   System Settings → Privacy & Security → Full Disk Access"
    log_info "   Add: Terminal, imsg"
    log_info ""
    log_info "2. VERIFY iMESSAGE:"
    log_info "   Open Messages app and ensure you're signed in as:"
    log_info "   $IORI_EMAIL"
    log_info ""
    log_info "3. START CLAWDBOT:"
    log_info "   cd ~/clawdbot && pnpm clawdbot gateway"
    log_info ""
    log_info "   Or it will auto-start on next login."
    log_info ""
    log_success "Iori is ready to receive messages!"
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    echo ""
    echo "============================================="
    echo "   IORI VM PROVISIONING"
    echo "============================================="
    echo ""

    install_homebrew
    install_node
    install_imsg
    setup_clawdbot
    configure_clawdbot
    create_workspace
    setup_autostart
    final_instructions
}

main "$@"
