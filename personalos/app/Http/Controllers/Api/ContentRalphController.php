<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentDraft;
use App\Services\ContentRalphImporter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContentRalphController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ContentDraft::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by pillar
        if ($request->has('pillar')) {
            $query->where('pillar', $request->pillar);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $drafts = $query->get();

        // Calculate stats
        $stats = [
            'total' => ContentDraft::where('user_id', $request->user()->id)->count(),
            'draft_count' => ContentDraft::where('user_id', $request->user()->id)->drafts()->count(),
            'ready_count' => ContentDraft::where('user_id', $request->user()->id)->ready()->count(),
            'posted_count' => ContentDraft::where('user_id', $request->user()->id)->posted()->count(),
            'by_pillar' => [
                'automation' => ContentDraft::where('user_id', $request->user()->id)->byPillar('automation')->count(),
                'martial-arts' => ContentDraft::where('user_id', $request->user()->id)->byPillar('martial-arts')->count(),
                'consciousness' => ContentDraft::where('user_id', $request->user()->id)->byPillar('consciousness')->count(),
            ],
        ];

        return response()->json([
            'drafts' => $drafts,
            'stats' => $stats,
            'types' => ContentDraft::getTypes(),
            'pillars' => ContentDraft::getPillars(),
            'statuses' => ContentDraft::getStatuses(),
        ]);
    }

    /**
     * Import drafts from ralph-content output folder
     */
    public function import(Request $request): JsonResponse
    {
        $importer = new ContentRalphImporter();
        $result = $importer->import($request->user()->id);

        return response()->json([
            'message' => "Imported {$result['imported']} new drafts ({$result['skipped']} already existed)",
            'stats' => $result,
        ]);
    }

    public function update(Request $request, ContentDraft $contentRalph): JsonResponse
    {
        if ($contentRalph->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'sometimes|string',
            'topic' => 'nullable|string|max:255',
            'pillar' => 'sometimes|string|in:automation,martial-arts,consciousness',
            'archetype' => 'nullable|string|max:255',
            'effortless_score' => 'nullable|integer|min:1|max:10',
        ]);

        $contentRalph->update($validated);

        return response()->json($contentRalph);
    }

    public function markReady(Request $request, ContentDraft $contentRalph): JsonResponse
    {
        if ($contentRalph->user_id !== $request->user()->id) {
            abort(403);
        }

        $contentRalph->markAsReady();

        return response()->json($contentRalph);
    }

    public function markPosted(Request $request, ContentDraft $contentRalph): JsonResponse
    {
        if ($contentRalph->user_id !== $request->user()->id) {
            abort(403);
        }

        $contentRalph->markAsPosted();

        return response()->json($contentRalph);
    }

    public function destroy(Request $request, ContentDraft $contentRalph): JsonResponse
    {
        if ($contentRalph->user_id !== $request->user()->id) {
            abort(403);
        }

        $contentRalph->delete();

        return response()->json(null, 204);
    }
}
