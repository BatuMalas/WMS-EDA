<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Services\KategoriService;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class KategoriController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected KategoriService $kategoriService
    ) {}

    public function index()
    {
        $kategoris = $this->kategoriService->getAll();

        return $this->success($kategoris, 'Data kategori berhasil diambil');
    }

    public function store(Request $request)
    {
        try {
            $kategori = $this->kategoriService->create($request->all());

            return $this->created($kategori, 'Kategori berhasil ditambahkan');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function show(int $id)
    {
        $kategori = $this->kategoriService->getById($id);

        if (!$kategori) {
            return $this->notFound('Kategori tidak ditemukan');
        }

        return $this->success($kategori);
    }

    public function update(Request $request, int $id)
    {
        try {
            $kategori = $this->kategoriService->update($id, $request->all());

            if (!$kategori) {
                return $this->notFound('Kategori tidak ditemukan');
            }

            return $this->success($kategori, 'Kategori berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function destroy(int $id)
    {
        $deleted = $this->kategoriService->delete($id);

        if (!$deleted) {
            return $this->notFound('Kategori tidak ditemukan');
        }

        return $this->success(null, 'Kategori berhasil dihapus');
    }
}
