<?php

use App\Http\Controllers\Api\WorkflowController;
use App\Models\Team;
use Illuminate\Support\Facades\Route;

Route::apiResource('workflows', WorkflowController::class);
Route::get('email-templates', [WorkflowController::class, 'emailTemplates']);
Route::get('schedule-options', [WorkflowController::class, 'scheduleOptions']);
Route::post('workflows/actions/email', [WorkflowController::class, 'sendEmail']);

Route::get('teams', fn () => Team::all(['id', 'name']));
