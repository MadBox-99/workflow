# Module Setup Guide

## Existing Modules for Reference

When creating a new module, inspect these existing implementations:

| Module | Path | Color |
|--------|------|-------|
| Subscriber (Main) | `~/Herd/subscriber` | Indigo #6161FF |
| Controlling | `~/Herd/controlling` | Emerald #10B981 |
| CRM | `~/Herd/crm` | Blue #3B82F6 |
| Workflow | `~/Herd/workflow` | Violet #8B5CF6 |

Key files to reference in existing modules:
- `resources/views/components/layouts/` - Layout components
- `resources/views/home.blade.php` - Landing page structure
- `resources/css/app.css` - CSS configuration with Filament imports
- `app/Filament/Pages/Auth/` - Custom auth pages
- `app/Http/Responses/` - Custom auth responses

## Prerequisites

- PHP 8.4+
- Laravel 12
- Filament 4
- Node.js 20+
- Composer

## Directory Structure

```
project-root/
├── app/
│   ├── Filament/
│   │   └── Pages/
│   │       └── Auth/
│   │           ├── Login.php          # Custom login page
│   │           └── Register.php       # Custom registration page
│   ├── Http/
│   │   ├── Middleware/
│   │   │   └── SetLocale.php          # Language switching middleware
│   │   └── Responses/
│   │       ├── LoginResponse.php      # Redirect to /dashboard after login
│   │       └── RegistrationResponse.php # Redirect to /dashboard after registration
│   └── Providers/
│       └── AppServiceProvider.php     # Bind custom responses
├── bootstrap/
│   └── app.php                        # Middleware registration
├── docs/
│   └── design-system/                 # This documentation
├── resources/
│   ├── css/
│   │   └── app.css                    # Main stylesheet with Vibe Design System
│   ├── images/
│   │   └── logo.png                   # Cégem360 logo (copy from existing module)
│   └── views/
│       ├── components/
│       │   ├── layouts/
│       │   │   ├── app.blade.php      # Main layout wrapper
│       │   │   ├── navbar.blade.php   # Navigation component
│       │   │   └── footer.blade.php   # Footer component
│       │   └── language-switcher.blade.php
│       ├── filament/
│       │   ├── layouts/
│       │   │   ├── auth.blade.php     # Centered auth layout (login)
│       │   │   └── auth-split.blade.php # Split auth layout (registration)
│       │   └── pages/auth/
│       │       ├── login.blade.php    # Login form UI
│       │       └── register.blade.php # Registration form UI
│       └── home.blade.php             # Landing page
├── routes/
│   └── web.php                        # Routes including language switch
└── public/
    └── build/                         # Compiled assets (via npm run build)
```

## Step 1: Create Layout Components Directory

```bash
mkdir -p resources/views/components/layouts
mkdir -p resources/images
```

## Step 2: Copy Logo

```bash
cp /path/to/existing-module/resources/images/logo.png resources/images/
```

## Step 3: Create SetLocale Middleware

Create `app/Http/Middleware/SetLocale.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale', config('app.locale'));

        if (in_array($locale, ['en', 'hu'], true)) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}
```

## Step 4: Register Middleware in bootstrap/app.php

```php
<?php

use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            SetLocale::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

## Step 5: Add Routes

In `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('home');
})->name('home');

Route::get('/language/{locale}', function (string $locale) {
    if (! in_array($locale, ['en', 'hu'], true)) {
        abort(400);
    }
    $cookie = cookie('locale', $locale, 60 * 24 * 365);
    $referer = request()->headers->get('referer');
    $redirectUrl = $referer ?: url()->previous();

    return redirect($redirectUrl)->withCookie($cookie);
})->name('language.switch');
```

## Step 6: Setup Authentication Pages

Follow the detailed guide in [Authentication Pages](./08-authentication-pages.md) to create:

1. Custom `LoginResponse` and `RegistrationResponse` classes (redirect to `/dashboard`)
2. Bind responses in `AppServiceProvider`
3. Custom `Login.php` and `Register.php` Filament auth pages
4. Auth layouts (`auth.blade.php` and `auth-split.blade.php`)
5. Auth views (`login.blade.php` and `register.blade.php`)
6. Guest routes for `/login` and `/register`

## Step 7: Build Assets

```bash
npm install
npm run build
```

## Verification Checklist

- [ ] Logo displays correctly in navbar
- [ ] Language switcher works (HU/EN)
- [ ] All sections render with correct colors
- [ ] Mobile responsive design works
- [ ] Dark borders are light gray (not dark) - see Common Issues
- [ ] Login page renders with custom centered layout
- [ ] Registration page renders with split layout
- [ ] After login, user redirects to `/dashboard`
- [ ] After registration, user redirects to `/dashboard`
