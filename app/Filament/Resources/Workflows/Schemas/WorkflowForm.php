<?php

namespace App\Filament\Resources\Workflows\Schemas;

use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class WorkflowForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Workflow Details')
                    ->schema([
                        TextInput::make('name')
                            ->required(),
                        Select::make('team_id')
                            ->relationship('team', 'name')
                            ->preload()
                            ->required(),
                        Textarea::make('description')
                            ->columnSpanFull(),
                        Toggle::make('is_active')
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('Nodes')
                    ->hidden(fn (string $operation): bool => $operation === 'create')
                    ->columnSpanFull()
                    ->schema([
                        Repeater::make('nodes')
                            ->relationship()
                            ->schema([
                                TextInput::make('node_id')
                                    ->label('Node ID')
                                    ->required()
                                    ->disabled()
                                    ->dehydrated(),
                                Select::make('type')
                                    ->options([
                                        'start' => 'Start',
                                        'apiAction' => 'API Action',
                                        'emailAction' => 'Email Action',
                                        'databaseAction' => 'Database Action',
                                        'scriptAction' => 'Script Action',
                                        'webhookAction' => 'Webhook Action',
                                        'condition' => 'Condition',
                                        'constant' => 'Constant',
                                        'branch' => 'Branch',
                                        'join' => 'Join',
                                        'end' => 'End',
                                    ])
                                    ->required(),
                                TextInput::make('label')
                                    ->required(),
                                Textarea::make('data')
                                    ->label('Node Data (JSON)')
                                    ->formatStateUsing(fn ($state) => \is_array($state) ? json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : $state)
                                    ->dehydrateStateUsing(fn ($state) => json_decode($state, true))
                                    ->rows(6)
                                    ->columnSpanFull(),
                                TextInput::make('position.x')
                                    ->label('Position X')
                                    ->numeric(),
                                TextInput::make('position.y')
                                    ->label('Position Y')
                                    ->numeric(),
                            ])
                            ->columns(2)
                            ->itemLabel(fn (array $state): ?string => $state['label'] ?? $state['type'] ?? null)
                            ->collapsible()
                            ->collapsed()
                            ->reorderableWithButtons()
                            ->addActionLabel('Add Node')
                            ->columnSpanFull(),
                    ]),

                Section::make('Connections (Edges)')
                    ->hidden(fn (string $operation): bool => $operation === 'create')
                    ->schema([
                        Repeater::make('connections')
                            ->relationship()
                            ->schema([
                                TextInput::make('connection_id')
                                    ->label('Connection ID')
                                    ->required()
                                    ->disabled()
                                    ->dehydrated(),
                                TextInput::make('source_node_id')
                                    ->label('Source Node ID')
                                    ->required(),
                                TextInput::make('target_node_id')
                                    ->label('Target Node ID')
                                    ->required(),
                                TextInput::make('source_handle')
                                    ->label('Source Handle'),
                                TextInput::make('target_handle')
                                    ->label('Target Handle'),
                            ])
                            ->columns(2)
                            ->itemLabel(fn (array $state): ?string => ($state['source_node_id'] ?? '?').' → '.($state['target_node_id'] ?? '?'))
                            ->collapsible()
                            ->collapsed()
                            ->reorderableWithButtons()
                            ->addActionLabel('Add Connection')
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
