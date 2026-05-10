<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes khusus domain (barang, supplier, transaksi) sudah dimuat
| oleh masing-masing module ServiceProvider. File ini hanya untuk
| routes global / cross-module.
|
*/

// Test connection (public)
Route::get('/test', function () {
    return response()->json([
        'message' => 'Warehouse Management System API v1.0',
        'status' => 'Connected',
        'timestamp' => now()->toDateTimeString(),
        'architecture' => 'Modular Monolith',
        'modules' => [
            'inventory' => '/api/barang',
            'supplier' => '/api/supplier',
            'transaction' => '/api/transaksi',
            'dashboard' => '/api/dashboard',
            'auth' => '/api/auth',
        ],
    ]);
});

// Dashboard (protected - requires JWT)
Route::middleware('jwt.auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});