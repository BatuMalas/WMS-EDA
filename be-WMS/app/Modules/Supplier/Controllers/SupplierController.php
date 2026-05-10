<?php

namespace App\Modules\Supplier\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Contracts\SupplierServiceInterface;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SupplierController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SupplierServiceInterface $supplierService
    ) {}

    public function index()
    {
        $suppliers = $this->supplierService->getAll();

        return $this->success($suppliers, 'Data supplier berhasil diambil');
    }

    public function store(Request $request)
    {
        try {
            $supplier = $this->supplierService->create($request->all());

            return $this->created($supplier, 'Supplier berhasil ditambahkan');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function show(int $id)
    {
        $supplier = $this->supplierService->getById($id);

        if (!$supplier) {
            return $this->notFound('Supplier tidak ditemukan');
        }

        return $this->success($supplier);
    }

    public function update(Request $request, int $id)
    {
        try {
            $supplier = $this->supplierService->update($id, $request->all());

            if (!$supplier) {
                return $this->notFound('Supplier tidak ditemukan');
            }

            return $this->success($supplier, 'Supplier berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function destroy(int $id)
    {
        $deleted = $this->supplierService->delete($id);

        if (!$deleted) {
            return $this->notFound('Supplier tidak ditemukan');
        }

        return $this->success(null, 'Supplier berhasil dihapus');
    }
}
