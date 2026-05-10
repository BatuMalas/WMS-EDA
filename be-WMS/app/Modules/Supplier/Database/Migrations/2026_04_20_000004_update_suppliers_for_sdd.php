<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->renameColumn('nama', 'nama_supplier');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('nama_kontak')->nullable()->after('nama_supplier');
            $table->string('kota')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['nama_kontak', 'kota']);
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->renameColumn('nama_supplier', 'nama');
        });
    }
};
