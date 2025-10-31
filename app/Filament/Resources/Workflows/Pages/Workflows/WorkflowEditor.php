<?php

namespace App\Filament\Resources\Workflows\Pages\Workflows;

use App\Filament\Resources\Workflows\WorkflowResource;
use Filament\Resources\Pages\Concerns\InteractsWithRecord;
use Filament\Resources\Pages\Page;

class WorkflowEditor extends Page
{
    use InteractsWithRecord;

    protected static string $resource = WorkflowResource::class;

    protected string $view = 'filament.resources.workflows.pages.workflows.workflow-editor';

    public function mount(int|string $record): void
    {
        $this->record = $this->resolveRecord($record);
    }
}
