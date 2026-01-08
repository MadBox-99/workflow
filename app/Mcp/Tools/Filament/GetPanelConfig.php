<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Filament;

use Filament\Facades\Filament;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[IsReadOnly]
class GetPanelConfig extends Tool
{
    protected string $description = 'Get Filament panel configuration including path, tenant settings, colors, authentication, middleware, and discovery paths.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'panel_id' => $schema
                ->string()
                ->description('The panel ID (default: "admin")')
                ->default('admin'),
        ];
    }

    public function handle(Request $request): Response
    {
        $panelId = (string) ($request->get('panel_id') ?? 'admin');

        try {
            $panel = Filament::getPanel($panelId);
        } catch (\Throwable $e) {
            return Response::error("Panel not found: {$panelId}");
        }

        $config = [
            'id' => $panel->getId(),
            'path' => $panel->getPath(),

            // Tenancy
            'tenancy' => [
                'enabled' => $panel->hasTenancy(),
                'model' => $panel->getTenantModel(),
                'ownership_relationship' => $panel->getTenantOwnershipRelationshipName(),
                'slug_attribute' => $panel->getTenantSlugAttribute(),
            ],

            // Authentication
            'authentication' => [
                'guard' => $panel->getAuthGuard(),
                'login_enabled' => $panel->hasLogin(),
                'registration_enabled' => $panel->hasRegistration(),
                'password_reset_enabled' => $panel->hasPasswordReset(),
                'email_verification_enabled' => $panel->hasEmailVerification(),
            ],

            // Widgets
            'widgets' => $panel->getWidgets(),

            // Discovery paths
            'discovery' => [
                'resource_directories' => $this->getDiscoveryDirectories($panel, 'resources'),
                'page_directories' => $this->getDiscoveryDirectories($panel, 'pages'),
                'widget_directories' => $this->getDiscoveryDirectories($panel, 'widgets'),
            ],

            // Counts
            'counts' => [
                'resources' => count($panel->getResources()),
                'pages' => count($panel->getPages()),
                'widgets' => count($panel->getWidgets()),
            ],
        ];

        // Try to get colors
        try {
            $colors = $panel->getColors();
            $config['colors'] = array_map(function ($color) {
                if (is_array($color)) {
                    return $color;
                }
                if (is_object($color) && method_exists($color, 'value')) {
                    return $color->value;
                }

                return (string) $color;
            }, $colors);
        } catch (\Throwable) {
            $config['colors'] = 'Unable to retrieve';
        }

        // Available panels
        $config['available_panels'] = array_keys(Filament::getPanels());

        return Response::json($config);
    }

    /**
     * @return array<int, string>
     */
    private function getDiscoveryDirectories(\Filament\Panel $panel, string $type): array
    {
        // This information isn't directly available from the panel,
        // but we can infer from the project structure
        $directories = [];

        $basePath = app_path('Filament');

        switch ($type) {
            case 'resources':
                if (is_dir($basePath.'/Resources')) {
                    $directories[] = $basePath.'/Resources';
                }
                break;
            case 'pages':
                if (is_dir($basePath.'/Pages')) {
                    $directories[] = $basePath.'/Pages';
                }
                break;
            case 'widgets':
                if (is_dir($basePath.'/Widgets')) {
                    $directories[] = $basePath.'/Widgets';
                }
                break;
        }

        return $directories;
    }
}
