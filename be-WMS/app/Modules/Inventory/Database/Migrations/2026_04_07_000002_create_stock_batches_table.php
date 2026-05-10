<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->string('kode_batch')->unique();
            $table->foreignId('barang_id')->constrained('barangs')->onDelete('cascade');
            $table->foreignId('transaksi_masuk_id')->nullable()->constrained('transaksis')->onDelete('set null');
            $table->integer('jumlah_masuk');
            $table->integer('sisa_stok');
            $table->date('tanggal_masuk');
            $table->date('tanggal_kadaluarsa')->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['barang_id', 'sisa_stok']);
            $table->index(['barang_id', 'tanggal_masuk']);
            $table->index(['barang_id', 'tanggal_kadaluarsa']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};
