<?php

use App\Modules\Inventory\Controllers\BarangController;
use App\Modules\Inventory\Controllers\KategoriController;
use App\Modules\Inventory\Controllers\GudangController;
use Illuminate\Support\Facades\Route;

Route::middleware('jwt.auth')->group(function () {
    // Barang routes
    Route::prefix('barang')->group(function () {
        Route::get('/', [BarangController::class, 'index']);
        Route::post('/', [BarangController::class, 'store']);
        Route::get('/aging', [BarangController::class, 'agingStock']);
        Route::get('/{id}', [BarangController::class, 'show']);
        Route::put('/{id}', [BarangController::class, 'update']);
        Route::delete('/{id}', [BarangController::class, 'destroy']);
        Route::post('/{id}/stok/tambah', [BarangController::class, 'tambahStok']);
        Route::post('/{id}/stok/kurangi', [BarangController::class, 'kurangiStok']);
        Route::get('/{id}/batches', [BarangController::class, 'stockBatches']);
        Route::get('/{id}/gudang', [GudangController::class, 'gudangByBarang']);
    });

    // Kategori routes
    Route::prefix('kategori')->group(function () {
        Route::get('/', [KategoriController::class, 'index']);
        Route::post('/', [KategoriController::class, 'store']);
        Route::get('/{id}', [KategoriController::class, 'show']);
        Route::put('/{id}', [KategoriController::class, 'update']);
        Route::delete('/{id}', [KategoriController::class, 'destroy']);
    });

    // Gudang routes
    Route::prefix('gudang')->group(function () {
        Route::get('/', [GudangController::class, 'index']);
        Route::post('/', [GudangController::class, 'store']);
        Route::get('/{id}', [GudangController::class, 'show']);
        Route::put('/{id}', [GudangController::class, 'update']);
        Route::delete('/{id}', [GudangController::class, 'destroy']);
    });
});
