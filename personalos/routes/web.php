<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KnowledgeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Auth routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Chat
    Route::get('/chat', fn() => Inertia::render('Chat'))->name('chat');

    // Projects
    Route::get('/projects', fn() => Inertia::render('Projects'))->name('projects');
    Route::get('/projects/{id}', fn($id) => Inertia::render('ProjectDetail', ['projectId' => (int) $id]))->name('projects.show');

    // Placeholder routes
    Route::get('/calendar', fn() => Inertia::render('Placeholder', ['title' => 'Schedule']))->name('calendar');
    Route::get('/contacts', fn() => Inertia::render('Placeholder', ['title' => 'Relationships']))->name('contacts');
    Route::get('/training', fn() => Inertia::render('Training'))->name('training');
    Route::get('/knowledge', [KnowledgeController::class, 'index'])->name('knowledge');
    Route::get('/knowledge/browse/{path}', [KnowledgeController::class, 'browse'])->where('path', '.*')->name('knowledge.browse');
    Route::get('/knowledge/file/{path}', [KnowledgeController::class, 'show'])->where('path', '.*')->name('knowledge.show');
    Route::get('/knowledge/download/{path}', [KnowledgeController::class, 'download'])->where('path', '.*')->name('knowledge.download');
    Route::delete('/knowledge/file/{path}', [KnowledgeController::class, 'destroy'])->where('path', '.*')->name('knowledge.destroy');
    Route::get('/sparkfile', fn() => Inertia::render('Sparkfile'))->name('sparkfile');
    Route::get('/content-ralph', fn() => Inertia::render('ContentRalph'))->name('content-ralph');

    // Settings
    Route::get('/settings', [App\Http\Controllers\SettingsController::class, 'index'])->name('settings');
    Route::get('/settings/usage', [App\Http\Controllers\SettingsController::class, 'usage'])->name('settings.usage');
});
