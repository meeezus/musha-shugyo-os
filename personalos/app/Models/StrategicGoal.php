<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StrategicGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'category',
        'target_value',
        'current_value',
        'unit',
        'target_dollars',
        'target_date',
        'timeframe',
        'notes',
        'status',
    ];

    protected $casts = [
        'target_value' => 'decimal:2',
        'current_value' => 'decimal:2',
        'target_dollars' => 'decimal:2',
        'target_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get progress as a percentage
     */
    public function getProgressAttribute(): int
    {
        if ($this->target_value <= 0) {
            return 0;
        }
        return (int) min(100, round(($this->current_value / $this->target_value) * 100));
    }

    /**
     * Get trend based on progress
     */
    public function getTrendAttribute(): string
    {
        $progress = $this->progress;
        if ($progress >= 75) return 'up';
        if ($progress >= 25) return 'flat';
        return 'down';
    }

    /**
     * Format for the dashboard widget
     */
    public function toDashboardFormat(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'target' => (float) $this->target_value,
            'current' => (float) $this->current_value,
            'progress' => $this->progress,
            'trend' => $this->trend,
            'unit' => $this->unit,
            'targetDollars' => $this->target_dollars ? (float) $this->target_dollars : null,
            'timeframe' => $this->timeframe,
            'notes' => $this->notes,
        ];
    }
}
