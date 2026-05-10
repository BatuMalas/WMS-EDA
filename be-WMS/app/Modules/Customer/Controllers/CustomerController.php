<?php

namespace App\Modules\Customer\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Contracts\CustomerServiceInterface;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerServiceInterface $customerService
    ) {}

    public function index()
    {
        $customers = $this->customerService->getAll();

        return $this->success($customers, 'Data customer berhasil diambil');
    }

    public function store(Request $request)
    {
        try {
            $customer = $this->customerService->create($request->all());

            return $this->created($customer, 'Customer berhasil ditambahkan');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function show(int $id)
    {
        $customer = $this->customerService->getById($id);

        if (!$customer) {
            return $this->notFound('Customer tidak ditemukan');
        }

        return $this->success($customer);
    }

    public function update(Request $request, int $id)
    {
        try {
            $customer = $this->customerService->update($id, $request->all());

            if (!$customer) {
                return $this->notFound('Customer tidak ditemukan');
            }

            return $this->success($customer, 'Customer berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function destroy(int $id)
    {
        $deleted = $this->customerService->delete($id);

        if (!$deleted) {
            return $this->notFound('Customer tidak ditemukan');
        }

        return $this->success(null, 'Customer berhasil dihapus');
    }
}
