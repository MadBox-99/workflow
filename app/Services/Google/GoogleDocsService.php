<?php

namespace App\Services\Google;

use App\Models\Team;
use Google\Service\Docs;
use Google\Service\Docs\BatchUpdateDocumentRequest;
use Google\Service\Docs\Document;
use Google\Service\Docs\Request;
use Google\Service\Drive;
use Illuminate\Support\Facades\Log;

class GoogleDocsService
{
    public function __construct(
        protected GoogleAuthService $authService
    ) {}

    protected function getDocsService(Team $team): Docs
    {
        $client = $this->authService->getAuthenticatedClient($team);

        return new Docs($client);
    }

    protected function getDriveService(Team $team): Drive
    {
        $client = $this->authService->getAuthenticatedClient($team);

        return new Drive($client);
    }

    public function listDocuments(Team $team, array $options = []): array
    {
        $service = $this->getDriveService($team);
        $query = "mimeType='application/vnd.google-apps.document'";

        if (! empty($options['query'])) {
            $query .= " and name contains '{$options['query']}'";
        }

        $params = [
            'q' => $query,
            'pageSize' => $options['maxResults'] ?? 20,
            'fields' => 'files(id, name, createdTime, modifiedTime, webViewLink)',
            'orderBy' => 'modifiedTime desc',
        ];

        $results = $service->files->listFiles($params);

        $documents = [];
        foreach ($results->getFiles() as $file) {
            $documents[] = $this->formatDocumentFromDrive($file);
        }

        return $documents;
    }

    public function getDocument(Team $team, string $documentId): array
    {
        try {
            $service = $this->getDocsService($team);
            $document = $service->documents->get($documentId);

            return $this->formatDocument($document);
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 404) {
                Log::warning('Google Docs document not found', [
                    'document_id' => $documentId,
                ]);

                return [
                    'success' => false,
                    'error' => 'Document not found',
                    'errorCode' => 'DOCUMENT_NOT_FOUND',
                    'message' => "A dokumentum ({$documentId}) nem található.",
                ];
            }
            throw $e;
        }
    }

    public function createDocument(Team $team, string $title, ?string $content = null): array
    {
        $service = $this->getDocsService($team);

        $document = new Document(['title' => $title]);
        $createdDoc = $service->documents->create($document);

        Log::info('Google Docs document created', [
            'document_id' => $createdDoc->getDocumentId(),
            'title' => $title,
        ]);

        // If initial content is provided, append it
        if ($content) {
            $this->appendContent($team, $createdDoc->getDocumentId(), $content);

            // Re-fetch to get the updated content
            return $this->getDocument($team, $createdDoc->getDocumentId());
        }

        return $this->formatDocument($createdDoc);
    }

    public function updateDocument(Team $team, string $documentId, array $operations): array
    {
        try {
            $service = $this->getDocsService($team);

            // First get the document to find the end index for append
            $document = $service->documents->get($documentId);
            $endIndex = $this->getDocumentEndIndex($document);

            $requests = [];
            $operation = $operations['operation'] ?? 'append';
            $content = $operations['content'] ?? '';

            switch ($operation) {
                case 'append':
                    // Append to end of document
                    if (! empty($content)) {
                        $requests[] = new Request([
                            'insertText' => [
                                'location' => ['index' => $endIndex],
                                'text' => $content,
                            ],
                        ]);
                    }
                    break;

                case 'prepend':
                    // Insert at the beginning
                    if (! empty($content)) {
                        $requests[] = new Request([
                            'insertText' => [
                                'location' => ['index' => 1],
                                'text' => $content,
                            ],
                        ]);
                    }
                    break;

                case 'replace':
                    // Replace all text matching pattern
                    if (! empty($operations['searchText']) && $content !== null) {
                        $requests[] = new Request([
                            'replaceAllText' => [
                                'containsText' => [
                                    'text' => $operations['searchText'],
                                    'matchCase' => $operations['matchCase'] ?? true,
                                ],
                                'replaceText' => $content,
                            ],
                        ]);
                    }
                    break;

                case 'insertAt':
                    // Insert at specific index
                    $insertIndex = $operations['insertIndex'] ?? 1;
                    if (! empty($content)) {
                        $requests[] = new Request([
                            'insertText' => [
                                'location' => ['index' => max(1, $insertIndex)],
                                'text' => $content,
                            ],
                        ]);
                    }
                    break;
            }

            if (! empty($requests)) {
                $batchRequest = new BatchUpdateDocumentRequest(['requests' => $requests]);
                $service->documents->batchUpdate($documentId, $batchRequest);

                Log::info('Google Docs document updated', [
                    'document_id' => $documentId,
                    'operation' => $operation,
                ]);
            }

            // Return updated document
            return $this->getDocument($team, $documentId);

        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 404) {
                Log::warning('Google Docs document not found for update', [
                    'document_id' => $documentId,
                ]);

                return [
                    'success' => false,
                    'error' => 'Document not found',
                    'errorCode' => 'DOCUMENT_NOT_FOUND',
                    'message' => "A dokumentum ({$documentId}) nem található.",
                ];
            }
            throw $e;
        }
    }

    protected function appendContent(Team $team, string $documentId, string $content): void
    {
        $service = $this->getDocsService($team);

        // Get document to find end index
        $document = $service->documents->get($documentId);
        $endIndex = $this->getDocumentEndIndex($document);

        // Parse content for structured formatting (headings, lists, etc.)
        $structuredContent = $this->parseStructuredContent($content);

        if (empty($structuredContent['text'])) {
            return;
        }

        $requests = [];

        // First, insert all the text at once
        $requests[] = new Request([
            'insertText' => [
                'location' => ['index' => $endIndex],
                'text' => $structuredContent['text'],
            ],
        ]);

        // Apply formatting styles for headings
        // Note: Requests are processed in reverse order for styling to work correctly
        foreach (array_reverse($structuredContent['styles']) as $style) {
            $startIndex = $endIndex + $style['start'];
            $endStyleIndex = $endIndex + $style['end'];

            if ($style['type'] === 'heading') {
                $requests[] = new Request([
                    'updateParagraphStyle' => [
                        'range' => [
                            'startIndex' => $startIndex,
                            'endIndex' => $endStyleIndex,
                        ],
                        'paragraphStyle' => [
                            'namedStyleType' => $style['level'], // HEADING_1, HEADING_2, etc.
                        ],
                        'fields' => 'namedStyleType',
                    ],
                ]);
            } elseif ($style['type'] === 'bullet') {
                $requests[] = new Request([
                    'createParagraphBullets' => [
                        'range' => [
                            'startIndex' => $startIndex,
                            'endIndex' => $endStyleIndex,
                        ],
                        'bulletPreset' => 'BULLET_DISC_CIRCLE_SQUARE',
                    ],
                ]);
            }
        }

        $batchRequest = new BatchUpdateDocumentRequest(['requests' => $requests]);
        $service->documents->batchUpdate($documentId, $batchRequest);
    }

    /**
     * Parse content and extract structured formatting information.
     * Supports: headings (H1, H2, H3), bullet lists, paragraphs.
     */
    protected function parseStructuredContent(string $content): array
    {
        $text = '';
        $styles = [];

        // Check if content has HTML tags
        if (! preg_match('/<[^>]+>/', $content)) {
            // Plain text, no formatting needed
            return ['text' => $content, 'styles' => []];
        }

        // Track current position in output text
        $position = 0;

        // Process headings first - extract and mark positions
        // H1
        $content = preg_replace_callback('/<h1[^>]*>(.*?)<\/h1>/is', function ($matches) use (&$text, &$styles, &$position) {
            $heading = strip_tags($matches[1]);
            $start = $position;
            $text .= $heading."\n";
            $position = \strlen($text);
            $styles[] = ['type' => 'heading', 'level' => 'HEADING_1', 'start' => $start, 'end' => $position];

            return ''; // Remove from content
        }, $content);

        // H2
        $content = preg_replace_callback('/<h2[^>]*>(.*?)<\/h2>/is', function ($matches) use (&$text, &$styles, &$position) {
            $heading = strip_tags($matches[1]);
            $start = $position;
            $text .= $heading."\n";
            $position = \strlen($text);
            $styles[] = ['type' => 'heading', 'level' => 'HEADING_2', 'start' => $start, 'end' => $position];

            return '';
        }, $content);

        // H3
        $content = preg_replace_callback('/<h3[^>]*>(.*?)<\/h3>/is', function ($matches) use (&$text, &$styles, &$position) {
            $heading = strip_tags($matches[1]);
            $start = $position;
            $text .= $heading."\n";
            $position = \strlen($text);
            $styles[] = ['type' => 'heading', 'level' => 'HEADING_3', 'start' => $start, 'end' => $position];

            return '';
        }, $content);

        // Process unordered lists
        $content = preg_replace_callback('/<ul[^>]*>(.*?)<\/ul>/is', function ($matches) use (&$text, &$styles, &$position) {
            preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $matches[1], $items);
            foreach ($items[1] as $item) {
                $itemText = strip_tags($item);
                $start = $position;
                $text .= $itemText."\n";
                $position = \strlen($text);
                $styles[] = ['type' => 'bullet', 'start' => $start, 'end' => $position];
            }

            return '';
        }, $content);

        // Process paragraphs
        $content = preg_replace_callback('/<p[^>]*>(.*?)<\/p>/is', function ($matches) use (&$text, &$position) {
            $para = strip_tags($matches[1]);
            if (! empty(trim($para))) {
                $text .= $para."\n\n";
                $position = \strlen($text);
            }

            return '';
        }, $content);

        // Process remaining content (stripped of tags)
        $remaining = trim(strip_tags($content));
        if (! empty($remaining)) {
            $text .= $remaining."\n";
        }

        // Clean up excessive newlines
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        return ['text' => trim($text)."\n", 'styles' => $styles];
    }

    protected function getDocumentEndIndex(Document $document): int
    {
        $body = $document->getBody();
        if (! $body) {
            return 1;
        }

        $content = $body->getContent();
        if (empty($content)) {
            return 1;
        }

        // Get the end index of the last content element
        $lastElement = end($content);

        return $lastElement ? ($lastElement->getEndIndex() - 1) : 1;
    }

    protected function formatDocument(Document $document): array
    {
        $content = '';
        $body = $document->getBody();

        if ($body) {
            foreach ($body->getContent() as $element) {
                $paragraph = $element->getParagraph();
                if ($paragraph) {
                    foreach ($paragraph->getElements() as $elem) {
                        $textRun = $elem->getTextRun();
                        if ($textRun) {
                            $content .= $textRun->getContent();
                        }
                    }
                }
            }
        }

        return [
            'id' => $document->getDocumentId(),
            'title' => $document->getTitle(),
            'content' => $content,
            'revisionId' => $document->getRevisionId(),
        ];
    }

    protected function formatDocumentFromDrive($file): array
    {
        return [
            'id' => $file->getId(),
            'name' => $file->getName(),
            'createdTime' => $file->getCreatedTime(),
            'modifiedTime' => $file->getModifiedTime(),
            'webViewLink' => $file->getWebViewLink(),
        ];
    }
}
