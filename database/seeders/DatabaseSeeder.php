<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'admin@admin.com',
            'password' => Hash::make('password'),
        ]);

        $team = Team::create([
            'name' => 'Test Team',
            'slug' => 'test-team',
            'owner_id' => User::first()->id,
        ]);
        $team->members()->attach(User::first(), ['role' => 'owner']);

        EmailTemplate::factory(5)->create([
            'team_id' => $team->id,

        ]);

    }
}
