<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Services\Google\GoogleDocsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleDocsController extends Controller
{
    public function __construct(
        protected GoogleDocsService $docsService
    ) {}

    public function documents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
            'max_results' => 'nullable|integer|min:1|max:100',
            'query' => 'nullable|string',
        ]);

        $team = Team::findOrFail($validated['team_id']);

        if (! $team->googleCredential) {
            return response()->json([
                'error' => 'Google is not connected',
            ], 400);
        }

        try {
            $documents = $this->docsService->listDocuments($team, [
                'maxResults' => $validated['max_results'] ?? 20,
                'query' => $validated['query'] ?? null,
            ]);

            return response()->json($documents);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch documents: '.$e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, string $documentId): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $team = Team::findOrFail($validated['team_id']);

        if (! $team->googleCredential) {
            return response()->json([
                'error' => 'Google is not connected',
            ], 400);
        }

        try {
            $document = $this->docsService->getDocument($team, $documentId);

            // Check if it's an error response
            if (isset($document['success']) && $document['success'] === false) {
                return response()->json($document, 404);
            }

            return response()->json($document);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch document: '.$e->getMessage(),
            ], 500);
        }
    }
}
