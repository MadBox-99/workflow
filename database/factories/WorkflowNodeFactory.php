<?php

namespace Database\Factories;

use App\Models\Workflow;
use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkflowNode>
 */
class WorkflowNodeFactory extends Factory
{
    protected $model = WorkflowNode::class;

    public function definition(): array
    {
        return [
            'workflow_id' => Workflow::factory(),
            'node_id' => 'node-'.fake()->uuid(),
            'type' => fake()->randomElement(['start', 'end', 'apiAction', 'condition']),
            'label' => fake()->words(2, true),
            'data' => [
                'type' => 'start',
                'config' => [],
            ],
            'position' => [
                'x' => fake()->numberBetween(0, 500),
                'y' => fake()->numberBetween(0, 500),
            ],
        ];
    }

    public function start(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'start',
            'data' => [
                'type' => 'start',
                'config' => ['value' => true],
            ],
        ]);
    }

    public function end(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'end',
            'data' => [
                'type' => 'end',
                'config' => [],
            ],
        ]);
    }

    public function googleCalendarAction(array $config = []): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'googleCalendarAction',
            'data' => [
                'type' => 'googleCalendarAction',
                'config' => array_merge([
                    'operation' => 'create',
                    'calendarId' => 'primary',
                    'summary' => 'Test Event',
                ], $config),
            ],
        ]);
    }
}
