<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WorkflowController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/workflow-editor', function () {
    return view('admin');
})->name('workflow.editor');

Route::get('/workflows', function () {
    return view('workflows');
})->name('workflows');

Route::prefix('api')->group(function () {
    Route::apiResource('workflows', WorkflowController::class);
});
