<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SparkfileEntry extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'content',
        'date',
        'duration_minutes',
        'mood_before',
        'mood_after',
        'meditation_type',
        'tags',
    ];

    protected $casts = [
        'date' => 'date',
        'tags' => 'array',
        'duration_minutes' => 'integer',
        'mood_before' => 'integer',
        'mood_after' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function getTypes(): array
    {
        return [
            'meditation' => 'Meditation',
            'journal' => 'Journal',
            'spark' => 'Spark',
        ];
    }

    public static function getMeditationTypes(): array
    {
        return [
            'daily' => 'Daily Meditation',
            'theory' => 'Theory',
            'conversation' => 'Conversation',
            'moment' => 'Moment',
            'practice' => 'Practice',
            'sleep' => 'Sleep',
            'other' => 'Other',
        ];
    }
}
