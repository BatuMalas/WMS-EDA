<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');          // login, create_transaksi, approve, reject, create_barang, etc.
            $table->string('module');           // auth, inventory, transaction, supplier, customer
            $table->string('description');      // Human-readable description
            $table->string('subject_type')->nullable(); // Model class: App\Modules\Transaction\Models\Transaksi
            $table->unsignedBigInteger('subject_id')->nullable(); // ID of the related model
            $table->json('properties')->nullable();  // Extra data (old values, new values, etc.)
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['module', 'action']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
