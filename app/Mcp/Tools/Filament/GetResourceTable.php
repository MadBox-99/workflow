<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Filament;

use Filament\Facades\Filament;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\File;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use ReflectionClass;

#[IsReadOnly]
class GetResourceTable extends Tool
{
    protected string $description = 'Get the table configuration for a specific Filament resource, including columns, actions, filters, and bulk actions.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'resource' => $schema
                ->string()
                ->description('The resource class name or slug (e.g., "WorkflowResource" or "workflows")')
                ->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        $resourceIdentifier = (string) $request->get('resource');

        $panel = Filament::getPanel('admin');
        $resources = $panel->getResources();

        $resourceClass = $this->findResource($resources, $resourceIdentifier);

        if (! $resourceClass) {
            return Response::error("Resource not found: {$resourceIdentifier}");
        }

        $tableInfo = $this->analyzeTableSchema($resourceClass);

        return Response::json([
            'resource' => $resourceClass,
            'table' => $tableInfo,
        ]);
    }

    /**
     * @param  array<string, class-string>  $resources
     */
    private function findResource(array $resources, string $identifier): ?string
    {
        foreach ($resources as $path => $resourceClass) {
            if (str_ends_with($resourceClass, $identifier)) {
                return $resourceClass;
            }

            if ($resourceClass::getSlug() === $identifier) {
                return $resourceClass;
            }
        }

        return null;
    }

    /**
     * @param  class-string  $resourceClass
     * @return array<string, mixed>
     */
    private function analyzeTableSchema(string $resourceClass): array
    {
        $reflection = new ReflectionClass($resourceClass);
        $fileName = $reflection->getFileName();
        $source = File::get($fileName);

        // Check if table uses an external class
        if (preg_match('/return\s+(\w+)::configure\s*\(\s*\$\w+\s*\)/', $source, $matches)) {
            $tableClassName = $matches[1];

            // For table method - might be different class name
            if (preg_match('/use\s+([^;]+\\\\'.$tableClassName.')\s*;/', $source, $useMatch)) {
                // Skip if this is a form class
                if (! str_contains($useMatch[1], 'Form')) {
                    return $this->analyzeTableClass($useMatch[1]);
                }
            }
        }

        // Look for table-specific pattern
        if (preg_match('/public\s+static\s+function\s+table[^{]*\{[^}]*return\s+(\w+)::configure/', $source, $tableMatch)) {
            $tableClassName = $tableMatch[1];

            if (preg_match('/use\s+([^;]+\\\\'.$tableClassName.')\s*;/', $source, $useMatch)) {
                return $this->analyzeTableClass($useMatch[1]);
            }
        }

        return $this->analyzeInlineTable($source);
    }

    /**
     * @return array<string, mixed>
     */
    private function analyzeTableClass(string $tableClass): array
    {
        if (! class_exists($tableClass)) {
            return ['error' => "Table class not found: {$tableClass}"];
        }

        $reflection = new ReflectionClass($tableClass);
        $fileName = $reflection->getFileName();
        $source = File::get($fileName);

        return $this->parseTableSource($source, $tableClass);
    }

    /**
     * @return array<string, mixed>
     */
    private function analyzeInlineTable(string $source): array
    {
        return $this->parseTableSource($source, 'inline');
    }

    /**
     * @return array<string, mixed>
     */
    private function parseTableSource(string $source, string $className): array
    {
        $columns = [];
        $actions = [];
        $bulkActions = [];
        $filters = [];

        // Find all column types
        $columnPatterns = [
            'TextColumn' => '/TextColumn::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^,\]]*)/s',
            'IconColumn' => '/IconColumn::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^,\]]*)/s',
            'BooleanColumn' => '/BooleanColumn::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^,\]]*)/s',
            'ImageColumn' => '/ImageColumn::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^,\]]*)/s',
            'BadgeColumn' => '/BadgeColumn::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^,\]]*)/s',
            'ColorColumn' => '/ColorColumn::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^,\]]*)/s',
        ];

        foreach ($columnPatterns as $type => $pattern) {
            preg_match_all($pattern, $source, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                $columnName = $match[1];
                $columnChain = $match[2] ?? '';

                $columnInfo = [
                    'name' => $columnName,
                    'type' => $type,
                    'searchable' => str_contains($columnChain, '->searchable()'),
                    'sortable' => str_contains($columnChain, '->sortable()'),
                    'toggleable' => str_contains($columnChain, '->toggleable()'),
                    'hidden_by_default' => str_contains($columnChain, 'isToggledHiddenByDefault'),
                ];

                // Extract label if present
                if (preg_match('/->label\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/', $columnChain, $labelMatch)) {
                    $columnInfo['label'] = $labelMatch[1];
                }

                // Check for date/time formatting
                if (str_contains($columnChain, '->dateTime()')) {
                    $columnInfo['format'] = 'dateTime';
                } elseif (str_contains($columnChain, '->date()')) {
                    $columnInfo['format'] = 'date';
                }

                // Check for boolean
                if (str_contains($columnChain, '->boolean()')) {
                    $columnInfo['is_boolean'] = true;
                }

                $columns[] = $columnInfo;
            }
        }

        // Find actions
        $actionPatterns = [
            'EditAction' => '/EditAction::make\s*\(\s*\)/',
            'ViewAction' => '/ViewAction::make\s*\(\s*\)/',
            'DeleteAction' => '/DeleteAction::make\s*\(\s*\)/',
            'Action' => '/Tables\\\\Actions\\\\Action::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/',
        ];

        foreach ($actionPatterns as $type => $pattern) {
            if (preg_match_all($pattern, $source, $matches)) {
                if ($type === 'Action' && ! empty($matches[1])) {
                    foreach ($matches[1] as $actionName) {
                        $actions[] = ['type' => 'custom', 'name' => $actionName];
                    }
                } else {
                    $actions[] = ['type' => $type];
                }
            }
        }

        // Find bulk actions
        if (preg_match('/DeleteBulkAction::make/', $source)) {
            $bulkActions[] = ['type' => 'DeleteBulkAction'];
        }

        // Find filters
        $filterPatterns = [
            'SelectFilter' => '/SelectFilter::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/',
            'TernaryFilter' => '/TernaryFilter::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/',
            'Filter' => '/Tables\\\\Filters\\\\Filter::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/',
        ];

        foreach ($filterPatterns as $type => $pattern) {
            if (preg_match_all($pattern, $source, $matches)) {
                foreach ($matches[1] as $filterName) {
                    $filters[] = ['type' => $type, 'name' => $filterName];
                }
            }
        }

        return [
            'table_class' => $className,
            'columns' => $columns,
            'column_count' => count($columns),
            'actions' => $actions,
            'bulk_actions' => $bulkActions,
            'filters' => $filters,
        ];
    }
}
