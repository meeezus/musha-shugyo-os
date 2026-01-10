<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StrategicGoal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StrategicGoalController extends Controller
{
    /**
     * Get all active strategic goals for dashboard
     */
    public function index()
    {
        $goals = Auth::user()
            ->strategicGoals()
            ->where('status', 'active')
            ->orderBy('category')
            ->orderBy('created_at')
            ->get()
            ->map(fn($goal) => $goal->toDashboardFormat());

        return response()->json([
            'goals' => $goals,
        ]);
    }

    /**
     * Update progress on a goal
     */
    public function updateProgress(Request $request, StrategicGoal $strategicGoal)
    {
        // Ensure user owns this goal
        if ($strategicGoal->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'current_value' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $strategicGoal->update($validated);

        // Check if goal is completed
        if ($strategicGoal->current_value >= $strategicGoal->target_value) {
            $strategicGoal->update(['status' => 'completed']);
        }

        return response()->json([
            'goal' => $strategicGoal->fresh()->toDashboardFormat(),
        ]);
    }

    /**
     * Increment progress (useful for "add 1 workshop" type updates)
     */
    public function increment(Request $request, StrategicGoal $strategicGoal)
    {
        if ($strategicGoal->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $strategicGoal->increment('current_value', $validated['amount']);

        // Check if goal is completed
        if ($strategicGoal->fresh()->current_value >= $strategicGoal->target_value) {
            $strategicGoal->update(['status' => 'completed']);
        }

        return response()->json([
            'goal' => $strategicGoal->fresh()->toDashboardFormat(),
        ]);
    }

    /**
     * Create a new strategic goal
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:revenue,health,content,learning',
            'target_value' => 'required|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
            'unit' => 'required|string|max:50',
            'target_dollars' => 'nullable|numeric|min:0',
            'target_date' => 'nullable|date',
            'timeframe' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $goal = Auth::user()->strategicGoals()->create($validated);

        return response()->json([
            'goal' => $goal->toDashboardFormat(),
        ], 201);
    }

    /**
     * Delete a strategic goal
     */
    public function destroy(StrategicGoal $strategicGoal)
    {
        if ($strategicGoal->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $strategicGoal->delete();

        return response()->json(['success' => true]);
    }
}
