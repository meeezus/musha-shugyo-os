<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Workout extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'apple_workout_type',
        'date',
        'started_at',
        'ended_at',
        'duration_minutes',
        'calories_burned',
        'distance_km',
        'avg_heart_rate',
        'max_heart_rate',
        'notes',
        'source',
        'source_id',
    ];

    protected $casts = [
        'date' => 'date',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration_minutes' => 'integer',
        'calories_burned' => 'integer',
        'distance_km' => 'decimal:2',
        'avg_heart_rate' => 'integer',
        'max_heart_rate' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Normalize Apple workout type to our simplified types
     */
    public static function normalizeType(string $appleType): string
    {
        $type = str_replace('HKWorkoutActivityType', '', $appleType);

        $mapping = [
            'TraditionalStrengthTraining' => 'strength',
            'FunctionalStrengthTraining' => 'strength',
            'HighIntensityIntervalTraining' => 'hiit',
            'Running' => 'running',
            'Walking' => 'walking',
            'Wrestling' => 'wrestling',
            'MartialArts' => 'martial_arts',
            'Yoga' => 'yoga',
            'Flexibility' => 'flexibility',
            'MixedCardio' => 'cardio',
            'Cycling' => 'cycling',
            'Swimming' => 'swimming',
            'Other' => 'other',
        ];

        return $mapping[$type] ?? strtolower($type);
    }

    public static function getTypes(): array
    {
        return [
            'strength' => 'Strength Training',
            'hiit' => 'HIIT',
            'running' => 'Running',
            'walking' => 'Walking',
            'wrestling' => 'Wrestling',
            'bjj' => 'BJJ',
            'martial_arts' => 'Martial Arts',
            'yoga' => 'Yoga',
            'flexibility' => 'Flexibility',
            'cardio' => 'Cardio',
            'cycling' => 'Cycling',
            'swimming' => 'Swimming',
            'other' => 'Other',
        ];
    }
}
