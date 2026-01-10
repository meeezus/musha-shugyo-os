<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecoveryRoutine extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
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

    protected $casts = [
        'date' => 'date',
        'left_brain_am' => 'boolean',
        'left_brain_pm' => 'boolean',
        'rear_deltoid' => 'boolean',
        'bicep_tricep_reset' => 'boolean',
        'tricep_extension' => 'boolean',
        'chin_darts' => 'boolean',
        'pec_lat_massage' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get or create today's routine for a user
     */
    public static function getOrCreateToday(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId, 'date' => now()->toDateString()],
            [
                'left_brain_am' => false,
                'left_brain_pm' => false,
                'scapular_squeezes' => 0,
                'rear_deltoid' => false,
                'bicep_tricep_reset' => false,
                'tricep_extension' => false,
                'chin_darts' => false,
                'pec_lat_massage' => false,
            ]
        );
    }

    /**
     * Calculate completion percentage (0-100)
     * 8 items total: 2 left brain + 6 exercises (scaps count as done at 80+)
     */
    public function getCompletionPercentage(): int
    {
        $completed = 0;
        $total = 8;

        if ($this->left_brain_am) $completed++;
        if ($this->left_brain_pm) $completed++;
        if ($this->scapular_squeezes >= 80) $completed++;
        if ($this->rear_deltoid) $completed++;
        if ($this->bicep_tricep_reset) $completed++;
        if ($this->tricep_extension) $completed++;
        if ($this->chin_darts) $completed++;
        if ($this->pec_lat_massage) $completed++;

        return round(($completed / $total) * 100);
    }

    /**
     * Count completed items
     */
    public function getCompletedCount(): int
    {
        $completed = 0;

        if ($this->left_brain_am) $completed++;
        if ($this->left_brain_pm) $completed++;
        if ($this->scapular_squeezes >= 80) $completed++;
        if ($this->rear_deltoid) $completed++;
        if ($this->bicep_tricep_reset) $completed++;
        if ($this->tricep_extension) $completed++;
        if ($this->chin_darts) $completed++;
        if ($this->pec_lat_massage) $completed++;

        return $completed;
    }

    /**
     * Check if routine is considered "complete" (80%+ = 6/8 items)
     */
    public function isComplete(): bool
    {
        return $this->getCompletedCount() >= 6;
    }

    /**
     * Get weekly completion stats for scoring
     */
    public static function getWeeklyStats(int $userId): array
    {
        $startOfWeek = now()->startOfWeek();
        $routines = self::where('user_id', $userId)
            ->where('date', '>=', $startOfWeek)
            ->get();

        $daysCompleted = $routines->filter(fn($r) => $r->isComplete())->count();
        $totalDays = min(7, now()->diffInDays($startOfWeek) + 1);
        $avgCompletion = $routines->count() > 0
            ? round($routines->avg(fn($r) => $r->getCompletionPercentage()))
            : 0;

        return [
            'days_completed' => $daysCompleted,
            'total_days' => $totalDays,
            'avg_completion' => $avgCompletion,
            'streak' => self::calculateStreak($userId),
        ];
    }

    /**
     * Calculate consecutive days streak
     */
    public static function calculateStreak(int $userId): int
    {
        $dates = self::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->get()
            ->filter(fn($r) => $r->isComplete())
            ->pluck('date')
            ->map(fn($d) => $d->format('Y-m-d'))
            ->values();

        if ($dates->isEmpty()) {
            return 0;
        }

        $streak = 0;
        $checkDate = now()->format('Y-m-d');

        // Check if today or yesterday has a complete routine
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
}
