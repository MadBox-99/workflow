<?php

namespace App\Services\Google;

use App\Models\Team;
use App\Models\TeamGoogleCredential;
use Google\Client as Google_Client;
use Illuminate\Support\Facades\Log;

class GoogleAuthService
{
    protected Google_Client $client;

    public function __construct()
    {
        $this->client = new Google_Client;
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect_uri'));
        $this->client->setScopes(config('services.google.scopes'));
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function getAuthUrl(Team $team): string
    {
        $this->client->setState((string) $team->id);

        return $this->client->createAuthUrl();
    }

    public function handleCallback(string $code, Team $team): TeamGoogleCredential
    {
        Log::info('Google OAuth: Fetching access token');

        $token = $this->client->fetchAccessTokenWithAuthCode($code);

        Log::info('Google OAuth: Token response received', [
            'has_access_token' => isset($token['access_token']),
            'has_refresh_token' => isset($token['refresh_token']),
            'has_error' => isset($token['error']),
        ]);

        if (isset($token['error'])) {
            throw new \Exception('Google OAuth error: '.($token['error_description'] ?? $token['error']));
        }

        $this->client->setAccessToken($token);

        Log::info('Google OAuth: Fetching user info');

        $oauth2 = new \Google\Service\Oauth2($this->client);
        $userInfo = $oauth2->userinfo->get();

        Log::info('Google OAuth: User info received', ['email' => $userInfo->getEmail()]);

        return TeamGoogleCredential::updateOrCreate(
            ['team_id' => $team->id],
            [
                'access_token' => $token['access_token'],
                'refresh_token' => $token['refresh_token'] ?? null,
                'token_type' => $token['token_type'] ?? 'Bearer',
                'expires_at' => now()->addSeconds($token['expires_in'] ?? 3600),
                'scopes' => $token['scope'] ?? config('services.google.scopes'),
                'google_email' => $userInfo->getEmail(),
            ]
        );
    }

    public function refreshToken(TeamGoogleCredential $credential): TeamGoogleCredential
    {
        if (! $credential->refresh_token) {
            throw new \Exception('No refresh token available. Please reconnect Google Calendar.');
        }

        $this->client->refreshToken($credential->refresh_token);
        $token = $this->client->getAccessToken();

        if (isset($token['error'])) {
            Log::error('Google token refresh failed', ['error' => $token]);
            throw new \Exception('Failed to refresh Google token: '.$token['error']);
        }

        $credential->update([
            'access_token' => $token['access_token'],
            'expires_at' => now()->addSeconds($token['expires_in'] ?? 3600),
        ]);

        return $credential->fresh();
    }

    public function revokeAccess(Team $team): bool
    {
        $credential = $team->googleCredential;

        if (! $credential) {
            return true;
        }

        try {
            $this->client->revokeToken($credential->access_token);
        } catch (\Exception $e) {
            Log::warning('Failed to revoke Google token', ['error' => $e->getMessage()]);
        }

        $credential->delete();

        return true;
    }

    public function getAuthenticatedClient(Team $team): Google_Client
    {
        $credential = $team->googleCredential;

        if (! $credential) {
            throw new \Exception('Google Calendar is not connected for this team.');
        }

        if ($credential->needsRefresh()) {
            $credential = $this->refreshToken($credential);
        }

        $this->client->setAccessToken([
            'access_token' => $credential->access_token,
            'refresh_token' => $credential->refresh_token,
            'token_type' => $credential->token_type,
            'expires_in' => $credential->expires_at->diffInSeconds(now()),
        ]);

        return $this->client;
    }
}
