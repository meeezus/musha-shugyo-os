<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingSession extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'date',
        'duration_minutes',
        'intensity',
        'notes',
        'techniques',
        'sparring',
        'energy_before',
        'energy_after',
    ];

    protected $casts = [
        'date' => 'date',
        'techniques' => 'array',
        'sparring' => 'array',
        'duration_minutes' => 'integer',
        'energy_before' => 'integer',
        'energy_after' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function getTypes(): array
    {
        return [
            'bjj' => 'Brazilian Jiu-Jitsu',
            'muay_thai' => 'Muay Thai',
            'wrestling' => 'Wrestling',
            'strength' => 'Strength Training',
            'cardio' => 'Cardio',
            'yoga' => 'Yoga/Mobility',
            'other' => 'Other',
        ];
    }

    public static function getIntensities(): array
    {
        return ['light', 'moderate', 'hard'];
    }
}
