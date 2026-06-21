<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Prometheus metrics endpoint (di-scrape oleh Prometheus setiap 5s)
Route::get('/metrics', [\App\Http\Controllers\MetricsController::class, 'index']);
