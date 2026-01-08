<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\Workflow;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workflow>
 */
class WorkflowFactory extends Factory
{
    protected $model = Workflow::class;

    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'is_active' => true,
            'is_scheduled' => false,
            'schedule_cron' => null,
            'last_run_at' => null,
            'next_run_at' => null,
            'metadata' => [],
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function scheduled(string $cron = '0 * * * *'): static
    {
        return $this->state(fn (array $attributes) => [
            'is_scheduled' => true,
            'schedule_cron' => $cron,
        ]);
    }
}
