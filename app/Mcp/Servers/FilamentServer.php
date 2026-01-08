<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\Filament\GetPanelConfig;
use App\Mcp\Tools\Filament\GetResourceForm;
use App\Mcp\Tools\Filament\GetResourceTable;
use App\Mcp\Tools\Filament\ListPages;
use App\Mcp\Tools\Filament\ListResources;
use Laravel\Mcp\Server;

class FilamentServer extends Server
{
    /**
     * The MCP server's name.
     */
    protected string $name = 'Filament';

    /**
     * The MCP server's version.
     */
    protected string $version = '1.0.0';

    /**
     * The MCP server's instructions for the LLM.
     */
    protected string $instructions = <<<'MARKDOWN'
        Filament admin panel introspection tools. Use these tools to understand the structure of Filament resources, forms, tables, pages, and panel configuration.

        Available tools:
        - list-filament-resources: List all registered Filament resources with their models, icons, and pages
        - get-filament-resource-form: Get detailed form schema for a specific resource (fields, types, validation)
        - get-filament-resource-table: Get table configuration for a specific resource (columns, actions, filters)
        - list-filament-pages: List all custom Filament pages
        - get-filament-panel-config: Get panel configuration (path, tenancy, colors, middleware)
    MARKDOWN;

    /**
     * The tools registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        ListResources::class,
        GetResourceForm::class,
        GetResourceTable::class,
        ListPages::class,
        GetPanelConfig::class,
    ];
}
