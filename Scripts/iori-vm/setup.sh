#!/bin/bash
# =============================================================================
# Iori VM Setup Script
# Creates and configures a macOS VM for Iori (PersonalOS AI Assistant)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM_NAME="Iori-VM"
VM_RAM_MB=8192
VM_CPU_CORES=4
VM_DISK_GB=64
IORI_EMAIL="iorii.miyamoto@gmail.com"
PERSONALOS_PATH="$HOME/PersonalOS"
CLAWDBOT_REPO="https://github.com/steipete/clawdis"
HOST_PERSONALOS="$HOME/PersonalOS"
HOST_CLAWDIS_COPY="$HOST_PERSONALOS/clawdis"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# STEP 1: Check Prerequisites
# =============================================================================
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check for UTM
    if [ -d "/Applications/UTM.app" ]; then
        log_success "UTM found"
    else
        log_error "UTM not found in /Applications. Please install UTM first."
        exit 1
    fi

    # Check for utmctl
    if command -v utmctl &> /dev/null; then
        log_success "utmctl found"
    else
        log_warn "utmctl not in PATH. Adding UTM CLI..."
        export PATH="$PATH:/Applications/UTM.app/Contents/MacOS"
    fi

    # Check for jq
    if command -v jq &> /dev/null; then
        log_success "jq found"
    else
        log_warn "jq not found. Installing via Homebrew..."
        brew install jq
    fi

    # Check Claude Code credentials (file or Keychain)
    if [ -f "$HOME/.claude/.credentials.json" ]; then
        log_success "Claude Code credentials found (file)"
        CREDS_SOURCE="file"
    elif security find-generic-password -s "Claude Code-credentials" -w &>/dev/null; then
        log_success "Claude Code credentials found (Keychain)"
        CREDS_SOURCE="keychain"
    else
        log_error "Claude Code credentials not found"
        log_error "Please run 'claude' and authenticate first."
        exit 1
    fi
}

# =============================================================================
# STEP 2: Download macOS IPSW
# =============================================================================
download_ipsw() {
    IPSW_DIR="$HOME/.cache/utm-ipsw"
    mkdir -p "$IPSW_DIR"

    # Check if we already have an IPSW
    EXISTING_IPSW=$(find "$IPSW_DIR" -name "*.ipsw" -type f 2>/dev/null | head -1)

    if [ -n "$EXISTING_IPSW" ]; then
        log_success "Found existing IPSW: $EXISTING_IPSW"
        IPSW_PATH="$EXISTING_IPSW"
        return
    fi

    log_info "Downloading macOS IPSW (this may take a while ~13GB)..."
    log_info "You can also manually download from: https://ipsw.me/product/Mac"

    # Get latest macOS IPSW URL for Apple Silicon
    # This uses Apple's software update catalog
    IPSW_URL=$(curl -s "https://mesu.apple.com/assets/macos/com_apple_macOSIPSW/com_apple_macOSIPSW.xml" | \
        grep -o 'https://updates.cdn-apple.com[^<]*\.ipsw' | head -1)

    if [ -z "$IPSW_URL" ]; then
        log_warn "Could not auto-detect IPSW URL."
        log_info "Please download macOS IPSW manually from https://ipsw.me/product/Mac"
        log_info "Save it to: $IPSW_DIR/"
        read -p "Press Enter when IPSW is downloaded..."
        EXISTING_IPSW=$(find "$IPSW_DIR" -name "*.ipsw" -type f 2>/dev/null | head -1)
        if [ -z "$EXISTING_IPSW" ]; then
            log_error "No IPSW found in $IPSW_DIR"
            exit 1
        fi
        IPSW_PATH="$EXISTING_IPSW"
    else
        IPSW_NAME=$(basename "$IPSW_URL")
        IPSW_PATH="$IPSW_DIR/$IPSW_NAME"
        curl -L -o "$IPSW_PATH" "$IPSW_URL"
        log_success "IPSW downloaded to $IPSW_PATH"
    fi
}

# =============================================================================
# STEP 3: Create VM
# =============================================================================
create_vm() {
    log_info "Creating VM '$VM_NAME'..."

    # Check if VM already exists
    if utmctl list | grep -q "$VM_NAME"; then
        log_warn "VM '$VM_NAME' already exists"
        read -p "Delete and recreate? (y/N): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            utmctl delete "$VM_NAME" || true
        else
            log_info "Using existing VM"
            return
        fi
    fi

    # Create VM using UTM's command line
    # Note: UTM's CLI is limited, so we may need to create via AppleScript or template

    log_info "Creating macOS VM with:"
    log_info "  - RAM: ${VM_RAM_MB}MB"
    log_info "  - CPU: ${VM_CPU_CORES} cores"
    log_info "  - Disk: ${VM_DISK_GB}GB"
    log_info "  - IPSW: $IPSW_PATH"

    # UTM doesn't have a full CLI for VM creation, so we'll use AppleScript
    osascript <<EOF
tell application "UTM"
    activate
end tell
EOF

    log_warn "UTM's CLI doesn't support full VM creation yet."
    log_info ""
    log_info "Please create the VM manually in UTM:"
    log_info "  1. Click 'Create a New Virtual Machine'"
    log_info "  2. Select 'Virtualize' → 'macOS'"
    log_info "  3. Browse to IPSW: $IPSW_PATH"
    log_info "  4. Set RAM to ${VM_RAM_MB}MB, CPU to ${VM_CPU_CORES} cores"
    log_info "  5. Set disk size to ${VM_DISK_GB}GB"
    log_info "  6. Name it '$VM_NAME'"
    log_info ""
    read -p "Press Enter when VM is created and macOS is installed..."
}

# =============================================================================
# STEP 4: Manual Setup Steps (inside VM)
# =============================================================================
manual_setup_instructions() {
    log_info ""
    log_info "============================================="
    log_info "MANUAL STEPS REQUIRED INSIDE THE VM"
    log_info "============================================="
    log_info ""
    log_info "1. ENABLE REMOTE LOGIN (SSH):"
    log_info "   System Settings → General → Sharing → Remote Login → ON"
    log_info "   Note the VM's IP address shown there"
    log_info ""
    log_info "2. SIGN INTO iMESSAGE:"
    log_info "   Open Messages app → Sign in with: $IORI_EMAIL"
    log_info "   Complete 2FA verification"
    log_info ""
    log_info "3. GRANT FULL DISK ACCESS (after Clawdbot install):"
    log_info "   System Settings → Privacy & Security → Full Disk Access"
    log_info "   Add: Terminal, Clawdbot, imsg"
    log_info ""

    read -p "Enter the VM's IP address: " VM_IP
    echo "$VM_IP" > "$SCRIPT_DIR/.vm_ip"
    log_success "VM IP saved: $VM_IP"
}

# =============================================================================
# STEP 5: Provision VM via SSH
# =============================================================================
provision_vm() {
    if [ ! -f "$SCRIPT_DIR/.vm_ip" ]; then
        log_error "VM IP not found. Run setup first."
        exit 1
    fi

    VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
    VM_USER=$(whoami)  # Assuming same username

    log_info "Provisioning VM at $VM_IP..."

    read -p "Enter VM username (default: $VM_USER): " input_user
    VM_USER=${input_user:-$VM_USER}

    # Copy provisioning script to VM
    log_info "Copying provisioning script to VM..."
    scp "$SCRIPT_DIR/provision-vm.sh" "$VM_USER@$VM_IP:~/provision-vm.sh"

    # Copy Claude credentials to VM
    log_info "Copying Claude credentials to VM..."
    ssh "$VM_USER@$VM_IP" "mkdir -p ~/.clawdbot/credentials"

    # Get credentials from file or Keychain
    if [ -f "$HOME/.claude/.credentials.json" ]; then
        CREDS_JSON=$(cat "$HOME/.claude/.credentials.json")
    else
        CREDS_JSON=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null)
    fi

    # Convert Claude Code credentials to Clawdbot format
    echo "$CREDS_JSON" | jq '{
        anthropic: {
            access: .claudeAiOauth.accessToken,
            refresh: .claudeAiOauth.refreshToken,
            expires: .claudeAiOauth.expiresAt
        }
    }' | ssh "$VM_USER@$VM_IP" "cat > ~/.clawdbot/credentials/oauth.json && chmod 600 ~/.clawdbot/credentials/oauth.json"

    log_success "Credentials copied to VM"

    # Run provisioning script on VM
    log_info "Running provisioning script on VM..."
    ssh -t "$VM_USER@$VM_IP" "chmod +x ~/provision-vm.sh && ~/provision-vm.sh"

    log_success "VM provisioning complete!"
}

# =============================================================================
# STEP 6: Create shared folder for PersonalOS
# =============================================================================
setup_shared_folder() {
    log_info "Setting up PersonalOS access..."

    # UTM supports VirtioFS for shared folders on macOS guests
    # This needs to be configured in UTM's VM settings

    log_warn "For PersonalOS access, you have two options:"
    log_info ""
    log_info "Option A: Shared Folder (recommended)"
    log_info "  In UTM → VM Settings → Sharing → Add share pointing to:"
    log_info "  $PERSONALOS_PATH"
    log_info ""
    log_info "Option B: Sync via rsync (alternative)"
    log_info "  We can set up periodic rsync to copy Memory/Knowledge folders"
    log_info ""

    read -p "Set up rsync sync? (y/N): " setup_rsync
    if [ "$setup_rsync" = "y" ] || [ "$setup_rsync" = "Y" ]; then
        setup_rsync_sync
    fi
}

setup_rsync_sync() {
    if [ ! -f "$SCRIPT_DIR/.vm_ip" ]; then
        log_error "VM IP not found"
        return
    fi

    VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
    VM_USER=$(whoami)

    # Create sync script
    cat > "$SCRIPT_DIR/sync-personalos.sh" << 'SYNC_EOF'
#!/bin/bash
# Sync PersonalOS context to Iori VM

VM_IP=$(cat "$(dirname "$0")/.vm_ip")
VM_USER="${VM_USER:-$(whoami)}"
PERSONALOS="$HOME/PersonalOS"

# Sync Memory and Knowledge (read-only for VM)
rsync -avz --delete \
    "$PERSONALOS/Memory/" \
    "$PERSONALOS/Knowledge/" \
    "$PERSONALOS/CLAUDE.md" \
    "$VM_USER@$VM_IP:~/PersonalOS-Context/"

echo "Synced PersonalOS context to VM"
SYNC_EOF

    chmod +x "$SCRIPT_DIR/sync-personalos.sh"
    log_success "Created sync script: $SCRIPT_DIR/sync-personalos.sh"

    # Add to cron for periodic sync
    read -p "Add to cron for periodic sync every 5 minutes? (y/N): " add_cron
    if [ "$add_cron" = "y" ] || [ "$add_cron" = "Y" ]; then
        (crontab -l 2>/dev/null; echo "*/5 * * * * $SCRIPT_DIR/sync-personalos.sh") | crontab -
        log_success "Added cron job for PersonalOS sync"
    fi
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    echo ""
    echo "============================================="
    echo "   IORI VM SETUP"
    echo "   macOS VM for PersonalOS AI Assistant"
    echo "============================================="
    echo ""

    case "${1:-}" in
        --provision)
            provision_vm
            ;;
        --sync)
            "$SCRIPT_DIR/sync-personalos.sh"
            ;;
        --ip)
            if [ -f "$SCRIPT_DIR/.vm_ip" ]; then
                cat "$SCRIPT_DIR/.vm_ip"
            else
                log_error "VM IP not set. Run setup first."
            fi
            ;;
        *)
            check_prerequisites
            download_ipsw
            create_vm
            manual_setup_instructions
            provision_vm
            setup_shared_folder

            log_success ""
            log_success "============================================="
            log_success "   SETUP COMPLETE!"
            log_success "============================================="
            log_success ""
            log_success "Iori is ready. To manage the VM:"
            log_success "  Start:   $SCRIPT_DIR/lifecycle.sh start"
            log_success "  Stop:    $SCRIPT_DIR/lifecycle.sh stop"
            log_success "  Status:  $SCRIPT_DIR/lifecycle.sh status"
            log_success "  SSH:     $SCRIPT_DIR/lifecycle.sh ssh"
            log_success ""
            log_success "Message Iori at: $IORI_EMAIL"
            ;;
    esac
}

main "$@"
