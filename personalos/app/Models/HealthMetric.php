<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthMetric extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'steps',
        'distance_km',
        'active_calories',
        'exercise_minutes',
        'stand_hours',
        'flights_climbed',
        'resting_heart_rate',
        'avg_heart_rate',
        'hrv_avg',
        'walking_heart_rate_avg',
        'sleep_minutes',
        'sleep_rem_minutes',
        'sleep_deep_minutes',
        'time_in_bed_minutes',
        'weight_kg',
        'body_fat_percent',
        'source',
    ];

    protected $casts = [
        'date' => 'date',
        'steps' => 'integer',
        'distance_km' => 'decimal:2',
        'active_calories' => 'integer',
        'exercise_minutes' => 'integer',
        'stand_hours' => 'integer',
        'flights_climbed' => 'integer',
        'resting_heart_rate' => 'integer',
        'avg_heart_rate' => 'integer',
        'hrv_avg' => 'integer',
        'walking_heart_rate_avg' => 'integer',
        'sleep_minutes' => 'integer',
        'sleep_rem_minutes' => 'integer',
        'sleep_deep_minutes' => 'integer',
        'time_in_bed_minutes' => 'integer',
        'weight_kg' => 'decimal:2',
        'body_fat_percent' => 'decimal:1',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
