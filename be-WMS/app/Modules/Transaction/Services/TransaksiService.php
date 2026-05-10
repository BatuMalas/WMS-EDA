<?php

namespace App\Modules\Transaction\Services;

use App\Models\ActivityLog;
use App\Modules\Transaction\Models\Transaksi;
use App\Modules\Shared\Contracts\TransactionServiceInterface;
use App\Modules\Shared\Contracts\InventoryServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class TransaksiService implements TransactionServiceInterface
{
    protected InventoryServiceInterface $inventoryService;

    public function __construct(InventoryServiceInterface $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function getAll()
    {
        return Transaksi::with(['barang', 'supplier', 'customer', 'approvedByUser', 'gudang'])->latest()->get();
    }

    public function getById(int $id)
    {
        return Transaksi::with(['barang', 'supplier', 'customer', 'approvedByUser', 'gudang', 'batchOutflows.stockBatch'])->find($id);
    }

    public function create(array $data)
    {
        $rules = [
            'kode_transaksi' => 'required|unique:transaksis',
            'jenis' => 'required|in:masuk,keluar',
            'tanggal' => 'required|date',
            'barang_id' => 'required|exists:barangs,id',
            'jumlah' => 'required|integer|min:1',
            'penerima' => 'nullable|string|max:255',
            'pengambil' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
            'tanggal_kadaluarsa' => 'nullable|date|after:today',
            'harga_satuan' => 'nullable|numeric|min:0',
            'gudang_rak' => 'nullable|string|max:255',
            'gudang_id' => 'nullable|exists:gudangs,id',
        ];

        // Supplier wajib untuk barang masuk
        if (($data['jenis'] ?? '') === 'masuk') {
            $rules['supplier_id'] = 'required|exists:suppliers,id';
            $rules['invoice_file'] = 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120';
        } else {
            $rules['supplier_id'] = 'nullable|exists:suppliers,id';
            $rules['customer_id'] = 'nullable|exists:customers,id';
            $rules['invoice_number'] = 'nullable|string|max:255';
        }

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return DB::transaction(function () use ($data) {
            // Handle file upload
            $invoicePath = null;
            if (isset($data['invoice_file']) && $data['invoice_file'] instanceof \Illuminate\Http\UploadedFile) {
                $file = $data['invoice_file'];
                $filename = 'INV-MASUK-' . ($data['kode_transaksi'] ?? time()) . '.' . $file->getClientOriginalExtension();
                $invoicePath = $file->storeAs('invoices/masuk', $filename, 'public');
                unset($data['invoice_file']);
            } else {
                unset($data['invoice_file']);
            }

            // Remove non-model fields
            unset($data['tanggal_kadaluarsa_value']);

            // Create transaksi with status 'pending'
            $transaksiData = collect($data)->except(['invoice_file'])->toArray();
            $transaksiData['invoice_file'] = $invoicePath;
            $transaksiData['status'] = 'pending'; // Always pending on create

            // Auto-generate invoice number untuk barang keluar
            if (($transaksiData['jenis'] ?? '') === 'keluar' && empty($transaksiData['invoice_number'])) {
                $transaksiData['invoice_number'] = $this->generateInvoiceNumber();
            }

            $transaksi = Transaksi::create($transaksiData);

            // Log activity
            ActivityLog::log(
                'create_transaksi',
                'transaction',
                'Membuat transaksi ' . $transaksi->kode_transaksi . ' (' . $transaksi->jenis . ')',
                $transaksi
            );

            // Reload relasi
            $transaksi->load(['barang', 'supplier', 'customer', 'gudang']);

            return $transaksi;
        });
    }

    /**
     * Approve transaksi (Manajer).
     * Stok hanya diupdate saat approve.
     */
    public function approve(int $id)
    {
        $transaksi = Transaksi::find($id);

        if (!$transaksi) {
            return null;
        }

        if ($transaksi->status !== 'pending') {
            return false;
        }

        $result = DB::transaction(function () use ($transaksi) {
            $transaksi->update([
                'status' => 'diterima',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            $fifoDetail = [];

            if ($transaksi->jenis === 'masuk') {
                // BARANG MASUK → Buat batch baru
                $this->inventoryService->tambahStok(
                    $transaksi->barang_id,
                    $transaksi->jumlah,
                    [
                        'transaksi_masuk_id' => $transaksi->id,
                        'tanggal_masuk' => $transaksi->tanggal,
                        'supplier_id' => $transaksi->supplier_id,
                        'harga_satuan' => $transaksi->harga_satuan ?? 0,
                        'gudang_id' => $transaksi->gudang_id,
                        'keterangan' => $transaksi->keterangan,
                    ]
                );
            } elseif ($transaksi->jenis === 'keluar') {
                // BARANG KELUAR → Kurangi dari batch tertua (FIFO)
                $res = $this->inventoryService->kurangiStok(
                    $transaksi->barang_id,
                    $transaksi->jumlah,
                    $transaksi->id
                );

                if ($res === false) {
                    throw new \Exception('Stok tidak mencukupi untuk transaksi keluar.');
                }

                $fifoDetail = $res['fifo_detail'] ?? [];
            }

            // Log activity
            ActivityLog::log(
                'approve_transaksi',
                'transaction',
                'Menyetujui transaksi ' . $transaksi->kode_transaksi . ' (' . $transaksi->jenis . ', ' . $transaksi->jumlah . ' unit)',
                $transaksi
            );

            return ['fifo_detail' => $fifoDetail];
        });

        // Generate PDF OUTSIDE transaction to avoid holding DB locks during slow I/O
        if ($transaksi->jenis === 'keluar') {
            $invoiceGenerated = $this->generateInvoiceKeluar($transaksi, $result['fifo_detail']);
            $transaksi->update(['invoice_generated' => $invoiceGenerated]);
        }

        $transaksi->load(['barang', 'supplier', 'customer', 'approvedByUser', 'gudang']);

        return $transaksi;
    }

    /**
     * Reject transaksi (Manajer).
     */
    public function reject(int $id)
    {
        $transaksi = Transaksi::find($id);

        if (!$transaksi) {
            return null;
        }

        if ($transaksi->status !== 'pending') {
            return false;
        }

        $transaksi->update([
            'status' => 'ditolak',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        // Log activity
        ActivityLog::log(
            'reject_transaksi',
            'transaction',
            'Menolak transaksi ' . $transaksi->kode_transaksi,
            $transaksi
        );

        $transaksi->load(['barang', 'supplier', 'customer', 'approvedByUser']);

        return $transaksi;
    }

    /**
     * Generate PDF invoice untuk barang keluar.
     */
    public function generateInvoiceKeluar(Transaksi $transaksi, array $fifoDetail = []): string
    {
        $transaksi->load(['barang', 'supplier']);

        $pdf = Pdf::loadView('invoices.keluar', [
            'transaksi' => $transaksi,
            'fifoDetail' => $fifoDetail,
        ]);

        $pdf->setPaper('A4', 'portrait');

        $filename = 'INV-KELUAR-' . $transaksi->kode_transaksi . '.pdf';
        $path = 'invoices/keluar/' . $filename;

        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    /**
     * Generate nomor invoice otomatis untuk barang keluar.
     * Format: INV-OUT-YYYYMMDD-XXX
     */
    public function generateInvoiceNumber(): string
    {
        $date = Carbon::now()->format('Ymd');
        $lastInvoice = Transaksi::where('invoice_number', 'like', "INV-OUT-{$date}-%")
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->invoice_number, -3);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf("INV-OUT-%s-%03d", $date, $nextNumber);
    }

    public function update(int $id, array $data)
    {
        $transaksi = Transaksi::find($id);

        if (!$transaksi) {
            return null;
        }

        // Only allow update if still pending
        if ($transaksi->status !== 'pending') {
            return false;
        }

        $validator = Validator::make($data, [
            'kode_transaksi' => 'required|unique:transaksis,kode_transaksi,' . $id,
            'jenis' => 'required|in:masuk,keluar',
            'tanggal' => 'required|date',
            'barang_id' => 'required|exists:barangs,id',
            'jumlah' => 'required|integer|min:1',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'customer_id' => 'nullable|exists:customers,id',
            'penerima' => 'nullable|string|max:255',
            'pengambil' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
            'gudang_rak' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $transaksi->update($data);

        return $transaksi;
    }

    public function delete(int $id)
    {
        $transaksi = Transaksi::find($id);

        if (!$transaksi) {
            return null;
        }

        // Only allow deleting pending transactions
        if ($transaksi->status === 'diterima') {
            return 'approved'; // Cannot delete approved transactions 
        }

        $transaksi->delete();

        return true;
    }

    public function masukHariIni()
    {
        return Transaksi::with(['barang', 'supplier'])
            ->whereDate('tanggal', today())
            ->where('jenis', 'masuk')
            ->get();
    }

    public function keluarHariIni()
    {
        return Transaksi::with(['barang', 'supplier', 'customer'])
            ->whereDate('tanggal', today())
            ->where('jenis', 'keluar')
            ->get();
    }

    public function laporan(string $periode)
    {
        $query = Transaksi::with(['barang', 'supplier', 'customer']);

        switch ($periode) {
            case 'hari-ini':
                $query->whereDate('tanggal', today());
                break;
            case 'minggu-ini':
                $query->whereBetween('tanggal', [now()->startOfWeek(), now()->endOfWeek()]);
                break;
            case 'bulan-ini':
                $query->whereMonth('tanggal', now()->month)
                      ->whereYear('tanggal', now()->year);
                break;
            case 'tahun-ini':
                $query->whereYear('tanggal', now()->year);
                break;
        }

        return $query->latest()->get();
    }

    /**
     * Get stok barang summary (for manajer).
     */
    public function stokBarang()
    {
        $barangs = \App\Modules\Inventory\Models\Barang::all();

        return $barangs->map(function ($barang) {
            $masuk = Transaksi::where('barang_id', $barang->id)
                ->where('jenis', 'masuk')
                ->where('status', 'diterima')
                ->sum('jumlah');

            $keluar = Transaksi::where('barang_id', $barang->id)
                ->where('jenis', 'keluar')
                ->where('status', 'diterima')
                ->sum('jumlah');

            return [
                'id' => $barang->id,
                'kode_barang' => $barang->kode_barang,
                'nama' => $barang->nama,
                'jumlah_masuk' => (int) $masuk,
                'jumlah_keluar' => (int) $keluar,
                'stok_saat_ini' => $barang->stok,
            ];
        });
    }

    public function getSummary(): array
    {
        $transaksiMasukHariIni = Transaksi::whereDate('tanggal', today())
            ->where('jenis', 'masuk')
            ->count();

        $transaksiKeluarHariIni = Transaksi::whereDate('tanggal', today())
            ->where('jenis', 'keluar')
            ->count();

        $pendingCount = Transaksi::where('status', 'pending')->count();

        $latestTransaksi = Transaksi::with(['barang', 'supplier', 'customer'])
            ->latest()
            ->limit(5)
            ->get();

        return [
            'transaksi_masuk_hari_ini' => $transaksiMasukHariIni,
            'transaksi_keluar_hari_ini' => $transaksiKeluarHariIni,
            'total_transaksi_hari_ini' => $transaksiMasukHariIni + $transaksiKeluarHariIni,
            'pending_count' => $pendingCount,
            'latest_transaksi' => $latestTransaksi,
        ];
    }

    /**
     * Arus barang masuk/keluar per bulan (untuk bar chart).
     */
    public function getMonthlyFlow(int $months = 6): array
    {
        $result = [];
        $now = Carbon::now();

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $month = $date->month;
            $year = $date->year;

            $masuk = Transaksi::where('jenis', 'masuk')
                ->where('status', 'diterima')
                ->whereMonth('tanggal', $month)
                ->whereYear('tanggal', $year)
                ->sum('jumlah');

            $keluar = Transaksi::where('jenis', 'keluar')
                ->where('status', 'diterima')
                ->whereMonth('tanggal', $month)
                ->whereYear('tanggal', $year)
                ->sum('jumlah');

            $result[] = [
                'name' => $date->translatedFormat('M Y'),
                'masuk' => (int) $masuk,
                'keluar' => (int) $keluar,
            ];
        }

        return $result;
    }

    /**
     * Top N barang paling sering keluar (fast-moving products).
     */
    public function getTopMovingProducts(int $limit = 10): array
    {
        return Transaksi::where('jenis', 'keluar')
            ->where('status', 'diterima')
            ->selectRaw('barang_id, SUM(jumlah) as total_keluar')
            ->groupBy('barang_id')
            ->orderByDesc('total_keluar')
            ->limit($limit)
            ->with('barang:id,kode_barang,nama')
            ->get()
            ->map(fn($row) => [
                'name' => $row->barang?->nama ?? 'Unknown',
                'kode' => $row->barang?->kode_barang ?? '-',
                'total_keluar' => (int) $row->total_keluar,
            ])
            ->toArray();
    }

    /**
     * Mutasi stok terbaru (transaksi approved).
     */
    public function getRecentMutations(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Transaksi::with(['barang:id,kode_barang,nama', 'approvedByUser:id,name'])
            ->where('status', 'diterima');

        if ($startDate) {
            $query->whereDate('approved_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('approved_at', '<=', $endDate);
        }

        return $query->latest('approved_at')
            ->limit($limit)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'kode_transaksi' => $t->kode_transaksi,
                'jenis' => $t->jenis,
                'barang' => $t->barang?->nama ?? '-',
                'jumlah' => $t->jumlah,
                'tanggal' => $t->tanggal->format('Y-m-d'),
                'approved_by' => $t->approvedByUser?->name ?? '-',
                'approved_at' => $t->approved_at?->format('Y-m-d H:i'),
            ])
            ->toArray();
    }
}

