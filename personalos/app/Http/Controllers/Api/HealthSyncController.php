<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HealthMetric;
use App\Models\Workout;
use App\Models\SparkfileEntry;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Health Sync API for iOS Shortcuts
 *
 * Endpoint for receiving daily health data from Apple Health via iOS Shortcuts.
 * The Shortcut reads today's health data and POSTs it here for ongoing sync.
 */
class HealthSyncController extends Controller
{
    /**
     * Sync daily health metrics from iOS Shortcut
     *
     * POST /api/health/sync
     *
     * Expected payload:
     * {
     *   "date": "2024-01-06",
     *   "steps": 8500,
     *   "active_calories": 450,
     *   "exercise_minutes": 45,
     *   "sleep_minutes": 420,
     *   "resting_heart_rate": 52,
     *   "hrv": 65,
     *   "workouts": [
     *     { "type": "strength", "duration": 45, "calories": 300 }
     *   ],
     *   "mindful_minutes": 15
     * }
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'steps' => 'nullable|integer',
            'distance_km' => 'nullable|numeric',
            'active_calories' => 'nullable|integer',
            'exercise_minutes' => 'nullable|integer',
            'stand_hours' => 'nullable|integer',
            'flights_climbed' => 'nullable|integer',
            'resting_heart_rate' => 'nullable|integer',
            'hrv' => 'nullable|integer',
            'sleep_minutes' => 'nullable|integer',
            'weight_kg' => 'nullable|numeric',
            'workouts' => 'nullable|array',
            'workouts.*.type' => 'required|string',
            'workouts.*.duration' => 'required|integer',
            'workouts.*.calories' => 'nullable|integer',
            'workouts.*.distance_km' => 'nullable|numeric',
            'mindful_minutes' => 'nullable|integer',
        ]);

        $userId = $request->user()->id;
        $date = $validated['date'];
        $imported = [];

        // Upsert health metrics
        $metric = HealthMetric::updateOrCreate(
            ['user_id' => $userId, 'date' => $date],
            [
                'steps' => $validated['steps'] ?? null,
                'distance_km' => $validated['distance_km'] ?? null,
                'active_calories' => $validated['active_calories'] ?? null,
                'exercise_minutes' => $validated['exercise_minutes'] ?? null,
                'stand_hours' => $validated['stand_hours'] ?? null,
                'flights_climbed' => $validated['flights_climbed'] ?? null,
                'resting_heart_rate' => $validated['resting_heart_rate'] ?? null,
                'hrv_avg' => $validated['hrv'] ?? null,
                'sleep_minutes' => $validated['sleep_minutes'] ?? null,
                'weight_kg' => $validated['weight_kg'] ?? null,
                'source' => 'ios_shortcut',
            ]
        );
        $imported['health_metrics'] = 1;

        // Import workouts
        if (!empty($validated['workouts'])) {
            $workoutCount = 0;
            foreach ($validated['workouts'] as $workout) {
                // Generate a source_id for dedup
                $sourceId = 'shortcut_' . $date . '_' . $workout['type'] . '_' . $workout['duration'];

                // Check for existing
                $exists = Workout::where('user_id', $userId)
                    ->where('source_id', $sourceId)
                    ->exists();

                if (!$exists) {
                    Workout::create([
                        'user_id' => $userId,
                        'type' => Workout::normalizeType($workout['type']),
                        'date' => $date,
                        'duration_minutes' => $workout['duration'],
                        'calories_burned' => $workout['calories'] ?? null,
                        'distance_km' => $workout['distance_km'] ?? null,
                        'source' => 'ios_shortcut',
                        'source_id' => $sourceId,
                    ]);
                    $workoutCount++;
                }
            }
            $imported['workouts'] = $workoutCount;
        }

        // Import mindfulness as meditation entry
        if (!empty($validated['mindful_minutes']) && $validated['mindful_minutes'] > 0) {
            // Check for existing entry today
            $exists = SparkfileEntry::where('user_id', $userId)
                ->where('type', 'meditation')
                ->where('date', $date)
                ->where('duration_minutes', $validated['mindful_minutes'])
                ->exists();

            if (!$exists) {
                SparkfileEntry::create([
                    'user_id' => $userId,
                    'type' => 'meditation',
                    'date' => $date,
                    'duration_minutes' => $validated['mindful_minutes'],
                    'meditation_type' => 'daily',
                    'content' => 'Synced from iOS Shortcut',
                ]);
                $imported['meditation'] = 1;
            }
        }

        return response()->json([
            'success' => true,
            'date' => $date,
            'imported' => $imported,
            'message' => 'Health data synced successfully',
        ]);
    }

    /**
     * Get health summary for a date range
     */
    public function summary(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $days = $request->get('days', 7);

        $metrics = HealthMetric::where('user_id', $userId)
            ->where('date', '>=', now()->subDays($days))
            ->orderBy('date', 'desc')
            ->get();

        $workouts = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->subDays($days))
            ->orderBy('date', 'desc')
            ->get();

        $meditation = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->subDays($days))
            ->sum('duration_minutes');

        // Calculate averages
        $avgSteps = $metrics->avg('steps');
        $avgSleep = $metrics->avg('sleep_minutes');
        $avgHRV = $metrics->whereNotNull('hrv_avg')->avg('hrv_avg');
        $avgRHR = $metrics->whereNotNull('resting_heart_rate')->avg('resting_heart_rate');

        return response()->json([
            'period_days' => $days,
            'metrics' => $metrics,
            'workouts' => $workouts,
            'totals' => [
                'workout_sessions' => $workouts->count(),
                'workout_minutes' => $workouts->sum('duration_minutes'),
                'meditation_minutes' => $meditation,
            ],
            'averages' => [
                'steps' => round($avgSteps ?? 0),
                'sleep_hours' => round(($avgSleep ?? 0) / 60, 1),
                'hrv' => round($avgHRV ?? 0),
                'resting_hr' => round($avgRHR ?? 0),
            ],
        ]);
    }
}
