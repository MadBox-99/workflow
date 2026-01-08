<?php

namespace Database\Seeders;

use App\Models\ScheduleOption;
use App\Models\Team;
use Illuminate\Database\Seeder;

class ScheduleOptionSeeder extends Seeder
{
    public function run(): void
    {
        $options = [
            ['name' => 'Percenként', 'cron_expression' => '* * * * *', 'sort_order' => 1],
            ['name' => '5 percenként', 'cron_expression' => '*/5 * * * *', 'sort_order' => 2],
            ['name' => '10 percenként', 'cron_expression' => '*/10 * * * *', 'sort_order' => 3],
            ['name' => '15 percenként', 'cron_expression' => '*/15 * * * *', 'sort_order' => 4],
            ['name' => '30 percenként', 'cron_expression' => '*/30 * * * *', 'sort_order' => 5],
            ['name' => 'Óránként', 'cron_expression' => '0 * * * *', 'sort_order' => 6],
            ['name' => '4 óránként', 'cron_expression' => '0 */4 * * *', 'sort_order' => 7],
            ['name' => '12 óránként', 'cron_expression' => '0 */12 * * *', 'sort_order' => 8],
            ['name' => 'Naponta egyszer', 'cron_expression' => '0 0 * * *', 'sort_order' => 9],
        ];

        foreach ($options as $option) {
            ScheduleOption::updateOrCreate(
                ['cron_expression' => $option['cron_expression']],
                $option
            );
        }

        // Attach all options to existing teams
        $allOptionIds = ScheduleOption::pluck('id');
        Team::all()->each(function ($team) use ($allOptionIds) {
            $team->scheduleOptions()->syncWithoutDetaching($allOptionIds);
        });
    }
}
