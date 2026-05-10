<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class BatchOutflow extends Model
{
    protected $table = 'batch_outflows';

    protected $fillable = [
        'transaksi_keluar_id',
        'stock_batch_id',
        'jumlah',
    ];

    protected $casts = [
        'jumlah' => 'integer',
    ];

    /**
     * Transaksi keluar yang mengambil dari batch ini.
     */
    public function transaksiKeluar()
    {
        return $this->belongsTo(\App\Modules\Transaction\Models\Transaksi::class, 'transaksi_keluar_id');
    }

    /**
     * Batch asal stok diambil.
     */
    public function stockBatch()
    {
        return $this->belongsTo(StockBatch::class, 'stock_batch_id');
    }
}
