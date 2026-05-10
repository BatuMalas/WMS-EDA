<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_outflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaksi_keluar_id')->constrained('transaksis')->onDelete('cascade');
            $table->foreignId('stock_batch_id')->constrained('stock_batches')->onDelete('cascade');
            $table->integer('jumlah');
            $table->timestamps();

            $table->index(['transaksi_keluar_id']);
            $table->index(['stock_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_outflows');
    }
};
