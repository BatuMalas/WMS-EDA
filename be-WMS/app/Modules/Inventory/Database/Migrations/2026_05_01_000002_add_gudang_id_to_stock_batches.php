<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->foreignId('gudang_id')->nullable()->after('supplier_id')
                  ->constrained('gudangs')->nullOnDelete();
        });

        Schema::table('transaksis', function (Blueprint $table) {
            $table->foreignId('gudang_id')->nullable()->after('gudang_rak')
                  ->constrained('gudangs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropForeign(['gudang_id']);
            $table->dropColumn('gudang_id');
        });

        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropForeign(['gudang_id']);
            $table->dropColumn('gudang_id');
        });
    }
};
