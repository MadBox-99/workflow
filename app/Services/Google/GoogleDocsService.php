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

        $requests = [
            new Request([
                'insertText' => [
                    'location' => ['index' => $endIndex],
                    'text' => $content,
                ],
            ]),
        ];

        $batchRequest = new BatchUpdateDocumentRequest(['requests' => $requests]);
        $service->documents->batchUpdate($documentId, $batchRequest);
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
