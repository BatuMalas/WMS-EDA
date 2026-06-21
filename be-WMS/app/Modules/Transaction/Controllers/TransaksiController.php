<?php

namespace App\Modules\Transaction\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Contracts\TransactionServiceInterface;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TransaksiController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected TransactionServiceInterface $transaksiService
    ) {}

    public function index(Request $request)
    {
        $filters = [
            'jenis' => $request->query('jenis'),
            'status' => $request->query('status'),
            'per_page' => $request->query('per_page', 10),
        ];

        $transaksi = $this->transaksiService->getAll($filters);

        return $this->success($transaksi, 'Data transaksi berhasil diambil');
    }

    public function store(Request $request)
    {
        try {
            $data = $request->all();

            // Pass uploaded file as part of data
            if ($request->hasFile('invoice_file')) {
                $data['invoice_file'] = $request->file('invoice_file');
            }

            $transaksi = $this->transaksiService->create($data);

            return $this->created($transaksi, 'Transaksi berhasil ditambahkan (menunggu approval)');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function show(int $id)
    {
        $transaksi = $this->transaksiService->getById($id);

        if (!$transaksi) {
            return $this->notFound('Transaksi tidak ditemukan');
        }

        return $this->success($transaksi);
    }

    public function update(Request $request, int $id)
    {
        try {
            $transaksi = $this->transaksiService->update($id, $request->all());

            if ($transaksi === null) {
                return $this->notFound('Transaksi tidak ditemukan');
            }

            if ($transaksi === false) {
                return $this->error('Transaksi sudah diproses, tidak bisa diubah', 422);
            }

            return $this->success($transaksi, 'Transaksi berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function destroy(int $id)
    {
        $result = $this->transaksiService->delete($id);

        if ($result === null) {
            return $this->notFound('Transaksi tidak ditemukan');
        }

        if ($result === 'approved') {
            return $this->error('Transaksi yang sudah disetujui tidak dapat dihapus', 422);
        }

        return $this->success(null, 'Transaksi berhasil dihapus');
    }

    /**
     * Approve transaksi (Manajer only).
     */
    public function approve(int $id)
    {
        try {
            $result = $this->transaksiService->approve($id);

            if ($result === null) {
                return $this->notFound('Transaksi tidak ditemukan');
            }

            if ($result === false) {
                return $this->error('Transaksi sudah diproses sebelumnya', 422);
            }

            return $this->success($result, 'Transaksi berhasil disetujui');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Reject transaksi (Manajer only).
     */
    public function reject(int $id)
    {
        $result = $this->transaksiService->reject($id);

        if ($result === null) {
            return $this->notFound('Transaksi tidak ditemukan');
        }

        if ($result === false) {
            return $this->error('Transaksi sudah diproses sebelumnya', 422);
        }

        return $this->success($result, 'Transaksi berhasil ditolak');
    }

    public function masukHariIni()
    {
        $data = $this->transaksiService->masukHariIni();

        return $this->success($data, 'Data transaksi masuk hari ini');
    }

    public function keluarHariIni()
    {
        $data = $this->transaksiService->keluarHariIni();

        return $this->success($data, 'Data transaksi keluar hari ini');
    }

    public function laporan(string $periode)
    {
        $data = $this->transaksiService->laporan($periode);

        return $this->success($data, "Laporan transaksi periode: {$periode}");
    }

    /**
     * Get stok barang summary.
     */
    public function stokBarang()
    {
        $data = $this->transaksiService->stokBarang();

        return $this->success($data, 'Data stok barang berhasil diambil');
    }

    /**
     * Download invoice file.
     */
    public function downloadInvoice(int $id)
    {
        $transaksi = $this->transaksiService->getById($id);

        if (!$transaksi) {
            return $this->notFound('Transaksi tidak ditemukan');
        }

        $path = $transaksi->invoice_generated ?? $transaksi->invoice_file;

        if (!$path || !Storage::disk('public')->exists($path)) {
            return $this->notFound('Invoice tidak ditemukan');
        }

        $fullPath = Storage::disk('public')->path($path);
        $filename = basename($path);

        return response()->download($fullPath, $filename);
    }

    /**
     * View invoice inline.
     */
    public function viewInvoice(int $id)
    {
        $transaksi = $this->transaksiService->getById($id);

        if (!$transaksi) {
            return $this->notFound('Transaksi tidak ditemukan');
        }

        $path = $transaksi->invoice_generated ?? $transaksi->invoice_file;

        if (!$path || !Storage::disk('public')->exists($path)) {
            return $this->notFound('Invoice tidak ditemukan');
        }

        $fullPath = Storage::disk('public')->path($path);
        $mimeType = Storage::disk('public')->mimeType($path);

        return response()->file($fullPath, [
            'Content-Type' => $mimeType,
        ]);
    }
}
