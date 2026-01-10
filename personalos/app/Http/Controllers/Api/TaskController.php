<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->tasks()->with('project')->orderBy('due_date', 'asc');

        // Filter by due_date if provided
        if ($request->has('due_date')) {
            if ($request->due_date === 'today') {
                $query->whereDate('due_date', today());
            } else {
                $query->whereDate('due_date', $request->due_date);
            }
        }

        // Filter by priority if provided
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter completed/incomplete
        if ($request->has('completed')) {
            if ($request->completed === 'true') {
                $query->whereNotNull('completed_at');
            } else {
                $query->whereNull('completed_at');
            }
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'priority' => 'in:low,medium,high',
            'project_id' => 'nullable|exists:projects,id',
            'phase_id' => 'nullable|exists:phases,id',
            'sort_order' => 'integer',
        ]);

        $task = $request->user()->tasks()->create($validated);
        return response()->json($task, 201);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        return response()->json($task);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'completed_at' => 'nullable|date',
            'priority' => 'in:low,medium,high',
            'project_id' => 'nullable|exists:projects,id',
            'phase_id' => 'nullable|exists:phases,id',
            'sort_order' => 'integer',
        ]);

        $task->update($validated);
        return response()->json($task);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $task->delete();
        return response()->json(null, 204);
    }
}
