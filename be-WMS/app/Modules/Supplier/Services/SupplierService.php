<?php

namespace App\Modules\Supplier\Services;

use App\Modules\Supplier\Models\Supplier;
use App\Modules\Shared\Contracts\SupplierServiceInterface;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SupplierService implements SupplierServiceInterface
{
    public function getAll()
    {
        return Supplier::latest()->get();
    }

    public function getById(int $id)
    {
        return Supplier::find($id);
    }

    public function create(array $data)
    {
        $validator = Validator::make($data, [
            'kode_supplier' => 'required|unique:suppliers',
            'nama_supplier' => 'required|string|max:255',
            'nama_kontak' => 'nullable|string|max:255',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'kota' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return Supplier::create($data);
    }

    public function update(int $id, array $data)
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return null;
        }

        $validator = Validator::make($data, [
            'kode_supplier' => 'required|unique:suppliers,kode_supplier,' . $id,
            'nama_supplier' => 'required|string|max:255',
            'nama_kontak' => 'nullable|string|max:255',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'kota' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $supplier->update($data);

        return $supplier;
    }

    public function delete(int $id)
    {
        $supplier = Supplier::find($id);

        if (!$supplier) {
            return false;
        }

        $supplier->delete();

        return true;
    }

    public function getSummary(): array
    {
        return [
            'total_supplier' => Supplier::count(),
        ];
    }

    /**
     * Top supplier berdasarkan jumlah transaksi masuk.
     */
    public function getTopSuppliers(int $limit = 5): array
    {
        return Supplier::select('suppliers.*')
            ->selectRaw('(SELECT COUNT(*) FROM transaksis WHERE transaksis.supplier_id = suppliers.id AND transaksis.status = "diterima") as total_transaksi')
            ->selectRaw('(SELECT SUM(jumlah) FROM transaksis WHERE transaksis.supplier_id = suppliers.id AND transaksis.status = "diterima") as total_unit')
            ->orderByDesc('total_transaksi')
            ->limit($limit)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'kode_supplier' => $s->kode_supplier,
                'nama_supplier' => $s->nama_supplier,
                'telepon' => $s->telepon,
                'kota' => $s->kota,
                'total_transaksi' => (int) $s->total_transaksi,
                'total_unit' => (int) ($s->total_unit ?? 0),
            ])
            ->toArray();
    }
}

