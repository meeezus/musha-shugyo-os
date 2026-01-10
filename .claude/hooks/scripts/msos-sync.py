#!/usr/bin/env python3
"""
MSOS Coding Activity Sync Hook

Sends coding activity to PersonalOS to track:
- Session completions
- Git commits
- Task completions

Usage:
  python3 msos-sync.py --type=commit --message="feat: add feature"
  python3 msos-sync.py --type=session_end --duration=45
  python3 msos-sync.py --type=task_complete --task="Fixed bug in auth"
"""

import os
import sys
import json
import subprocess
import argparse
import urllib.request
import urllib.error
from datetime import datetime

# MSOS Configuration
MSOS_API_URL = "http://localhost:8000/api/coding/activity"
MSOS_API_TOKEN = "5|yR1R0nw73L7YuL0dsd1ZI4Wfeblitnv7OyYz1kBef883c49a"

def get_git_info():
    """Get current git repository info"""
    try:
        # Get repo name from remote or folder
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            repo_path = result.stdout.strip()
            project_name = os.path.basename(repo_path)
        else:
            project_name = os.path.basename(os.getcwd())

        # Get current branch
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=5
        )
        branch = result.stdout.strip() if result.returncode == 0 else None

        return {"project_name": project_name, "branch": branch}
    except Exception:
        return {"project_name": os.path.basename(os.getcwd()), "branch": None}


def get_last_commit_info():
    """Get info about the last commit"""
    try:
        # Commit hash
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=5
        )
        commit_hash = result.stdout.strip()[:40] if result.returncode == 0 else None

        # Commit message
        result = subprocess.run(
            ["git", "log", "-1", "--pretty=%B"],
            capture_output=True, text=True, timeout=5
        )
        commit_message = result.stdout.strip() if result.returncode == 0 else None

        # Files changed in last commit
        result = subprocess.run(
            ["git", "diff", "--shortstat", "HEAD~1", "HEAD"],
            capture_output=True, text=True, timeout=5
        )
        stats = result.stdout.strip()
        files_changed = lines_added = lines_removed = 0
        if stats:
            parts = stats.split(",")
            for part in parts:
                part = part.strip()
                if "file" in part:
                    files_changed = int(part.split()[0])
                elif "insertion" in part:
                    lines_added = int(part.split()[0])
                elif "deletion" in part:
                    lines_removed = int(part.split()[0])

        return {
            "commit_hash": commit_hash,
            "commit_message": commit_message,
            "files_changed": files_changed,
            "lines_added": lines_added,
            "lines_removed": lines_removed,
        }
    except Exception as e:
        return {}


def send_to_msos(data):
    """Send activity data to MSOS API"""
    try:
        payload = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            MSOS_API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {MSOS_API_TOKEN}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
            return True, result
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()}"
    except Exception as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(description="Sync coding activity to MSOS")
    parser.add_argument("--type", required=True,
                       choices=["commit", "session_start", "session_end", "task_complete", "pr_created", "pr_merged"],
                       help="Type of activity")
    parser.add_argument("--message", help="Commit message or description")
    parser.add_argument("--duration", type=int, help="Duration in minutes (for sessions)")
    parser.add_argument("--task", help="Task description (for task_complete)")
    parser.add_argument("--task-id", type=int, help="MSOS task ID to complete directly")
    parser.add_argument("--quiet", action="store_true", help="Suppress output")

    args = parser.parse_args()

    # Build activity data
    git_info = get_git_info()
    data = {
        "type": args.type,
        "project_name": git_info.get("project_name"),
        "branch": git_info.get("branch"),
        "activity_at": datetime.now().isoformat(),
    }

    # Type-specific data
    if args.type == "commit":
        commit_info = get_last_commit_info()
        data.update(commit_info)
        if args.message:
            data["commit_message"] = args.message

    elif args.type in ("session_start", "session_end"):
        if args.duration:
            data["duration_minutes"] = args.duration

    elif args.type == "task_complete":
        data["task_description"] = args.task or args.message or "Task completed"

    # Send to MSOS
    success, result = send_to_msos(data)

    if not args.quiet:
        if success:
            print(f"[MSOS] Logged {args.type}: {result.get('matched_project', git_info.get('project_name'))}")
        else:
            print(f"[MSOS] Failed to log: {result}", file=sys.stderr)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
