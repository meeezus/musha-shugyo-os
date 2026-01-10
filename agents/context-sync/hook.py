#!/usr/bin/env python3
"""
Claude Code SessionEnd Hook

Triggers the context sync agent after each session ends.
Receives session data via stdin and kicks off the sync process.
"""

import json
import subprocess
import sys
from pathlib import Path

AGENT_DIR = Path(__file__).parent
AGENT_SCRIPT = AGENT_DIR / "main.py"


def main():
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Error parsing hook input: {e}", file=sys.stderr)
        sys.exit(1)

    session_id = input_data.get("session_id")
    reason = input_data.get("reason")

    # Skip if session was just cleared or trivial
    if reason == "clear":
        print("Session cleared, skipping sync")
        sys.exit(0)

    # Trigger the context sync agent in the background
    # We use subprocess to avoid blocking the hook
    try:
        subprocess.Popen(
            ["/opt/homebrew/bin/uv", "run", "python", str(AGENT_SCRIPT)],
            cwd=str(AGENT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True  # Detach from parent
        )
        print(f"Context sync triggered for session {session_id[:8] if session_id else 'unknown'}")
    except Exception as e:
        print(f"Failed to trigger context sync: {e}", file=sys.stderr)
        # Don't fail the hook, just log
        sys.exit(0)

    sys.exit(0)


if __name__ == "__main__":
    main()
