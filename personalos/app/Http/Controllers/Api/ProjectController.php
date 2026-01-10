<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\SparkfileEntry;
use App\Models\Workout;
use App\Models\HealthMetric;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = $request->user()->projects()
            ->with([
                'tasks' => function ($q) {
                    $q->orderBy('sort_order', 'asc');
                },
                'phases' => function ($q) {
                    $q->orderBy('sort_order', 'asc');
                },
                'children' => function ($q) {
                    $q->with('tasks')->orderBy('sort_order', 'asc');
                }
            ]);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $projects = $query->orderBy('created_at', 'desc')->get();

        // Calculate quadrant stats once
        $quadrantStats = $this->getQuadrantStats($userId);

        // Helper to add computed fields to a project
        $addComputedFields = function ($project) use ($quadrantStats) {
            $taskCount = $project->tasks->count();
            $completedCount = $project->tasks->whereNotNull('completed_at')->count();

            $project->task_count = $taskCount;
            $project->completed_task_count = $completedCount;
            $project->progress = $taskCount > 0 ? round(($completedCount / $taskCount) * 100) : 0;
            $project->next_action = $project->tasks
                ->whereNull('completed_at')
                ->sortBy('sort_order')
                ->first();

            // Add quadrant-specific stats
            if ($project->quadrant && isset($quadrantStats[$project->quadrant])) {
                $project->quadrant_stats = $quadrantStats[$project->quadrant];
            }

            return $project;
        };

        // Add computed fields to projects and their children
        $projects->transform(function ($project) use ($addComputedFields) {
            $addComputedFields($project);

            // Also add computed fields to children
            if ($project->children) {
                $project->children->transform(function ($child) use ($addComputedFields) {
                    return $addComputedFields($child);
                });
            }

            return $project;
        });

        return response()->json($projects);
    }

    /**
     * Get stats for each Human 3.0 quadrant
     */
    private function getQuadrantStats(int $userId): array
    {
        // Spirit quadrant: Meditation stats
        $meditationThisWeek = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $meditationThisMonth = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $totalMeditationHours = round(SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->sum('duration_minutes') / 60, 1);

        // Body quadrant: Workout stats
        $workoutsThisWeek = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $workoutsThisMonth = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $totalWorkoutHours = round(Workout::where('user_id', $userId)
            ->sum('duration_minutes') / 60, 1);

        // Weekly averages from health metrics
        $weeklyHealth = HealthMetric::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->selectRaw('
                AVG(steps) as avg_steps,
                AVG(sleep_minutes) as avg_sleep
            ')
            ->first();

        return [
            'spirit' => [
                'this_week' => $meditationThisWeek,
                'this_month' => $meditationThisMonth,
                'total_hours' => $totalMeditationHours,
                'label' => 'meditation sessions',
            ],
            'body' => [
                'this_week' => $workoutsThisWeek,
                'this_month' => $workoutsThisMonth,
                'total_hours' => $totalWorkoutHours,
                'avg_steps' => round($weeklyHealth->avg_steps ?? 0),
                'avg_sleep_hours' => round(($weeklyHealth->avg_sleep ?? 0) / 60, 1),
                'label' => 'workouts',
            ],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:active,paused,blocked,completed,archived',
            'deadline' => 'nullable|date',
            'color' => 'nullable|string|max:50',
            'quadrant' => 'nullable|string|in:mind,body,spirit,vocation',
            'parent_id' => 'nullable|integer|exists:projects,id',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        // If creating a sub-project, get the next sort_order
        if (isset($validated['parent_id'])) {
            $maxSortOrder = Project::where('parent_id', $validated['parent_id'])->max('sort_order') ?? 0;
            $validated['sort_order'] = $maxSortOrder + 1;
        }

        $project = $request->user()->projects()->create($validated);

        return response()->json($project, 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $project->load([
            'tasks' => function ($q) {
                $q->orderBy('sort_order', 'asc');
            },
            'phases.tasks',
            'children' => function ($q) {
                $q->with('tasks')->orderBy('sort_order', 'asc');
            }
        ]);

        // Helper to add computed fields
        $addComputedFields = function ($proj) {
            $taskCount = $proj->tasks->count();
            $completedCount = $proj->tasks->whereNotNull('completed_at')->count();

            $proj->task_count = $taskCount;
            $proj->completed_task_count = $completedCount;
            $proj->progress = $taskCount > 0 ? round(($completedCount / $taskCount) * 100) : 0;
            $proj->next_action = $proj->tasks
                ->whereNull('completed_at')
                ->sortBy('sort_order')
                ->first();

            return $proj;
        };

        // Add computed fields to main project
        $addComputedFields($project);

        // Also add computed fields to children
        if ($project->children) {
            $project->children->transform(function ($child) use ($addComputedFields) {
                return $addComputedFields($child);
            });
        }

        return response()->json($project);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:active,paused,blocked,completed,archived',
            'deadline' => 'nullable|date',
            'color' => 'nullable|string|max:50',
            'quadrant' => 'nullable|string|in:mind,body,spirit,vocation',
        ]);

        $project->update($validated);
        return response()->json($project);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $project->delete();
        return response()->json(null, 204);
    }

    public function reorderChildren(Request $request, Project $project): JsonResponse
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'integer|exists:projects,id',
        ]);

        // Update sort_order for each child
        foreach ($validated['ordered_ids'] as $index => $childId) {
            Project::where('id', $childId)
                ->where('parent_id', $project->id)
                ->update(['sort_order' => $index]);
        }

        return response()->json(['success' => true]);
    }
}
