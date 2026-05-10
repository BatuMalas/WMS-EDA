<?php

use App\Modules\Transaction\Controllers\TransaksiController;
use Illuminate\Support\Facades\Route;

Route::middleware('jwt.auth')->prefix('transaksi')->group(function () {
    Route::get('/', [TransaksiController::class, 'index']);
    Route::post('/', [TransaksiController::class, 'store']);
    Route::get('/hari-ini/masuk', [TransaksiController::class, 'masukHariIni']);
    Route::get('/hari-ini/keluar', [TransaksiController::class, 'keluarHariIni']);
    Route::get('/laporan/{periode}', [TransaksiController::class, 'laporan']);
    Route::get('/stok-barang', [TransaksiController::class, 'stokBarang']);
    Route::get('/{id}', [TransaksiController::class, 'show']);
    Route::put('/{id}', [TransaksiController::class, 'update']);
    Route::delete('/{id}', [TransaksiController::class, 'destroy']);
    Route::get('/{id}/invoice/download', [TransaksiController::class, 'downloadInvoice']);
    Route::get('/{id}/invoice/view', [TransaksiController::class, 'viewInvoice']);

    // Approval routes (manajer only)
    Route::middleware('role:manajer')->group(function () {
        Route::put('/{id}/approve', [TransaksiController::class, 'approve']);
        Route::put('/{id}/reject', [TransaksiController::class, 'reject']);
    });
});
