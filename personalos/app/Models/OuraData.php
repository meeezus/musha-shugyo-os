<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OuraData extends Model
{
    use HasFactory;

    protected $table = 'oura_data';

    protected $fillable = [
        'user_id',
        'date',
        'readiness_score',
        'sleep_score',
        'activity_score',
        'total_sleep_duration',
        'deep_sleep_duration',
        'rem_sleep_duration',
        'light_sleep_duration',
        'sleep_efficiency',
        'resting_heart_rate',
        'hr_lowest',
        'hrv_average',
        'body_temperature_deviation',
        'active_calories',
        'total_calories',
        'steps',
        'target_calories',
        'stress_high',
        'recovery_high',
        'day_summary',
        'readiness_data',
        'sleep_data',
        'activity_data',
        'stress_data',
    ];

    protected $casts = [
        'date' => 'date',
        'readiness_score' => 'integer',
        'sleep_score' => 'integer',
        'activity_score' => 'integer',
        'total_sleep_duration' => 'integer',
        'deep_sleep_duration' => 'integer',
        'rem_sleep_duration' => 'integer',
        'light_sleep_duration' => 'integer',
        'sleep_efficiency' => 'integer',
        'resting_heart_rate' => 'integer',
        'hr_lowest' => 'integer',
        'hrv_average' => 'integer',
        'body_temperature_deviation' => 'float',
        'active_calories' => 'integer',
        'total_calories' => 'integer',
        'steps' => 'integer',
        'target_calories' => 'integer',
        'readiness_data' => 'array',
        'sleep_data' => 'array',
        'activity_data' => 'array',
        'stress_data' => 'array',
        'stress_high' => 'integer',
        'recovery_high' => 'integer',
    ];

    /**
     * Get the user that owns the Oura data
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Get data for a specific date
     */
    public function scopeForDate($query, string $date)
    {
        return $query->where('date', $date);
    }

    /**
     * Scope: Get recent data
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('date', '>=', now()->subDays($days)->format('Y-m-d'))
            ->orderBy('date', 'desc');
    }

    /**
     * Format sleep duration as human readable
     */
    public function getFormattedSleepDurationAttribute(): string
    {
        if (!$this->total_sleep_duration) {
            return '--';
        }
        $hours = floor($this->total_sleep_duration / 3600);
        $minutes = floor(($this->total_sleep_duration % 3600) / 60);
        return "{$hours}h {$minutes}m";
    }

    /**
     * Get score interpretation
     */
    public function getReadinessInterpretationAttribute(): string
    {
        if (!$this->readiness_score) {
            return 'Unknown';
        }
        if ($this->readiness_score >= 85) return 'Optimal';
        if ($this->readiness_score >= 70) return 'Good';
        if ($this->readiness_score >= 60) return 'Fair';
        return 'Pay attention';
    }

    /**
     * Get energy level classification
     */
    public function getEnergyLevelAttribute(): string
    {
        if (!$this->readiness_score) {
            return 'unknown';
        }
        if ($this->readiness_score >= 80) return 'high';
        if ($this->readiness_score >= 60) return 'medium';
        return 'low';
    }
}
