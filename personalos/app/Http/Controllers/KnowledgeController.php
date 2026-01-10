<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\YamlFrontMatter\YamlFrontMatter;
use League\CommonMark\CommonMarkConverter;

class KnowledgeController extends Controller
{
    private string $knowledgePath;
    private CommonMarkConverter $markdownConverter;

    public function __construct()
    {
        // Path to ~/Knowledge directory
        $this->knowledgePath = getenv('HOME') . '/Knowledge';
        $this->markdownConverter = new CommonMarkConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);
    }

    public function index(Request $request): Response
    {
        $tree = $this->buildTree($this->knowledgePath);
        $stats = $this->getKnowledgeStats();

        return Inertia::render('Knowledge', [
            'tree' => $tree,
            'stats' => $stats,
        ]);
    }

    public function browse(Request $request, string $path = ''): Response
    {
        $fullPath = $this->knowledgePath . '/' . $path;

        if (!File::isDirectory($fullPath)) {
            abort(404, 'Folder not found');
        }

        $folders = $this->getFolders($fullPath);
        $files = $this->getFiles($fullPath);
        $breadcrumbs = $this->getBreadcrumbs($path);

        return Inertia::render('KnowledgeBrowser', [
            'folders' => $folders,
            'files' => $files,
            'currentPath' => $path,
            'breadcrumbs' => $breadcrumbs,
        ]);
    }

    public function show(Request $request, string $path): Response
    {
        $filePath = $this->knowledgePath . '/' . $path;

        if (!File::exists($filePath)) {
            abort(404, 'File not found');
        }

        $pathInfo = pathinfo($path);
        $folder = $pathInfo['dirname'];
        $slug = $pathInfo['filename'];
        $ext = $pathInfo['extension'];

        // Handle PDFs differently
        if ($ext === 'pdf') {
            $item = [
                'title' => $slug,
                'type' => 'pdf',
                'date_added' => null,
                'source' => null,
                'author' => null,
                'tags' => [],
                'via' => null,
                'content' => '',
                'contentHtml' => '',
                'path' => $path,
                'folder' => $folder !== '.' ? $folder : '',
                'slug' => $slug,
                'isPdf' => true,
                'pdfPath' => $filePath,
                'fileSize' => File::size($filePath),
            ];

            return Inertia::render('KnowledgeItem', [
                'item' => $item,
                'relatedItems' => [],
            ]);
        }

        // Handle markdown/text files
        $fileContent = File::get($filePath);

        // Validate UTF-8 encoding
        if (!mb_check_encoding($fileContent, 'UTF-8')) {
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', 'auto');
        }

        try {
            $parsed = YamlFrontMatter::parse($fileContent);
            $hasFrontmatter = true;
        } catch (\Exception $e) {
            // File doesn't have frontmatter, treat as plain markdown
            $hasFrontmatter = false;
            $parsed = null;
        }

        $item = [
            'title' => $hasFrontmatter && $parsed->matter('title')
                ? $this->cleanUtf8($parsed->matter('title'))
                : $slug,
            'type' => $hasFrontmatter && $parsed->matter('type')
                ? $this->cleanUtf8($parsed->matter('type'))
                : 'document',
            'date_added' => $hasFrontmatter ? $parsed->matter('date_added') : null,
            'source' => $hasFrontmatter && $parsed->matter('source')
                ? $this->cleanUtf8($parsed->matter('source'))
                : null,
            'author' => $hasFrontmatter && $parsed->matter('author')
                ? $this->cleanUtf8($parsed->matter('author'))
                : null,
            'tags' => $hasFrontmatter && $parsed->matter('tags')
                ? array_map([$this, 'cleanUtf8'], $parsed->matter('tags'))
                : [],
            'via' => $hasFrontmatter && $parsed->matter('via')
                ? $this->cleanUtf8($parsed->matter('via'))
                : null,
            'content' => $hasFrontmatter
                ? $this->cleanUtf8($parsed->body())
                : $this->cleanUtf8($fileContent),
            'contentHtml' => $hasFrontmatter
                ? $this->cleanUtf8($this->markdownConverter->convert($parsed->body())->getContent())
                : $this->cleanUtf8($this->markdownConverter->convert($fileContent)->getContent()),
            'path' => $path,
            'folder' => $folder !== '.' ? $folder : '',
            'slug' => $slug,
            'isPdf' => false,
        ];

        // Get related files from same folder
        $relatedFiles = $this->getRelatedFiles($folder, basename($path));

        return Inertia::render('KnowledgeItem', [
            'item' => $item,
            'relatedItems' => $relatedFiles,
        ]);
    }

    public function download(Request $request, string $path)
    {
        $filePath = $this->knowledgePath . '/' . $path;

        if (!File::exists($filePath)) {
            abort(404, 'File not found');
        }

        $filename = basename($filePath);

        // Return file for download or inline viewing
        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"'
        ]);
    }

    public function destroy(Request $request, string $path)
    {
        $filePath = $this->knowledgePath . '/' . $path;

        if (!File::exists($filePath)) {
            return redirect()->route('knowledge')
                ->with('error', 'File not found');
        }

        // Delete the file
        File::delete($filePath);

        // Redirect to folder or home
        $pathInfo = pathinfo($path);
        $folder = $pathInfo['dirname'];

        if ($folder && $folder !== '.') {
            return redirect()->route('knowledge.browse', ['path' => $folder])
                ->with('success', 'File deleted successfully');
        }

        return redirect()->route('knowledge')
            ->with('success', 'File deleted successfully');
    }

    private function getFolders(string $path): array
    {
        if (!File::isDirectory($path)) {
            return [];
        }

        $folders = [];
        $items = File::directories($path);

        foreach ($items as $dir) {
            $name = basename($dir);

            // Skip hidden folders
            if (str_starts_with($name, '.')) {
                continue;
            }

            $fileCount = $this->countFilesRecursive($dir);

            $folders[] = [
                'name' => $name,
                'path' => str_replace($this->knowledgePath . '/', '', $dir),
                'fileCount' => $fileCount,
            ];
        }

        // Sort by name
        usort($folders, fn($a, $b) => $a['name'] <=> $b['name']);

        return $folders;
    }

    private function getFiles(string $path): array
    {
        if (!File::isDirectory($path)) {
            return [];
        }

        $files = [];
        $items = File::glob($path . '/*');

        foreach ($items as $item) {
            if (File::isFile($item)) {
                $name = basename($item);
                $ext = pathinfo($name, PATHINFO_EXTENSION);

                // Only show markdown and text files
                if (!in_array($ext, ['md', 'txt'])) {
                    continue;
                }

                $slug = pathinfo($name, PATHINFO_FILENAME);
                $relativePath = str_replace($this->knowledgePath . '/', '', $item);

                try {
                    $fileContent = File::get($item);

                    if (!mb_check_encoding($fileContent, 'UTF-8')) {
                        $fileContent = mb_convert_encoding($fileContent, 'UTF-8', 'auto');
                    }

                    $parsed = YamlFrontMatter::parse($fileContent);
                    $title = $parsed->matter('title') ?? $slug;
                    $type = $parsed->matter('type') ?? 'document';
                    $dateAdded = $parsed->matter('date_added');
                    $excerpt = $this->getExcerpt($parsed->body());
                } catch (\Exception $e) {
                    // No frontmatter, use filename
                    $title = $slug;
                    $type = 'document';
                    $dateAdded = null;
                    $excerpt = '';
                }

                $files[] = [
                    'name' => $name,
                    'slug' => $slug,
                    'path' => $relativePath,
                    'title' => $this->cleanUtf8($title),
                    'type' => $this->cleanUtf8($type),
                    'dateAdded' => $dateAdded,
                    'excerpt' => $this->cleanUtf8($excerpt),
                    'size' => File::size($item),
                ];
            }
        }

        // Sort by date added (newest first), then by name
        usort($files, function($a, $b) {
            if ($a['dateAdded'] && $b['dateAdded']) {
                return $b['dateAdded'] <=> $a['dateAdded'];
            }
            if ($a['dateAdded']) return -1;
            if ($b['dateAdded']) return 1;
            return $a['name'] <=> $b['name'];
        });

        return $files;
    }

    private function getRelatedFiles(string $folder, string $currentFile): array
    {
        $folderPath = $folder && $folder !== '.'
            ? $this->knowledgePath . '/' . $folder
            : $this->knowledgePath;

        $files = $this->getFiles($folderPath);

        // Remove current file and limit to 5
        $related = array_filter($files, fn($f) => $f['name'] !== $currentFile);
        return array_slice($related, 0, 5);
    }

    private function getBreadcrumbs(string $path): array
    {
        if (empty($path)) {
            return [];
        }

        $parts = explode('/', $path);
        $breadcrumbs = [];
        $currentPath = '';

        foreach ($parts as $part) {
            $currentPath .= ($currentPath ? '/' : '') . $part;
            $breadcrumbs[] = [
                'name' => $part,
                'path' => $currentPath,
            ];
        }

        return $breadcrumbs;
    }

    private function countFilesRecursive(string $path): int
    {
        $count = 0;
        $items = File::glob($path . '/*');

        foreach ($items as $item) {
            if (File::isFile($item)) {
                $ext = pathinfo($item, PATHINFO_EXTENSION);
                if (in_array($ext, ['md', 'txt'])) {
                    $count++;
                }
            } elseif (File::isDirectory($item)) {
                $count += $this->countFilesRecursive($item);
            }
        }

        return $count;
    }

    private function getKnowledgeStats(): array
    {
        $totalFiles = $this->countFilesRecursive($this->knowledgePath);
        $folders = $this->getFolders($this->knowledgePath);

        return [
            'totalFiles' => $totalFiles,
            'totalFolders' => count($folders),
        ];
    }

    private function getExcerpt(string $content, int $length = 150): string
    {
        $text = strip_tags($this->markdownConverter->convert($content)->getContent());
        $text = preg_replace('/\s+/', ' ', $text);
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');

        if (strlen($text) <= $length) {
            return $text;
        }

        return substr($text, 0, $length) . '...';
    }

    private function cleanUtf8(string $text): string
    {
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        $text = iconv('UTF-8', 'UTF-8//IGNORE', $text);
        return $text;
    }

    private function buildTree(string $path, string $relativePath = ''): array
    {
        if (!File::isDirectory($path)) {
            return [];
        }

        $items = [];
        $entries = File::glob($path . '/*');

        // Sort: directories first, then files
        usort($entries, function($a, $b) {
            $aIsDir = File::isDirectory($a);
            $bIsDir = File::isDirectory($b);

            if ($aIsDir && !$bIsDir) return -1;
            if (!$aIsDir && $bIsDir) return 1;

            return basename($a) <=> basename($b);
        });

        foreach ($entries as $entry) {
            $name = basename($entry);

            // Skip hidden files/folders
            if (str_starts_with($name, '.')) {
                continue;
            }

            $entryRelativePath = $relativePath ? $relativePath . '/' . $name : $name;

            if (File::isDirectory($entry)) {
                // Recursively build tree for subdirectories
                $children = $this->buildTree($entry, $entryRelativePath);

                $items[] = [
                    'type' => 'folder',
                    'name' => $name,
                    'path' => $entryRelativePath,
                    'children' => $children,
                    'fileCount' => $this->countFilesRecursive($entry),
                ];
            } else {
                $ext = pathinfo($name, PATHINFO_EXTENSION);

                // Include md, txt, and pdf files
                if (in_array($ext, ['md', 'txt', 'pdf'])) {
                    $items[] = [
                        'type' => 'file',
                        'name' => $name,
                        'path' => $entryRelativePath,
                        'extension' => $ext,
                        'size' => File::size($entry),
                    ];
                }
            }
        }

        return $items;
    }
}
