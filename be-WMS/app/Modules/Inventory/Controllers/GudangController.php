<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Services\GudangService;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class GudangController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected GudangService $gudangService
    ) {}

    public function index()
    {
        $gudangs = $this->gudangService->getAll();

        return $this->success($gudangs, 'Data gudang berhasil diambil');
    }

    public function store(Request $request)
    {
        try {
            $gudang = $this->gudangService->create($request->all());

            return $this->created($gudang, 'Gudang berhasil ditambahkan');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function show(int $id)
    {
        $gudang = $this->gudangService->getById($id);

        if (!$gudang) {
            return $this->notFound('Gudang tidak ditemukan');
        }

        return $this->success($gudang);
    }

    public function update(Request $request, int $id)
    {
        try {
            $gudang = $this->gudangService->update($id, $request->all());

            if (!$gudang) {
                return $this->notFound('Gudang tidak ditemukan');
            }

            return $this->success($gudang, 'Gudang berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function destroy(int $id)
    {
        $result = $this->gudangService->delete($id);

        if ($result === false) {
            return $this->notFound('Gudang tidak ditemukan');
        }

        if ($result === 'has_stock') {
            return $this->error('Gudang masih memiliki stok, tidak dapat dihapus', 422);
        }

        return $this->success(null, 'Gudang berhasil dihapus');
    }

    /**
     * Gudang yang punya stok untuk barang tertentu.
     */
    public function gudangByBarang(int $barangId)
    {
        $data = $this->gudangService->getGudangByBarang($barangId);

        return $this->success($data, 'Daftar gudang dengan stok barang tersedia');
    }
}
