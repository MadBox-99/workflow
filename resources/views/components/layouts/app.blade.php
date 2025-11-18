<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ $title ?? config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />
        @viteReactRefresh
        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])

        @livewireStyles
    </head>

    <body class="antialiased bg-gray-50 dark:bg-gray-900">
        <div class="min-h-screen">
            <x-layouts.nav />

            <!-- Page Content -->
            <main>
                {{ $slot }}
            </main>
        </div>

        @livewireScripts
    </body>

</html>
