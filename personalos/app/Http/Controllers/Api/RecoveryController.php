<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecoveryRoutine;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RecoveryController extends Controller
{
    /**
     * Get today's recovery routine status
     */
    public function status(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $routine = RecoveryRoutine::getOrCreateToday($userId);
        $weeklyStats = RecoveryRoutine::getWeeklyStats($userId);

        return response()->json([
            'date' => $routine->date->format('Y-m-d'),
            'items' => [
                'left_brain_am' => $routine->left_brain_am,
                'left_brain_pm' => $routine->left_brain_pm,
                'scapular_squeezes' => $routine->scapular_squeezes,
                'rear_deltoid' => $routine->rear_deltoid,
                'bicep_tricep_reset' => $routine->bicep_tricep_reset,
                'tricep_extension' => $routine->tricep_extension,
                'chin_darts' => $routine->chin_darts,
                'pec_lat_massage' => $routine->pec_lat_massage,
            ],
            'completion' => [
                'completed' => $routine->getCompletedCount(),
                'total' => 8,
                'percentage' => $routine->getCompletionPercentage(),
                'is_complete' => $routine->isComplete(),
            ],
            'weekly' => $weeklyStats,
            'notes' => $routine->notes,
        ]);
    }

    /**
     * Log/update a specific item
     * POST /api/recovery/log
     * { "item": "scapular_squeezes", "value": 20 } or { "item": "chin_darts", "value": true }
     */
    public function log(Request $request): JsonResponse
    {
        $request->validate([
            'item' => 'required|string|in:left_brain_am,left_brain_pm,scapular_squeezes,rear_deltoid,bicep_tricep_reset,tricep_extension,chin_darts,pec_lat_massage',
            'value' => 'required',
        ]);

        $userId = $request->user()->id;
        $routine = RecoveryRoutine::getOrCreateToday($userId);
        $item = $request->input('item');
        $value = $request->input('value');

        // Handle scapular_squeezes as increment
        if ($item === 'scapular_squeezes') {
            if (is_numeric($value)) {
                // If value is a number, add to current count
                $routine->scapular_squeezes += (int) $value;
            } else {
                // If "true" or truthy, add default 20 (one set)
                $routine->scapular_squeezes += 20;
            }
        } else {
            // Boolean items
            $routine->$item = filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        $routine->save();

        return response()->json([
            'success' => true,
            'item' => $item,
            'new_value' => $routine->$item,
            'completion' => [
                'completed' => $routine->getCompletedCount(),
                'total' => 8,
                'percentage' => $routine->getCompletionPercentage(),
                'is_complete' => $routine->isComplete(),
            ],
        ]);
    }

    /**
     * Mark all items complete for today
     * POST /api/recovery/complete-day
     */
    public function completeDay(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $routine = RecoveryRoutine::getOrCreateToday($userId);

        $routine->update([
            'left_brain_am' => true,
            'left_brain_pm' => true,
            'scapular_squeezes' => max(100, $routine->scapular_squeezes),
            'rear_deltoid' => true,
            'bicep_tricep_reset' => true,
            'tricep_extension' => true,
            'chin_darts' => true,
            'pec_lat_massage' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Recovery routine marked complete for today',
            'completion' => [
                'completed' => 8,
                'total' => 8,
                'percentage' => 100,
                'is_complete' => true,
            ],
        ]);
    }

    /**
     * Update routine (bulk update from dashboard)
     * PUT /api/recovery/today
     */
    public function update(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $routine = RecoveryRoutine::getOrCreateToday($userId);

        $validFields = [
            'left_brain_am',
            'left_brain_pm',
            'scapular_squeezes',
            'rear_deltoid',
            'bicep_tricep_reset',
            'tricep_extension',
            'chin_darts',
            'pec_lat_massage',
            'notes',
        ];

        $updates = $request->only($validFields);
        $routine->update($updates);

        return response()->json([
            'success' => true,
            'routine' => $routine->fresh(),
            'completion' => [
                'completed' => $routine->getCompletedCount(),
                'total' => 8,
                'percentage' => $routine->getCompletionPercentage(),
                'is_complete' => $routine->isComplete(),
            ],
        ]);
    }

    /**
     * Get weekly history
     * GET /api/recovery/history
     */
    public function history(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $days = $request->input('days', 7);

        $routines = RecoveryRoutine::where('user_id', $userId)
            ->where('date', '>=', now()->subDays($days))
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'date' => $r->date->format('Y-m-d'),
                    'completed' => $r->getCompletedCount(),
                    'percentage' => $r->getCompletionPercentage(),
                    'is_complete' => $r->isComplete(),
                    'scapular_squeezes' => $r->scapular_squeezes,
                ];
            });

        return response()->json([
            'history' => $routines,
            'weekly_stats' => RecoveryRoutine::getWeeklyStats($userId),
        ]);
    }

    /**
     * Increment scapular squeezes (convenience endpoint)
     * POST /api/recovery/scaps
     * { "count": 20 }
     */
    public function incrementScaps(Request $request): JsonResponse
    {
        $count = $request->input('count', 20);
        $userId = $request->user()->id;
        $routine = RecoveryRoutine::getOrCreateToday($userId);

        $routine->scapular_squeezes += (int) $count;
        $routine->save();

        return response()->json([
            'success' => true,
            'scapular_squeezes' => $routine->scapular_squeezes,
            'target' => 100,
            'remaining' => max(0, 100 - $routine->scapular_squeezes),
            'is_done' => $routine->scapular_squeezes >= 80,
        ]);
    }
}
