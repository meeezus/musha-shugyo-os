#!/usr/bin/env python3
"""
Export MSOS database to markdown files.

This enables bidirectional sync - changes made in MSOS web UI
get written back to markdown files for Claude context.
"""

import asyncio
import os
from datetime import datetime
from pathlib import Path

import httpx

# Configuration
PERSONALOS_ROOT = Path(os.getenv("PERSONALOS_ROOT", Path.home() / "PersonalOS"))
MSOS_API_URL = os.getenv("MSOS_API_URL", "http://localhost:8000/api")
MSOS_API_TOKEN = os.getenv("MSOS_API_TOKEN", "")


async def export_projects():
    """Export projects from MSOS to projects_index.md."""
    output_path = PERSONALOS_ROOT / "Projects" / "projects_index.md"

    print(f"Exporting projects from MSOS to {output_path}...")

    async with httpx.AsyncClient(
        headers={"Authorization": f"Bearer {MSOS_API_TOKEN}"} if MSOS_API_TOKEN else {},
        timeout=30.0
    ) as client:
        try:
            resp = await client.get(f"{MSOS_API_URL}/sync/export")

            if resp.status_code == 200:
                data = resp.json()
                markdown = data.get("projects_index", "")
                project_count = data.get("project_count", 0)

                if markdown:
                    # Backup existing file
                    if output_path.exists():
                        backup_path = output_path.with_suffix(".md.bak")
                        output_path.rename(backup_path)
                        print(f"  Backed up existing file to {backup_path.name}")

                    output_path.write_text(markdown)
                    print(f"  Exported {project_count} projects")
                    print(f"  Written to: {output_path}")
                    return True
                else:
                    print("  No markdown content returned")
                    return False
            else:
                print(f"  API error: {resp.status_code} - {resp.text}")
                return False

        except Exception as e:
            print(f"  Export failed: {e}")
            return False


async def main():
    """Main entry point."""
    if not MSOS_API_TOKEN:
        print("Warning: MSOS_API_TOKEN not set")

    success = await export_projects()

    if success:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Export complete!")
    else:
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Export failed!")


if __name__ == "__main__":
    asyncio.run(main())
