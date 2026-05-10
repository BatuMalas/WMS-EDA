<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Transaksis Indexes
        Schema::table('transaksis', function (Blueprint $table) {
            $table->index('status');
            $table->index(['jenis', 'status']);
            $table->index('tanggal');
            $table->index('approved_at');
        });

        // 2. Barangs Indexes
        Schema::table('barangs', function (Blueprint $table) {
            $table->index('stok');
            $table->index('kategori_id');
        });

        // 3. Stock Batches - additional composite indexes
        Schema::table('stock_batches', function (Blueprint $table) {
            // Already has [barang_id, sisa_stok], [barang_id, tanggal_masuk], [barang_id, tanggal_kadaluarsa]
            $table->index(['sisa_stok', 'tanggal_kadaluarsa']);
        });

        // 4. Activity Logs - ensure these are efficient
        Schema::table('activity_logs', function (Blueprint $table) {
            // Already has [user_id, created_at], [module, action], created_at
            // Add index for searching by module + created_at
            $table->index(['module', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['jenis', 'status']);
            $table->dropIndex(['tanggal']);
            $table->dropIndex(['approved_at']);
        });

        Schema::table('barangs', function (Blueprint $table) {
            $table->dropIndex(['stok']);
            $table->dropIndex(['kategori_id']);
        });

        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropIndex(['sisa_stok', 'tanggal_kadaluarsa']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['module', 'created_at']);
        });
    }
};
