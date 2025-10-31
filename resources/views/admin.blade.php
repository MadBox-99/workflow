<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Workflow Admin</title>
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="antialiased bg-gray-50">
    <div id="admin-app"></div>
</body>
</html>
