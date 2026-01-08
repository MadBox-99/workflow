<?php

namespace App\Jobs;

use App\Models\Workflow;
use App\Services\Workflow\WorkflowRunnerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ExecuteWorkflow implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public Workflow $workflow
    ) {}

    public function handle(WorkflowRunnerService $runner): void
    {
        Log::channel('workflow')->info("Job started for workflow: {$this->workflow->name} (ID: {$this->workflow->id})");

        $result = $runner->execute($this->workflow);

        if ($result['success']) {
            Log::channel('workflow')->info("Workflow {$this->workflow->id} completed successfully");
        } else {
            Log::channel('workflow')->error("Workflow {$this->workflow->id} failed: {$result['error']}");
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('workflow')->error("Workflow job {$this->workflow->id} failed permanently: {$exception->getMessage()}");
    }
}
