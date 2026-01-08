<?php

declare(strict_types=1);

namespace App\Mcp\Tools\Filament;

use Filament\Facades\Filament;
use Illuminate\Support\Facades\File;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;
use ReflectionClass;

#[IsReadOnly]
class ListPages extends Tool
{
    protected string $description = 'List all custom Filament pages including auth pages, tenancy pages, and resource pages with their routes and view paths.';

    public function handle(Request $request): Response
    {
        $panel = Filament::getPanel('admin');

        // Get registered pages from panel
        $registeredPages = $panel->getPages();

        // Also discover custom pages from the filesystem
        $customPages = $this->discoverCustomPages();

        // Get resource pages
        $resourcePages = $this->getResourcePages($panel);

        return Response::json([
            'panel_id' => $panel->getId(),
            'registered_pages' => $this->formatRegisteredPages($registeredPages),
            'custom_pages' => $customPages,
            'resource_pages' => $resourcePages,
        ]);
    }

    /**
     * @param  array<int|string, class-string>  $pages
     * @return array<int, array<string, mixed>>
     */
    private function formatRegisteredPages(array $pages): array
    {
        $result = [];

        foreach ($pages as $path => $pageClass) {
            $pageInfo = [
                'class' => $pageClass,
            ];

            if (class_exists($pageClass)) {
                $reflection = new ReflectionClass($pageClass);

                if ($reflection->hasMethod('getNavigationLabel')) {
                    try {
                        $pageInfo['navigation_label'] = $pageClass::getNavigationLabel();
                    } catch (\Throwable) {
                        // Skip if method throws
                    }
                }

                if ($reflection->hasMethod('getSlug')) {
                    try {
                        $pageInfo['slug'] = $pageClass::getSlug();
                    } catch (\Throwable) {
                        // Skip if method throws
                    }
                }
            }

            $result[] = $pageInfo;
        }

        return $result;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function discoverCustomPages(): array
    {
        $pagesPath = app_path('Filament/Pages');
        $pages = [];

        if (! File::isDirectory($pagesPath)) {
            return $pages;
        }

        $files = File::allFiles($pagesPath);

        foreach ($files as $file) {
            $relativePath = $file->getRelativePathname();
            $className = $this->pathToClassName($relativePath);

            if (! class_exists($className)) {
                continue;
            }

            $reflection = new ReflectionClass($className);

            // Skip abstract classes
            if ($reflection->isAbstract()) {
                continue;
            }

            $pageInfo = [
                'class' => $className,
                'file_path' => $file->getPathname(),
            ];

            // Try to get view
            if ($reflection->hasProperty('view')) {
                $viewProperty = $reflection->getProperty('view');
                if ($viewProperty->isDefault()) {
                    $viewProperty->setAccessible(true);

                    try {
                        $instance = $reflection->newInstanceWithoutConstructor();
                        $pageInfo['view'] = $viewProperty->getValue($instance);
                    } catch (\Throwable) {
                        // Skip if can't instantiate
                    }
                }
            }

            // Check if it's a tenancy page
            if (str_contains($className, 'Tenancy')) {
                $pageInfo['type'] = 'tenancy';
            } elseif (str_contains($className, 'Auth')) {
                $pageInfo['type'] = 'auth';
            } else {
                $pageInfo['type'] = 'custom';
            }

            $pages[] = $pageInfo;
        }

        return $pages;
    }

    private function pathToClassName(string $path): string
    {
        $path = str_replace(['/', '.php'], ['\\', ''], $path);

        return 'App\\Filament\\Pages\\'.$path;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getResourcePages(\Filament\Panel $panel): array
    {
        $resourcePages = [];
        $resources = $panel->getResources();

        foreach ($resources as $path => $resourceClass) {
            $pages = $resourceClass::getPages();

            foreach ($pages as $pageName => $pageRegistration) {
                $pageClass = $pageRegistration->getPage();

                $pageInfo = [
                    'resource' => $resourceClass,
                    'page_name' => $pageName,
                    'page_class' => $pageClass,
                ];

                // Check if it's a standard page or custom
                if (str_contains($pageClass, 'List')) {
                    $pageInfo['type'] = 'list';
                } elseif (str_contains($pageClass, 'Create')) {
                    $pageInfo['type'] = 'create';
                } elseif (str_contains($pageClass, 'Edit')) {
                    $pageInfo['type'] = 'edit';
                } elseif (str_contains($pageClass, 'View')) {
                    $pageInfo['type'] = 'view';
                } else {
                    $pageInfo['type'] = 'custom';
                }

                $resourcePages[] = $pageInfo;
            }
        }

        return $resourcePages;
    }
}
