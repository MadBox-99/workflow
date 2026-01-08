<?php

namespace App\Console\Commands;

use App\Jobs\ExecuteWorkflow;
use App\Models\Workflow;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RunScheduledWorkflows extends Command
{
    protected $signature = 'workflows:run-scheduled';

    protected $description = 'Check and run scheduled workflows that are due to execute';

    public function handle(): int
    {
        $this->info('Checking for scheduled workflows...');

        $workflows = Workflow::query()
            ->where('is_active', true)
            ->where('is_scheduled', true)
            ->whereNotNull('schedule_cron')
            ->get()
            ->filter(fn (Workflow $workflow) => $workflow->shouldRunNow());

        if ($workflows->isEmpty()) {
            $this->info('No workflows due to run.');

            return self::SUCCESS;
        }

        $this->info("Found {$workflows->count()} workflow(s) to execute.");

        foreach ($workflows as $workflow) {
            $this->info("Dispatching workflow: {$workflow->name} (ID: {$workflow->id}, Cron: {$workflow->schedule_cron})");

            Log::channel('workflow')->info("Scheduler dispatching workflow: {$workflow->name} (ID: {$workflow->id}, Cron: {$workflow->schedule_cron})");

            // Update schedule timestamps BEFORE dispatching to prevent double-runs
            $workflow->markAsRun();

            // Dispatch to queue
            ExecuteWorkflow::dispatch($workflow);
        }

        $this->info('Done.');

        return self::SUCCESS;
    }
}
