<?php

namespace App\Modules\Customer\Services;

use App\Modules\Customer\Models\Customer;
use App\Modules\Shared\Contracts\CustomerServiceInterface;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class CustomerService implements CustomerServiceInterface
{
    public function getAll()
    {
        return Customer::latest()->get();
    }

    public function getById(int $id)
    {
        return Customer::find($id);
    }

    public function create(array $data)
    {
        $validator = Validator::make($data, [
            'kode_customer' => 'required|unique:customers',
            'nama' => 'required|string|max:255',
            'telepon' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'alamat' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return Customer::create($data);
    }

    public function update(int $id, array $data)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return null;
        }

        $validator = Validator::make($data, [
            'kode_customer' => 'required|unique:customers,kode_customer,' . $id,
            'nama' => 'required|string|max:255',
            'telepon' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'alamat' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $customer->update($data);

        return $customer;
    }

    public function delete(int $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return false;
        }

        $customer->delete();

        return true;
    }

    public function getSummary(): array
    {
        return [
            'total_customer' => Customer::count(),
        ];
    }
}
