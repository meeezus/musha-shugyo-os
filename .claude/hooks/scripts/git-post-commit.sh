#!/bin/bash
#
# Git post-commit hook - Logs commits to MSOS
# Install: cp this file to .git/hooks/post-commit && chmod +x .git/hooks/post-commit
#

# MSOS sync script location
MSOS_SYNC="/Users/michaelenriquez/PersonalOS/.claude/hooks/scripts/msos-sync.py"

# Run the sync if script exists
if [ -f "$MSOS_SYNC" ]; then
    python3 "$MSOS_SYNC" --type=commit --quiet &
fi

exit 0
