<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Models\WorkflowConnection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class WorkflowController extends Controller
{
    public function index(): JsonResponse
    {
        $workflows = Workflow::with(['nodes', 'connections'])->get();
        return response()->json($workflows);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
            'nodes' => 'nullable|array',
            'connections' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $workflow = Workflow::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'metadata' => $validated['metadata'] ?? null,
            ]);

            if (isset($validated['nodes'])) {
                foreach ($validated['nodes'] as $node) {
                    WorkflowNode::create([
                        'workflow_id' => $workflow->id,
                        'node_id' => $node['id'],
                        'type' => $node['type'],
                        'label' => $node['data']['label'] ?? null,
                        'data' => $node['data'] ?? null,
                        'position' => $node['position'] ?? null,
                    ]);
                }
            }

            if (isset($validated['connections'])) {
                foreach ($validated['connections'] as $connection) {
                    WorkflowConnection::create([
                        'workflow_id' => $workflow->id,
                        'connection_id' => $connection['id'],
                        'source_node_id' => $connection['source'],
                        'target_node_id' => $connection['target'],
                        'source_handle' => $connection['sourceHandle'] ?? null,
                        'target_handle' => $connection['targetHandle'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return response()->json($workflow->load(['nodes', 'connections']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        $workflow = Workflow::with(['nodes', 'connections'])->findOrFail($id);
        return response()->json($workflow);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
            'nodes' => 'nullable|array',
            'connections' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $workflow = Workflow::findOrFail($id);

            $workflow->update([
                'name' => $validated['name'] ?? $workflow->name,
                'description' => $validated['description'] ?? $workflow->description,
                'is_active' => $validated['is_active'] ?? $workflow->is_active,
                'metadata' => $validated['metadata'] ?? $workflow->metadata,
            ]);

            if (isset($validated['nodes'])) {
                $workflow->nodes()->delete();
                foreach ($validated['nodes'] as $node) {
                    WorkflowNode::create([
                        'workflow_id' => $workflow->id,
                        'node_id' => $node['id'],
                        'type' => $node['type'],
                        'label' => $node['data']['label'] ?? null,
                        'data' => $node['data'] ?? null,
                        'position' => $node['position'] ?? null,
                    ]);
                }
            }

            if (isset($validated['connections'])) {
                $workflow->connections()->delete();
                foreach ($validated['connections'] as $connection) {
                    WorkflowConnection::create([
                        'workflow_id' => $workflow->id,
                        'connection_id' => $connection['id'],
                        'source_node_id' => $connection['source'],
                        'target_node_id' => $connection['target'],
                        'source_handle' => $connection['sourceHandle'] ?? null,
                        'target_handle' => $connection['targetHandle'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return response()->json($workflow->load(['nodes', 'connections']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        $workflow = Workflow::findOrFail($id);
        $workflow->delete();
        return response()->json(['message' => 'Workflow deleted successfully']);
    }
}
