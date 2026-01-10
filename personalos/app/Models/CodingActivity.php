<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodingActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'project_name',
        'project_id',
        'branch',
        'commit_hash',
        'commit_message',
        'files_changed',
        'lines_added',
        'lines_removed',
        'duration_minutes',
        'task_description',
        'metadata',
        'source',
        'activity_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'activity_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Activity types
     */
    const TYPE_COMMIT = 'commit';
    const TYPE_SESSION_START = 'session_start';
    const TYPE_SESSION_END = 'session_end';
    const TYPE_TASK_COMPLETE = 'task_complete';
    const TYPE_PR_CREATED = 'pr_created';
    const TYPE_PR_MERGED = 'pr_merged';

    /**
     * Get stats for a time period
     */
    public static function getStats(int $userId, string $period = 'week'): array
    {
        $startDate = match ($period) {
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfWeek(),
        };

        $activities = self::where('user_id', $userId)
            ->where('activity_at', '>=', $startDate)
            ->get();

        return [
            'commits' => $activities->where('type', self::TYPE_COMMIT)->count(),
            'tasks_completed' => $activities->where('type', self::TYPE_TASK_COMPLETE)->count(),
            'prs_created' => $activities->where('type', self::TYPE_PR_CREATED)->count(),
            'prs_merged' => $activities->where('type', self::TYPE_PR_MERGED)->count(),
            'total_lines_added' => $activities->sum('lines_added'),
            'total_lines_removed' => $activities->sum('lines_removed'),
            'total_files_changed' => $activities->sum('files_changed'),
            'coding_minutes' => $activities->sum('duration_minutes'),
            'projects_touched' => $activities->pluck('project_name')->unique()->filter()->count(),
        ];
    }
}
