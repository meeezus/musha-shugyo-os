<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\ApiUsage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * Get chat messages for current session
     */
    public function index(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id');

        $query = ChatMessage::where('user_id', $request->user()->id);

        if ($sessionId) {
            $query->forSession($sessionId);
        }

        $messages = $query->chronological()->get();

        return response()->json([
            'messages' => $messages,
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Send a message to Iori and get response
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:10000',
            'session_id' => 'nullable|string',
            'model' => 'nullable|string',
            'mode' => 'nullable|string|in:default,focus,recovery,hustle', // Iori operating mode
            'files' => 'nullable|array|max:10', // Max 10 files
            'files.*' => 'file|max:20480|mimes:jpg,jpeg,png,gif,webp,pdf,txt,md,csv,json', // Max 20MB each
            'image' => 'nullable|file|max:20480|mimes:jpg,jpeg,png,gif,webp,pdf,txt,md,csv,json', // Legacy single file support
        ]);

        $user = $request->user();
        $sessionId = $validated['session_id'] ?? Str::uuid()->toString();

        // Handle file uploads (images or documents) - supports multiple files
        $images = []; // Array of base64 encoded images
        $fileUrl = null;
        $allFileContent = '';

        // Process files from 'files' array (multiple) or legacy 'image' field (single)
        $uploadedFiles = $request->file('files', []);
        if ($request->hasFile('image') && empty($uploadedFiles)) {
            $uploadedFiles = [$request->file('image')];
        }

        \Log::info('Chat file upload debug', [
            'has_files_array' => $request->hasFile('files'),
            'files_count' => count($uploadedFiles),
            'file_names' => array_map(fn($f) => $f->getClientOriginalName(), $uploadedFiles),
        ]);

        foreach ($uploadedFiles as $file) {
            $fileMimeType = $file->getMimeType();

            // For images, encode as base64 for Claude vision
            if (str_starts_with($fileMimeType, 'image/')) {
                $images[] = [
                    'data' => base64_encode(file_get_contents($file->getRealPath())),
                    'media_type' => $fileMimeType,
                ];
                // Store first image for display
                if (!$fileUrl) {
                    $filePath = $file->store('chat-images', 'public');
                    $fileUrl = '/storage/' . $filePath;
                }
            } else {
                // For documents (PDF, text, etc.), read as text content
                $fileContent = file_get_contents($file->getRealPath());
                // For PDFs, we'd need a PDF parser - for now just note it's a PDF
                if ($fileMimeType === 'application/pdf') {
                    $fileContent = "[PDF file: {$file->getClientOriginalName()}]\n\nNote: PDF content extraction requires additional processing. The file has been received.";
                }
                $allFileContent .= "\n\n--- {$file->getClientOriginalName()} ---\n" . $fileContent;
            }
        }

        // Store user message
        $userMessage = ChatMessage::create([
            'user_id' => $user->id,
            'role' => 'user',
            'content' => $validated['content'],
            'session_id' => $sessionId,
            'image_url' => $fileUrl,
        ]);

        // Get conversation history for context
        $history = ChatMessage::where('user_id', $user->id)
            ->forSession($sessionId)
            ->chronological()
            ->get()
            ->map(fn($msg) => [
                'role' => $msg->role,
                'content' => $msg->content,
            ])
            ->toArray();

        // Get user's current data for context
        $goals = $user->goals()->get(['id', 'name as title', 'target_value as target', 'current_value as current', 'unit']);
        $tasks = $user->tasks()->whereNull('completed_at')->get(['id', 'title', 'priority', 'due_date']);
        $contacts = $user->contacts()->orderBy('last_contact', 'desc')->limit(10)->get(['id', 'name', 'last_contact']);

        // Get recent sessions for conversation memory (exclude current session)
        $recentSessions = $this->getRecentSessionsForContext($user->id, $sessionId);

        try {
            // For text files, append content to the message
            $messageContent = $validated['content'];
            if ($allFileContent) {
                $messageContent .= "\n\n--- Attached File Content ---" . $allFileContent;
            }

            // Build request payload
            $payload = [
                'message' => $messageContent,
                'history' => $history,
                'model' => $validated['model'] ?? null,
                'mode' => $validated['mode'] ?? 'default', // Iori operating mode
                'context' => [
                    'goals' => $goals,
                    'tasks' => $tasks,
                    'contacts' => $contacts,
                    'user_name' => $user->name,
                    'recent_sessions' => $recentSessions,
                ],
            ];

            // Add images if present (for vision) - supports multiple images
            if (!empty($images)) {
                $payload['images'] = $images;
                // Also keep single 'image' for backward compatibility with Iori
                $payload['image'] = $images[0];
            }

            // Call Iori agent with 10-minute timeout for complex agentic operations
            \Log::info('Sending to Iori', ['url' => env('IORI_URL', 'http://localhost:3002') . '/chat', 'payload_size' => strlen(json_encode($payload))]);

            $response = Http::timeout(600)->connectTimeout(10)->post(
                env('IORI_URL', 'http://localhost:3002') . '/chat',
                $payload
            );

            \Log::info('Iori response', ['status' => $response->status(), 'body_length' => strlen($response->body())]);

            if (!$response->successful()) {
                \Log::error('Iori error', ['status' => $response->status(), 'body' => $response->body()]);
                throw new \Exception('Iori agent returned error: ' . $response->status());
            }

            $data = $response->json();
            $assistantContent = $data['response'] ?? 'I apologize, but I encountered an issue processing your request.';
            $actions = $data['actions'] ?? [];
            $usage = $data['usage'] ?? null;

            // Execute any actions Iori requested
            $actionResults = $this->executeActions($actions, $user);

            // Store API usage if present
            if ($usage) {
                $this->logApiUsage($user, $usage);
            }

            // Store assistant message
            $assistantMessage = ChatMessage::create([
                'user_id' => $user->id,
                'role' => 'assistant',
                'content' => $assistantContent,
                'session_id' => $sessionId,
                'metadata' => [
                    'actions' => $actions,
                    'action_results' => $actionResults,
                    'usage' => $usage,
                ],
            ]);

            return response()->json([
                'message' => $assistantMessage,
                'session_id' => $sessionId,
                'actions' => $actionResults,
                'usage' => $usage,
            ]);

        } catch (\Exception $e) {
            \Log::error('Chat error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            // Store error as assistant message
            $errorMessage = ChatMessage::create([
                'user_id' => $user->id,
                'role' => 'assistant',
                'content' => 'I apologize, but I encountered a connection issue. Please try again.',
                'session_id' => $sessionId,
                'metadata' => ['error' => $e->getMessage()],
            ]);

            return response()->json([
                'message' => $errorMessage,
                'session_id' => $sessionId,
                'error' => true,
            ], 500);
        }
    }

    /**
     * Clear chat history for a session
     */
    public function clear(Request $request): JsonResponse
    {
        $sessionId = $request->input('session_id');

        $query = ChatMessage::where('user_id', $request->user()->id);

        if ($sessionId) {
            $query->forSession($sessionId);
        }

        $deleted = $query->delete();

        return response()->json([
            'deleted' => $deleted,
            'message' => 'Chat history cleared',
        ]);
    }

    /**
     * Get list of chat sessions
     */
    public function sessions(Request $request): JsonResponse
    {
        $sessions = ChatMessage::where('user_id', $request->user()->id)
            ->selectRaw('session_id, MIN(created_at) as started_at, MAX(created_at) as last_message_at, COUNT(*) as message_count')
            ->groupBy('session_id')
            ->orderBy('last_message_at', 'desc')
            ->limit(20)
            ->get();

        // Add preview from first user message in each session
        foreach ($sessions as $session) {
            $firstMessage = ChatMessage::where('user_id', $request->user()->id)
                ->where('session_id', $session->session_id)
                ->where('role', 'user')
                ->orderBy('created_at', 'asc')
                ->first();

            $session->preview = $firstMessage
                ? \Illuminate\Support\Str::limit($firstMessage->content, 60)
                : null;
        }

        return response()->json(['sessions' => $sessions]);
    }

    /**
     * Execute actions requested by Iori
     */
    private function executeActions(array $actions, $user): array
    {
        $results = [];

        foreach ($actions as $action) {
            $type = $action['type'] ?? null;
            $data = $action['data'] ?? [];

            switch ($type) {
                case 'add_task':
                    $task = $user->tasks()->create([
                        'title' => $data['title'] ?? 'New Task',
                        'description' => $data['description'] ?? null,
                        'priority' => $data['priority'] ?? 'medium',
                        'due_date' => $data['due_date'] ?? null,
                    ]);
                    $results[] = ['type' => 'add_task', 'success' => true, 'task_id' => $task->id];
                    break;

                case 'complete_task':
                    $task = $user->tasks()->find($data['task_id']);
                    if ($task) {
                        $task->update(['completed_at' => now()]);
                        $results[] = ['type' => 'complete_task', 'success' => true, 'task_id' => $task->id];
                    }
                    break;

                case 'update_goal':
                    $goal = $user->goals()->find($data['goal_id']);
                    if ($goal) {
                        $goal->update(['current' => $data['current'] ?? $goal->current]);
                        $results[] = ['type' => 'update_goal', 'success' => true, 'goal_id' => $goal->id];
                    }
                    break;

                case 'add_contact':
                    $contact = $user->contacts()->create([
                        'name' => $data['name'],
                        'email' => $data['email'] ?? null,
                        'notes' => $data['notes'] ?? null,
                        'last_contact' => now(),
                    ]);
                    $results[] = ['type' => 'add_contact', 'success' => true, 'contact_id' => $contact->id];
                    break;

                default:
                    $results[] = ['type' => $type, 'success' => false, 'error' => 'Unknown action type'];
            }
        }

        return $results;
    }

    /**
     * Log API usage to database
     */
    private function logApiUsage($user, array $usage): void
    {
        // Claude Sonnet 4 pricing: $3/M input, $15/M output
        $inputCost = ($usage['input_tokens'] / 1_000_000) * 3;
        $outputCost = ($usage['output_tokens'] / 1_000_000) * 15;
        $totalCost = $inputCost + $outputCost;

        ApiUsage::create([
            'user_id' => $user->id,
            'timestamp' => now(),
            'model' => $usage['model'] ?? 'claude-sonnet-4',
            'endpoint' => 'chat',
            'input_tokens' => $usage['input_tokens'],
            'output_tokens' => $usage['output_tokens'],
            'cost_usd' => $totalCost,
        ]);
    }

    /**
     * Get recent sessions with previews for conversation context
     */
    private function getRecentSessionsForContext(int $userId, ?string $currentSessionId): array
    {
        $query = ChatMessage::where('user_id', $userId)
            ->selectRaw('session_id, MIN(created_at) as started_at, COUNT(*) as message_count')
            ->groupBy('session_id')
            ->orderBy('started_at', 'desc')
            ->limit(5);

        // Exclude current session if provided
        if ($currentSessionId) {
            $query->where('session_id', '!=', $currentSessionId);
        }

        $sessions = $query->get();

        $result = [];
        foreach ($sessions as $session) {
            $firstMessage = ChatMessage::where('user_id', $userId)
                ->where('session_id', $session->session_id)
                ->where('role', 'user')
                ->orderBy('created_at', 'asc')
                ->first();

            if ($firstMessage) {
                $result[] = [
                    'session_id' => $session->session_id,
                    'started_at' => $session->started_at,
                    'preview' => \Illuminate\Support\Str::limit($firstMessage->content, 100),
                    'message_count' => $session->message_count,
                ];
            }
        }

        return $result;
    }
}
