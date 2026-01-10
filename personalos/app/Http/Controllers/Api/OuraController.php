<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OuraData;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class OuraController extends Controller
{
    private string $baseUrl = 'https://api.ouraring.com/v2';

    /**
     * Get the Oura API token
     */
    private function getToken(): ?string
    {
        return config('services.oura.token');
    }

    /**
     * Fetch data from Oura API
     */
    private function fetchFromOura(string $endpoint, string $date): ?array
    {
        $token = $this->getToken();
        if (!$token) {
            return null;
        }

        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->get("{$this->baseUrl}/usercollection/{$endpoint}", [
                    'start_date' => $date,
                    'end_date' => $date,
                ]);

            if ($response->successful()) {
                $data = $response->json('data');
                return !empty($data) ? $data[0] : null;
            }
        } catch (\Exception $e) {
            \Log::error("Oura API error: {$e->getMessage()}");
        }

        return null;
    }

    /**
     * GET /api/oura/latest
     * Get the most recent Oura data
     */
    public function latest(Request $request): JsonResponse
    {
        // Try to get from cache first
        $cacheKey = 'oura_latest_' . $request->user()->id;

        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($request) {
            // Try today first
            $today = Carbon::today()->format('Y-m-d');
            $data = OuraData::where('user_id', $request->user()->id)
                ->where('date', $today)
                ->first();

            // If no data for today, try yesterday
            if (!$data) {
                $yesterday = Carbon::yesterday()->format('Y-m-d');
                $data = OuraData::where('user_id', $request->user()->id)
                    ->where('date', $yesterday)
                    ->first();
            }

            return $data;
        });

        if ($data) {
            return response()->json($data);
        }

        return response()->json([
            'error' => 'No Oura data found',
            'message' => 'Sync your Oura data first'
        ], 404);
    }

    /**
     * GET /api/oura/date/{date}
     * Get Oura data for a specific date
     */
    public function forDate(Request $request, string $date): JsonResponse
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json([
                'error' => 'Invalid date format',
                'message' => 'Date must be in YYYY-MM-DD format'
            ], 400);
        }

        $data = OuraData::where('user_id', $request->user()->id)
            ->where('date', $date)
            ->first();

        if ($data) {
            return response()->json($data);
        }

        return response()->json([
            'error' => 'No data found',
            'message' => "No Oura data found for {$date}"
        ], 404);
    }

    /**
     * GET /api/oura/range
     * Get Oura data for a date range
     */
    public function range(Request $request): JsonResponse
    {
        $request->validate([
            'start' => 'required|date_format:Y-m-d',
            'end' => 'required|date_format:Y-m-d',
        ]);

        $data = OuraData::where('user_id', $request->user()->id)
            ->whereBetween('date', [$request->start, $request->end])
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($data);
    }

    /**
     * POST /api/oura/sync
     * Sync Oura data from API
     */
    public function sync(Request $request): JsonResponse
    {
        $token = $this->getToken();
        if (!$token) {
            return response()->json([
                'error' => 'Oura token not configured',
                'message' => 'Add OURA_TOKEN to your .env file'
            ], 400);
        }

        // Get yesterday's date (Oura processes data overnight)
        $date = Carbon::yesterday()->format('Y-m-d');

        // Fetch all data types
        $readiness = $this->fetchFromOura('daily_readiness', $date);
        $sleep = $this->fetchFromOura('daily_sleep', $date);
        $activity = $this->fetchFromOura('daily_activity', $date);

        // Also fetch detailed sleep for HR/HRV data
        $sleepPeriods = null;
        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->get("{$this->baseUrl}/usercollection/sleep", [
                    'start_date' => $date,
                    'end_date' => $date,
                ]);
            if ($response->successful()) {
                $periods = $response->json('data');
                $sleepPeriods = collect($periods)->firstWhere('type', 'long_sleep') ?? ($periods[0] ?? null);
            }
        } catch (\Exception $e) {
            \Log::warning("Could not fetch sleep periods: {$e->getMessage()}");
        }

        // Fetch daily stress data
        $stress = $this->fetchFromOura('daily_stress', $date);

        if (!$readiness && !$sleep && !$activity) {
            return response()->json([
                'error' => 'No data available',
                'message' => 'No Oura data available for yesterday yet'
            ], 404);
        }

        // Store the data
        $ouraData = OuraData::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'date' => $date,
            ],
            [
                'readiness_score' => $readiness['score'] ?? null,
                'sleep_score' => $sleep['score'] ?? null,
                'activity_score' => $activity['score'] ?? null,
                'total_sleep_duration' => $sleepPeriods['total_sleep_duration'] ?? null,
                'deep_sleep_duration' => $sleepPeriods['deep_sleep_duration'] ?? null,
                'rem_sleep_duration' => $sleepPeriods['rem_sleep_duration'] ?? null,
                'light_sleep_duration' => $sleepPeriods['light_sleep_duration'] ?? null,
                'sleep_efficiency' => $sleepPeriods['efficiency'] ?? null,
                'resting_heart_rate' => $sleepPeriods['average_heart_rate'] ?? null,
                'hr_lowest' => $sleepPeriods['lowest_heart_rate'] ?? null,
                'hrv_average' => $sleepPeriods['average_hrv'] ?? null,
                'body_temperature_deviation' => $readiness['temperature_deviation'] ?? null,
                'active_calories' => $activity['active_calories'] ?? null,
                'total_calories' => $activity['total_calories'] ?? null,
                'steps' => $activity['steps'] ?? null,
                'target_calories' => $activity['target_calories'] ?? null,
                'readiness_data' => $readiness,
                'sleep_data' => $sleep,
                'activity_data' => $activity,
                'stress_high' => $stress['stress_high'] ?? null,
                'recovery_high' => $stress['recovery_high'] ?? null,
                'day_summary' => $stress['day_summary'] ?? null,
                'stress_data' => $stress,
            ]
        );

        // Clear cache
        Cache::forget('oura_latest_' . $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => "Synced Oura data for {$date}",
            'data' => $ouraData,
        ]);
    }

    /**
     * Fetch active rest mode (illness) data from Oura
     */
    private function fetchRestMode(): ?array
    {
        $token = $this->getToken();
        if (!$token) {
            return null;
        }

        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->get("{$this->baseUrl}/usercollection/rest_mode_period");

            if ($response->successful()) {
                $data = $response->json('data');
                // Find active rest mode (no end_day means still active)
                return collect($data)->first(fn($period) => $period['end_day'] === null);
            }
        } catch (\Exception $e) {
            \Log::warning("Could not fetch rest mode: {$e->getMessage()}");
        }

        return null;
    }

    /**
     * GET /api/oura/insights
     * Get energy insights and recommendations
     */
    public function insights(Request $request): JsonResponse
    {
        $insights = [
            'energyLevel' => 'unknown',
            'recommendedTaskTypes' => [],
            'trainingRecommendation' => null,
            'patterns' => [],
            'currentData' => null,
            'restMode' => null,
        ];

        // Get latest data
        $today = Carbon::today()->format('Y-m-d');
        $yesterday = Carbon::yesterday()->format('Y-m-d');

        $data = OuraData::where('user_id', $request->user()->id)
            ->whereIn('date', [$today, $yesterday])
            ->orderBy('date', 'desc')
            ->first();

        if (!$data) {
            return response()->json($insights);
        }

        $insights['currentData'] = [
            'date' => $data->date,
            'readiness' => $data->readiness_score,
            'sleep' => $data->sleep_score,
            'activity' => $data->activity_score,
            'sleepDuration' => $data->total_sleep_duration,
            'steps' => $data->steps,
        ];

        $readiness = $data->readiness_score;

        if ($readiness !== null) {
            // Energy level
            if ($readiness >= 80) {
                $insights['energyLevel'] = 'high';
                $insights['recommendedTaskTypes'] = ['creative_work', 'deep_focus', 'hard_conversations', 'intense_training'];
                $insights['trainingRecommendation'] = 'Full intensity BJJ today - you are in peak condition';
            } elseif ($readiness >= 60) {
                $insights['energyLevel'] = 'medium';
                $insights['recommendedTaskTypes'] = ['normal_tasks', 'meetings', 'moderate_focus'];
                $insights['trainingRecommendation'] = 'Moderate BJJ, focus on technique over intensity';
            } else {
                $insights['energyLevel'] = 'low';
                $insights['recommendedTaskTypes'] = ['admin', 'email', 'light_tasks', 'recovery'];
                $insights['trainingRecommendation'] = 'Consider skipping training, prioritize recovery';
            }
        }

        // Check sleep duration
        if ($data->total_sleep_duration) {
            $hours = $data->total_sleep_duration / 3600;
            if ($hours < 7) {
                $insights['patterns'][] = sprintf('Sleep debt: Only %.1fh last night. Consider earlier bedtime.', $hours);
            } elseif ($hours > 8) {
                $insights['patterns'][] = sprintf('Good recovery: %.1fh sleep last night.', $hours);
            }
        }

        // Check historical patterns
        $history = OuraData::where('user_id', $request->user()->id)
            ->where('date', '<=', $today)
            ->orderBy('date', 'desc')
            ->limit(7)
            ->pluck('readiness_score')
            ->filter()
            ->values();

        if ($history->count() >= 3) {
            // Check for declining readiness
            $recent = $history->take(3);
            $declining = true;
            for ($i = 1; $i < $recent->count(); $i++) {
                if ($recent[$i] >= $recent[$i - 1]) {
                    $declining = false;
                    break;
                }
            }
            if ($declining && $recent->first() < $recent->last()) {
                $insights['patterns'][] = '3 days of declining readiness - recovery needed';
            }

            // Check for peak performance
            if ($recent->every(fn($s) => $s >= 80)) {
                $insights['patterns'][] = 'Peak performance window - capitalize on high energy';
            }
        }

        // Check for active rest mode (illness)
        $restMode = $this->fetchRestMode();
        if ($restMode) {
            $tags = [];
            foreach ($restMode['episodes'] ?? [] as $episode) {
                foreach ($episode['tags'] ?? [] as $tag) {
                    // Convert tag_generic_nasal_congestion -> Nasal Congestion
                    $readable = str_replace(['tag_generic_', 'tag_'], '', $tag);
                    $readable = ucwords(str_replace('_', ' ', $readable));
                    $tags[] = $readable;
                }
            }

            $insights['restMode'] = [
                'active' => true,
                'startDate' => $restMode['start_day'],
                'symptoms' => array_unique($tags),
            ];

            // Override recommendations when sick
            $insights['energyLevel'] = 'recovery';
            $insights['trainingRecommendation'] = 'REST MODE ACTIVE - Skip training completely, focus on recovery';
            $insights['recommendedTaskTypes'] = ['rest', 'light_reading', 'sleep'];
            $insights['patterns'][] = 'Illness detected: ' . implode(', ', array_unique($tags));
        }

        return response()->json($insights);
    }
}
