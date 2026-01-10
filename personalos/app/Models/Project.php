<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'description',
        'status',
        'deadline',
        'color',
        'quadrant',
        'parent_id',
        'user_id',
        'sort_order',
    ];

    protected $casts = [
        'deadline' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function phases(): HasMany
    {
        return $this->hasMany(Phase::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    // Hierarchy relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Project::class, 'parent_id');
    }

    // Scope for top-level projects (no parent)
    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    // Scope for projects in a specific quadrant
    public function scopeInQuadrant($query, string $quadrant)
    {
        return $query->where('quadrant', $quadrant);
    }
}
