<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangs', function (Blueprint $table) {
            $table->string('satuan')->nullable()->after('nama');
            $table->foreignId('kategori_id')->nullable()->after('satuan')->constrained('kategoris')->nullOnDelete();
            $table->string('gudang_rak')->nullable()->after('lokasi');
            $table->decimal('harga_beli', 15, 2)->default(0)->after('gudang_rak');
            $table->decimal('harga_jual', 15, 2)->default(0)->after('harga_beli');
            $table->date('kadaluarsa')->nullable()->after('harga_jual');
            $table->integer('stok_min')->default(0)->after('kadaluarsa');
            $table->text('deskripsi')->nullable()->after('stok_min');
        });
    }

    public function down(): void
    {
        Schema::table('barangs', function (Blueprint $table) {
            $table->dropForeign(['kategori_id']);
            $table->dropColumn([
                'satuan', 'kategori_id', 'gudang_rak',
                'harga_beli', 'harga_jual', 'kadaluarsa',
                'stok_min', 'deskripsi',
            ]);
        });
    }
};
