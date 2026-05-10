<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->enum('status', ['pending', 'diterima', 'ditolak'])->default('pending')->after('keterangan');
            $table->foreignId('approved_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->string('invoice_number')->nullable()->after('approved_at');
            $table->foreignId('customer_id')->nullable()->after('supplier_id')->constrained('customers')->nullOnDelete();
            $table->string('gudang_rak')->nullable()->after('customer_id');
        });
    }

    public function down(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['customer_id']);
            $table->dropColumn([
                'status', 'approved_by', 'approved_at',
                'invoice_number', 'customer_id', 'gudang_rak',
            ]);
        });
    }
};
