#!/bin/bash
# Refresh Iori OAuth credentials from Mac to VM

VM_IP="192.168.64.2"
VM_USER="michaelenriquez"

# Get fresh credentials from Mac Keychain
CREDS=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null)
if [ -z "$CREDS" ]; then
    echo "$(date): Failed to get credentials from Keychain" >> /tmp/iori-refresh.log
    exit 1
fi

# Update local credentials file for SSH access to Claude Code
echo "$CREDS" > ~/.claude/.credentials.json
chmod 600 ~/.claude/.credentials.json

# Convert to Clawdbot format (lowercase keys!) and copy to VM
echo "$CREDS" | jq '{
    anthropic: {
        access: .claudeAiOauth.accessToken,
        refresh: .claudeAiOauth.refreshToken,
        expires: .claudeAiOauth.expiresAt
    }
}' | ssh -o ConnectTimeout=5 "$VM_USER@$VM_IP" "cat > ~/.clawdbot/credentials/oauth.json" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "$(date): Credentials refreshed (Clawdbot + Claude Code)" >> /tmp/iori-refresh.log
else
    echo "$(date): Failed to copy credentials to VM" >> /tmp/iori-refresh.log
    exit 1
fi
