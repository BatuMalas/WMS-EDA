<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gudang extends Model
{
    use HasFactory;

    protected $table = 'gudangs';

    protected $fillable = [
        'kode_gudang',
        'nama_gudang',
        'deskripsi',
    ];

    /**
     * Relasi ke stock batches di gudang ini.
     */
    public function stockBatches()
    {
        return $this->hasMany(StockBatch::class, 'gudang_id');
    }

    /**
     * Batch yang masih punya sisa stok di gudang ini.
     */
    public function availableBatches()
    {
        return $this->stockBatches()->where('sisa_stok', '>', 0);
    }

    /**
     * Total stok di gudang ini (sum sisa_stok semua batch).
     */
    public function getTotalStokAttribute(): int
    {
        return (int) $this->stockBatches()->sum('sisa_stok');
    }

    protected $appends = ['total_stok'];
}
