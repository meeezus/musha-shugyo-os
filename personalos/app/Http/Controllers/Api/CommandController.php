<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OuraData;
use App\Models\CodingActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CommandController extends Controller
{
    private string $ioriUrl;

    public function __construct()
    {
        $this->ioriUrl = env('IORI_URL', 'http://localhost:3002');
    }

    /**
     * Get command center brief
     *
     * Proxies to Iori agent service and merges with DB data
     */
    public function brief(Request $request): JsonResponse
    {
        $user = $request->user();
        $refresh = $request->boolean('refresh', false);
        $aiRefresh = $request->boolean('ai', false);

        try {
            // Get latest Oura data for energy context
            $ouraData = OuraData::where('user_id', $user->id)
                ->orderBy('date', 'desc')
                ->first();

            // Build query params for Iori
            $queryParams = [
                'refresh' => $refresh ? 'true' : 'false',
                'ai' => $aiRefresh ? 'true' : 'false',
            ];

            // Add Oura context if available
            if ($ouraData) {
                $energyLevel = $this->determineEnergyLevel($ouraData->readiness_score);
                $queryParams['energyLevel'] = $energyLevel;
                $queryParams['readiness'] = $ouraData->readiness_score ?? '';
                $queryParams['sleep'] = $ouraData->sleep_score ?? '';
                $queryParams['activity'] = $ouraData->activity_score ?? '';
            }

            // Try to call Iori agent service, but don't fail if unavailable
            $brief = [];
            try {
                $response = Http::timeout(30)
                    ->get("{$this->ioriUrl}/command/brief", $queryParams);

                if ($response->successful()) {
                    $brief = $response->json() ?? [];
                } else {
                    Log::warning('Iori command/brief returned non-200', [
                        'status' => $response->status(),
                    ]);
                }
            } catch (\Exception $ioriException) {
                Log::warning('Iori agent unavailable, using database data only', [
                    'error' => $ioriException->getMessage(),
                ]);
            }

            // Merge with additional DB data
            $brief['ouraData'] = $ouraData ? [
                'date' => $ouraData->date->format('Y-m-d'),
                'readiness' => $ouraData->readiness_score,
                'sleep' => $ouraData->sleep_score,
                'activity' => $ouraData->activity_score,
                'hrv' => $ouraData->hrv_average,
                'rhr' => $ouraData->resting_heart_rate,
                'steps' => $ouraData->steps,
                'daySummary' => $ouraData->day_summary,
            ] : null;

            // Add tasks from database
            $brief['dbTasks'] = $user->tasks()
                ->whereNull('completed_at')
                ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END")
                ->limit(10)
                ->get(['id', 'title', 'priority', 'due_date']);

            // Add goals from database
            $brief['dbGoals'] = $user->goals()
                ->get(['id', 'name', 'target_value', 'current_value', 'color', 'trend']);

            // ALWAYS use database for project-related data (single source of truth)
            // Iori is only used for AI-generated statusBrief and patterns
            $brief['recommendations'] = $this->generateRecommendationsFromProjects($user);
            $brief['goalAlignment'] = $this->generateGoalAlignmentFromProjects($user);
            $brief['timeAllocation'] = $this->generateTimeAllocationFromProjects($user);

            // Add coding activity stats
            $brief['codingActivity'] = CodingActivity::getStats($user->id, 'week');

            // Add Human 3.0 quadrant summary
            $brief['quadrantSummary'] = $this->getQuadrantSummary($user->id);

            // Add weekly wins for motivation
            $brief['weeklyWins'] = $this->getWeeklyWins($user);

            // Always use our motivational brief based on weekly wins (replaces Iori's health recovery message)
            $brief['statusBrief'] = $this->generateMotivationalBrief($user, $brief['weeklyWins']);

            // Generate accurate patterns based on actual data (replaces Iori's stale patterns)
            $brief['patterns'] = $this->generateAccuratePatterns($user, $brief['weeklyWins']);

            return response()->json($brief);

        } catch (\Exception $e) {
            Log::error('Command brief error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to generate command brief',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate recommendations from Week 1 projects
     */
    private function generateRecommendationsFromProjects($user): array
    {
        $recommendations = [];

        $projects = $user->projects()
            ->where('status', 'active')
            ->with(['tasks' => function ($q) {
                $q->whereNull('completed_at')->orderBy('sort_order', 'asc')->limit(2);
            }])
            ->orderBy('sort_order', 'asc')
            ->get();

        foreach ($projects as $project) {
            foreach ($project->tasks as $task) {
                $recommendations[] = [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $project->name,
                    'confidence' => $task->priority === 'high' ? 95 : ($task->priority === 'medium' ? 75 : 60),
                    'priority' => $task->priority,
                    'energyAware' => false,
                    'source' => 'projects',
                ];
            }
        }

        return array_slice($recommendations, 0, 5); // Top 5 recommendations
    }

    /**
     * Generate goal alignment from Week 1 projects
     */
    private function generateGoalAlignmentFromProjects($user): array
    {
        $alignment = [];

        // Map projects to goal categories and track progress
        $projects = $user->projects()
            ->where('status', 'active')
            ->with('tasks')
            ->orderBy('sort_order', 'asc')
            ->get();

        foreach ($projects as $project) {
            $totalTasks = $project->tasks->count();
            $completedTasks = $project->tasks->whereNotNull('completed_at')->count();
            $progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

            // Determine category based on project name/quadrant
            $category = 'revenue';
            if (str_contains(strtolower($project->name), 'brand') || str_contains(strtolower($project->name), 'content')) {
                $category = 'content';
            } elseif (str_contains(strtolower($project->name), 'health') || str_contains(strtolower($project->name), 'fitness')) {
                $category = 'health';
            } elseif (str_contains(strtolower($project->name), 'learn') || str_contains(strtolower($project->name), 'course')) {
                $category = 'learning';
            }

            $alignment[] = [
                'name' => $project->name,
                'category' => $category,
                'target' => 100, // Target is always 100%
                'current' => $completedTasks,
                'progress' => $progress,
                'trend' => $progress >= 50 ? 'up' : ($progress > 0 ? 'flat' : 'down'),
                'weeklyDelta' => 0, // Will be calculated when we have historical data
                'notes' => "{$completedTasks}/{$totalTasks} tasks completed",
            ];
        }

        return $alignment;
    }

    /**
     * Generate time allocation from Week 1 projects with actual progress
     */
    private function generateTimeAllocationFromProjects($user): array
    {
        $allocations = [];
        $startOfWeek = now()->startOfWeek();

        $projects = $user->projects()
            ->where('status', 'active')
            ->withCount([
                'tasks',
                'tasks as completed_this_week' => function ($q) use ($startOfWeek) {
                    $q->whereNotNull('completed_at')
                      ->where('completed_at', '>=', $startOfWeek);
                },
                'tasks as completed_total' => function ($q) {
                    $q->whereNotNull('completed_at');
                },
                'tasks as pending_count' => function ($q) {
                    $q->whereNull('completed_at');
                },
            ])
            ->orderByDesc('completed_this_week')
            ->limit(6)
            ->get();

        foreach ($projects as $project) {
            $totalTasks = $project->tasks_count;
            $completedTotal = $project->completed_total;
            $completedThisWeek = $project->completed_this_week;
            $pendingCount = $project->pending_count;

            // Calculate progress percentage
            $progress = $totalTasks > 0 ? round(($completedTotal / $totalTasks) * 100) : 0;

            // Determine status based on this week's activity
            if ($completedThisWeek >= 5) {
                $status = 'crushing';
                $statusColor = 'emerald';
            } elseif ($completedThisWeek >= 2) {
                $status = 'active';
                $statusColor = 'blue';
            } elseif ($completedThisWeek >= 1) {
                $status = 'progress';
                $statusColor = 'amber';
            } else {
                $status = 'stalled';
                $statusColor = 'red';
            }

            $allocations[] = [
                'project' => $project->name,
                'targetHours' => "{$completedThisWeek} this week",
                'schedule' => "{$completedTotal}/{$totalTasks} total ({$progress}%)",
                'color' => $project->color ?? '#6b7280',
                'progress' => $progress,
                'completedThisWeek' => $completedThisWeek,
                'pendingCount' => $pendingCount,
                'status' => $status,
                'statusColor' => $statusColor,
            ];
        }

        return $allocations;
    }

    /**
     * Determine energy level from readiness score
     */
    private function determineEnergyLevel(?int $readiness): string
    {
        if ($readiness === null) {
            return 'unknown';
        }

        if ($readiness >= 80) {
            return 'high';
        }

        if ($readiness >= 60) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Generate accurate patterns based on actual data
     */
    private function generateAccuratePatterns($user, array $weeklyWins): array
    {
        $patterns = [];
        $total = $weeklyWins['totalCompleted'] ?? 0;
        $streak = $weeklyWins['streak'] ?? 0;
        $byProject = $weeklyWins['byProject'] ?? [];

        // Positive patterns based on performance
        if ($total >= 20) {
            $patterns[] = "Exceptional execution this week - {$total} tasks completed";
        } elseif ($total >= 10) {
            $patterns[] = "Strong momentum - averaging " . round($total / 7, 1) . " completions/day";
        } elseif ($total >= 5) {
            $patterns[] = "Building consistency - {$total} wins prove you can execute";
        }

        if ($streak >= 7) {
            $patterns[] = "🔥 {$streak}-day completion streak - unstoppable";
        } elseif ($streak >= 3) {
            $patterns[] = "Streak building: {$streak} consecutive days with completions";
        }

        // Project-specific insights
        $topProject = collect($byProject)->sortByDesc('count')->first();
        if ($topProject && $topProject['count'] >= 3) {
            $patterns[] = "{$topProject['project']} leading with {$topProject['count']} completions";
        }

        // Multi-project activity
        if (count($byProject) >= 3) {
            $patterns[] = "Diversified progress across " . count($byProject) . " projects";
        }

        // If nothing to report, add neutral/forward-looking pattern
        if (empty($patterns)) {
            $patterns[] = "New week ahead - first completion builds momentum";
        }

        return array_slice($patterns, 0, 3); // Max 3 patterns
    }

    /**
     * Get weekly wins for motivation
     */
    private function getWeeklyWins($user): array
    {
        $startOfWeek = now()->startOfWeek();

        // Get completed tasks this week
        $completedTasks = $user->tasks()
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', $startOfWeek)
            ->with('project')
            ->orderBy('completed_at', 'desc')
            ->get();

        // Group by project
        $byProject = $completedTasks->groupBy(fn($task) => $task->project?->name ?? 'No Project');

        $wins = [];
        foreach ($byProject as $projectName => $tasks) {
            $wins[] = [
                'project' => $projectName,
                'count' => $tasks->count(),
                'tasks' => $tasks->take(3)->map(fn($t) => $t->title)->toArray(),
            ];
        }

        return [
            'totalCompleted' => $completedTasks->count(),
            'byProject' => $wins,
            'streak' => $this->calculateCompletionStreak($user),
        ];
    }

    /**
     * Calculate completion streak (days with at least one completed task)
     */
    private function calculateCompletionStreak($user): int
    {
        $streak = 0;
        $checkDate = now()->format('Y-m-d');

        for ($i = 0; $i < 30; $i++) {
            $hasCompletion = $user->tasks()
                ->whereNotNull('completed_at')
                ->whereDate('completed_at', $checkDate)
                ->exists();

            if ($hasCompletion) {
                $streak++;
                $checkDate = date('Y-m-d', strtotime($checkDate . ' -1 day'));
            } else {
                // Allow one skip for yesterday
                if ($i === 0) {
                    $checkDate = date('Y-m-d', strtotime($checkDate . ' -1 day'));
                    continue;
                }
                break;
            }
        }

        return $streak;
    }

    /**
     * Generate motivational brief based on weekly wins
     */
    private function generateMotivationalBrief($user, array $weeklyWins): array
    {
        $total = $weeklyWins['totalCompleted'] ?? 0;
        $streak = $weeklyWins['streak'] ?? 0;
        $projects = count($weeklyWins['byProject'] ?? []);

        // Generate headline based on performance
        if ($total >= 20) {
            $headline = "CRUSHING IT - {$total} WINS THIS WEEK";
            $overview = "You're on fire. {$total} tasks completed across {$projects} projects. The evidence is clear: you can make shit happen.";
        } elseif ($total >= 10) {
            $headline = "MOMENTUM BUILDING - {$total} WINS";
            $overview = "Solid week. {$total} tasks done, {$projects} projects advancing. Keep the momentum going.";
        } elseif ($total >= 5) {
            $headline = "PROGRESS IN MOTION - {$total} WINS";
            $overview = "You're moving forward. {$total} tasks completed this week. Every completion is evidence against the resistance voice.";
        } elseif ($total > 0) {
            $headline = "EXECUTION MODE - {$total} WINS";
            $overview = "{$total} tasks completed. That's {$total} more than zero. Build on it.";
        } else {
            $headline = "READY TO EXECUTE";
            $overview = "Fresh week, fresh start. Pick one task and ship it. The first completion breaks the seal.";
        }

        // Add streak info
        if ($streak >= 3) {
            $overview .= " 🔥 {$streak}-day streak active.";
        }

        // Generate directive
        $directives = [
            "Ship something small. Build evidence.",
            "One task at a time. Execute without overthinking.",
            "The resistance voice lies. Your completion history proves it.",
            "Focus beats planning. Pick the next task and move.",
            "Execution > perfection. Done beats perfect.",
        ];
        $directive = $directives[array_rand($directives)];

        return [
            'headline' => $headline,
            'overview' => $overview,
            'directive' => $directive,
            'aiGenerated' => false,
            'stale' => false,
        ];
    }

    /**
     * Get Human 3.0 quadrant summary for command brief
     */
    private function getQuadrantSummary(int $userId): array
    {
        // Get quadrant controller stats
        $quadrantController = new QuadrantController();
        $request = new Request();
        $request->setUserResolver(fn() => \App\Models\User::find($userId));

        try {
            $response = $quadrantController->stats($request);
            $stats = json_decode($response->getContent(), true);

            return [
                'mind' => ['score' => $stats['mind']['score'] ?? 0, 'label' => 'Mind'],
                'body' => ['score' => $stats['body']['score'] ?? 0, 'label' => 'Body'],
                'spirit' => ['score' => $stats['spirit']['score'] ?? 0, 'label' => 'Soul'],
                'vocation' => ['score' => $stats['vocation']['score'] ?? 0, 'label' => 'Vocation'],
                'overall' => round(
                    (($stats['mind']['score'] ?? 0) +
                     ($stats['body']['score'] ?? 0) +
                     ($stats['spirit']['score'] ?? 0) +
                     ($stats['vocation']['score'] ?? 0)) / 4
                ),
            ];
        } catch (\Exception $e) {
            Log::warning('Failed to get quadrant summary', ['error' => $e->getMessage()]);
            return [
                'mind' => ['score' => 0, 'label' => 'Mind'],
                'body' => ['score' => 0, 'label' => 'Body'],
                'spirit' => ['score' => 0, 'label' => 'Soul'],
                'vocation' => ['score' => 0, 'label' => 'Vocation'],
                'overall' => 0,
            ];
        }
    }
}
