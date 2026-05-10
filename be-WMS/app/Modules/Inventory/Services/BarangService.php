<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Barang;
use App\Modules\Inventory\Models\StockBatch;
use App\Modules\Inventory\Models\BatchOutflow;
use App\Modules\Shared\Contracts\InventoryServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class BarangService implements InventoryServiceInterface
{
    public function getAll()
    {
        return Barang::with('kategori')->get();
    }

    public function getById(int $id)
    {
        return Barang::find($id);
    }

    public function create(array $data)
    {
        $validator = Validator::make($data, [
            'kode_barang' => 'required|unique:barangs',
            'nama' => 'required|string|max:255',
            'stok' => 'required|integer|min:0',
            'lokasi' => 'required|string|max:100',
            'kategori_id' => 'nullable|exists:kategoris,id',
            'keterangan' => 'nullable|string',
            'batas_aging_hari' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return Barang::create($data);
    }

    public function update(int $id, array $data)
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return null;
        }

        $validator = Validator::make($data, [
            'kode_barang' => 'required|unique:barangs,kode_barang,' . $id,
            'nama' => 'required|string|max:255',
            'stok' => 'required|integer|min:0',
            'lokasi' => 'required|string|max:100',
            'kategori_id' => 'nullable|exists:kategoris,id',
            'keterangan' => 'nullable|string',
            'batas_aging_hari' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $barang->update($data);

        return $barang;
    }

    public function delete(int $id)
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return false;
        }

        $barang->delete();

        return true;
    }

    /**
     * Tambah stok dengan membuat StockBatch baru (FIFO entry).
     *
     * @param int   $id         Barang ID
     * @param int   $jumlah     Jumlah stok masuk
     * @param array $batchData  Data tambahan batch: tanggal_masuk, tanggal_kadaluarsa, supplier_id, keterangan, transaksi_masuk_id
     */
    public function tambahStok(int $id, int $jumlah, array $batchData = [])
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return null;
        }

        return DB::transaction(function () use ($id, $jumlah, $batchData) {
            // Lock the barang record
            $barang = Barang::lockForUpdate()->find($id);

            if (!$barang) {
                return null;
            }

            $stokLama = $barang->stok;

            // Buat batch baru
            $batch = StockBatch::create([
                'kode_batch' => StockBatch::generateKodeBatch(),
                'barang_id' => $barang->id,
                'transaksi_masuk_id' => $batchData['transaksi_masuk_id'] ?? null,
                'jumlah_masuk' => $jumlah,
                'sisa_stok' => $jumlah,
                'harga_satuan' => $batchData['harga_satuan'] ?? 0,
                'tanggal_masuk' => $batchData['tanggal_masuk'] ?? Carbon::today(),
                'tanggal_kadaluarsa' => $batchData['tanggal_kadaluarsa'] ?? null,
                'supplier_id' => $batchData['supplier_id'] ?? null,
                'gudang_id' => $batchData['gudang_id'] ?? null,
                'keterangan' => $batchData['keterangan'] ?? null,
            ]);

            // Sync stok cache di barangs
            $stokBaru = $barang->syncStokDariBatch();

            return [
                'id' => $barang->id,
                'nama' => $barang->nama,
                'stok_lama' => $stokLama,
                'stok_baru' => $stokBaru,
                'tambahan' => $jumlah,
                'batch' => $batch,
            ];
        });
    }

    /**
     * Kurangi stok menggunakan logika FIFO/FEFO.
     * Mengambil dari batch tertua (FIFO) atau yang paling dekat kadaluarsa (FEFO).
     *
     * @param int      $id                 Barang ID
     * @param int      $jumlah             Jumlah stok keluar
     * @param int|null $transaksiKeluarId   Transaksi keluar ID (untuk audit trail)
     */
    public function kurangiStok(int $id, int $jumlah, ?int $transaksiKeluarId = null)
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return null;
        }

        return DB::transaction(function () use ($id, $jumlah, $transaksiKeluarId) {
            // Lock the barang record to prevent concurrent updates to this item
            $barang = Barang::lockForUpdate()->find($id);

            if (!$barang) {
                return null;
            }

            // Cek total stok cukup (INSIDE transaction with lock)
            $totalAvailable = $barang->stockBatches()->available()->sum('sisa_stok');

            // Auto-create batch untuk data lama yang belum punya batch (INSIDE transaction)
            if ($totalAvailable == 0 && $barang->stok > 0) {
                StockBatch::create([
                    'kode_batch' => StockBatch::generateKodeBatch(),
                    'barang_id' => $barang->id,
                    'jumlah_masuk' => $barang->stok,
                    'sisa_stok' => $barang->stok,
                    'tanggal_masuk' => $barang->created_at ?? Carbon::today(),
                    'keterangan' => 'Auto-migrated dari data legacy',
                ]);
                $totalAvailable = $barang->stok;
            }

            if ($jumlah > $totalAvailable) {
                return false;
            }

            $stokLama = $barang->stok;
            $sisaYangPerluDiambil = $jumlah;
            $batchesUsed = [];

            // Ambil batch-batch available dengan LOCK
            // 1. Yang punya expiry date → urut dari yang paling dekat expired (FEFO)
            // 2. Yang tanpa expiry date → urut dari yang paling lama masuk (FIFO)
            $batches = $barang->stockBatches()
                ->available()
                ->lockForUpdate()
                ->orderByRaw('CASE WHEN tanggal_kadaluarsa IS NULL THEN 1 ELSE 0 END')
                ->orderBy('tanggal_kadaluarsa', 'asc')
                ->orderBy('tanggal_masuk', 'asc')
                ->get();

            foreach ($batches as $batch) {
                if ($sisaYangPerluDiambil <= 0) {
                    break;
                }

                $ambilDariBatch = min($sisaYangPerluDiambil, $batch->sisa_stok);
                $batch->sisa_stok -= $ambilDariBatch;
                $batch->save();

                // Catat outflow untuk audit trail
                if ($transaksiKeluarId) {
                    BatchOutflow::create([
                        'transaksi_keluar_id' => $transaksiKeluarId,
                        'stock_batch_id' => $batch->id,
                        'jumlah' => $ambilDariBatch,
                    ]);
                }

                $batchesUsed[] = [
                    'batch_id' => $batch->id,
                    'kode_batch' => $batch->kode_batch,
                    'tanggal_masuk' => $batch->tanggal_masuk->format('Y-m-d'),
                    'diambil' => $ambilDariBatch,
                    'sisa_stok_batch' => $batch->sisa_stok,
                ];

                $sisaYangPerluDiambil -= $ambilDariBatch;
            }

            // Sync stok cache
            $stokBaru = $barang->syncStokDariBatch();

            return [
                'id' => $barang->id,
                'nama' => $barang->nama,
                'stok_lama' => $stokLama,
                'stok_baru' => $stokBaru,
                'pengurangan' => $jumlah,
                'fifo_detail' => $batchesUsed,
            ];
        });
    }

    /**
     * Lihat semua stock batch suatu barang.
     */
    public function getStockBatches(int $barangId)
    {
        return StockBatch::with(['supplier', 'transaksiMasuk'])
            ->where('barang_id', $barangId)
            ->orderBy('tanggal_masuk', 'asc')
            ->get();
    }

    /**
     * Ambil semua batch yang sudah aging (melewati batas per barang).
     */
    public function getAgingStock(): array
    {
        $barangs = Barang::all();
        $agingItems = [];

        foreach ($barangs as $barang) {
            $agingBatches = $barang->stockBatches()
                ->available()
                ->where('tanggal_masuk', '<=', Carbon::now()->subDays($barang->batas_aging_hari ?? 180))
                ->oldestFirst()
                ->get();

            foreach ($agingBatches as $batch) {
                $agingItems[] = [
                    'batch_id' => $batch->id,
                    'kode_batch' => $batch->kode_batch,
                    'barang_id' => $barang->id,
                    'kode_barang' => $barang->kode_barang,
                    'nama_barang' => $barang->nama,
                    'lokasi' => $barang->lokasi,
                    'sisa_stok' => $batch->sisa_stok,
                    'tanggal_masuk' => $batch->tanggal_masuk->format('Y-m-d'),
                    'tanggal_kadaluarsa' => $batch->tanggal_kadaluarsa?->format('Y-m-d'),
                    'umur_hari' => $batch->umur_hari,
                    'batas_aging_hari' => $barang->batas_aging_hari ?? 180,
                    'is_expired' => $batch->is_expired,
                ];
            }
        }

        // Urutkan dari yang paling lama
        usort($agingItems, fn($a, $b) => $b['umur_hari'] - $a['umur_hari']);

        return $agingItems;
    }

    /**
     * Ringkasan data inventory untuk dashboard.
     */
    public function getSummary(): array
    {
        $agingStock = $this->getAgingStock();

        // Batch yang akan kadaluarsa dalam 30 hari
        $expiringSoon = StockBatch::available()
            ->expiringSoon(30)
            ->with('barang')
            ->get()
            ->map(fn($batch) => [
                'kode_batch' => $batch->kode_batch,
                'nama_barang' => $batch->barang->nama,
                'sisa_stok' => $batch->sisa_stok,
                'tanggal_kadaluarsa' => $batch->tanggal_kadaluarsa->format('Y-m-d'),
                'sisa_hari' => Carbon::today()->diffInDays($batch->tanggal_kadaluarsa),
            ]);

        // Low stock: barang yang stok <= stok_min
        $lowStockCount = Barang::whereColumn('stok', '<=', 'stok_min')
            ->where('stok_min', '>', 0)
            ->count();

        return [
            'total_barang' => Barang::count(),
            'total_stok' => Barang::sum('stok'),
            'low_stock_count' => $lowStockCount,
            'barang_low_stock' => Barang::where('stok', '<', 10)
                ->orderBy('stok', 'asc')
                ->limit(5)
                ->get(['id', 'kode_barang', 'nama', 'stok', 'lokasi']),
            'aging_stock' => array_slice($agingStock, 0, 5),
            'aging_stock_count' => count($agingStock),
            'expiring_soon' => $expiringSoon,
            'expiring_soon_count' => $expiringSoon->count(),
        ];
    }

    /**
     * Total nilai aset seluruh inventory.
     */
    public function getAssetValue(): float
    {
        return (float) StockBatch::available()
            ->selectRaw('SUM(sisa_stok * harga_satuan) as total')
            ->value('total') ?? 0;
    }

    /**
     * Barang yang stoknya di bawah stok_min.
     */
    public function getLowStockItems(int $limit = 10): array
    {
        return Barang::with('kategori')
            ->whereColumn('stok', '<=', 'stok_min')
            ->where('stok_min', '>', 0)
            ->orderByRaw('stok - stok_min ASC')
            ->limit($limit)
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'kode_barang' => $b->kode_barang,
                'nama' => $b->nama,
                'stok' => $b->stok,
                'stok_min' => $b->stok_min,
                'kategori' => $b->kategori?->nama ?? '-',
                'lokasi' => $b->lokasi,
                'selisih' => $b->stok - $b->stok_min,
            ])
            ->toArray();
    }

    /**
     * Distribusi stok per kategori (untuk pie chart).
     */
    public function getStockByKategori(): array
    {
        return Barang::with('kategori')
            ->selectRaw('kategori_id, SUM(stok) as total_stok')
            ->groupBy('kategori_id')
            ->get()
            ->map(fn($row) => [
                'name' => $row->kategori?->nama ?? 'Tanpa Kategori',
                'value' => (int) $row->total_stok,
            ])
            ->toArray();
    }
}

