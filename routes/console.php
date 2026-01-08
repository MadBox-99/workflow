<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Run scheduled workflows every minute
Schedule::command('workflows:run-scheduled')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
