<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    use HasFactory;

    protected $table = 'barangs';

    protected $fillable = [
        'kode_barang',
        'nama',
        'satuan',
        'kategori_id',
        'stok',
        'lokasi',
        'gudang_rak',
        'harga_beli',
        'harga_jual',
        'kadaluarsa',
        'stok_min',
        'deskripsi',
        'keterangan',
        'batas_aging_hari',
    ];

    protected $casts = [
        'stok' => 'integer',
        'stok_min' => 'integer',
        'harga_beli' => 'decimal:2',
        'harga_jual' => 'decimal:2',
        'kadaluarsa' => 'date',
        'batas_aging_hari' => 'integer',
    ];

    protected $appends = ['harga_terakhir', 'harga_rata', 'total_nilai_stok'];

    // ─── Relationships ───

    /**
     * Relasi ke kategori.
     */
    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }

    /**
     * Relasi ke transaksi.
     */
    public function transaksis()
    {
        return $this->hasMany(\App\Modules\Transaction\Models\Transaksi::class);
    }

    /**
     * Relasi ke stock batches.
     */
    public function stockBatches()
    {
        return $this->hasMany(StockBatch::class);
    }

    /**
     * Batch yang masih punya sisa stok.
     */
    public function availableBatches()
    {
        return $this->stockBatches()->available()->oldestFirst();
    }

    // ─── Methods ───

    /**
     * Hitung ulang stok dari total sisa_stok batch.
     */
    public function syncStokDariBatch(): int
    {
        $totalStok = $this->stockBatches()->sum('sisa_stok');
        $this->stok = $totalStok;
        $this->save();

        return $totalStok;
    }

    /**
     * Ambil batch tertua yang masih ada stoknya.
     */
    public function getBatchTertua()
    {
        return $this->stockBatches()
            ->available()
            ->oldestFirst()
            ->first();
    }

    /**
     * Ambil batch-batch yang sudah melewati batas aging.
     */
    public function getAgingBatches()
    {
        return $this->stockBatches()
            ->available()
            ->aging($this->batas_aging_hari ?? 180)
            ->oldestFirst()
            ->get();
    }

    /**
     * Ambil batch-batch yang sudah kadaluarsa.
     */
    public function getExpiredBatches()
    {
        return $this->stockBatches()
            ->available()
            ->expired()
            ->get();
    }

    // ─── Price Accessors ───

    /**
     * Harga terakhir dari batch paling baru.
     */
    public function getHargaTerakhirAttribute(): float
    {
        $latestBatch = $this->stockBatches()
            ->where('harga_satuan', '>', 0)
            ->latest('tanggal_masuk')
            ->first();

        return (float) ($latestBatch?->harga_satuan ?? 0);
    }

    /**
     * Harga rata-rata tertimbang dari semua batch yang masih punya stok.
     */
    public function getHargaRataAttribute(): float
    {
        $batches = $this->stockBatches()
            ->available()
            ->where('harga_satuan', '>', 0)
            ->get();

        if ($batches->isEmpty()) {
            return 0;
        }

        $totalNilai = $batches->sum(fn ($b) => $b->sisa_stok * $b->harga_satuan);
        $totalStok = $batches->sum('sisa_stok');

        return $totalStok > 0 ? round($totalNilai / $totalStok, 2) : 0;
    }

    /**
     * Total nilai seluruh stok (sum sisa_stok × harga_satuan per batch).
     */
    public function getTotalNilaiStokAttribute(): float
    {
        return (float) $this->stockBatches()
            ->available()
            ->selectRaw('SUM(sisa_stok * harga_satuan) as total')
            ->value('total') ?? 0;
    }

    /**
     * Override factory untuk mendukung namespace modul.
     */
    protected static function newFactory()
    {
        return \App\Modules\Inventory\Database\Factories\BarangFactory::new();
    }
}
