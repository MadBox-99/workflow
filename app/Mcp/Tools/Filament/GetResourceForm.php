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
class GetResourceForm extends Tool
{
    protected string $description = 'Get the form schema for a specific Filament resource, including all fields, their types, validation rules, and sections.';

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

        $formInfo = $this->analyzeFormSchema($resourceClass);

        return Response::json([
            'resource' => $resourceClass,
            'form' => $formInfo,
        ]);
    }

    /**
     * @param  array<string, class-string>  $resources
     */
    private function findResource(array $resources, string $identifier): ?string
    {
        foreach ($resources as $path => $resourceClass) {
            // Match by class name (with or without namespace)
            if (str_ends_with($resourceClass, $identifier)) {
                return $resourceClass;
            }

            // Match by slug
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
    private function analyzeFormSchema(string $resourceClass): array
    {
        $reflection = new ReflectionClass($resourceClass);
        $formMethod = $reflection->getMethod('form');

        // Get the source file and find where form schema is defined
        $fileName = $reflection->getFileName();
        $source = File::get($fileName);

        // Check if form uses an external schema class
        if (preg_match('/return\s+(\w+)::configure\s*\(\s*\$\w+\s*\)/', $source, $matches)) {
            $schemaClassName = $matches[1];

            // Try to find the full class name from use statements
            if (preg_match('/use\s+([^;]+\\\\'.$schemaClassName.')\s*;/', $source, $useMatch)) {
                $fullSchemaClass = $useMatch[1];

                return $this->analyzeSchemaClass($fullSchemaClass);
            }
        }

        // Inline form definition - analyze the form method directly
        return $this->analyzeInlineForm($source);
    }

    /**
     * @return array<string, mixed>
     */
    private function analyzeSchemaClass(string $schemaClass): array
    {
        if (! class_exists($schemaClass)) {
            return ['error' => "Schema class not found: {$schemaClass}"];
        }

        $reflection = new ReflectionClass($schemaClass);
        $fileName = $reflection->getFileName();
        $source = File::get($fileName);

        return $this->parseFormSource($source, $schemaClass);
    }

    /**
     * @return array<string, mixed>
     */
    private function analyzeInlineForm(string $source): array
    {
        return $this->parseFormSource($source, 'inline');
    }

    /**
     * @return array<string, mixed>
     */
    private function parseFormSource(string $source, string $className): array
    {
        $sections = [];
        $fields = [];

        // Find all Section::make calls
        preg_match_all('/Section::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/', $source, $sectionMatches);
        $sections = $sectionMatches[1] ?? [];

        // Find all form field types
        $fieldPatterns = [
            'TextInput' => '/TextInput::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'Textarea' => '/Textarea::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'Select' => '/Select::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'Toggle' => '/Toggle::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'Repeater' => '/Repeater::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'RichEditor' => '/RichEditor::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'KeyValue' => '/KeyValue::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'DateTimePicker' => '/DateTimePicker::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'FileUpload' => '/FileUpload::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
            'Checkbox' => '/Checkbox::make\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)([^;]*);?/s',
        ];

        foreach ($fieldPatterns as $type => $pattern) {
            preg_match_all($pattern, $source, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                $fieldName = $match[1];
                $fieldChain = $match[2] ?? '';

                $fieldInfo = [
                    'name' => $fieldName,
                    'type' => $type,
                    'required' => str_contains($fieldChain, '->required()'),
                    'disabled' => str_contains($fieldChain, '->disabled()'),
                    'live' => str_contains($fieldChain, '->live()'),
                    'hidden_on_create' => str_contains($fieldChain, "operation === 'create'") || str_contains($fieldChain, 'hiddenOn'),
                ];

                // Extract label if present
                if (preg_match('/->label\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)/', $fieldChain, $labelMatch)) {
                    $fieldInfo['label'] = $labelMatch[1];
                }

                // Check for relationship
                if (preg_match('/->relationship\s*\(\s*[\'"]?([^\'")\s,]+)?/', $fieldChain, $relMatch)) {
                    $fieldInfo['relationship'] = $relMatch[1] ?? true;
                }

                // Check for options
                if (preg_match('/->options\s*\(\s*\[([^\]]+)\]/', $fieldChain, $optMatch)) {
                    $fieldInfo['has_static_options'] = true;
                } elseif (str_contains($fieldChain, '->options(')) {
                    $fieldInfo['has_dynamic_options'] = true;
                }

                $fields[] = $fieldInfo;
            }
        }

        return [
            'schema_class' => $className,
            'sections' => $sections,
            'fields' => $fields,
            'field_count' => count($fields),
        ];
    }
}
