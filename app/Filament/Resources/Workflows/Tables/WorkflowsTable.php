<?php

namespace App\Filament\Resources\Workflows\Tables;

use App\Models\Workflow;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class WorkflowsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable(),
                IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),
                IconColumn::make('is_scheduled')
                    ->label('Scheduled')
                    ->boolean(),
                TextColumn::make('schedule_cron')
                    ->label('Schedule')
                    ->formatStateUsing(fn ($state) => Workflow::describeCron($state))
                    ->toggleable(),
                TextColumn::make('last_run_at')
                    ->label('Last Run')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('Never')
                    ->toggleable(),
                TextColumn::make('next_run_at')
                    ->label('Next Run')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('Not scheduled')
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                Action::make('design')
                    ->label('Design Workflow')
                    ->icon('heroicon-o-pencil-square')
                    ->url(fn ($record) => route('workflow.editor', ['workflow' => $record->id]))
                    ->openUrlInNewTab()
                    ->color('info'),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
