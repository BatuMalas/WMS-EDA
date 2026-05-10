<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Contracts\InventoryServiceInterface;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BarangController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected InventoryServiceInterface $barangService
    ) {}

    public function index()
    {
        $barang = $this->barangService->getAll();

        return $this->success($barang, 'Data barang berhasil diambil');
    }

    public function store(Request $request)
    {
        try {
            $barang = $this->barangService->create($request->all());

            return $this->created($barang, 'Barang berhasil ditambahkan');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function show(int $id)
    {
        $barang = $this->barangService->getById($id);

        if (!$barang) {
            return $this->notFound('Barang tidak ditemukan');
        }

        return $this->success($barang);
    }

    public function update(Request $request, int $id)
    {
        try {
            $barang = $this->barangService->update($id, $request->all());

            if (!$barang) {
                return $this->notFound('Barang tidak ditemukan');
            }

            return $this->success($barang, 'Barang berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function destroy(int $id)
    {
        $deleted = $this->barangService->delete($id);

        if (!$deleted) {
            return $this->notFound('Barang tidak ditemukan');
        }

        return $this->success(null, 'Barang berhasil dihapus');
    }

    public function tambahStok(Request $request, int $id)
    {
        $request->validate([
            'jumlah' => 'required|integer|min:1',
            'tanggal_masuk' => 'nullable|date',
            'tanggal_kadaluarsa' => 'nullable|date',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'keterangan' => 'nullable|string',
        ]);

        $result = $this->barangService->tambahStok($id, $request->jumlah, [
            'tanggal_masuk' => $request->tanggal_masuk,
            'tanggal_kadaluarsa' => $request->tanggal_kadaluarsa,
            'supplier_id' => $request->supplier_id,
            'keterangan' => $request->keterangan,
        ]);

        if ($result === null) {
            return $this->notFound('Barang tidak ditemukan');
        }

        return $this->success($result, 'Stok berhasil ditambahkan (batch baru dibuat)');
    }

    public function kurangiStok(Request $request, int $id)
    {
        $request->validate([
            'jumlah' => 'required|integer|min:1',
        ]);

        $result = $this->barangService->kurangiStok($id, $request->jumlah);

        if ($result === null) {
            return $this->notFound('Barang tidak ditemukan');
        }

        if ($result === false) {
            return $this->error('Stok tidak mencukupi', 422);
        }

        return $this->success($result, 'Stok berhasil dikurangi (FIFO)');
    }

    /**
     * Lihat stock batches suatu barang.
     */
    public function stockBatches(int $id)
    {
        $barang = $this->barangService->getById($id);

        if (!$barang) {
            return $this->notFound('Barang tidak ditemukan');
        }

        $batches = $this->barangService->getStockBatches($id);

        return $this->success([
            'barang' => $barang,
            'batches' => $batches,
        ], 'Stock batches berhasil diambil');
    }

    /**
     * Daftar semua barang/batch yang sudah aging.
     */
    public function agingStock()
    {
        $agingItems = $this->barangService->getAgingStock();

        return $this->success($agingItems, 'Data aging stock berhasil diambil');
    }
}
