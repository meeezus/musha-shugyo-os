#!/bin/bash
# =============================================================================
# Iori VM Lifecycle Manager
# Start, stop, monitor, and manage the Iori VM
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM_NAME="Iori-VM"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Add UTM to PATH
export PATH="$PATH:/Applications/UTM.app/Contents/MacOS"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Get VM Status
# =============================================================================
get_status() {
    if ! command -v utmctl &> /dev/null; then
        log_error "utmctl not found"
        return 1
    fi

    STATUS=$(utmctl status "$VM_NAME" 2>/dev/null)
    echo "$STATUS"
}

# =============================================================================
# Start VM
# =============================================================================
start_vm() {
    log_info "Starting $VM_NAME..."

    STATUS=$(get_status)
    if [[ "$STATUS" == *"started"* ]]; then
        log_success "VM is already running"
        return 0
    fi

    utmctl start "$VM_NAME"

    # Wait for VM to boot
    log_info "Waiting for VM to boot..."
    sleep 10

    # Try to ping the VM
    if [ -f "$SCRIPT_DIR/.vm_ip" ]; then
        VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
        for i in {1..30}; do
            if ping -c 1 -W 1 "$VM_IP" &> /dev/null; then
                log_success "VM is up and reachable at $VM_IP"
                return 0
            fi
            sleep 2
        done
        log_warn "VM started but not reachable yet. It may still be booting."
    else
        log_success "VM started"
    fi
}

# =============================================================================
# Stop VM
# =============================================================================
stop_vm() {
    log_info "Stopping $VM_NAME..."

    STATUS=$(get_status)
    if [[ "$STATUS" == *"stopped"* ]]; then
        log_success "VM is already stopped"
        return 0
    fi

    utmctl stop "$VM_NAME"
    log_success "VM stopped"
}

# =============================================================================
# Restart VM
# =============================================================================
restart_vm() {
    log_info "Restarting $VM_NAME..."
    stop_vm
    sleep 3
    start_vm
}

# =============================================================================
# SSH into VM
# =============================================================================
ssh_vm() {
    if [ ! -f "$SCRIPT_DIR/.vm_ip" ]; then
        log_error "VM IP not configured. Run setup.sh first."
        exit 1
    fi

    VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
    VM_USER="${VM_USER:-$(whoami)}"

    log_info "Connecting to $VM_USER@$VM_IP..."
    ssh "$VM_USER@$VM_IP"
}

# =============================================================================
# Check Clawdbot status inside VM
# =============================================================================
check_clawdbot() {
    if [ ! -f "$SCRIPT_DIR/.vm_ip" ]; then
        log_error "VM IP not configured"
        return 1
    fi

    VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
    VM_USER="${VM_USER:-$(whoami)}"

    log_info "Checking Clawdbot status in VM..."

    ssh "$VM_USER@$VM_IP" 'pgrep -f "clawdbot gateway" > /dev/null && echo "Clawdbot: RUNNING" || echo "Clawdbot: STOPPED"'
    ssh "$VM_USER@$VM_IP" 'curl -s http://localhost:18789/health 2>/dev/null | head -1 || echo "Gateway: NOT RESPONDING"'
}

# =============================================================================
# View Clawdbot logs
# =============================================================================
view_logs() {
    if [ ! -f "$SCRIPT_DIR/.vm_ip" ]; then
        log_error "VM IP not configured"
        return 1
    fi

    VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
    VM_USER="${VM_USER:-$(whoami)}"

    log_info "Streaming Clawdbot logs from VM..."
    ssh "$VM_USER@$VM_IP" 'tail -f ~/.clawdbot/logs/gateway.log'
}

# =============================================================================
# Restart Clawdbot inside VM
# =============================================================================
restart_clawdbot() {
    if [ ! -f "$SCRIPT_DIR/.vm_ip" ]; then
        log_error "VM IP not configured"
        return 1
    fi

    VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
    VM_USER="${VM_USER:-$(whoami)}"

    log_info "Restarting Clawdbot in VM..."
    ssh "$VM_USER@$VM_IP" 'launchctl unload ~/Library/LaunchAgents/com.iori.clawdbot.plist 2>/dev/null; launchctl load ~/Library/LaunchAgents/com.iori.clawdbot.plist'
    log_success "Clawdbot restarted"
}

# =============================================================================
# Show full status
# =============================================================================
show_status() {
    echo ""
    echo "============================================="
    echo "   IORI VM STATUS"
    echo "============================================="
    echo ""

    # VM Status
    STATUS=$(get_status 2>/dev/null || echo "unknown")
    if [[ "$STATUS" == *"started"* ]]; then
        echo -e "VM:        ${GREEN}RUNNING${NC}"
    elif [[ "$STATUS" == *"stopped"* ]]; then
        echo -e "VM:        ${RED}STOPPED${NC}"
    else
        echo -e "VM:        ${YELLOW}UNKNOWN${NC}"
    fi

    # VM IP
    if [ -f "$SCRIPT_DIR/.vm_ip" ]; then
        VM_IP=$(cat "$SCRIPT_DIR/.vm_ip")
        echo "IP:        $VM_IP"

        # Ping check
        if ping -c 1 -W 1 "$VM_IP" &> /dev/null; then
            echo -e "Network:   ${GREEN}REACHABLE${NC}"

            # Clawdbot check
            CLAWDBOT_STATUS=$(ssh -o ConnectTimeout=5 "$(whoami)@$VM_IP" 'pgrep -f "clawdbot gateway" > /dev/null && echo "RUNNING" || echo "STOPPED"' 2>/dev/null || echo "UNKNOWN")
            if [ "$CLAWDBOT_STATUS" = "RUNNING" ]; then
                echo -e "Clawdbot:  ${GREEN}RUNNING${NC}"
            elif [ "$CLAWDBOT_STATUS" = "STOPPED" ]; then
                echo -e "Clawdbot:  ${RED}STOPPED${NC}"
            else
                echo -e "Clawdbot:  ${YELLOW}UNKNOWN${NC}"
            fi
        else
            echo -e "Network:   ${RED}NOT REACHABLE${NC}"
        fi
    else
        echo "IP:        Not configured"
    fi

    echo ""
    echo "iMessage:  iorii.miyamoto@gmail.com"
    echo ""
}

# =============================================================================
# Monitor (continuous status)
# =============================================================================
monitor() {
    log_info "Monitoring Iori VM (Ctrl+C to stop)..."
    while true; do
        clear
        show_status
        sleep 5
    done
}

# =============================================================================
# Usage
# =============================================================================
usage() {
    echo "Iori VM Lifecycle Manager"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start        Start the VM"
    echo "  stop         Stop the VM"
    echo "  restart      Restart the VM"
    echo "  status       Show status"
    echo "  monitor      Continuous monitoring"
    echo "  ssh          SSH into the VM"
    echo "  logs         View Clawdbot logs"
    echo "  clawdbot     Check Clawdbot status"
    echo "  restart-bot  Restart Clawdbot (not the VM)"
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================
case "${1:-}" in
    start)
        start_vm
        ;;
    stop)
        stop_vm
        ;;
    restart)
        restart_vm
        ;;
    status)
        show_status
        ;;
    monitor)
        monitor
        ;;
    ssh)
        ssh_vm
        ;;
    logs)
        view_logs
        ;;
    clawdbot)
        check_clawdbot
        ;;
    restart-bot)
        restart_clawdbot
        ;;
    *)
        usage
        ;;
esac
