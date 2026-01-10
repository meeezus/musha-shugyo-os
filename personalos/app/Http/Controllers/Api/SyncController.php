<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SyncController extends Controller
{
    /**
     * Bulk sync projects from markdown files.
     * Creates or updates projects based on name matching.
     */
    public function syncProjects(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'projects' => 'required|array',
            'projects.*.name' => 'required|string|max:255',
            'projects.*.description' => 'nullable|string',
            'projects.*.status' => 'in:active,completed,archived',
            'projects.*.deadline' => 'nullable|date',
            'projects.*.tasks' => 'nullable|array',
            'projects.*.tasks.*.title' => 'required|string|max:255',
            'projects.*.tasks.*.priority' => 'in:low,medium,high',
            'projects.*.tasks.*.completed' => 'boolean',
        ]);

        $results = [
            'created' => 0,
            'updated' => 0,
            'tasks_synced' => 0,
            'errors' => [],
        ];

        foreach ($validated['projects'] as $projectData) {
            try {
                // Find or create project by name
                $project = $request->user()->projects()
                    ->where('name', $projectData['name'])
                    ->first();

                if ($project) {
                    // Update existing
                    $project->update([
                        'description' => $projectData['description'] ?? $project->description,
                        'status' => $projectData['status'] ?? $project->status,
                        'deadline' => $projectData['deadline'] ?? $project->deadline,
                    ]);
                    $results['updated']++;
                } else {
                    // Create new with default color
                    $project = $request->user()->projects()->create([
                        'name' => $projectData['name'],
                        'description' => $projectData['description'] ?? null,
                        'status' => $projectData['status'] ?? 'active',
                        'deadline' => $projectData['deadline'] ?? null,
                        'color' => $projectData['color'] ?? 'emerald',
                    ]);
                    $results['created']++;
                }

                // Sync tasks if provided
                if (!empty($projectData['tasks'])) {
                    foreach ($projectData['tasks'] as $i => $taskData) {
                        // Check if task exists by title
                        $task = $project->tasks()
                            ->where('title', $taskData['title'])
                            ->first();

                        $taskFields = [
                            'title' => $taskData['title'],
                            'priority' => $taskData['priority'] ?? 'medium',
                            'sort_order' => $i,
                            'completed_at' => ($taskData['completed'] ?? false) ? now() : null,
                        ];

                        if ($task) {
                            $task->update($taskFields);
                        } else {
                            $taskFields['user_id'] = $request->user()->id;
                            $project->tasks()->create($taskFields);
                        }
                        $results['tasks_synced']++;
                    }
                }
            } catch (\Exception $e) {
                $results['errors'][] = "Error syncing {$projectData['name']}: " . $e->getMessage();
            }
        }

        return response()->json($results);
    }

    /**
     * Get sync status and last sync time.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'projects_count' => $user->projects()->count(),
            'active_projects' => $user->projects()->where('status', 'active')->count(),
            'tasks_count' => $user->tasks()->count(),
            'pending_tasks' => $user->tasks()->whereNull('completed_at')->count(),
        ]);
    }

    /**
     * Export projects to markdown format for writing back to files.
     */
    public function exportMarkdown(Request $request): JsonResponse
    {
        $user = $request->user();
        $projects = $user->projects()
            ->with(['tasks' => fn($q) => $q->orderBy('sort_order')])
            ->orderBy('name')
            ->get();

        // Generate projects_index.md content
        $markdown = "# Projects Index\n\n";
        $markdown .= "**Last Updated:** " . now()->format('F j, Y') . "\n\n";
        $markdown .= "---\n\n";

        $activeProjects = $projects->where('status', 'active');
        $archivedProjects = $projects->where('status', 'archived');
        $completedProjects = $projects->where('status', 'completed');

        if ($activeProjects->count() > 0) {
            $markdown .= "## Active Projects\n\n";
            foreach ($activeProjects as $i => $project) {
                $markdown .= $this->projectToMarkdown($project, $i + 1);
            }
        }

        if ($completedProjects->count() > 0) {
            $markdown .= "## Completed Projects\n\n";
            foreach ($completedProjects as $i => $project) {
                $markdown .= $this->projectToMarkdown($project, $i + 1);
            }
        }

        if ($archivedProjects->count() > 0) {
            $markdown .= "## Archived Projects\n\n";
            foreach ($archivedProjects as $i => $project) {
                $markdown .= $this->projectToMarkdown($project, $i + 1);
            }
        }

        return response()->json([
            'projects_index' => $markdown,
            'project_count' => $projects->count(),
            'exported_at' => now()->toISOString(),
        ]);
    }

    private function projectToMarkdown(Project $project, int $num): string
    {
        $statusEmoji = match($project->status) {
            'active' => '🟢',
            'completed' => '✅',
            'archived' => '🟡',
            default => '⚪',
        };

        $md = "### {$num}. {$project->name}\n";
        $md .= "**Status:** {$statusEmoji} " . ucfirst($project->status) . "\n";

        if ($project->deadline) {
            $md .= "**Deadline:** " . $project->deadline->format('F j, Y') . "\n";
        }

        if ($project->description) {
            $md .= "**Description:** {$project->description}\n";
        }

        if ($project->tasks->count() > 0) {
            $md .= "\n**Tasks:**\n";
            foreach ($project->tasks as $task) {
                $checkbox = $task->completed_at ? '[x]' : '[ ]';
                $priority = $task->priority === 'high' ? ' [HIGH]' : ($task->priority === 'low' ? ' [LOW]' : '');
                $md .= "- {$checkbox}{$priority} {$task->title}\n";
            }
        }

        $md .= "\n---\n\n";
        return $md;
    }
}
