<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SparkfileEntry;
use App\Models\Workout;
use App\Models\HealthMetric;
use App\Models\TrainingSession;
use App\Models\CodingActivity;
use App\Models\Task;
use App\Models\RecoveryRoutine;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QuadrantController extends Controller
{
    /**
     * Get health stats for all Human 3.0 quadrants
     */
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Spirit quadrant: Meditation stats
        $meditationThisWeek = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $meditationThisMonth = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $meditationThisYear = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->whereYear('date', now()->year)
            ->count();
        $totalMeditationMinutes = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->sum('duration_minutes');
        $avgMeditationMinutes = round(SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->avg('duration_minutes') ?? 0);
        $currentStreak = $this->calculateMeditationStreak($userId);

        // Body quadrant: Workout stats from both Apple Health and manual training
        // Apple Health workouts
        $appleWorkoutsThisWeek = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $appleWorkoutsThisMonth = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $appleWorkoutMinutes = Workout::where('user_id', $userId)
            ->sum('duration_minutes');

        // Manual training sessions (BJJ, strength, etc)
        $manualTrainingThisWeek = TrainingSession::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $manualTrainingThisMonth = TrainingSession::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $manualTrainingMinutes = TrainingSession::where('user_id', $userId)
            ->sum('duration_minutes');

        // Combined totals (both sources)
        $workoutsThisWeek = $appleWorkoutsThisWeek + $manualTrainingThisWeek;
        $workoutsThisMonth = $appleWorkoutsThisMonth + $manualTrainingThisMonth;
        $totalWorkoutMinutes = $appleWorkoutMinutes + $manualTrainingMinutes;

        // Year totals
        $appleWorkoutsThisYear = Workout::where('user_id', $userId)
            ->whereYear('date', now()->year)
            ->count();
        $manualTrainingThisYear = TrainingSession::where('user_id', $userId)
            ->whereYear('date', now()->year)
            ->count();
        $workoutsThisYear = $appleWorkoutsThisYear + $manualTrainingThisYear;

        // BJJ specific (from both sources)
        $bjjThisMonth = Workout::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->where(function ($q) {
                $q->where('type', 'LIKE', '%wrestling%')
                    ->orWhere('type', 'martial_arts')
                    ->orWhere('type', 'wrestling');
            })
            ->count();
        $bjjThisMonth += TrainingSession::where('user_id', $userId)
            ->where('date', '>=', now()->startOfMonth())
            ->whereIn('type', ['bjj', 'wrestling', 'muay_thai'])
            ->count();

        // Health metrics (from Apple Health)
        $avgStepsThisWeek = round(HealthMetric::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->avg('steps') ?? 0);
        $avgSleepHoursThisWeek = round((HealthMetric::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->avg('sleep_minutes') ?? 0) / 60, 1);
        $avgHRVThisWeek = round(HealthMetric::where('user_id', $userId)
            ->where('date', '>=', now()->startOfWeek())
            ->whereNotNull('hrv_avg')
            ->avg('hrv_avg') ?? 0);

        // Latest metrics
        $latestMetric = HealthMetric::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->first();

        // Recovery routine stats (Sean's exercises)
        $recoveryStats = RecoveryRoutine::getWeeklyStats($userId);

        // Calculate "scores" based on activity
        // Spirit score: Based on meditation consistency and total hours (historical weighted heavily)
        $spiritScore = $this->calculateSpiritScore(
            $meditationThisWeek,
            $meditationThisMonth,
            $totalMeditationMinutes / 60,
            $currentStreak
        );

        // Body score: Based on workout consistency, health metrics, and recovery routine
        $bodyScore = $this->calculateBodyScore(
            $workoutsThisWeek,
            $workoutsThisMonth,
            $totalWorkoutMinutes / 60,
            $avgStepsThisWeek,
            $avgSleepHoursThisWeek,
            $recoveryStats
        );

        return response()->json([
            'spirit' => [
                'score' => $spiritScore,
                'this_week' => $meditationThisWeek,
                'this_month' => $meditationThisMonth,
                'this_year' => $meditationThisYear,
                'total_hours' => round($totalMeditationMinutes / 60, 1),
                'avg_duration_minutes' => $avgMeditationMinutes,
                'current_streak' => $currentStreak,
                'label' => 'meditation sessions',
            ],
            'body' => [
                'score' => $bodyScore,
                'workouts_this_week' => $workoutsThisWeek,
                'workouts_this_month' => $workoutsThisMonth,
                'workouts_this_year' => $workoutsThisYear,
                'total_workout_hours' => round($totalWorkoutMinutes / 60, 1),
                'bjj_this_month' => $bjjThisMonth,
                'manual_training_this_week' => $manualTrainingThisWeek,
                'avg_steps' => $avgStepsThisWeek,
                'avg_sleep_hours' => $avgSleepHoursThisWeek,
                'avg_hrv' => $avgHRVThisWeek,
                'recovery' => $recoveryStats,
                'latest' => $latestMetric ? [
                    'date' => $latestMetric->date->format('Y-m-d'),
                    'steps' => $latestMetric->steps,
                    'sleep_hours' => round(($latestMetric->sleep_minutes ?? 0) / 60, 1),
                    'hrv' => $latestMetric->hrv_avg,
                ] : null,
                'label' => 'physical health',
            ],
            'mind' => $this->getMindStats($userId),
            'vocation' => $this->getVocationStats($userId),
        ]);
    }

    /**
     * Calculate meditation streak (consecutive days)
     */
    private function calculateMeditationStreak(int $userId): int
    {
        $dates = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'meditation')
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->map(fn($d) => $d->format('Y-m-d'))
            ->unique()
            ->values();

        if ($dates->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $checkDate = now()->format('Y-m-d');

        // Check if today or yesterday has a session (to start the streak)
        if (!$dates->contains($checkDate)) {
            $checkDate = now()->subDay()->format('Y-m-d');
            if (!$dates->contains($checkDate)) {
                return 0;
            }
        }

        // Count consecutive days
        while ($dates->contains($checkDate)) {
            $streak++;
            $checkDate = date('Y-m-d', strtotime($checkDate . ' -1 day'));
        }

        return $streak;
    }

    /**
     * Calculate Spirit score (0-100)
     * Based on: consciousness foundation + current practice
     *
     * Consciousness foundation (25% of score):
     * - Years of self-awareness work and introspection
     * - Martial arts philosophy (BJJ as moving meditation)
     * - Prior meditation/mindfulness experience
     *
     * Current practice (75% of score):
     * - Weekly meditation sessions
     * - Monthly consistency
     * - Total hours tracked
     * - Current streak
     */
    private function calculateSpiritScore(int $thisWeek, int $thisMonth, float $totalHours, int $streak): int
    {
        // === CONSCIOUSNESS FOUNDATION (25% of total score) ===
        // Years of self-awareness, martial arts philosophy, introspection
        $consciousnessFoundation = 25;

        // === CURRENT PRACTICE (75% of total score) ===
        // Weekly target: 3 sessions (achievable)
        $weeklyScore = min(100, ($thisWeek / 3) * 100);

        // Monthly target: 10 sessions
        $monthlyScore = min(100, ($thisMonth / 10) * 100);

        // Total hours tracked (50 hours = 100%)
        $totalScore = min(100, ($totalHours / 50) * 100);

        // Streak bonus (5 day streak = 100%)
        $streakScore = min(100, ($streak / 5) * 100);

        // Current practice weighted (scales to 75% of total)
        $currentPractice = (
            ($weeklyScore * 0.25) +
            ($monthlyScore * 0.20) +
            ($totalScore * 0.35) +
            ($streakScore * 0.20)
        ) * 0.75;

        return round(min(100, $consciousnessFoundation + $currentPractice));
    }

    /**
     * Calculate Body score (0-100)
     * Based on: physical foundation + current activity + recovery routine
     *
     * Physical foundation (25% of score):
     * - Years of BJJ training and martial arts
     * - Athletic base and body awareness
     * - Movement patterns developed over time
     *
     * Current activity (75% of score):
     * - Recovery routine (25% - primary during injury)
     * - Weekly workouts (12.5%)
     * - Total tracked hours (12.5%)
     * - Daily steps (10%)
     * - Sleep quality (15%)
     */
    private function calculateBodyScore(int $workoutsThisWeek, int $workoutsThisMonth, float $totalWorkoutHours, int $avgSteps, float $avgSleep, array $recoveryStats = []): int
    {
        // === PHYSICAL FOUNDATION (25% of total score) ===
        // Years of BJJ, martial arts, and athletic development
        $physicalFoundation = 25;

        // === CURRENT ACTIVITY (75% of total score) ===

        // Recovery routine score (25% weight) - primary work during injury recovery
        // Based on days completed this week (6/8 items = complete day)
        $daysCompleted = $recoveryStats['days_completed'] ?? 0;
        $totalDays = $recoveryStats['total_days'] ?? 7;
        $recoveryScore = $totalDays > 0 ? min(100, ($daysCompleted / $totalDays) * 100) : 0;

        // Weekly workout target: 3 workouts (realistic during recovery)
        $weeklyWorkoutScore = min(100, ($workoutsThisWeek / 3) * 100);

        // Total workout hours tracked (50 hours = 100%)
        $totalWorkoutScore = min(100, ($totalWorkoutHours / 50) * 100);

        // Steps target: 5,000 daily average (adjusted for injury)
        $stepsScore = min(100, ($avgSteps / 5000) * 100);

        // Sleep target: 7.5 hours
        $sleepScore = min(100, ($avgSleep / 7.5) * 100);

        // Current activity weighted (scales to 75% of total score)
        // Weights sum to 1.0, then multiply by 0.75 for final contribution
        $currentActivity = (
            ($recoveryScore * 0.33) +       // ~25% of 75% = recovery routine (primary)
            ($weeklyWorkoutScore * 0.17) +  // ~12.5% of 75% = weekly workouts
            ($totalWorkoutScore * 0.17) +   // ~12.5% of 75% = total hours
            ($stepsScore * 0.13) +          // ~10% of 75% = steps
            ($sleepScore * 0.20)            // ~15% of 75% = sleep
        ) * 0.75;

        return round(min(100, $physicalFoundation + $currentActivity));
    }

    /**
     * Get Vocation stats from coding activity AND regular task completions
     */
    private function getVocationStats(int $userId): array
    {
        // Get coding stats
        $weekStats = CodingActivity::getStats($userId, 'week');
        $monthStats = CodingActivity::getStats($userId, 'month');
        $yearStats = CodingActivity::getStats($userId, 'year');

        // Total commits and sessions ever
        $totalCommits = CodingActivity::where('user_id', $userId)
            ->where('type', 'commit')
            ->count();
        $totalSessions = CodingActivity::where('user_id', $userId)
            ->whereIn('type', ['session_start', 'session_end'])
            ->count();

        // Regular task completions (from Tasks table, not just CodingActivity)
        $tasksCompletedWeek = Task::where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->startOfWeek())
            ->count();
        $tasksCompletedMonth = Task::where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->startOfMonth())
            ->count();
        $totalTasksCompleted = Task::where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->count();

        // Calculate Vocation score using regular task completions
        $vocationScore = $this->calculateVocationScore(
            $weekStats['commits'],
            $tasksCompletedWeek,  // Use regular tasks, not just coding tasks
            $totalCommits,
            $totalTasksCompleted  // Use total tasks completed
        );

        return [
            'score' => $vocationScore,
            'commits_this_week' => $weekStats['commits'],
            'commits_this_month' => $monthStats['commits'],
            'commits_this_year' => $yearStats['commits'],
            'total_commits' => $totalCommits,
            'tasks_completed_week' => $tasksCompletedWeek,
            'tasks_completed_month' => $tasksCompletedMonth,
            'total_tasks_completed' => $totalTasksCompleted,
            'coding_sessions' => $totalSessions,
            'lines_added_week' => $weekStats['total_lines_added'],
            'lines_removed_week' => $weekStats['total_lines_removed'],
            'projects_touched_week' => $weekStats['projects_touched'],
            'label' => 'productive work',
        ];
    }

    /**
     * Get Mind stats from journaling and idea capture
     */
    private function getMindStats(int $userId): array
    {
        // Journal entries (reflection, training notes)
        $journalsThisWeek = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'journal')
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $journalsThisMonth = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'journal')
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $totalJournals = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'journal')
            ->count();

        // Spark entries (idea capture, insights)
        $sparksThisWeek = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'spark')
            ->where('date', '>=', now()->startOfWeek())
            ->count();
        $sparksThisMonth = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'spark')
            ->where('date', '>=', now()->startOfMonth())
            ->count();
        $totalSparks = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'spark')
            ->count();

        // Training journals specifically (learning from practice)
        $trainingJournals = SparkfileEntry::where('user_id', $userId)
            ->where('type', 'journal')
            ->whereJsonContains('tags', 'training')
            ->count();

        // Calculate Mind score
        $mindScore = $this->calculateMindScore(
            $journalsThisWeek,
            $sparksThisWeek,
            $totalJournals,
            $totalSparks,
            $trainingJournals
        );

        return [
            'score' => $mindScore,
            'journals_this_week' => $journalsThisWeek,
            'journals_this_month' => $journalsThisMonth,
            'total_journals' => $totalJournals,
            'sparks_this_week' => $sparksThisWeek,
            'sparks_this_month' => $sparksThisMonth,
            'total_sparks' => $totalSparks,
            'training_journals' => $trainingJournals,
            'label' => 'reflection & ideas',
        ];
    }

    /**
     * Calculate Mind score (0-100)
     * Based on: intellectual foundation + current reflection activities
     *
     * Intellectual foundation (30% of score):
     * - Years of learning, reading, professional development
     * - Critical thinking developed through technical roles
     * - Pattern recognition from 16 years problem-solving
     *
     * Current activity (70% of score):
     * - Weekly journaling & reflection
     * - Idea capture (sparks)
     * - Training reflection (BJJ notes, etc.)
     */
    private function calculateMindScore(
        int $journalsWeek,
        int $sparksWeek,
        int $totalJournals,
        int $totalSparks,
        int $trainingJournals
    ): int {
        // === INTELLECTUAL FOUNDATION (30% of total score) ===
        // 16 years of professional learning and problem-solving
        // Technical roles requiring analysis and pattern recognition
        $intellectualFoundation = 30;

        // === CURRENT ACTIVITY (70% of total score) ===
        // Weekly journal target: 2 entries (achievable)
        $weeklyJournalScore = min(100, ($journalsWeek / 2) * 100);

        // Weekly spark target: 3 ideas (achievable)
        $weeklySparkScore = min(100, ($sparksWeek / 3) * 100);

        // Historical journals (20 = 100%)
        $totalJournalScore = min(100, ($totalJournals / 20) * 100);

        // Historical sparks (40 = 100%)
        $totalSparkScore = min(100, ($totalSparks / 40) * 100);

        // Training reflection bonus (10 training journals = +10% max)
        $trainingBonus = min(10, ($trainingJournals / 10) * 10);

        // Current activity weighted (scales to 70% of total)
        $currentActivity = (
            ($weeklyJournalScore * 0.30) +
            ($weeklySparkScore * 0.20) +
            ($totalJournalScore * 0.30) +
            ($totalSparkScore * 0.20)
        ) * 0.70;

        // Total score: foundation + current activity + training bonus
        return round(min(100, $intellectualFoundation + $currentActivity + $trainingBonus));
    }

    /**
     * Calculate Vocation score (0-100)
     * Based on: career foundation + current productivity
     *
     * Career foundation (40% of score):
     * - 16 years professional experience (Unity, Metamarkets, Rubicon Project)
     * - Leadership experience (Team Lead at Unity)
     * - Technical account management expertise
     *
     * Current activity (60% of score):
     * - Weekly tasks completed
     * - Weekly commits
     * - Historical task completion in MSOS
     */
    private function calculateVocationScore(int $commitsWeek, int $tasksWeek, int $totalCommits, int $totalTasksCompleted): int
    {
        // === CAREER FOUNDATION (40% of total score) ===
        // 16 years experience: Jun 2009 - Jul 2025
        // - Rubicon Project: 5 yrs (Stats Integrity → Account Manager → Technical AM)
        // - Metamarkets: 3.5 yrs (Account Manager → Technical AM)
        // - Unity: 7.75 yrs (Partner Manager → Team Lead, Growth Partnerships)
        $yearsExperience = 16;
        $hasLeadershipExp = true;  // Team Lead at Unity
        $hasTechnicalExp = true;   // Multiple Technical AM roles

        // Experience score: 5% per year, capped at 25%
        $experienceScore = min(25, $yearsExperience * 1.5);

        // Leadership bonus: +10%
        $leadershipBonus = $hasLeadershipExp ? 10 : 0;

        // Technical expertise bonus: +5%
        $technicalBonus = $hasTechnicalExp ? 5 : 0;

        // Career foundation total (max 40%)
        $careerFoundation = min(40, $experienceScore + $leadershipBonus + $technicalBonus);

        // === CURRENT ACTIVITY (60% of total score) ===
        // Weekly task target: 10 tasks
        $weeklyTaskScore = min(100, ($tasksWeek / 10) * 100);

        // Weekly commit target: 5 commits
        $weeklyCommitScore = min(100, ($commitsWeek / 5) * 100);

        // Historical tasks in MSOS (100 tasks = 100%)
        $historicalTaskScore = min(100, ($totalTasksCompleted / 100) * 100);

        // Current activity weighted (scales to 60% of total)
        $currentActivity = (
            ($weeklyTaskScore * 0.40) +
            ($weeklyCommitScore * 0.20) +
            ($historicalTaskScore * 0.40)
        ) * 0.60;

        // Total score: career foundation + current activity
        return round($careerFoundation + $currentActivity);
    }
}
