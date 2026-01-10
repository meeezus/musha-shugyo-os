<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ApiUsageController;
use App\Http\Controllers\Api\OuraController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\CommandController;
use App\Http\Controllers\Api\TrainingController;
use App\Http\Controllers\Api\SparkfileController;
use App\Http\Controllers\Api\HealthSyncController;
use App\Http\Controllers\Api\QuadrantController;
use App\Http\Controllers\Api\CodingActivityController;
use App\Http\Controllers\Api\ContentRalphController;
use App\Http\Controllers\Api\RecoveryController;
use App\Http\Controllers\Api\StrategicGoalController;

// Public route to get current user
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// All API routes require authentication
Route::middleware('auth:sanctum')->group(function () {
    // Goals
    Route::apiResource('goals', GoalController::class);

    // Tasks
    Route::apiResource('tasks', TaskController::class);

    // Contacts
    Route::apiResource('contacts', ContactController::class);

    // Projects
    Route::apiResource('projects', ProjectController::class);
    Route::post('projects/{project}/reorder-children', [ProjectController::class, 'reorderChildren']);

    // API Usage
    Route::get('api-usage', [ApiUsageController::class, 'index']);
    Route::post('api-usage', [ApiUsageController::class, 'store']);

    // Oura Ring
    Route::get('oura/latest', [OuraController::class, 'latest']);
    Route::get('oura/date/{date}', [OuraController::class, 'forDate']);
    Route::get('oura/range', [OuraController::class, 'range']);
    Route::get('oura/insights', [OuraController::class, 'insights']);
    Route::post('oura/sync', [OuraController::class, 'sync']);

    // Chat (Jotaro)
    Route::get('chat/messages', [ChatController::class, 'index']);
    Route::post('chat/send', [ChatController::class, 'send']);
    Route::delete('chat/clear', [ChatController::class, 'clear']);
    Route::get('chat/sessions', [ChatController::class, 'sessions']);

    // Context Sync (for file watcher daemon)
    Route::post('sync/projects', [SyncController::class, 'syncProjects']);
    Route::get('sync/status', [SyncController::class, 'status']);
    Route::get('sync/export', [SyncController::class, 'exportMarkdown']);

    // Command Center
    Route::get('command/brief', [CommandController::class, 'brief']);

    // Training
    Route::apiResource('training', TrainingController::class);

    // Sparkfile (meditation, journal, sparks)
    Route::apiResource('sparkfile', SparkfileController::class);
    Route::post('sparkfile/bulk-import', [SparkfileController::class, 'bulkImport']);

    // Health Sync (iOS Shortcut integration)
    Route::post('health/sync', [HealthSyncController::class, 'sync']);
    Route::get('health/summary', [HealthSyncController::class, 'summary']);

    // Human 3.0 Quadrant Stats
    Route::get('quadrants/stats', [QuadrantController::class, 'stats']);

    // Coding Activity (Claude Code Integration)
    Route::post('coding/activity', [CodingActivityController::class, 'store']);
    Route::get('coding/stats', [CodingActivityController::class, 'stats']);
    Route::get('coding/feed', [CodingActivityController::class, 'feed']);

    // Content Ralph (Content Draft Management)
    Route::get('content-ralph', [ContentRalphController::class, 'index']);
    Route::post('content-ralph/import', [ContentRalphController::class, 'import']);
    Route::put('content-ralph/{contentRalph}', [ContentRalphController::class, 'update']);
    Route::post('content-ralph/{contentRalph}/ready', [ContentRalphController::class, 'markReady']);
    Route::post('content-ralph/{contentRalph}/posted', [ContentRalphController::class, 'markPosted']);
    Route::delete('content-ralph/{contentRalph}', [ContentRalphController::class, 'destroy']);

    // Recovery Routine (Sean's daily exercises)
    Route::get('recovery/status', [RecoveryController::class, 'status']);
    Route::post('recovery/log', [RecoveryController::class, 'log']);
    Route::post('recovery/complete-day', [RecoveryController::class, 'completeDay']);
    Route::put('recovery/today', [RecoveryController::class, 'update']);
    Route::get('recovery/history', [RecoveryController::class, 'history']);
    Route::post('recovery/scaps', [RecoveryController::class, 'incrementScaps']);

    // Strategic Goals (high-level quarterly/annual goals)
    Route::get('strategic-goals', [StrategicGoalController::class, 'index']);
    Route::post('strategic-goals', [StrategicGoalController::class, 'store']);
    Route::put('strategic-goals/{strategicGoal}/progress', [StrategicGoalController::class, 'updateProgress']);
    Route::post('strategic-goals/{strategicGoal}/increment', [StrategicGoalController::class, 'increment']);
    Route::delete('strategic-goals/{strategicGoal}', [StrategicGoalController::class, 'destroy']);
});
