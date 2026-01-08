<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Filament;

use Filament\Facades\Filament;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[IsReadOnly]
class ListResources extends Tool
{
    protected string $description = 'List all registered Filament resources with their models, navigation icons, tenant relationships, and pages.';

    public function handle(Request $request): Response
    {
        $panel = Filament::getPanel('admin');
        $resources = $panel->getResources();

        $resourceInfo = [];
        foreach ($resources as $path => $resourceClass) {
            $resourceInfo[] = [
                'class' => $resourceClass,
                'model' => $resourceClass::getModel(),
                'navigation_icon' => $resourceClass::getNavigationIcon(),
                'navigation_label' => $resourceClass::getNavigationLabel(),
                'slug' => $resourceClass::getSlug(),
                'pages' => array_keys($resourceClass::getPages()),
                'tenant_ownership_relationship' => $resourceClass::getTenantOwnershipRelationshipName(),
                'file_path' => $path,
            ];
        }

        return Response::json([
            'panel_id' => $panel->getId(),
            'resources' => $resourceInfo,
        ]);
    }
}
