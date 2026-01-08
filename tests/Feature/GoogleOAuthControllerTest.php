<?php

use App\Models\Team;
use App\Models\TeamGoogleCredential;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'services.google.client_id' => 'test-client-id',
        'services.google.client_secret' => 'test-client-secret',
        'services.google.redirect_uri' => 'http://localhost/api/google/auth/callback',
        'services.google.scopes' => [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ],
    ]);
});

describe('GET /api/google/auth/redirect', function () {
    it('returns auth URL for valid team', function () {
        $team = Team::factory()->create();

        $response = $this->getJson("/api/google/auth/redirect?team_id={$team->id}");

        $response->assertSuccessful()
            ->assertJsonStructure(['auth_url']);

        expect($response->json('auth_url'))->toContain('accounts.google.com');
    });

    it('returns validation error when team_id is missing', function () {
        $response = $this->getJson('/api/google/auth/redirect');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['team_id']);
    });

    it('returns validation error when team does not exist', function () {
        $response = $this->getJson('/api/google/auth/redirect?team_id=99999');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['team_id']);
    });
});

describe('GET /api/google/auth/status', function () {
    it('returns connected false when no credential exists', function () {
        $team = Team::factory()->create();

        $response = $this->getJson("/api/google/auth/status?team_id={$team->id}");

        $response->assertSuccessful()
            ->assertJson([
                'connected' => false,
                'email' => null,
            ]);
    });

    it('returns connected true when credential exists', function () {
        $team = Team::factory()->create();
        TeamGoogleCredential::factory()->for($team)->create([
            'google_email' => 'test@example.com',
        ]);

        $response = $this->getJson("/api/google/auth/status?team_id={$team->id}");

        $response->assertSuccessful()
            ->assertJson([
                'connected' => true,
                'email' => 'test@example.com',
            ]);
    });

    it('returns validation error when team_id is missing', function () {
        $response = $this->getJson('/api/google/auth/status');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['team_id']);
    });
});

describe('POST /api/google/auth/disconnect', function () {
    it('disconnects Google Calendar successfully', function () {
        $team = Team::factory()->create();
        TeamGoogleCredential::factory()->for($team)->create();

        expect($team->fresh()->hasGoogleCalendarConnected())->toBeTrue();

        $response = $this->postJson('/api/google/auth/disconnect', [
            'team_id' => $team->id,
        ]);

        $response->assertSuccessful()
            ->assertJson(['success' => true]);

        expect($team->fresh()->hasGoogleCalendarConnected())->toBeFalse();
    });

    it('succeeds even when no credential exists', function () {
        $team = Team::factory()->create();

        $response = $this->postJson('/api/google/auth/disconnect', [
            'team_id' => $team->id,
        ]);

        $response->assertSuccessful()
            ->assertJson(['success' => true]);
    });

    it('returns validation error when team_id is missing', function () {
        $response = $this->postJson('/api/google/auth/disconnect', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['team_id']);
    });
});

describe('GET /api/google/auth/callback', function () {
    it('returns popup response with error when error parameter is present', function () {
        $response = $this->get('/api/google/auth/callback?error=access_denied');

        $response->assertSuccessful()
            ->assertSee('Connection Failed')
            ->assertSee('Google authorization was denied');
    });

    it('returns popup response with error when code is missing', function () {
        $team = Team::factory()->create();

        $response = $this->get("/api/google/auth/callback?state={$team->id}");

        $response->assertSuccessful()
            ->assertSee('Connection Failed')
            ->assertSee('Invalid callback parameters');
    });

    it('returns popup response with error when state is missing', function () {
        $response = $this->get('/api/google/auth/callback?code=test-code');

        $response->assertSuccessful()
            ->assertSee('Connection Failed')
            ->assertSee('Invalid callback parameters');
    });

    it('returns popup response with postMessage script', function () {
        $response = $this->get('/api/google/auth/callback?error=access_denied');

        $response->assertSuccessful()
            ->assertSee('window.opener.postMessage')
            ->assertSee('google-oauth-callback');
    });
});
