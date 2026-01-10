<?php

namespace App\Http\Controllers;

use App\Models\ApiUsage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/Index');
    }

    public function usage(Request $request): Response
    {
        $user = $request->user();
        $usage = $this->getDetailedUsageStats($user->id);

        return Inertia::render('Settings/Usage', [
            'usage' => $usage,
        ]);
    }

    private function getDetailedUsageStats(int $userId): array
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();
        $weekStart = now()->startOfWeek();
        $monthStart = now()->startOfMonth();

        // Today's usage
        $todayUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $today)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        // Yesterday's usage
        $yesterdayUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $yesterday)
            ->where('timestamp', '<', $today)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        // Week's usage
        $weekUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $weekStart)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        // Month's usage
        $monthUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $monthStart)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        // Daily usage for the last 14 days
        $dailyUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', now()->subDays(14)->startOfDay())
            ->selectRaw('DATE(timestamp) as date, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(fn($row) => [
                'date' => $row->date,
                'input_tokens' => (int) $row->input_tokens,
                'output_tokens' => (int) $row->output_tokens,
                'cost_usd' => (float) $row->cost_usd,
                'requests' => (int) $row->requests,
            ])
            ->toArray();

        // Fill in missing days with zero values
        $dailyUsage = $this->fillMissingDays($dailyUsage, 14);

        // Recent requests (last 50)
        $recentRequests = ApiUsage::where('user_id', $userId)
            ->orderBy('timestamp', 'desc')
            ->limit(50)
            ->get(['id', 'model', 'endpoint', 'input_tokens', 'output_tokens', 'cost_usd', 'timestamp'])
            ->toArray();

        return [
            'today' => [
                'input_tokens' => (int) ($todayUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($todayUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($todayUsage->cost_usd ?? 0),
                'requests' => (int) ($todayUsage->requests ?? 0),
            ],
            'yesterday' => [
                'input_tokens' => (int) ($yesterdayUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($yesterdayUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($yesterdayUsage->cost_usd ?? 0),
                'requests' => (int) ($yesterdayUsage->requests ?? 0),
            ],
            'week' => [
                'input_tokens' => (int) ($weekUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($weekUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($weekUsage->cost_usd ?? 0),
                'requests' => (int) ($weekUsage->requests ?? 0),
            ],
            'month' => [
                'input_tokens' => (int) ($monthUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($monthUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($monthUsage->cost_usd ?? 0),
                'requests' => (int) ($monthUsage->requests ?? 0),
            ],
            'daily' => $dailyUsage,
            'recent' => $recentRequests,
        ];
    }

    private function fillMissingDays(array $dailyData, int $numDays): array
    {
        $result = [];
        $existingData = collect($dailyData)->keyBy('date');

        for ($i = $numDays - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            if ($existingData->has($date)) {
                $result[] = $existingData->get($date);
            } else {
                $result[] = [
                    'date' => $date,
                    'input_tokens' => 0,
                    'output_tokens' => 0,
                    'cost_usd' => 0,
                    'requests' => 0,
                ];
            }
        }

        return $result;
    }
}
