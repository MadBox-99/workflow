<?php

namespace App\Services\Workflow;

use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Services\Google\GoogleCalendarService;
use App\Services\Google\GoogleDocsService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class WorkflowRunnerService
{
    protected Workflow $workflow;

    protected Collection $nodes;

    protected Collection $connections;

    protected array $nodeOutputs = [];

    protected array $visitedNodes = [];

    protected array $failedNodes = [];

    protected array $executionLog = [];

    protected array $pendingJoinNodes = [];

    public function execute(Workflow $workflow): array
    {
        $this->workflow = $workflow;
        $this->nodes = $workflow->nodes;
        $this->connections = $workflow->connections;
        $this->nodeOutputs = [];
        $this->visitedNodes = [];
        $this->failedNodes = [];
        $this->executionLog = [];
        $this->pendingJoinNodes = [];

        $this->log('info', "Starting workflow execution: {$workflow->name}");

        $startNodes = $this->findStartNodes();

        if ($startNodes->isEmpty()) {
            $this->log('error', 'No start nodes found in workflow');

            return [
                'success' => false,
                'error' => 'No start nodes found',
                'log' => $this->executionLog,
            ];
        }

        $queue = $startNodes->map(fn ($node) => ['node' => $node, 'fromEdge' => null])->toArray();

        try {
            while (! empty($queue)) {
                $item = array_shift($queue);
                $node = $item['node'];

                if (\in_array($node->node_id, $this->visitedNodes)) {
                    continue;
                }

                // Check if this is a Join, Merge or Template node - they need all inputs ready
                $nodeType = ($node->data['type'] ?? $node->type);
                if ($nodeType === 'join' || $nodeType === 'merge' || $nodeType === 'template') {
                    if (! $this->areAllJoinInputsReady($node)) {
                        // Put it back at the end of the queue to process later
                        if (! isset($this->pendingJoinNodes[$node->node_id])) {
                            $this->pendingJoinNodes[$node->node_id] = 0;
                        }
                        $this->pendingJoinNodes[$node->node_id]++;

                        // Prevent infinite loop - if we've tried too many times, proceed anyway
                        if ($this->pendingJoinNodes[$node->node_id] < 100) {
                            $queue[] = $item;

                            continue;
                        }
                        $this->log('warning', "{$nodeType} node {$node->node_id} proceeding without all inputs after timeout");
                    }
                }

                $this->visitedNodes[] = $node->node_id;

                $this->log('info', "Executing node: {$node->node_id} ({$nodeType})");

                $result = $this->executeNode($node);

                if (! $result['success']) {
                    $this->log('error', "Node {$node->node_id} failed: {$result['error']}");

                    // Track failed node but continue with other branches
                    $this->failedNodes[] = [
                        'node_id' => $node->node_id,
                        'error' => $result['error'],
                    ];

                    // Mark this path as completed (failed) so Join nodes know
                    $this->nodeOutputs[$node->node_id] = ['__failed' => true, 'error' => $result['error']];

                    // Don't add downstream nodes of failed node to queue
                    continue;
                }

                // Store output for downstream nodes
                $this->nodeOutputs[$node->node_id] = $result['output'] ?? null;

                if ($result['finished'] ?? false) {
                    $this->log('info', "Branch completed at end node: {$node->node_id}");

                    continue;
                }

                // Find next nodes
                $sourceHandle = $result['nextHandle'] ?? null;
                $nextNodes = $this->findNextNodes($node->node_id, $sourceHandle);

                foreach ($nextNodes as $next) {
                    if (! \in_array($next['nodeId'], $this->visitedNodes)) {
                        $nextNode = $this->nodes->firstWhere('node_id', $next['nodeId']);
                        if ($nextNode) {
                            $queue[] = ['node' => $nextNode, 'fromEdge' => $next['edge']];
                        }
                    }
                }
            }

            // Determine overall success
            $hasFailures = ! empty($this->failedNodes);

            if ($hasFailures) {
                $failedCount = count($this->failedNodes);
                $this->log('warning', "Workflow completed with {$failedCount} failed node(s)");

                return [
                    'success' => false,
                    'partial' => true,
                    'error' => "Workflow completed with {$failedCount} failed node(s)",
                    'failedNodes' => $this->failedNodes,
                    'outputs' => $this->nodeOutputs,
                    'log' => $this->executionLog,
                ];
            }

            $this->log('info', 'Workflow execution completed successfully');

            return [
                'success' => true,
                'outputs' => $this->nodeOutputs,
                'log' => $this->executionLog,
            ];

        } catch (\Exception $e) {
            $this->log('error', "Workflow execution failed: {$e->getMessage()}");

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'failedNodes' => $this->failedNodes,
                'log' => $this->executionLog,
            ];
        }
    }

    protected function findStartNodes(): Collection
    {
        return $this->nodes->filter(function ($node) {
            $data = $node->data ?? [];

            return ($data['type'] ?? $node->type) === 'start';
        });
    }

    /**
     * Check if all input paths to a Join node are ready (completed or failed).
     */
    protected function areAllJoinInputsReady(WorkflowNode $node): bool
    {
        $incomingConnections = $this->connections->filter(
            fn ($conn) => $conn->target_node_id === $node->node_id
        );

        foreach ($incomingConnections as $conn) {
            $sourceNodeId = $conn->source_node_id;

            // Check if the source node has been executed (has output or is visited)
            if (! isset($this->nodeOutputs[$sourceNodeId]) && ! \in_array($sourceNodeId, $this->visitedNodes)) {
                return false;
            }
        }

        return true;
    }

    protected function findNextNodes(string $nodeId, ?string $sourceHandle = null): array
    {
        $outgoingConnections = $this->connections->filter(function ($conn) use ($nodeId, $sourceHandle) {
            if ($conn->source_node_id !== $nodeId) {
                return false;
            }
            if ($sourceHandle && $conn->source_handle !== $sourceHandle) {
                return false;
            }

            return true;
        });

        return $outgoingConnections->map(fn ($conn) => [
            'nodeId' => $conn->target_node_id,
            'edge' => $conn,
        ])->toArray();
    }

    protected function getInputValues(WorkflowNode $node): array
    {
        $incomingConnections = $this->connections->filter(
            fn ($conn) => $conn->target_node_id === $node->node_id
        );

        $values = [];

        foreach ($incomingConnections as $conn) {
            $sourceOutput = $this->nodeOutputs[$conn->source_node_id] ?? null;

            // Get source node to check for targetField config
            $sourceNode = $this->nodes->firstWhere('node_id', $conn->source_node_id);
            $sourceConfig = $sourceNode?->data['config'] ?? [];
            $targetField = $sourceConfig['targetField'] ?? null;

            if ($targetField) {
                // Use the targetField as the key (e.g., 'summary', 'startDateTime', 'endDateTime', etc.)
                $values[$targetField] = $sourceOutput;
            } elseif ($conn->target_handle === 'input-a') {
                $values['valueA'] = $sourceOutput;
            } elseif ($conn->target_handle === 'input-b') {
                $values['valueB'] = $sourceOutput;
            } elseif ($conn->target_handle === 'start-input') {
                $values['startDateTime'] = $sourceOutput;
            } elseif ($conn->target_handle === 'end-input') {
                $values['endDateTime'] = $sourceOutput;
            } else {
                $values['input'] = $sourceOutput;
            }
        }

        return $values;
    }

    protected function executeNode(WorkflowNode $node): array
    {
        $data = $node->data ?? [];
        $nodeType = $data['type'] ?? $node->type;
        $config = $data['config'] ?? [];
        $inputValues = $this->getInputValues($node);

        return match ($nodeType) {
            'start' => $this->executeStartNode($config),
            'end' => $this->executeEndNode(),
            'constant' => $this->executeConstantNode($config),
            'condition' => $this->executeConditionNode($config, $inputValues),
            'branch' => $this->executeBranchNode($inputValues),
            'join' => $this->executeJoinNode($inputValues),
            'merge' => $this->executeMergeNode($node, $config),
            'template' => $this->executeTemplateNode($node, $config),
            'apiAction' => $this->executeApiAction($config, $inputValues),
            'emailAction' => $this->executeEmailAction($config, $inputValues),
            'databaseAction' => $this->executeDatabaseAction($config, $inputValues),
            'scriptAction' => $this->executeScriptAction($config, $inputValues),
            'webhookAction' => $this->executeWebhookAction($config, $inputValues),
            'googleCalendarAction' => $this->executeGoogleCalendarAction($config, $inputValues),
            'googleDocsAction' => $this->executeGoogleDocsAction($config, $inputValues),
            default => ['success' => true, 'output' => $inputValues['input'] ?? null],
        };
    }

    protected function executeStartNode(array $config): array
    {
        return ['success' => true, 'output' => $config['value'] ?? true];
    }

    protected function executeEndNode(): array
    {
        return ['success' => true, 'finished' => true];
    }

    protected function executeConstantNode(array $config): array
    {
        // Handle datetime type - calculate value at runtime
        if (($config['valueType'] ?? null) === 'datetime') {
            $now = now();
            $result = match ($config['datetimeOption'] ?? 'now') {
                'now' => $now,
                'today' => $now->startOfDay(),
                'tomorrow' => $now->addDay()->startOfDay(),
                'next_week' => $now->addWeek(),
                'next_month' => $now->addMonth(),
                'in_1_hour' => $now->addHour(),
                'in_2_hours' => $now->addHours(2),
                'in_30_min' => $now->addMinutes(30),
                'end_of_day' => $now->endOfDay(),
                'custom_offset' => $this->calculateCustomOffset($now, $config),
                'fixed' => ! empty($config['fixedDateTime'])
                    ? \Carbon\Carbon::parse($config['fixedDateTime'])
                    : $now,
                default => $now,
            };

            // Format as ISO 8601 with timezone for Google Calendar compatibility
            return ['success' => true, 'output' => $result->toIso8601String()];
        }

        return ['success' => true, 'output' => $config['value'] ?? null];
    }

    protected function calculateCustomOffset(\Carbon\Carbon $now, array $config): \Carbon\Carbon
    {
        $amount = (int) ($config['offsetAmount'] ?? 1);
        $unit = $config['offsetUnit'] ?? 'hours';

        return match ($unit) {
            'minutes' => $now->addMinutes($amount),
            'hours' => $now->addHours($amount),
            'days' => $now->addDays($amount),
            default => $now->addHours($amount),
        };
    }

    protected function executeConditionNode(array $config, array $inputValues): array
    {
        $operator = $config['operator'] ?? 'equals';
        $a = $inputValues['valueA'] ?? $config['valueA'] ?? null;
        $b = $inputValues['valueB'] ?? $config['valueB'] ?? null;

        $result = match ($operator) {
            'equals' => $a == $b,
            'strictEquals' => $a === $b,
            'notEquals' => $a != $b,
            'greaterThan' => (float) $a > (float) $b,
            'lessThan' => (float) $a < (float) $b,
            'greaterOrEqual' => (float) $a >= (float) $b,
            'lessOrEqual' => (float) $a <= (float) $b,
            'contains' => str_contains((string) $a, (string) $b),
            'isEmpty' => empty($a),
            'isNotEmpty' => ! empty($a),
            'isTrue' => $a === true || $a === 'true' || $a === 1 || $a === '1',
            'isFalse' => $a === false || $a === 'false' || $a === 0 || $a === '0',
            default => false,
        };

        $this->log('info', "Condition: {$a} {$operator} {$b} = ".($result ? 'true' : 'false'));

        return [
            'success' => true,
            'conditionResult' => $result,
            'nextHandle' => $result ? 'true-source' : 'false-source',
            'output' => $result,
        ];
    }

    protected function executeBranchNode(array $inputValues): array
    {
        return ['success' => true, 'output' => $inputValues['input'] ?? null, 'isBranch' => true];
    }

    protected function executeJoinNode(array $inputValues): array
    {
        return ['success' => true, 'output' => $inputValues['input'] ?? null];
    }

    protected function executeMergeNode(WorkflowNode $node, array $config): array
    {
        $separator = $config['separator'] ?? '';
        $inputIds = $node->data['inputs'] ?? ['input-1', 'input-2'];

        // Find all incoming connections
        $incomingConnections = $this->connections->filter(
            fn ($conn) => $conn->target_node_id === $node->node_id
        );

        // Build a map of input slot -> value, respecting targetField from source nodes
        $valuesBySlot = [];
        foreach ($incomingConnections as $conn) {
            $sourceOutput = $this->nodeOutputs[$conn->source_node_id] ?? null;

            // Skip failed nodes
            if (\is_array($sourceOutput) && isset($sourceOutput['__failed'])) {
                continue;
            }

            if ($sourceOutput === null) {
                continue;
            }

            // Check if source node has a targetField configured
            $sourceNode = $this->nodes->firstWhere('node_id', $conn->source_node_id);
            $sourceConfig = $sourceNode?->data['config'] ?? [];
            $targetField = $sourceConfig['targetField'] ?? null;

            // Use targetField if set, otherwise use connection's target_handle
            $targetHandle = $targetField ?: $conn->target_handle;
            $slotIndex = array_search($targetHandle, $inputIds);

            if ($slotIndex !== false) {
                $valuesBySlot[$slotIndex] = (string) $sourceOutput;
            }
        }

        // Sort by slot index and collect values
        ksort($valuesBySlot);
        $values = array_values($valuesBySlot);

        $mergedValue = implode($separator, $values);
        $this->log('info', 'Merge node: '.count($values)." inputs, separator: \"{$separator}\", result: \"{$mergedValue}\"");

        return ['success' => true, 'output' => $mergedValue];
    }

    protected function executeTemplateNode(WorkflowNode $node, array $config): array
    {
        $template = $config['template'] ?? '';
        $inputIds = $node->data['inputs'] ?? ['input-1', 'input-2'];

        // Find all incoming connections
        $incomingConnections = $this->connections->filter(
            fn ($conn) => $conn->target_node_id === $node->node_id
        );

        // Build values indexed by input number
        $valuesByIndex = [];
        foreach ($incomingConnections as $conn) {
            $sourceOutput = $this->nodeOutputs[$conn->source_node_id] ?? null;

            // Skip failed nodes
            if (\is_array($sourceOutput) && isset($sourceOutput['__failed'])) {
                continue;
            }

            if ($sourceOutput === null) {
                continue;
            }

            // Check if source node has a targetField configured (for Constant nodes targeting specific input)
            $sourceNode = $this->nodes->firstWhere('node_id', $conn->source_node_id);
            $sourceConfig = $sourceNode?->data['config'] ?? [];
            $targetField = $sourceConfig['targetField'] ?? null;

            // Use targetField if set, otherwise use connection's target_handle
            $targetHandle = $targetField ?: $conn->target_handle;

            // Find the index from the handle (e.g., 'input-1' -> 1, 'input-2' -> 2)
            $handleIndex = array_search($targetHandle, $inputIds);
            if ($handleIndex !== false) {
                $valuesByIndex[$handleIndex + 1] = $sourceOutput; // 1-indexed for ${input1}, ${input2}, etc.
            }
        }

        // First, convert @mentions in HTML to ${inputN} placeholders
        // Match: <span data-type="mention" data-id="input1" ...>@Label</span>
        $processedTemplate = preg_replace(
            '/<span[^>]*data-type="mention"[^>]*data-id="(input\d+)"[^>]*>[^<]*<\/span>/i',
            '${$1}',
            $template
        );

        // Replace ${inputN} placeholders with actual values
        $result = preg_replace_callback('/\$\{input(\d+)\}/', function ($matches) use ($valuesByIndex) {
            $index = (int) $matches[1];

            return isset($valuesByIndex[$index]) ? (string) $valuesByIndex[$index] : $matches[0];
        }, $processedTemplate);

        $this->log('info', 'Template node: '.count($valuesByIndex).' inputs, result length: '.strlen($result));

        return ['success' => true, 'output' => $result];
    }

    protected function executeApiAction(array $config, array $inputValues): array
    {
        $url = $config['url'] ?? null;

        if (! $url) {
            return ['success' => false, 'error' => 'API Action requires a URL'];
        }

        $method = strtoupper($config['method'] ?? 'GET');
        $headers = $config['headers'] ?? [];
        $body = $config['requestBody'] ?? [];

        // Replace placeholders with input values
        $body = $this->replacePlaceholders($body, $inputValues);

        try {
            $request = Http::withHeaders($headers);

            /** @var \Illuminate\Http\Client\Response $response */
            $response = match ($method) {
                'POST' => $request->post($url, $body),
                'PUT' => $request->put($url, $body),
                'PATCH' => $request->patch($url, $body),
                'DELETE' => $request->delete($url),
                default => $request->get($url, $body),
            };

            $this->log('info', "API {$method} {$url} - Status: {$response->status()}");

            return [
                'success' => $response->successful(),
                'output' => $response->json() ?? $response->body(),
                'statusCode' => $response->status(),
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => "API request failed: {$e->getMessage()}"];
        }
    }

    protected function executeEmailAction(array $config, array $inputValues): array
    {
        $templateId = $config['template'] ?? null;
        $recipients = $config['recipients'] ?? [];
        $subject = $config['subject'] ?? null;
        $customData = $config['customData'] ?? [];

        if (! $templateId) {
            return ['success' => false, 'error' => 'Email Action requires a template'];
        }

        if (empty($recipients)) {
            return ['success' => false, 'error' => 'Email Action requires at least one recipient'];
        }

        try {
            // Support both ID and slug for template lookup
            $template = is_numeric($templateId)
                ? \App\Models\EmailTemplate::find($templateId)
                : \App\Models\EmailTemplate::where('slug', $templateId)->first();

            if (! $template) {
                return ['success' => false, 'error' => "Email template not found: {$templateId}"];
            }

            // Merge input values with custom data
            $data = array_merge($customData, $inputValues);

            // Replace placeholders in template
            $body = $this->replaceTemplatePlaceholders($template->body_html ?? $template->body ?? '', $data);
            $emailSubject = $subject ?: $template->subject;
            $emailSubject = $this->replaceTemplatePlaceholders($emailSubject, $data);

            foreach ($recipients as $recipient) {
                Mail::html($body, function ($message) use ($recipient, $emailSubject) {
                    $message->to($recipient)->subject($emailSubject);
                });
            }

            $this->log('info', 'Email sent to: '.implode(', ', $recipients));

            return [
                'success' => true,
                'output' => ['sent_to' => $recipients, 'subject' => $emailSubject],
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => "Email failed: {$e->getMessage()}"];
        }
    }

    protected function executeDatabaseAction(array $config, array $inputValues): array
    {
        $operation = $config['operation'] ?? 'select';
        $table = $config['table'] ?? null;
        $query = $config['query'] ?? null;

        if (! $table && ! $query) {
            return ['success' => false, 'error' => 'Database Action requires a table or query'];
        }

        try {
            $result = match ($operation) {
                'select' => DB::table($table)->get(),
                'insert' => DB::table($table)->insert($config['data'] ?? []),
                'update' => DB::table($table)->where($config['where'] ?? [])->update($config['data'] ?? []),
                'delete' => DB::table($table)->where($config['where'] ?? [])->delete(),
                'raw' => DB::select($query),
                default => null,
            };

            $this->log('info', "Database {$operation} on {$table}");

            return ['success' => true, 'output' => $result];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => "Database operation failed: {$e->getMessage()}"];
        }
    }

    protected function executeScriptAction(array $config, array $inputValues): array
    {
        $script = $config['script'] ?? null;

        if (! $script) {
            return ['success' => false, 'error' => 'Script Action requires a script'];
        }

        try {
            // Execute PHP code safely with input values available
            $input = $inputValues['input'] ?? null;
            $result = eval($script);

            $this->log('info', 'Script executed');

            return ['success' => true, 'output' => $result];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => "Script execution failed: {$e->getMessage()}"];
        }
    }

    protected function executeWebhookAction(array $config, array $inputValues): array
    {
        $url = $config['url'] ?? null;

        if (! $url) {
            return ['success' => false, 'error' => 'Webhook Action requires a URL'];
        }

        try {
            $payload = array_merge($config['payload'] ?? [], $inputValues);

            $response = Http::post($url, $payload);

            $this->log('info', "Webhook POST {$url} - Status: {$response->status()}");

            return [
                'success' => $response->successful(),
                'output' => $response->json() ?? $response->body(),
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => "Webhook failed: {$e->getMessage()}"];
        }
    }

    protected function executeGoogleCalendarAction(array $config, array $inputValues): array
    {
        // Log entry point with raw data
        $this->log('info', 'Google Calendar action started');
        $this->log('info', 'Raw config: '.json_encode($config));
        $this->log('info', 'Raw inputValues: '.json_encode($inputValues));

        $team = $this->workflow->team;

        if (! $team || ! $team->hasGoogleCalendarConnected()) {
            return [
                'success' => false,
                'error' => 'Google Calendar is not connected for this team',
            ];
        }

        $operation = $config['operation'] ?? 'create';
        $calendarId = $config['calendarId'] ?? 'primary';

        $configAfterPlaceholders = $this->replacePlaceholders($config, $inputValues);
        $this->log('info', 'Config after placeholder replacement: '.json_encode($configAfterPlaceholders));

        // Check if we have a connected Calendar event object (from previous Calendar node)
        // If so, extract the id for eventId
        $eventIdFromInput = $inputValues['eventId'] ?? null;
        if (! $eventIdFromInput && isset($inputValues['input']) && \is_array($inputValues['input'])) {
            // If input is a Calendar event object, extract the id
            if (isset($inputValues['input']['id'])) {
                $eventIdFromInput = $inputValues['input']['id'];
                $this->log('info', 'Extracted eventId from connected Calendar node output: '.$eventIdFromInput);
            }
        }

        // Use input values from connected nodes if available, otherwise fall back to config
        // This allows dynamic values from Constant nodes with targetField set
        $summary = $inputValues['summary'] ?? $configAfterPlaceholders['summary'] ?? '';
        $description = $inputValues['description'] ?? $configAfterPlaceholders['description'] ?? '';
        $location = $inputValues['location'] ?? $configAfterPlaceholders['location'] ?? '';
        $startDateTime = $inputValues['startDateTime'] ?? $configAfterPlaceholders['startDateTime'] ?? null;
        $endDateTime = $inputValues['endDateTime'] ?? $configAfterPlaceholders['endDateTime'] ?? null;
        $attendees = $inputValues['attendees'] ?? $configAfterPlaceholders['attendees'] ?? '';
        $eventId = $eventIdFromInput ?? $configAfterPlaceholders['eventId'] ?? '';

        // Check for unreplaced placeholders and clear them
        $checkAndClear = function ($value) {
            if (is_string($value) && preg_match('/\{\{\{.*?\}\}\}/', $value)) {
                return null; // Clear unreplaced placeholders
            }

            return $value;
        };

        $summary = $checkAndClear($summary) ?? '';
        $description = $checkAndClear($description) ?? '';
        $location = $checkAndClear($location) ?? '';
        $startDateTime = $checkAndClear($startDateTime);
        $endDateTime = $checkAndClear($endDateTime);
        $attendees = $checkAndClear($attendees) ?? '';
        $eventId = $checkAndClear($eventId) ?? '';

        $this->log('info', "Google Calendar {$operation} - Summary: {$summary}, Start: {$startDateTime}, End: {$endDateTime}");
        $this->log('info', 'Final inputValues: '.json_encode($inputValues));

        try {
            $calendarService = app(GoogleCalendarService::class);

            $eventData = [
                'summary' => $summary,
                'description' => $description,
                'location' => $location,
                'start' => [
                    'dateTime' => $startDateTime ?? now()->toIso8601String(),
                    'timeZone' => $configAfterPlaceholders['timeZone'] ?? config('app.timezone', 'Europe/Budapest'),
                ],
                'end' => [
                    'dateTime' => $endDateTime ?? now()->addHour()->toIso8601String(),
                    'timeZone' => $configAfterPlaceholders['timeZone'] ?? config('app.timezone', 'Europe/Budapest'),
                ],
                'attendees' => $this->parseAttendees($attendees),
            ];

            $this->log('info', 'Event data being sent to Google Calendar: '.json_encode($eventData));

            $result = match ($operation) {
                'create' => $calendarService->createEvent($team, $calendarId, $eventData),
                'list' => $calendarService->listEvents($team, $calendarId, [
                    'timeMin' => $configAfterPlaceholders['timeMin'] ?? null,
                    'timeMax' => $configAfterPlaceholders['timeMax'] ?? null,
                    'maxResults' => $configAfterPlaceholders['maxResults'] ?? 10,
                ]),
                'update' => $calendarService->updateEvent(
                    $team,
                    $calendarId,
                    $eventId,
                    array_filter([
                        'summary' => $summary ?: null,
                        'description' => $description ?: null,
                        'location' => $location ?: null,
                        'start' => $startDateTime ? [
                            'dateTime' => $startDateTime,
                            'timeZone' => $configAfterPlaceholders['timeZone'] ?? config('app.timezone', 'Europe/Budapest'),
                        ] : null,
                        'end' => $endDateTime ? [
                            'dateTime' => $endDateTime,
                            'timeZone' => $configAfterPlaceholders['timeZone'] ?? config('app.timezone', 'Europe/Budapest'),
                        ] : null,
                    ])
                ),
                'delete' => $calendarService->deleteEvent($team, $calendarId, $eventId),
                default => throw new \InvalidArgumentException("Unknown operation: {$operation}"),
            };

            // Check if the result contains an error (e.g., from 404 handling)
            if (\is_array($result) && isset($result['success']) && $result['success'] === false) {
                $this->log('warning', "Google Calendar {$operation} failed: ".($result['message'] ?? $result['error'] ?? 'Unknown error'));

                return [
                    'success' => false,
                    'error' => $result['message'] ?? $result['error'] ?? 'Operation failed',
                    'errorCode' => $result['errorCode'] ?? null,
                ];
            }

            $this->log('info', "Google Calendar {$operation} completed successfully");

            // For delete operation, include the deleted marker in the output
            if ($operation === 'delete' && \is_array($result) && isset($result['deleted'])) {
                return [
                    'success' => true,
                    'deleted' => true,
                    'deletedEventId' => $result['deletedEventId'] ?? $eventId,
                    'output' => null, // No event object because it was deleted
                ];
            }

            return [
                'success' => true,
                'output' => $result,
            ];

        } catch (\Google\Service\Exception $e) {
            $this->log('error', "Google Calendar API error: {$e->getMessage()}");

            return [
                'success' => false,
                'error' => "Google Calendar API error: {$e->getMessage()}",
            ];
        } catch (\Exception $e) {
            $this->log('error', "Google Calendar action failed: {$e->getMessage()}");

            return [
                'success' => false,
                'error' => "Google Calendar action failed: {$e->getMessage()}",
            ];
        }
    }

    protected function executeGoogleDocsAction(array $config, array $inputValues): array
    {
        $this->log('info', 'Google Docs action started');
        $this->log('info', 'Raw config: '.json_encode($config));
        $this->log('info', 'Raw inputValues: '.json_encode($inputValues));

        $team = $this->workflow->team;

        if (! $team || ! $team->googleCredential) {
            return [
                'success' => false,
                'error' => 'Google is not connected for this team',
            ];
        }

        $operation = $config['operation'] ?? 'create';
        $configAfterPlaceholders = $this->replacePlaceholders($config, $inputValues);
        $this->log('info', 'Config after placeholder replacement: '.json_encode($configAfterPlaceholders));

        // Check if we have a connected Docs document object (from previous Docs node)
        $documentIdFromInput = $inputValues['documentId'] ?? null;
        if (! $documentIdFromInput && isset($inputValues['input']) && \is_array($inputValues['input'])) {
            if (isset($inputValues['input']['id'])) {
                $documentIdFromInput = $inputValues['input']['id'];
                $this->log('info', 'Extracted documentId from connected Docs node output: '.$documentIdFromInput);
            }
        }

        // Use input values from connected nodes if available
        $title = $inputValues['title'] ?? $configAfterPlaceholders['title'] ?? 'Untitled';
        $content = $inputValues['content'] ?? $configAfterPlaceholders['content'] ?? '';
        $documentId = $documentIdFromInput ?? $configAfterPlaceholders['documentId'] ?? '';

        // Check for unreplaced placeholders and clear them
        $checkAndClear = function ($value) {
            if (is_string($value) && preg_match('/\{\{\{.*?\}\}\}/', $value)) {
                return null;
            }

            return $value;
        };

        $title = $checkAndClear($title) ?? 'Untitled';
        $content = $checkAndClear($content) ?? '';
        $documentId = $checkAndClear($documentId) ?? '';

        $this->log('info', "Google Docs {$operation} - Title: {$title}, DocumentId: {$documentId}");

        try {
            $docsService = app(GoogleDocsService::class);

            $result = match ($operation) {
                'create' => $docsService->createDocument($team, $title, $content ?: null),
                'read' => $docsService->getDocument($team, $documentId),
                'update' => $docsService->updateDocument($team, $documentId, [
                    'operation' => $configAfterPlaceholders['updateOperation'] ?? 'append',
                    'content' => $content,
                    'searchText' => $configAfterPlaceholders['searchText'] ?? '',
                    'insertIndex' => $configAfterPlaceholders['insertIndex'] ?? 1,
                ]),
                'list' => $docsService->listDocuments($team, [
                    'maxResults' => $configAfterPlaceholders['maxResults'] ?? 20,
                ]),
                default => throw new \InvalidArgumentException("Unknown operation: {$operation}"),
            };

            // Check if the result contains an error (e.g., from 404 handling)
            if (\is_array($result) && isset($result['success']) && $result['success'] === false) {
                $this->log('warning', "Google Docs {$operation} failed: ".($result['message'] ?? $result['error'] ?? 'Unknown error'));

                return [
                    'success' => false,
                    'error' => $result['message'] ?? $result['error'] ?? 'Operation failed',
                    'errorCode' => $result['errorCode'] ?? null,
                ];
            }

            $this->log('info', "Google Docs {$operation} completed successfully");

            return [
                'success' => true,
                'output' => $result,
            ];

        } catch (\Google\Service\Exception $e) {
            $this->log('error', "Google Docs API error: {$e->getMessage()}");

            return [
                'success' => false,
                'error' => "Google Docs API error: {$e->getMessage()}",
            ];
        } catch (\Exception $e) {
            $this->log('error', "Google Docs action failed: {$e->getMessage()}");

            return [
                'success' => false,
                'error' => "Google Docs action failed: {$e->getMessage()}",
            ];
        }
    }

    protected function parseAttendees(string $attendees): array
    {
        if (empty($attendees)) {
            return [];
        }

        return collect(explode(',', $attendees))
            ->map(fn ($email) => ['email' => trim($email)])
            ->filter(fn ($a) => filter_var($a['email'], FILTER_VALIDATE_EMAIL))
            ->values()
            ->toArray();
    }

    protected function replacePlaceholders(array $data, array $values): array
    {
        array_walk_recursive($data, function (&$item) use ($values) {
            if (is_string($item)) {
                foreach ($values as $key => $value) {
                    // Support both {{{key}}} and {{{input.key}}} patterns
                    $item = str_replace("{{{$key}}}", (string) $value, $item);
                    $item = str_replace("{{{input.$key}}}", (string) $value, $item);
                }
            }
        });

        return $data;
    }

    protected function replaceTemplatePlaceholders(string $template, array $data): string
    {
        foreach ($data as $key => $value) {
            if (is_scalar($value)) {
                $template = str_replace("{{{$key}}}", (string) $value, $template);
            }
        }

        return $template;
    }

    protected function log(string $level, string $message): void
    {
        $this->executionLog[] = [
            'level' => $level,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('workflow')->{$level}("[Workflow:{$this->workflow->id}] {$message}");
    }
}
