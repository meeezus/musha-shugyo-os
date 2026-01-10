#!/usr/bin/env python3
"""
Context Sync Agent

Analyzes Claude Code sessions and updates PersonalOS memory files.
Runs after each session to keep context current.
"""

import asyncio
import httpx
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from claude_code_sdk import query, ClaudeCodeOptions, AssistantMessage, TextBlock

# Configuration
KUATO_API = "http://localhost:3847"
PERSONALOS_ROOT = Path.home() / "PersonalOS"
MEMORY_DIR = PERSONALOS_ROOT / "Memory"
DISCORD_WEBHOOK = os.getenv(
    "DISCORD_WEBHOOK_URL",
    "https://discord.com/api/webhooks/1457212480966099121/gNI_Ksgr7XKrgyRDZY9w53hEuRMSg9vSyra9LYhWtlVpsWRwAu2yfH5atuw_kzu2u8Ib"
)


async def get_latest_session() -> dict | None:
    """Fetch the most recent unprocessed session from Kuato."""
    async with httpx.AsyncClient() as client:
        # Get sessions from last 24 hours, excluding warmup sessions
        resp = await client.get(
            f"{KUATO_API}/sessions",
            params={"days": 1, "limit": 10}
        )
        data = resp.json()

        if not data.get("success") or not data.get("data"):
            return None

        # Filter out warmup/trivial sessions
        for session in data["data"]:
            messages = session.get("user_messages", [])
            if messages and not all(m.strip().lower() == "warmup" for m in messages):
                # Check if already processed (look for marker in episode_logs)
                session_id = session["id"]

                # Simple check - if no episode log starts with this ID prefix, process it
                existing = list((MEMORY_DIR / "episode_logs").glob(f"*_{session_id[:8]}.md"))
                if not existing:
                    return session

        return None


async def get_session_transcript(session_id: str) -> str | None:
    """Fetch full transcript for deeper analysis."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{KUATO_API}/sessions/{session_id}",
            params={"with_transcript": "true"}
        )
        data = resp.json()
        if data.get("success"):
            return data.get("data", {}).get("transcript")
    return None


def read_file(path: Path) -> str:
    """Read a file safely."""
    if path.exists():
        return path.read_text()
    return ""


async def analyze_and_update(session: dict) -> dict:
    """
    Use Claude to analyze session and determine updates.
    Returns a report of what was changed.
    """
    session_id = session["id"]
    user_messages = session.get("user_messages", [])
    files_touched = session.get("files_touched", [])
    tools_used = session.get("tools_used", [])
    started_at = session.get("started_at", "")

    # Read current memory files
    goals_content = read_file(MEMORY_DIR / "goals.md")
    observations_content = read_file(MEMORY_DIR / "observations.md")
    identity_content = read_file(MEMORY_DIR / "identity.md")

    # Build prompt for analysis
    prompt = f"""You are the Context Sync Agent for Michael's PersonalOS.

Your job is to analyze a Claude Code session and update the memory files appropriately.

## Session to Analyze
- **Session ID:** {session_id}
- **Started:** {started_at}
- **User Messages:**
{json.dumps(user_messages, indent=2)}

- **Files Touched:** {files_touched}
- **Tools Used:** {tools_used}

## Current Memory Files

### goals.md (Current Objectives)
{goals_content[:3000]}

### observations.md (Patterns About Michael)
{observations_content[:2000]}

### identity.md (System Identity)
{identity_content[:1000]}

## Your Task

Analyze this session and determine what updates are needed. Be AGGRESSIVE - capture:
1. **Progress on goals** - Did Michael work on any listed objectives? Update progress.
2. **New patterns** - Did you observe hunter-brain patterns, resistance, or workflow insights?
3. **Decisions made** - Any commitments or choices that should be recorded?
4. **New information** - Facts learned that should persist (tools installed, configs changed, etc.)

## Output Format

Respond with a JSON object:
```json
{{
  "session_summary": "Brief 1-2 sentence summary of what happened",
  "observations_to_add": "Text to append to observations.md (or null if none)",
  "goals_updates": "Specific updates to goals.md (describe what to change, or null)",
  "episode_log": "Markdown content for the episode log entry",
  "discord_message": "Concise message for Discord notification"
}}
```

Be specific and actionable. If nothing meaningful happened, say so."""

    # Run Claude to analyze
    report = {
        "session_id": session_id,
        "session_summary": "",
        "observations_to_add": None,
        "goals_updates": None,
        "episode_log": "",
        "discord_message": "",
        "files_modified": []
    }

    response_text = ""
    async for message in query(
        prompt=prompt,
        options=ClaudeCodeOptions(
            max_turns=1,
            system_prompt="You are a context sync agent. Output only valid JSON."
        )
    ):
        if isinstance(message, AssistantMessage) and message.content:
            for block in message.content:
                if isinstance(block, TextBlock):
                    response_text += block.text

    # Parse the JSON response
    try:
        # Find JSON in response
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start >= 0 and end > start:
            analysis = json.loads(response_text[start:end])
            report.update(analysis)
    except json.JSONDecodeError as e:
        report["discord_message"] = f"Failed to parse analysis: {e}"
        return report

    # Apply updates
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H%M")

    # 1. Create episode log
    if report.get("episode_log"):
        episode_dir = MEMORY_DIR / "episode_logs"
        episode_dir.mkdir(exist_ok=True)
        episode_file = episode_dir / f"{date_str}_{time_str}_{session_id[:8]}.md"
        episode_content = f"""# Session {session_id[:8]} - {date_str}

**Analyzed:** {now.strftime("%Y-%m-%d %H:%M")}

---

{report['episode_log']}

---

*Auto-generated by Context Sync Agent*
"""
        episode_file.write_text(episode_content)
        report["files_modified"].append(str(episode_file))

    # 2. Append to observations if needed
    if report.get("observations_to_add"):
        obs_file = MEMORY_DIR / "observations.md"
        current = read_file(obs_file)

        # Find the right place to insert (before the --- divider at the end)
        new_section = f"\n\n## Session {date_str}\n{report['observations_to_add']}\n"

        if "---" in current:
            # Insert before the last ---
            parts = current.rsplit("---", 1)
            updated = parts[0].rstrip() + new_section + "\n---" + parts[1]
        else:
            updated = current + new_section

        obs_file.write_text(updated)
        report["files_modified"].append(str(obs_file))

    return report


async def send_discord_notification(report: dict):
    """Send a summary to Discord."""
    if not DISCORD_WEBHOOK:
        return

    message = report.get("discord_message", "Session processed")
    files_modified = report.get("files_modified", [])

    embed = {
        "title": "🧠 Context Sync Complete",
        "description": message,
        "color": 0x7289DA,  # Discord blue
        "fields": [],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    if report.get("session_summary"):
        embed["fields"].append({
            "name": "Session Summary",
            "value": report["session_summary"][:1024],
            "inline": False
        })

    if files_modified:
        embed["fields"].append({
            "name": "Files Updated",
            "value": "\n".join([f"• `{Path(f).name}`" for f in files_modified[:5]]),
            "inline": False
        })

    if report.get("observations_to_add"):
        embed["fields"].append({
            "name": "New Observation",
            "value": report["observations_to_add"][:500] + "..." if len(report.get("observations_to_add", "")) > 500 else report["observations_to_add"],
            "inline": False
        })

    async with httpx.AsyncClient() as client:
        await client.post(DISCORD_WEBHOOK, json={"embeds": [embed]})


async def main(test_session_id: str = None):
    """Main entry point."""
    print("Context Sync Agent starting...")

    if test_session_id:
        # Test mode - fetch specific session
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{KUATO_API}/sessions/{test_session_id}")
            data = resp.json()
            if data.get("success"):
                session = data.get("data")
            else:
                print(f"Session not found: {test_session_id}")
                return
    else:
        # Normal mode - get latest unprocessed session
        session = await get_latest_session()

    if not session:
        print("No new sessions to process.")
        return

    print(f"Processing session: {session['id'][:8]}...")

    # Analyze and update
    report = await analyze_and_update(session)

    # Send Discord notification
    await send_discord_notification(report)

    print(f"Done. Files modified: {report.get('files_modified', [])}")


if __name__ == "__main__":
    import sys
    test_id = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(main(test_id))
