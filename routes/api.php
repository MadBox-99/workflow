<?php

use App\Http\Controllers\Api\GoogleCalendarController;
use App\Http\Controllers\Api\GoogleOAuthController;
use App\Http\Controllers\Api\WorkflowController;
use App\Models\Team;
use Illuminate\Support\Facades\Route;

Route::apiResource('workflows', WorkflowController::class);
Route::get('email-templates', [WorkflowController::class, 'emailTemplates']);
Route::get('schedule-options', [WorkflowController::class, 'scheduleOptions']);
Route::post('workflows/actions/email', [WorkflowController::class, 'sendEmail']);

Route::get('teams', fn () => Team::all(['id', 'name']));

Route::prefix('google')->group(function () {
    Route::get('auth/redirect', [GoogleOAuthController::class, 'redirect']);
    Route::get('auth/callback', [GoogleOAuthController::class, 'callback'])->name('google.callback');
    Route::get('auth/status', [GoogleOAuthController::class, 'status']);
    Route::post('auth/disconnect', [GoogleOAuthController::class, 'disconnect']);
    Route::get('calendars', [GoogleCalendarController::class, 'calendars']);
    Route::get('events', [GoogleCalendarController::class, 'events']);
});
