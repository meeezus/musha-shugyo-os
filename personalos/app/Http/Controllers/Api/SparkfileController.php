<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SparkfileEntry;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SparkfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SparkfileEntry::where('user_id', $request->user()->id)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        $entries = $query->limit(100)->get();

        // Calculate stats
        $meditationThisWeek = SparkfileEntry::where('user_id', $request->user()->id)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->startOfWeek())
            ->count();

        $meditationThisMonth = SparkfileEntry::where('user_id', $request->user()->id)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->startOfMonth())
            ->count();

        $meditationMinutesMonth = SparkfileEntry::where('user_id', $request->user()->id)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->startOfMonth())
            ->sum('duration_minutes');

        $totalMeditationMinutes = SparkfileEntry::where('user_id', $request->user()->id)
            ->where('type', 'meditation')
            ->sum('duration_minutes');

        $journalCount = SparkfileEntry::where('user_id', $request->user()->id)
            ->where('type', 'journal')
            ->count();

        $sparkCount = SparkfileEntry::where('user_id', $request->user()->id)
            ->where('type', 'spark')
            ->count();

        // Current streak (consecutive days with meditation)
        $streak = $this->calculateMeditationStreak($request->user()->id);

        return response()->json([
            'entries' => $entries,
            'stats' => [
                'meditation_this_week' => $meditationThisWeek,
                'meditation_this_month' => $meditationThisMonth,
                'meditation_minutes_month' => $meditationMinutesMonth,
                'total_meditation_hours' => round($totalMeditationMinutes / 60, 1),
                'meditation_streak' => $streak,
                'journal_count' => $journalCount,
                'spark_count' => $sparkCount,
            ],
            'types' => SparkfileEntry::getTypes(),
            'meditation_types' => SparkfileEntry::getMeditationTypes(),
        ]);
    }

    private function calculateMeditationStreak(int $userId): int
    {
        $streak = 0;
        $currentDate = now()->startOfDay();

        while (true) {
            $hasMeditation = SparkfileEntry::where('user_id', $userId)
                ->where('type', 'meditation')
                ->whereDate('date', $currentDate)
                ->exists();

            if (!$hasMeditation) {
                // Check if today - if no meditation today, check yesterday as start
                if ($currentDate->isToday()) {
                    $currentDate = $currentDate->subDay();
                    continue;
                }
                break;
            }

            $streak++;
            $currentDate = $currentDate->subDay();

            // Safety limit
            if ($streak > 365) break;
        }

        return $streak;
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:meditation,journal,spark',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'date' => 'required|date',
            'duration_minutes' => 'nullable|integer|min:1',
            'mood_before' => 'nullable|integer|min:1|max:10',
            'mood_after' => 'nullable|integer|min:1|max:10',
            'meditation_type' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $entry = SparkfileEntry::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        // Auto-complete a task in Inner Practice project for meditation
        $completedTask = null;
        if ($validated['type'] === 'meditation') {
            $completedTask = $this->autoCompleteMeditationTask($request->user()->id);
        }

        return response()->json([
            'entry' => $entry,
            'completed_task' => $completedTask,
        ], 201);
    }

    /**
     * Auto-complete a meditation task in the Inner Practice project
     */
    private function autoCompleteMeditationTask(int $userId): ?array
    {
        // Find Inner Practice or meditation-related project
        $projectNames = ['Inner Practice', 'Meditation', 'Mindfulness', 'Spirit', 'Soul'];
        $project = Project::where('user_id', $userId)
            ->where(function ($q) use ($projectNames) {
                foreach ($projectNames as $name) {
                    $q->orWhereRaw('LOWER(name) LIKE ?', ['%' . strtolower($name) . '%']);
                }
            })
            ->first();

        if (!$project) {
            return null;
        }

        // Find an incomplete meditation-related task
        $taskKeywords = ['meditat', 'mindful', 'practice', 'session', 'waking up'];
        $task = Task::where('user_id', $userId)
            ->where('project_id', $project->id)
            ->whereNull('completed_at')
            ->where(function ($q) use ($taskKeywords) {
                foreach ($taskKeywords as $keyword) {
                    $q->orWhereRaw('LOWER(title) LIKE ?', ['%' . $keyword . '%']);
                }
            })
            ->first();

        // If no specific task found, complete any incomplete task in the project
        if (!$task) {
            $task = Task::where('user_id', $userId)
                ->where('project_id', $project->id)
                ->whereNull('completed_at')
                ->first();
        }

        if ($task) {
            $task->update(['completed_at' => now()]);
            return [
                'id' => $task->id,
                'title' => $task->title,
                'project' => $project->name,
            ];
        }

        return null;
    }

    public function show(Request $request, SparkfileEntry $sparkfile): JsonResponse
    {
        if ($sparkfile->user_id !== $request->user()->id) {
            abort(403);
        }
        return response()->json($sparkfile);
    }

    public function update(Request $request, SparkfileEntry $sparkfile): JsonResponse
    {
        if ($sparkfile->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'sometimes|string|in:meditation,journal,spark',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'date' => 'sometimes|date',
            'duration_minutes' => 'nullable|integer|min:1',
            'mood_before' => 'nullable|integer|min:1|max:10',
            'mood_after' => 'nullable|integer|min:1|max:10',
            'meditation_type' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $sparkfile->update($validated);

        return response()->json($sparkfile);
    }

    public function destroy(Request $request, SparkfileEntry $sparkfile): JsonResponse
    {
        if ($sparkfile->user_id !== $request->user()->id) {
            abort(403);
        }
        $sparkfile->delete();
        return response()->json(null, 204);
    }

    /**
     * Bulk import meditation history (for importing Waking Up data)
     */
    public function bulkImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entries' => 'required|array',
            'entries.*.type' => 'required|string|in:meditation,journal,spark',
            'entries.*.date' => 'required|date',
            'entries.*.duration_minutes' => 'nullable|integer|min:1',
            'entries.*.title' => 'nullable|string|max:255',
            'entries.*.content' => 'nullable|string',
            'entries.*.meditation_type' => 'nullable|string',
        ]);

        $imported = 0;
        foreach ($validated['entries'] as $entryData) {
            SparkfileEntry::create([
                ...$entryData,
                'user_id' => $request->user()->id,
            ]);
            $imported++;
        }

        return response()->json([
            'message' => "Successfully imported {$imported} entries",
            'count' => $imported,
        ], 201);
    }
}
