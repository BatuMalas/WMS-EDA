<?php

namespace App\Modules\Transaction\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'transaksis';

    protected $fillable = [
        'kode_transaksi',
        'jenis',
        'tanggal',
        'barang_id',
        'jumlah',
        'supplier_id',
        'customer_id',
        'penerima',
        'pengambil',
        'keterangan',
        'harga_satuan',
        'invoice_file',
        'invoice_generated',
        'status',
        'approved_by',
        'approved_at',
        'invoice_number',
        'gudang_rak',
        'gudang_id',
        'inventory_processed_at',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jumlah' => 'integer',
        'harga_satuan' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    protected $appends = ['invoice_url', 'invoice_generated_url', 'total_harga'];

    // ─── Relationships ───

    /**
     * Relasi ke barang (modul Inventory).
     */
    public function barang()
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Barang::class);
    }

    /**
     * Relasi ke supplier (modul Supplier).
     */
    public function supplier()
    {
        return $this->belongsTo(\App\Modules\Supplier\Models\Supplier::class);
    }

    /**
     * Relasi ke customer (modul Customer).
     */
    public function customer()
    {
        return $this->belongsTo(\App\Modules\Customer\Models\Customer::class);
    }

    /**
     * User yang meng-approve transaksi.
     */
    public function approvedByUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    /**
     * Relasi ke gudang.
     */
    public function gudang()
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Gudang::class, 'gudang_id');
    }

    /**
     * Batch yang dibuat dari transaksi masuk ini.
     */
    public function stockBatch()
    {
        return $this->hasOne(\App\Modules\Inventory\Models\StockBatch::class, 'transaksi_masuk_id');
    }

    /**
     * Detail batch yang dikonsumsi oleh transaksi keluar ini (FIFO audit trail).
     */
    public function batchOutflows()
    {
        return $this->hasMany(\App\Modules\Inventory\Models\BatchOutflow::class, 'transaksi_keluar_id');
    }

    // ─── Scopes ───

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeDiterima($query)
    {
        return $query->where('status', 'diterima');
    }

    public function scopeDitolak($query)
    {
        return $query->where('status', 'ditolak');
    }

    public function scopeMasuk($query)
    {
        return $query->where('jenis', 'masuk');
    }

    public function scopeKeluar($query)
    {
        return $query->where('jenis', 'keluar');
    }

    // ─── Accessors ───

    /**
     * URL untuk invoice yang diupload (barang masuk).
     */
    public function getInvoiceUrlAttribute(): ?string
    {
        if (!$this->invoice_file) {
            return null;
        }
        return url('storage/' . $this->invoice_file);
    }

    /**
     * URL untuk invoice yang di-generate (barang keluar).
     */
    public function getInvoiceGeneratedUrlAttribute(): ?string
    {
        if (!$this->invoice_generated) {
            return null;
        }
        return url('storage/' . $this->invoice_generated);
    }

    /**
     * Total harga (jumlah × harga_satuan).
     */
    public function getTotalHargaAttribute(): float
    {
        return $this->jumlah * ($this->harga_satuan ?? 0);
    }

    /**
     * Override factory untuk mendukung namespace modul.
     */
    protected static function newFactory()
    {
        return \App\Modules\Transaction\Database\Factories\TransaksiFactory::new();
    }
}
