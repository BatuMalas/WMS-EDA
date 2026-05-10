<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class StockBatch extends Model
{
    protected $table = 'stock_batches';

    protected $fillable = [
        'kode_batch',
        'barang_id',
        'transaksi_masuk_id',
        'jumlah_masuk',
        'sisa_stok',
        'harga_satuan',
        'tanggal_masuk',
        'tanggal_kadaluarsa',
        'supplier_id',
        'gudang_id',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_masuk' => 'date',
        'tanggal_kadaluarsa' => 'date',
        'jumlah_masuk' => 'integer',
        'sisa_stok' => 'integer',
        'harga_satuan' => 'decimal:2',
    ];

    protected $appends = ['umur_hari', 'is_aging', 'is_expired', 'total_nilai'];

    // ─── Relationships ───

    public function barang()
    {
        return $this->belongsTo(Barang::class);
    }

    public function transaksiMasuk()
    {
        return $this->belongsTo(\App\Modules\Transaction\Models\Transaksi::class, 'transaksi_masuk_id');
    }

    public function supplier()
    {
        return $this->belongsTo(\App\Modules\Supplier\Models\Supplier::class);
    }

    public function gudang()
    {
        return $this->belongsTo(Gudang::class, 'gudang_id');
    }

    public function outflows()
    {
        return $this->hasMany(BatchOutflow::class, 'stock_batch_id');
    }

    // ─── Scopes ───

    /**
     * Batch yang masih punya sisa stok.
     */
    public function scopeAvailable($query)
    {
        return $query->where('sisa_stok', '>', 0);
    }

    /**
     * Urutkan dari yang paling lama (FIFO).
     */
    public function scopeOldestFirst($query)
    {
        return $query->orderBy('tanggal_masuk', 'asc');
    }

    /**
     * Urutkan dari kadaluarsa paling dekat (FEFO).
     */
    public function scopeExpiringFirst($query)
    {
        return $query->orderByRaw('CASE WHEN tanggal_kadaluarsa IS NULL THEN 1 ELSE 0 END, tanggal_kadaluarsa ASC');
    }

    /**
     * Batch yang sudah melewati batas aging (berdasarkan hari).
     */
    public function scopeAging($query, int $days = 180)
    {
        return $query->where('tanggal_masuk', '<=', Carbon::now()->subDays($days));
    }

    /**
     * Batch yang sudah kadaluarsa.
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('tanggal_kadaluarsa')
                     ->where('tanggal_kadaluarsa', '<=', Carbon::today());
    }

    /**
     * Batch yang akan kadaluarsa dalam N hari.
     */
    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->whereNotNull('tanggal_kadaluarsa')
                     ->where('tanggal_kadaluarsa', '>', Carbon::today())
                     ->where('tanggal_kadaluarsa', '<=', Carbon::today()->addDays($days));
    }

    // ─── Accessors ───

    /**
     * Umur batch dalam hari sejak tanggal masuk.
     */
    public function getUmurHariAttribute(): int
    {
        return Carbon::parse($this->tanggal_masuk)->diffInDays(Carbon::now());
    }

    /**
     * Apakah batch sudah melewati batas aging barang.
     */
    public function getIsAgingAttribute(): bool
    {
        $batasHari = $this->barang?->batas_aging_hari ?? 180;
        return $this->umur_hari >= $batasHari;
    }

    /**
     * Apakah batch sudah kadaluarsa.
     */
    public function getIsExpiredAttribute(): bool
    {
        if (!$this->tanggal_kadaluarsa) {
            return false;
        }
        return Carbon::parse($this->tanggal_kadaluarsa)->isPast();
    }

    /**
     * Total nilai batch (sisa_stok × harga_satuan).
     */
    public function getTotalNilaiAttribute(): float
    {
        return $this->sisa_stok * ($this->harga_satuan ?? 0);
    }

    // ─── Helpers ───

    /**
     * Generate kode batch otomatis.
     */
    public static function generateKodeBatch(): string
    {
        $date = Carbon::now()->format('Ymd');
        $lastBatch = static::where('kode_batch', 'like', "BTH-{$date}-%")
            ->orderBy('kode_batch', 'desc')
            ->first();

        if ($lastBatch) {
            $lastNumber = (int) substr($lastBatch->kode_batch, -3);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf("BTH-%s-%03d-%s", $date, $nextNumber, strtoupper(bin2hex(random_bytes(2))));
    }
}
