<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EmailTemplate>
 */
class EmailTemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'slug' => $this->faker->slug(),
            'subject' => $this->faker->sentence(6),
            'body_html' => '<p>'.$this->faker->paragraph(4).'</p>',
            'body_text' => $this->faker->paragraph(4),
            'variables' => ['{{name}}', '{{date}}'],
            'is_active' => true,
        ];
    }
}
