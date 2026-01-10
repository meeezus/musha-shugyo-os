<?php

namespace App\Services;

use App\Models\ContentDraft;
use Illuminate\Support\Facades\File;

class ContentRalphImporter
{
    protected string $outputPath;

    public function __construct()
    {
        // Default path to ralph-content output
        $this->outputPath = env('RALPH_CONTENT_PATH', '/Users/michaelenriquez/scripts/ralph-content/output/tweets');
    }

    /**
     * Import new drafts from the ralph-content output folder
     *
     * @param int $userId The user to associate drafts with
     * @return array Stats about the import
     */
    public function import(int $userId): array
    {
        $stats = [
            'scanned' => 0,
            'imported' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        if (!File::isDirectory($this->outputPath)) {
            $stats['errors'][] = "Directory not found: {$this->outputPath}";
            return $stats;
        }

        $files = File::glob($this->outputPath . '/*.md');
        $stats['scanned'] = count($files);

        foreach ($files as $file) {
            try {
                $result = $this->importFile($file, $userId);
                if ($result === 'imported') {
                    $stats['imported']++;
                } elseif ($result === 'skipped') {
                    $stats['skipped']++;
                }
            } catch (\Exception $e) {
                $stats['errors'][] = basename($file) . ': ' . $e->getMessage();
            }
        }

        return $stats;
    }

    /**
     * Import a single markdown file
     */
    protected function importFile(string $filePath, int $userId): string
    {
        $content = File::get($filePath);
        $parsed = $this->parseMarkdown($content);

        // Skip if queue_id already exists
        if (ContentDraft::where('queue_id', $parsed['queue_id'])->exists()) {
            return 'skipped';
        }

        ContentDraft::create([
            'user_id' => $userId,
            'queue_id' => $parsed['queue_id'],
            'type' => $parsed['type'],
            'pillar' => $parsed['pillar'],
            'archetype' => $parsed['archetype'],
            'topic' => $parsed['topic'],
            'content' => $parsed['content'],
            'status' => 'draft',
            'effortless_score' => $parsed['effortless_score'],
            'source_path' => $filePath,
        ]);

        return 'imported';
    }

    /**
     * Parse a markdown draft file
     */
    protected function parseMarkdown(string $markdown): array
    {
        $result = [
            'queue_id' => null,
            'type' => 'tweet',
            'pillar' => 'automation',
            'archetype' => null,
            'topic' => null,
            'content' => '',
            'effortless_score' => null,
        ];

        $lines = explode("\n", $markdown);

        // Parse header (# TW-006 - Topic)
        foreach ($lines as $line) {
            if (preg_match('/^#\s+(TW|TH|NL)-(\d+)\s*-?\s*(.*)$/i', $line, $matches)) {
                $typeMap = ['TW' => 'tweet', 'TH' => 'thread', 'NL' => 'newsletter'];
                $result['type'] = $typeMap[strtoupper($matches[1])] ?? 'tweet';
                $result['queue_id'] = strtoupper($matches[1]) . '-' . $matches[2];
                $result['topic'] = trim($matches[3]) ?: null;
                break;
            }
        }

        // Parse metadata (Pillar:, Archetype:)
        foreach ($lines as $line) {
            if (preg_match('/^Pillar:\s*(.+)$/i', $line, $matches)) {
                $result['pillar'] = trim(strtolower($matches[1]));
            }
            if (preg_match('/^Archetype:\s*(.+)$/i', $line, $matches)) {
                $result['archetype'] = trim($matches[1]);
            }
            if (preg_match('/^Effortless score:\s*(\d+)/i', $line, $matches)) {
                $result['effortless_score'] = (int) $matches[1];
            }
        }

        // Extract content between --- markers
        $inContent = false;
        $contentLines = [];
        $dashCount = 0;

        foreach ($lines as $line) {
            if (trim($line) === '---') {
                $dashCount++;
                if ($dashCount === 1) {
                    $inContent = true;
                    continue;
                } elseif ($dashCount === 2) {
                    break;
                }
            }
            if ($inContent) {
                $contentLines[] = $line;
            }
        }

        $result['content'] = trim(implode("\n", $contentLines));

        return $result;
    }

    /**
     * Get all available draft files
     */
    public function getAvailableFiles(): array
    {
        if (!File::isDirectory($this->outputPath)) {
            return [];
        }

        return File::glob($this->outputPath . '/*.md');
    }
}
