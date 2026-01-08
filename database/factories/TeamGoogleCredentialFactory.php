<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TeamGoogleCredential>
 */
class TeamGoogleCredentialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'access_token' => fake()->sha256(),
            'refresh_token' => fake()->sha256(),
            'token_type' => 'Bearer',
            'expires_at' => now()->addHour(),
            'scopes' => [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
            ],
            'google_email' => fake()->safeEmail(),
        ];
    }

    /**
     * Indicate that the token is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subHour(),
        ]);
    }

    /**
     * Indicate that the token will expire soon.
     */
    public function expiringSoon(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->addMinutes(3),
        ]);
    }
}
