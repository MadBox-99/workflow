<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Services\Google\GoogleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GoogleOAuthController extends Controller
{
    public function __construct(
        protected GoogleAuthService $authService
    ) {}

    public function redirect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $team = Team::findOrFail($validated['team_id']);
        $authUrl = $this->authService->getAuthUrl($team);

        Log::info('Google OAuth redirect initiated', [
            'team_id' => $team->id,
            'auth_url' => $authUrl,
        ]);

        return response()->json([
            'auth_url' => $authUrl,
        ]);
    }

    public function callback(Request $request): RedirectResponse|\Illuminate\Http\Response
    {
        Log::info('Google OAuth callback received', [
            'all_params' => $request->all(),
            'query' => $request->query(),
            'url' => $request->fullUrl(),
        ]);

        $code = $request->query('code');
        $state = $request->query('state'); // state contains team_id
        $error = $request->query('error');

        // Use frontend URL for redirect (handles localhost callback -> workflow.test redirect)
        $frontendUrl = config('app.frontend_url', config('app.url'));

        // Default redirect for errors without team context
        $defaultRedirect = rtrim($frontendUrl, '/').'/admin';

        if ($error) {
            Log::warning('Google OAuth error received', ['error' => $error]);

            return $this->popupResponse(false, 'Google authorization was denied: '.$error, $defaultRedirect);
        }

        if (! $code || ! $state) {
            Log::warning('Google OAuth missing parameters', ['code' => $code ? 'present' : 'missing', 'state' => $state]);

            return $this->popupResponse(false, 'Invalid callback parameters', $defaultRedirect);
        }

        try {
            Log::info('Google OAuth processing callback', ['state' => $state, 'code_length' => strlen($code)]);

            $team = Team::findOrFail($state);
            Log::info('Team found for OAuth', ['team_id' => $team->id, 'team_slug' => $team->slug]);

            $credential = $this->authService->handleCallback($code, $team);
            Log::info('Google OAuth credentials saved', ['credential_id' => $credential->id, 'email' => $credential->google_email]);

            // Redirect to team-specific workflows page (Filament tenancy)
            $redirectUrl = rtrim($frontendUrl, '/').'/admin/'.$team->slug.'/workflows';

            return $this->popupResponse(true, 'Google Calendar connected successfully!', $redirectUrl);
        } catch (\Exception $e) {
            Log::error('Google OAuth callback failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return $this->popupResponse(false, 'Failed to connect Google Calendar: '.$e->getMessage(), $defaultRedirect);
        }
    }

    /**
     * Return a response that handles popup windows properly.
     * Will close the popup and notify the opener window, or redirect if not a popup.
     */
    protected function popupResponse(bool $success, string $message, string $redirectUrl): \Illuminate\Http\Response
    {
        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>Google Calendar Authorization</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
        .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; }
        .success { color: #059669; }
        .error { color: #dc2626; }
        .message { margin: 1rem 0; }
        .redirect { color: #6b7280; font-size: 0.875rem; }
        a { color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="{$this->getStatusClass($success)}">{$this->getStatusTitle($success)}</h2>
        <p class="message">{$message}</p>
        <p class="redirect">This window will close automatically. If it doesn't, <a href="{$redirectUrl}">click here</a>.</p>
    </div>
    <script>
        // Notify the opener window and close this popup
        if (window.opener) {
            window.opener.postMessage({
                type: 'google-oauth-callback',
                success: {$this->boolToJs($success)},
                message: '{$this->escapeJs($message)}'
            }, '*');
            setTimeout(function() { window.close(); }, 1500);
        } else {
            // Not a popup, redirect after showing message
            setTimeout(function() { window.location.href = '{$redirectUrl}'; }, 2000);
        }
    </script>
</body>
</html>
HTML;

        return response($html);
    }

    protected function getStatusClass(bool $success): string
    {
        return $success ? 'success' : 'error';
    }

    protected function getStatusTitle(bool $success): string
    {
        return $success ? 'Connected!' : 'Connection Failed';
    }

    protected function boolToJs(bool $value): string
    {
        return $value ? 'true' : 'false';
    }

    protected function escapeJs(string $value): string
    {
        return addslashes($value);
    }

    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $team = Team::findOrFail($validated['team_id']);
        $credential = $team->googleCredential;

        return response()->json([
            'connected' => $credential !== null,
            'email' => $credential?->google_email,
            'expires_at' => $credential?->expires_at?->toIso8601String(),
        ]);
    }

    public function disconnect(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $team = Team::findOrFail($validated['team_id']);

        try {
            $this->authService->revokeAccess($team);

            return response()->json([
                'success' => true,
                'message' => 'Google Calendar disconnected successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to disconnect: '.$e->getMessage(),
            ], 500);
        }
    }
}
