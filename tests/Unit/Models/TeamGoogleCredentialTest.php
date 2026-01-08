<?php

use App\Models\Team;
use App\Models\TeamGoogleCredential;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

it('belongs to a team', function () {
    $credential = TeamGoogleCredential::factory()->create();

    expect($credential->team)->toBeInstanceOf(Team::class);
});

it('encrypts access token', function () {
    $credential = TeamGoogleCredential::factory()->create([
        'access_token' => 'test-token-123',
    ]);

    $rawValue = \DB::table('team_google_credentials')
        ->where('id', $credential->id)
        ->value('access_token');

    expect($rawValue)->not->toBe('test-token-123');
    expect($credential->access_token)->toBe('test-token-123');
});

it('encrypts refresh token', function () {
    $credential = TeamGoogleCredential::factory()->create([
        'refresh_token' => 'refresh-token-123',
    ]);

    $rawValue = \DB::table('team_google_credentials')
        ->where('id', $credential->id)
        ->value('refresh_token');

    expect($rawValue)->not->toBe('refresh-token-123');
    expect($credential->refresh_token)->toBe('refresh-token-123');
});

it('casts expires_at to datetime', function () {
    $credential = TeamGoogleCredential::factory()->create();

    expect($credential->expires_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

it('casts scopes to array', function () {
    $credential = TeamGoogleCredential::factory()->create([
        'scopes' => ['scope1', 'scope2'],
    ]);

    expect($credential->scopes)->toBeArray();
    expect($credential->scopes)->toContain('scope1', 'scope2');
});

it('detects expired tokens', function () {
    $expiredCredential = TeamGoogleCredential::factory()->expired()->create();
    $validCredential = TeamGoogleCredential::factory()->create();

    expect($expiredCredential->isExpired())->toBeTrue();
    expect($validCredential->isExpired())->toBeFalse();
});

it('detects tokens needing refresh', function () {
    $expiringSoon = TeamGoogleCredential::factory()->expiringSoon()->create();
    $validCredential = TeamGoogleCredential::factory()->create();

    expect($expiringSoon->needsRefresh())->toBeTrue();
    expect($validCredential->needsRefresh())->toBeFalse();
});

it('returns true for needsRefresh when expires_at is null', function () {
    $credential = TeamGoogleCredential::factory()->create([
        'expires_at' => null,
    ]);

    expect($credential->needsRefresh())->toBeTrue();
});
