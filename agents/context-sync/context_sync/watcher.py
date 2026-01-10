#!/usr/bin/env python3
"""
File Watcher Daemon for MSOS Context Sync.

Watches markdown files and syncs changes to MSOS database.
"""

import asyncio
import os
import signal
import sys
from datetime import datetime
from pathlib import Path

import httpx
from watchfiles import awatch, Change

from .parser import ContextParser, ParsedProject, ParsedTask

# Configuration
PERSONALOS_ROOT = Path(os.getenv("PERSONALOS_ROOT", Path.home() / "PersonalOS"))
MSOS_API_URL = os.getenv("MSOS_API_URL", "http://localhost:8000/api")
MSOS_API_TOKEN = os.getenv("MSOS_API_TOKEN", "")  # Sanctum token

# Files to watch
WATCH_PATTERNS = [
    "Dashboard.md",
    "Memory/goals.md",
    "Memory/observations.md",
    "Projects/projects_index.md",
    "Projects/Active/*.md",
    "Tasks/Active/*.md",
    "Tasks/Daily/*.md",
]

# Debounce settings
DEBOUNCE_SECONDS = 2.0


class MSOSSync:
    """Handles syncing parsed data to MSOS API."""

    def __init__(self, api_url: str, token: str):
        self.api_url = api_url
        self.token = token
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {token}"} if token else {},
            timeout=30.0
        )

    async def close(self):
        await self.client.aclose()

    async def sync_projects(self, projects: list[ParsedProject]) -> dict:
        """Sync projects to MSOS database."""
        results = {"created": 0, "updated": 0, "errors": []}

        for project in projects:
            try:
                # Check if project exists by name
                resp = await self.client.get(
                    f"{self.api_url}/projects",
                    params={"status": "all"}
                )

                existing = None
                if resp.status_code == 200:
                    existing_projects = resp.json()
                    for ep in existing_projects:
                        if ep.get("name", "").lower() == project.name.lower():
                            existing = ep
                            break

                project_data = {
                    "name": project.name,
                    "description": project.description,
                    "status": project.status,
                    "deadline": project.deadline,
                }

                if existing:
                    # Update existing project
                    resp = await self.client.put(
                        f"{self.api_url}/projects/{existing['id']}",
                        json=project_data
                    )
                    if resp.status_code == 200:
                        results["updated"] += 1
                        project_id = existing["id"]
                    else:
                        results["errors"].append(f"Failed to update {project.name}: {resp.text}")
                        continue
                else:
                    # Create new project
                    resp = await self.client.post(
                        f"{self.api_url}/projects",
                        json=project_data
                    )
                    if resp.status_code == 201:
                        results["created"] += 1
                        project_id = resp.json().get("id")
                    else:
                        results["errors"].append(f"Failed to create {project.name}: {resp.text}")
                        continue

                # Sync tasks for this project
                if project.tasks and project_id:
                    await self._sync_project_tasks(project_id, project.tasks)

            except Exception as e:
                results["errors"].append(f"Error syncing {project.name}: {str(e)}")

        return results

    async def _sync_project_tasks(self, project_id: int, tasks: list[ParsedTask]):
        """Sync tasks for a specific project."""
        for i, task in enumerate(tasks):
            task_data = {
                "title": task.title,
                "priority": task.priority,
                "project_id": project_id,
                "sort_order": i,
                "completed_at": datetime.now().isoformat() if task.completed else None,
            }

            if task.due_date:
                task_data["due_date"] = task.due_date

            # Try to find existing task by title + project
            # For simplicity, we'll just create new tasks
            # A smarter implementation would match by title
            try:
                await self.client.post(
                    f"{self.api_url}/tasks",
                    json=task_data
                )
            except Exception:
                pass  # Ignore task sync errors for now

    async def health_check(self) -> bool:
        """Check if MSOS API is reachable."""
        try:
            resp = await self.client.get(f"{self.api_url}/user")
            return resp.status_code == 200
        except Exception:
            return False

    async def export_to_markdown(self, output_path: Path) -> bool:
        """Export projects from MSOS to markdown file."""
        try:
            resp = await self.client.get(f"{self.api_url}/sync/export")
            if resp.status_code == 200:
                data = resp.json()
                markdown = data.get("projects_index", "")
                if markdown:
                    output_path.write_text(markdown)
                    return True
            return False
        except Exception as e:
            print(f"Export failed: {e}")
            return False


class ContextWatcher:
    """Watches markdown files and triggers sync on changes."""

    def __init__(self, root: Path, sync: MSOSSync):
        self.root = root
        self.sync = sync
        self.parser = ContextParser(root)
        self.last_sync = None
        self.pending_sync = False
        self._running = True

    def _should_watch(self, path: Path) -> bool:
        """Check if a file should trigger sync."""
        rel_path = str(path.relative_to(self.root))

        # Check against patterns
        watch_dirs = ["Memory", "Projects", "Tasks"]
        if any(rel_path.startswith(d) for d in watch_dirs):
            return rel_path.endswith(".md")

        # Root level files
        if rel_path in ["Dashboard.md", "CLAUDE.md"]:
            return True

        return False

    async def sync_all(self):
        """Parse all files and sync to MSOS."""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Syncing context to MSOS...")

        try:
            data = self.parser.parse_all()

            print(f"  Found {len(data['projects'])} projects, {len(data['goals'])} goals")

            if data["projects"]:
                results = await self.sync.sync_projects(data["projects"])
                print(f"  Projects: {results['created']} created, {results['updated']} updated")
                if results["errors"]:
                    for err in results["errors"][:3]:
                        print(f"  Error: {err}")

            self.last_sync = datetime.now()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sync complete")

        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sync failed: {e}")

    async def run(self):
        """Main watch loop."""
        print(f"Context Sync Daemon starting...")
        print(f"  Watching: {self.root}")
        print(f"  MSOS API: {self.sync.api_url}")

        # Check API connectivity
        if not await self.sync.health_check():
            print("  WARNING: MSOS API not reachable (continuing anyway)")

        # Initial sync
        await self.sync_all()

        # Watch for changes
        watch_path = self.root
        print(f"\nWatching for changes... (Ctrl+C to stop)\n")

        try:
            async for changes in awatch(watch_path, recursive=True):
                if not self._running:
                    break

                # Filter relevant changes
                relevant_changes = []
                for change_type, path in changes:
                    path = Path(path)
                    if self._should_watch(path):
                        relevant_changes.append((change_type, path))

                if relevant_changes:
                    for change_type, path in relevant_changes:
                        change_name = {
                            Change.added: "Added",
                            Change.modified: "Modified",
                            Change.deleted: "Deleted"
                        }.get(change_type, "Changed")
                        rel_path = path.relative_to(self.root)
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {change_name}: {rel_path}")

                    # Debounce: wait a bit for more changes
                    await asyncio.sleep(DEBOUNCE_SECONDS)

                    # Sync
                    await self.sync_all()

        except asyncio.CancelledError:
            print("\nShutting down...")

    def stop(self):
        """Stop the watcher."""
        self._running = False


async def async_main():
    """Async main entry point."""
    sync = MSOSSync(MSOS_API_URL, MSOS_API_TOKEN)
    watcher = ContextWatcher(PERSONALOS_ROOT, sync)

    # Handle shutdown gracefully
    loop = asyncio.get_event_loop()

    def shutdown():
        watcher.stop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown)

    try:
        await watcher.run()
    finally:
        await sync.close()


def main():
    """Entry point."""
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
