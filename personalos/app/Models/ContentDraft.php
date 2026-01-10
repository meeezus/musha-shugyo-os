<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ContentDraft extends Model
{
    protected $fillable = [
        'user_id',
        'queue_id',
        'type',
        'pillar',
        'archetype',
        'topic',
        'content',
        'status',
        'effortless_score',
        'source_path',
        'posted_at',
    ];

    protected $casts = [
        'effortless_score' => 'integer',
        'posted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeDrafts(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    public function scopeReady(Builder $query): Builder
    {
        return $query->where('status', 'ready');
    }

    public function scopePosted(Builder $query): Builder
    {
        return $query->where('status', 'posted');
    }

    public function scopeByPillar(Builder $query, string $pillar): Builder
    {
        return $query->where('pillar', $pillar);
    }

    // Methods
    public function markAsReady(): void
    {
        $this->update(['status' => 'ready']);
    }

    public function markAsPosted(): void
    {
        $this->update([
            'status' => 'posted',
            'posted_at' => now(),
        ]);
    }

    // Static helpers
    public static function getTypes(): array
    {
        return [
            'tweet' => 'Tweet',
            'thread' => 'Thread',
            'newsletter' => 'Newsletter',
        ];
    }

    public static function getPillars(): array
    {
        return [
            'automation' => 'Automation',
            'martial-arts' => 'Martial Arts',
            'consciousness' => 'Consciousness',
        ];
    }

    public static function getStatuses(): array
    {
        return [
            'draft' => 'Draft',
            'ready' => 'Ready',
            'posted' => 'Posted',
        ];
    }
}
