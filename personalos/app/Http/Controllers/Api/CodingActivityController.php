<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodingActivity;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Coding Activity API for Claude Code Integration
 *
 * Receives activity data from Claude Code hooks and git hooks.
 * Updates Vocation score based on coding productivity.
 */
class CodingActivityController extends Controller
{
    /**
     * Log a coding activity
     *
     * POST /api/coding/activity
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:commit,session_start,session_end,task_complete,pr_created,pr_merged',
            'project_name' => 'nullable|string|max:255',
            'branch' => 'nullable|string|max:255',
            'commit_hash' => 'nullable|string|max:40',
            'commit_message' => 'nullable|string',
            'files_changed' => 'nullable|integer',
            'lines_added' => 'nullable|integer',
            'lines_removed' => 'nullable|integer',
            'duration_minutes' => 'nullable|integer',
            'task_description' => 'nullable|string',
            'metadata' => 'nullable|array',
            'activity_at' => 'nullable|date',
        ]);

        $userId = $request->user()->id;

        // Try to match project_name to an MSOS project
        $projectId = null;
        if (!empty($validated['project_name'])) {
            $project = Project::where('user_id', $userId)
                ->where(function ($q) use ($validated) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($validated['project_name']) . '%']);
                })
                ->first();
            $projectId = $project?->id;
        }

        // Dedupe commits by hash
        if ($validated['type'] === 'commit' && !empty($validated['commit_hash'])) {
            $exists = CodingActivity::where('user_id', $userId)
                ->where('commit_hash', $validated['commit_hash'])
                ->exists();
            if ($exists) {
                return response()->json([
                    'success' => true,
                    'message' => 'Commit already logged',
                    'duplicate' => true,
                ]);
            }
        }

        $activity = CodingActivity::create([
            'user_id' => $userId,
            'type' => $validated['type'],
            'project_name' => $validated['project_name'] ?? null,
            'project_id' => $projectId,
            'branch' => $validated['branch'] ?? null,
            'commit_hash' => $validated['commit_hash'] ?? null,
            'commit_message' => $validated['commit_message'] ?? null,
            'files_changed' => $validated['files_changed'] ?? null,
            'lines_added' => $validated['lines_added'] ?? null,
            'lines_removed' => $validated['lines_removed'] ?? null,
            'duration_minutes' => $validated['duration_minutes'] ?? null,
            'task_description' => $validated['task_description'] ?? null,
            'metadata' => $validated['metadata'] ?? null,
            'source' => 'claude_code',
            'activity_at' => $validated['activity_at'] ?? now(),
        ]);

        // Auto-complete matching task if task_complete activity
        $completedTask = null;
        if ($validated['type'] === 'task_complete' && !empty($validated['task_description'])) {
            $completedTask = $this->autoCompleteTask($userId, $validated['task_description'], $projectId);
        }

        return response()->json([
            'success' => true,
            'activity_id' => $activity->id,
            'matched_project' => $projectId ? $project->name : null,
            'completed_task' => $completedTask,
        ], 201);
    }

    /**
     * Get coding stats
     *
     * GET /api/coding/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $period = $request->get('period', 'week');

        $stats = CodingActivity::getStats($userId, $period);

        // Get recent activity
        $recent = CodingActivity::where('user_id', $userId)
            ->orderBy('activity_at', 'desc')
            ->limit(10)
            ->get(['type', 'project_name', 'commit_message', 'task_description', 'activity_at']);

        return response()->json([
            'period' => $period,
            'stats' => $stats,
            'recent' => $recent,
        ]);
    }

    /**
     * Get activity feed
     *
     * GET /api/coding/feed
     */
    public function feed(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $limit = min($request->get('limit', 20), 100);

        $activities = CodingActivity::where('user_id', $userId)
            ->orderBy('activity_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($activities);
    }

    /**
     * Auto-complete a task based on description match
     */
    private function autoCompleteTask(int $userId, string $description, ?int $projectId): ?array
    {
        // Build query
        $query = Task::where('user_id', $userId)
            ->whereNull('completed_at');

        // Prefer tasks from the same project if available
        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        // Try to find a matching task
        // First try exact match (case insensitive)
        $task = $query->whereRaw('LOWER(title) = ?', [strtolower($description)])->first();

        // If no exact match, try fuzzy match (contains)
        if (!$task) {
            $words = array_filter(explode(' ', strtolower($description)));
            $searchTerms = array_slice($words, 0, 5); // Use first 5 words

            $task = Task::where('user_id', $userId)
                ->whereNull('completed_at')
                ->where(function ($q) use ($searchTerms) {
                    foreach ($searchTerms as $term) {
                        if (strlen($term) > 3) { // Only match words longer than 3 chars
                            $q->orWhereRaw('LOWER(title) LIKE ?', ['%' . $term . '%']);
                        }
                    }
                })
                ->first();
        }

        if ($task) {
            $task->update(['completed_at' => now()]);
            return [
                'id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
            ];
        }

        return null;
    }
}
