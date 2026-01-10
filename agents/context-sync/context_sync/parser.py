"""
Markdown Parser for PersonalOS context files.

Parses projects, tasks, and goals from markdown files.
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class ParsedTask:
    title: str
    completed: bool = False
    priority: str = "medium"
    due_date: Optional[str] = None
    description: Optional[str] = None


@dataclass
class ParsedProject:
    name: str
    description: Optional[str] = None
    status: str = "active"
    deadline: Optional[str] = None
    tasks: list[ParsedTask] = field(default_factory=list)
    source_file: Optional[str] = None


@dataclass
class ParsedGoal:
    name: str
    current_value: float = 0
    target_value: float = 100
    unit: str = "%"
    description: Optional[str] = None


def parse_task_line(line: str) -> Optional[ParsedTask]:
    """Parse a markdown task line like '- [ ] Do something'."""
    # Match: - [ ] or - [x] followed by task text
    match = re.match(r'^[-*]\s*\[([ xX])\]\s*(.+)$', line.strip())
    if not match:
        return None

    completed = match.group(1).lower() == 'x'
    text = match.group(2).strip()

    # Extract priority if present (e.g., "[HIGH]" or "🔥")
    priority = "medium"
    if "[HIGH]" in text.upper() or "🔥" in text:
        priority = "high"
        text = re.sub(r'\[HIGH\]|\[high\]|🔥', '', text).strip()
    elif "[LOW]" in text.upper():
        priority = "low"
        text = re.sub(r'\[LOW\]|\[low\]', '', text).strip()

    # Extract due date if present (e.g., "(due: Jan 10)" or "(Mon)")
    due_match = re.search(r'\((?:due:?\s*)?([A-Za-z]{3}\s+\d{1,2}|\d{4}-\d{2}-\d{2}|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\)', text)
    due_date = None
    if due_match:
        due_date = due_match.group(1)
        text = text.replace(due_match.group(0), '').strip()

    return ParsedTask(
        title=text,
        completed=completed,
        priority=priority,
        due_date=due_date
    )


def parse_projects_index(content: str, source_file: str = None) -> list[ParsedProject]:
    """Parse projects from projects_index.md format."""
    projects = []
    current_project = None
    in_project = False

    lines = content.split('\n')

    for i, line in enumerate(lines):
        # Look for project headers like "### 1. Project Name"
        project_match = re.match(r'^###\s*\d*\.?\s*(.+)$', line)
        if project_match:
            # Save previous project
            if current_project:
                projects.append(current_project)

            name = project_match.group(1).strip()
            current_project = ParsedProject(name=name, source_file=source_file)
            in_project = True
            continue

        if not in_project or not current_project:
            continue

        # Parse status
        if line.startswith('**Status:**'):
            status_text = line.replace('**Status:**', '').strip()
            if '🟢' in status_text or 'Active' in status_text:
                current_project.status = 'active'
            elif '🟡' in status_text or 'Paused' in status_text:
                current_project.status = 'archived'
            elif '✅' in status_text or 'Complete' in status_text:
                current_project.status = 'completed'

        # Parse deadline/timeline
        if line.startswith('**Timeline:**') or line.startswith('**Deadline:**'):
            deadline_text = line.split(':', 1)[1].strip()
            # Try to extract end date
            date_match = re.search(r'(\w+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})', deadline_text)
            if date_match:
                current_project.deadline = date_match.group(1)

        # Parse tasks
        task = parse_task_line(line)
        if task:
            current_project.tasks.append(task)

        # Check for section break (new project or divider)
        if line.strip() == '---':
            in_project = False

    # Don't forget the last project
    if current_project:
        projects.append(current_project)

    return projects


def parse_dashboard(content: str) -> list[ParsedProject]:
    """Parse projects from Dashboard.md format."""
    projects = []

    # Find the Projects section
    lines = content.split('\n')
    in_projects = False
    current_project = None

    for line in lines:
        # Look for "### 1. Projects" or similar
        if '### 1. Projects' in line or '**Active:**' in line:
            in_projects = True
            continue

        if in_projects:
            # Project name after "**Active:**"
            if line.startswith('**Active:**'):
                name = line.replace('**Active:**', '').strip()
                current_project = ParsedProject(name=name, status='active')
                continue

            # End of projects section
            if line.startswith('### 2.') or line.startswith('---'):
                if current_project:
                    projects.append(current_project)
                break

            # Tasks in "Must Complete" etc
            task = parse_task_line(line)
            if task and current_project:
                current_project.tasks.append(task)

    return projects


def parse_goals_md(content: str) -> tuple[list[ParsedGoal], list[ParsedProject]]:
    """Parse goals.md for goals only. Weekly tasks are NOT projects."""
    goals = []
    projects = []  # We don't extract projects from goals.md anymore

    lines = content.split('\n')

    for i, line in enumerate(lines):
        # Look for "## Priority Order" section for goals
        if '## Priority Order' in line:
            # Parse numbered goals
            for j in range(i + 1, min(i + 10, len(lines))):
                goal_match = re.match(r'^\d+\.\s+\*\*(.+?)\*\*\s*[-–]\s*(.+)$', lines[j])
                if goal_match:
                    goals.append(ParsedGoal(
                        name=goal_match.group(1),
                        description=goal_match.group(2)
                    ))

    # Weekly items (Week 1, Week 2, etc.) are tasks within projects,
    # NOT projects themselves. They should be associated with their
    # parent project (like Automation Agency) via projects_index.md

    return goals, projects


def parse_project_file(content: str, filename: str) -> Optional[ParsedProject]:
    """Parse a single project markdown file."""
    lines = content.split('\n')

    # Get title from first H1
    name = filename.replace('.md', '').replace('_', ' ')
    for line in lines:
        if line.startswith('# '):
            name = line[2:].strip()
            break

    project = ParsedProject(name=name, source_file=filename)

    # Parse metadata and tasks
    for line in lines:
        if line.startswith('**Status:**'):
            status_text = line.lower()
            if 'active' in status_text:
                project.status = 'active'
            elif 'paused' in status_text or 'hold' in status_text:
                project.status = 'archived'
            elif 'complete' in status_text:
                project.status = 'completed'

        task = parse_task_line(line)
        if task:
            project.tasks.append(task)

    return project if project.tasks or project.name else None


class ContextParser:
    """Main parser that reads all context files."""

    def __init__(self, root: Path):
        self.root = root
        self.memory_dir = root / "Memory"
        self.projects_dir = root / "Projects"
        self.tasks_dir = root / "Tasks"

    def parse_all(self) -> dict:
        """Parse all context files and return structured data."""
        result = {
            "projects": [],
            "goals": [],
            "tasks": []
        }

        # Parse projects_index.md
        projects_index = self.projects_dir / "projects_index.md"
        if projects_index.exists():
            content = projects_index.read_text()
            result["projects"].extend(parse_projects_index(content, str(projects_index)))

        # Parse Dashboard.md
        dashboard = self.root / "Dashboard.md"
        if dashboard.exists():
            content = dashboard.read_text()
            result["projects"].extend(parse_dashboard(content))

        # Parse goals.md
        goals_file = self.memory_dir / "goals.md"
        if goals_file.exists():
            content = goals_file.read_text()
            goals, projects = parse_goals_md(content)
            result["goals"].extend(goals)
            result["projects"].extend(projects)

        # Parse individual project files in Projects/Active/
        active_dir = self.projects_dir / "Active"
        if active_dir.exists():
            for project_file in active_dir.glob("*.md"):
                content = project_file.read_text()
                project = parse_project_file(content, project_file.name)
                if project:
                    result["projects"].append(project)

        # Deduplicate projects by name
        seen_names = set()
        unique_projects = []
        for p in result["projects"]:
            if p.name not in seen_names:
                seen_names.add(p.name)
                unique_projects.append(p)
        result["projects"] = unique_projects

        return result
