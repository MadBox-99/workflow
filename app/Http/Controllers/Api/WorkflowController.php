<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Models\Team;
use App\Models\Workflow;
use App\Models\WorkflowConnection;
use App\Models\WorkflowNode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

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
            'team_id' => 'required|exists:teams,id',
            'is_active' => 'boolean',
            'is_scheduled' => 'boolean',
            'schedule_cron' => 'nullable|string|max:100',
            'metadata' => 'nullable|array',
            'nodes' => 'nullable|array',
            'connections' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $workflow = Workflow::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'team_id' => $validated['team_id'],
                'is_active' => $validated['is_active'] ?? true,
                'is_scheduled' => $validated['is_scheduled'] ?? false,
                'schedule_cron' => $validated['schedule_cron'] ?? null,
                'metadata' => $validated['metadata'] ?? null,
            ]);

            // Calculate next run time if scheduled
            if ($workflow->is_scheduled && $workflow->schedule_cron) {
                $workflow->update(['next_run_at' => $workflow->calculateNextRunAt()]);
            }

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
            'team_id' => 'sometimes|required|exists:teams,id',
            'is_active' => 'boolean',
            'is_scheduled' => 'boolean',
            'schedule_cron' => 'nullable|string|max:100',
            'metadata' => 'nullable|array',
            'nodes' => 'nullable|array',
            'connections' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $workflow = Workflow::findOrFail($id);

            $updateData = [
                'name' => $validated['name'] ?? $workflow->name,
                'description' => $validated['description'] ?? $workflow->description,
                'team_id' => $validated['team_id'] ?? $workflow->team_id,
                'is_active' => $validated['is_active'] ?? $workflow->is_active,
                'is_scheduled' => $validated['is_scheduled'] ?? $workflow->is_scheduled,
                'schedule_cron' => $validated['schedule_cron'] ?? $workflow->schedule_cron,
                'metadata' => $validated['metadata'] ?? $workflow->metadata,
            ];

            $workflow->update($updateData);

            // Recalculate next_run_at if scheduling changed
            if (isset($validated['is_scheduled']) || isset($validated['schedule_cron'])) {
                if ($workflow->is_scheduled && $workflow->schedule_cron) {
                    $workflow->update(['next_run_at' => $workflow->calculateNextRunAt()]);
                } elseif (! $workflow->is_scheduled) {
                    $workflow->update(['next_run_at' => null]);
                }
            }

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

    public function emailTemplates(Request $request): JsonResponse
    {
        $teamId = $request->query('team_id');

        $query = EmailTemplate::where('is_active', true);

        if ($teamId) {
            $query->where('team_id', $teamId);
        }

        $templates = $query->get(['id', 'name', 'slug', 'subject', 'variables']);

        return response()->json($templates);
    }

    public function sendEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template' => 'required|string',
            'recipients' => 'required|array',
            'recipients.*' => 'email',
            'subject' => 'nullable|string',
            'customData' => 'nullable|array',
            'team_id' => 'nullable|integer',
        ]);

        try {
            $query = EmailTemplate::where('slug', $validated['template'])
                ->where('is_active', true);

            if (isset($validated['team_id'])) {
                $query->where('team_id', $validated['team_id']);
            }

            $template = $query->first();

            if (! $template) {
                return response()->json([
                    'success' => false,
                    'error' => 'Email template not found: '.$validated['template'],
                ], 404);
            }

            $customData = $validated['customData'] ?? [];
            $rendered = $template->render($customData);

            $subject = $validated['subject'] ?? $rendered['subject'];

            foreach ($validated['recipients'] as $recipient) {
                Mail::html($rendered['body_html'], function ($message) use ($recipient, $subject) {
                    $message->to($recipient)
                        ->subject($subject);
                });
            }

            return response()->json([
                'success' => true,
                'message' => 'Email sent successfully',
                'recipients' => $validated['recipients'],
                'template' => $template->slug,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function scheduleOptions(Request $request): JsonResponse
    {
        $teamId = $request->query('team_id');

        if (! $teamId) {
            return response()->json([]);
        }

        $team = Team::find($teamId);

        if (! $team) {
            return response()->json([]);
        }

        $options = $team->availableScheduleOptions()
            ->get()
            ->map(fn ($option) => [
                'value' => $option->cron_expression,
                'label' => $option->name,
                'description' => $option->description,
            ]);

        return response()->json($options);
    }
}
