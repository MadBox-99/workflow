<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

    <head>
        <meta charset="utf-8" />

        <meta name="application-name" content="{{ config('app.name') }}" />
        <meta name="csrf-token" content="{{ csrf_token() }}" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>{{ $workflow->name }} - {{ __('Workflow Editor') }}</title>

        {{-- Monday.com / Vibe Design System Fonts --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">

        <style>
            [x-cloak] {
                display: none !important;
            }
        </style>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @filamentStyles

    </head>

    <body class="antialiased bg-gray-50 dark:bg-gray-900" x-data="{ sidebarOpen: true, mobileMenuOpen: false }">
        <div class="min-h-screen flex">
            {{-- Sidebar --}}
            <x-layouts.dashboard-sidebar />

            {{-- Main content area --}}
            <div class="flex-1 flex flex-col min-w-0" :class="{ 'lg:ml-60': sidebarOpen }">
                {{-- Header - matching dashboard design --}}
                <x-layouts.dashboard-header />

                {{-- Workflow context bar --}}
                <div class="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
                    <div class="flex items-center gap-4">
                        {{-- Back button --}}
                        <a href="{{ route('dashboard.workflows') }}"
                            class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title="{{ __('Back to Workflows') }}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                        </a>

                        {{-- Workflow info --}}
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                                </svg>
                            </div>
                            <div>
                                <h1 class="text-sm font-semibold text-gray-900 dark:text-white">{{ $workflow->name }}</h1>
                                <div class="flex items-center gap-2">
                                    @if($workflow->is_active)
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            {{ __('Active') }}
                                        </span>
                                    @endif
                                    @if($workflow->is_scheduled)
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {{ $workflow->schedule_description }}
                                        </span>
                                    @endif
                                    @if($workflow->webhook_enabled)
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            {{ __('Webhook') }}
                                        </span>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        {{-- Node count --}}
                        <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                            {{ $workflow->nodes->count() }} {{ __('nodes') }}
                        </span>

                        {{-- Auto-save indicator placeholder --}}
                        <div id="autosave-indicator" class="text-xs text-gray-400"></div>
                    </div>
                </div>

                {{-- Editor content - full height --}}
                <main class="flex-1 overflow-hidden">
                    <div id="admin-app" class="h-full" data-workflow-id="{{ $workflow->id }}"></div>
                </main>
            </div>
        </div>

        {{-- Mobile sidebar overlay --}}
        <div
            x-show="mobileMenuOpen"
            x-transition:enter="transition-opacity ease-linear duration-300"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition-opacity ease-linear duration-300"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
            @click="mobileMenuOpen = false"
        ></div>

        @livewire('notifications')

        @filamentScripts

    </body>

</html>
