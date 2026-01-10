<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingSession;
use App\Models\Workout;
use App\Models\HealthMetric;
use App\Models\Task;
use App\Models\Project;
use App\Models\SparkfileEntry;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TrainingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Get manual training sessions
        $manualQuery = TrainingSession::where('user_id', $userId)
            ->orderBy('date', 'desc');

        // Get Apple Health workouts
        $workoutQuery = Workout::where('user_id', $userId)
            ->orderBy('date', 'desc');

        // Filter by type
        if ($request->has('type')) {
            $manualQuery->where('type', $request->type);
            $workoutQuery->where('type', $request->type);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $manualQuery->where('date', '>=', $request->start_date);
            $workoutQuery->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $manualQuery->where('date', '<=', $request->end_date);
            $workoutQuery->where('date', '<=', $request->end_date);
        }

        $manualSessions = $manualQuery->limit(50)->get()->map(function ($s) {
            $s->source = 'manual';
            return $s;
        });

        $workouts = $workoutQuery->limit(50)->get()->map(function ($w) {
            // Normalize to match training session format
            return (object) [
                'id' => 'w_' . $w->id,
                'type' => $w->type,
                'date' => $w->date->format('Y-m-d'),
                'duration_minutes' => $w->duration_minutes,
                'intensity' => null,
                'notes' => $w->notes,
                'energy_before' => null,
                'energy_after' => null,
                'calories_burned' => $w->calories_burned,
                'distance_km' => $w->distance_km,
                'source' => 'apple_health',
                'created_at' => $w->created_at,
            ];
        });

        // Merge and sort by date
        $allSessions = $manualSessions->concat($workouts)
            ->sortByDesc('date')
            ->values()
            ->take(100);

        // Calculate stats (from both sources)
        $thisWeekManual = TrainingSession::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $thisWeekWorkouts = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->count();

        $thisMonthManual = TrainingSession::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $thisMonthWorkouts = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->count();

        $totalMinutesManual = TrainingSession::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->sum('duration_minutes');
        $totalMinutesWorkouts = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->sum('duration_minutes');

        // Get today's health metrics
        $todayMetrics = HealthMetric::where('user_id', $userId)
            ->where('date', today())
            ->first();

        // Get weekly averages
        $weeklyMetrics = HealthMetric::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->selectRaw('
                AVG(steps) as avg_steps,
                AVG(active_calories) as avg_calories,
                AVG(sleep_minutes) as avg_sleep,
                AVG(resting_heart_rate) as avg_rhr,
                AVG(hrv_avg) as avg_hrv
            ')
            ->first();

        return response()->json([
            'sessions' => $allSessions,
            'stats' => [
                'this_week' => $thisWeekManual + $thisWeekWorkouts,
                'this_month' => $thisMonthManual + $thisMonthWorkouts,
                'total_minutes_month' => $totalMinutesManual + $totalMinutesWorkouts,
            ],
            'health' => [
                'today' => $todayMetrics,
                'weekly_avg' => $weeklyMetrics,
            ],
            'types' => TrainingSession::getTypes(),
            'intensities' => TrainingSession::getIntensities(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'date' => 'required|date',
            'duration_minutes' => 'nullable|integer|min:1',
            'intensity' => 'nullable|string|in:light,moderate,hard',
            'notes' => 'nullable|string',
            'techniques' => 'nullable|array',
            'sparring' => 'nullable|array',
            'energy_before' => 'nullable|integer|min:1|max:10',
            'energy_after' => 'nullable|integer|min:1|max:10',
        ]);

        $session = TrainingSession::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        // Auto-complete a task in BJJ/Physical Mastery project for martial arts training
        $completedTask = null;
        if (in_array($validated['type'], ['bjj', 'muay_thai', 'wrestling'])) {
            $completedTask = $this->autoCompleteTrainingTask($request->user()->id, $validated['type']);
        }

        // Create a Sparkfile journal entry if there are notes
        $journalEntry = null;
        if (!empty($validated['notes'])) {
            $journalEntry = $this->createTrainingJournalEntry(
                $request->user()->id,
                $validated['type'],
                $validated['notes'],
                $validated['date'],
                $validated['duration_minutes'] ?? null,
                $validated['intensity'] ?? null
            );
        }

        return response()->json([
            'session' => $session,
            'completed_task' => $completedTask,
            'journal_entry' => $journalEntry,
        ], 201);
    }

    /**
     * Create a Sparkfile journal entry from training notes
     */
    private function createTrainingJournalEntry(
        int $userId,
        string $type,
        string $notes,
        string $date,
        ?int $durationMinutes,
        ?string $intensity
    ): array {
        $typeLabels = [
            'bjj' => 'BJJ',
            'muay_thai' => 'Muay Thai',
            'wrestling' => 'Wrestling',
            'strength' => 'Strength',
            'cardio' => 'Cardio',
            'yoga' => 'Yoga',
            'other' => 'Training',
        ];

        $title = ($typeLabels[$type] ?? 'Training') . ' Session';
        if ($durationMinutes) {
            $title .= " ({$durationMinutes} min)";
        }

        $entry = SparkfileEntry::create([
            'user_id' => $userId,
            'type' => 'journal',
            'title' => $title,
            'content' => $notes,
            'date' => $date,
            'duration_minutes' => $durationMinutes,
            'tags' => ['training', $type],
        ]);

        return [
            'id' => $entry->id,
            'title' => $title,
            'type' => 'journal',
        ];
    }

    /**
     * Auto-complete a training task in the appropriate project
     */
    private function autoCompleteTrainingTask(int $userId, string $type): ?array
    {
        // Find Physical Mastery or BJJ-related project
        $projectNames = ['Physical Mastery', 'BJJ', 'Martial Arts', 'Body'];
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

        // Find an incomplete training-related task
        $taskKeywords = ['train', 'bjj', 'class', 'session', 'workout', 'martial'];
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

    public function show(Request $request, TrainingSession $training): JsonResponse
    {
        if ($training->user_id !== $request->user()->id) {
            abort(403);
        }
        return response()->json($training);
    }

    public function update(Request $request, TrainingSession $training): JsonResponse
    {
        if ($training->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'sometimes|string',
            'date' => 'sometimes|date',
            'duration_minutes' => 'nullable|integer|min:1',
            'intensity' => 'nullable|string|in:light,moderate,hard',
            'notes' => 'nullable|string',
            'techniques' => 'nullable|array',
            'sparring' => 'nullable|array',
            'energy_before' => 'nullable|integer|min:1|max:10',
            'energy_after' => 'nullable|integer|min:1|max:10',
        ]);

        $training->update($validated);

        return response()->json($training);
    }

    public function destroy(Request $request, TrainingSession $training): JsonResponse
    {
        if ($training->user_id !== $request->user()->id) {
            abort(403);
        }
        $training->delete();
        return response()->json(null, 204);
    }
}
