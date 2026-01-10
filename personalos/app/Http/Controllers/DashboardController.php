<?php

namespace App\Http\Controllers;

use App\Models\OuraData;
use App\Models\ApiUsage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get latest Oura data
        $ouraData = OuraData::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->first();

        // Generate Oura insights
        $ouraInsights = null;
        if ($ouraData) {
            $ouraInsights = $this->generateOuraInsights($ouraData, $user->id);
        }

        // Get API usage stats
        $apiUsage = $this->getApiUsageStats($user->id);

        return Inertia::render('Dashboard', [
            'goals' => $user->goals()->get(),
            'tasks' => $user->tasks()
                ->where(function ($query) {
                    $query->whereDate('due_date', today())
                          ->orWhereNull('due_date');
                })
                ->whereNull('completed_at')
                ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END")
                ->get(),
            'contacts' => $user->contacts()->limit(5)->get(),
            'ouraData' => $ouraData,
            'ouraInsights' => $ouraInsights,
            'apiUsage' => $apiUsage,
        ]);
    }

    private function generateOuraInsights(?OuraData $data, int $userId): array
    {
        if (!$data) {
            return [
                'energyLevel' => 'unknown',
                'recommendedTaskTypes' => [],
                'trainingRecommendation' => null,
                'patterns' => [],
                'currentData' => null,
            ];
        }

        $readiness = $data->readiness_score;

        // Determine energy level
        $energyLevel = 'unknown';
        if ($readiness !== null) {
            if ($readiness >= 80) {
                $energyLevel = 'high';
            } elseif ($readiness >= 60) {
                $energyLevel = 'medium';
            } else {
                $energyLevel = 'low';
            }
        }

        // Task recommendations based on energy
        $taskTypes = [];
        $trainingRec = null;

        if ($energyLevel === 'high') {
            $taskTypes = ['Deep creative work', 'Complex problem solving', 'Hard conversations', 'Full intensity training'];
            $trainingRec = 'Full intensity BJJ - you are in peak condition';
        } elseif ($energyLevel === 'medium') {
            $taskTypes = ['Meetings', 'Collaboration', 'Moderate training', 'Admin tasks'];
            $trainingRec = 'Moderate BJJ - focus on technique over intensity';
        } elseif ($energyLevel === 'low') {
            $taskTypes = ['Light admin', 'Email', 'Recovery activities'];
            $trainingRec = 'Skip intense training - prioritize recovery';
        }

        // Detect patterns from recent data
        $patterns = [];
        $recentData = OuraData::where('user_id', $userId)
            ->where('date', '>=', now()->subDays(7))
            ->orderBy('date', 'desc')
            ->get();

        if ($recentData->count() >= 3) {
            $readinessScores = $recentData->pluck('readiness_score')->filter()->values();

            // Check for declining readiness
            if ($readinessScores->count() >= 3) {
                $recent3 = $readinessScores->take(3);
                if ($recent3->first() < $recent3->last()) {
                    $patterns[] = 'Declining readiness trend - consider extra recovery';
                }
            }

            // Check for low readiness streak
            $lowDays = $readinessScores->filter(fn($s) => $s < 60)->count();
            if ($lowDays >= 3) {
                $patterns[] = "{$lowDays} low readiness days this week - accumulated fatigue detected";
            }

            // Check for peak performance
            $highDays = $readinessScores->take(3)->filter(fn($s) => $s >= 80)->count();
            if ($highDays >= 3) {
                $patterns[] = 'Peak performance window - capitalize on this energy';
            }
        }

        return [
            'energyLevel' => $energyLevel,
            'recommendedTaskTypes' => $taskTypes,
            'trainingRecommendation' => $trainingRec,
            'patterns' => $patterns,
            'currentData' => [
                'date' => $data->date->format('Y-m-d'),
                'readiness' => $data->readiness_score,
                'sleep' => $data->sleep_score,
                'activity' => $data->activity_score,
                'sleepDuration' => $data->total_sleep_duration,
                'steps' => $data->steps,
            ],
        ];
    }

    private function getApiUsageStats(int $userId): array
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        // Today's usage
        $todayUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $today)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        // This month's usage
        $monthUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $thisMonth)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        // Recent requests (last 5)
        $recentRequests = ApiUsage::where('user_id', $userId)
            ->orderBy('timestamp', 'desc')
            ->limit(5)
            ->get(['model', 'input_tokens', 'output_tokens', 'cost_usd', 'timestamp']);

        return [
            'today' => [
                'input_tokens' => (int) ($todayUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($todayUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($todayUsage->cost_usd ?? 0),
                'requests' => (int) ($todayUsage->requests ?? 0),
            ],
            'month' => [
                'input_tokens' => (int) ($monthUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($monthUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($monthUsage->cost_usd ?? 0),
                'requests' => (int) ($monthUsage->requests ?? 0),
            ],
            'recent' => $recentRequests,
        ];
    }
}
