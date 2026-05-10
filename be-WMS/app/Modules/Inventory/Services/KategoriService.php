<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Kategori;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class KategoriService
{
    public function getAll()
    {
        return Kategori::latest()->get();
    }

    public function getById(int $id)
    {
        return Kategori::find($id);
    }

    public function create(array $data)
    {
        $validator = Validator::make($data, [
            'kode_kategori' => 'required|unique:kategoris',
            'nama_kategori' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return Kategori::create($data);
    }

    public function update(int $id, array $data)
    {
        $kategori = Kategori::find($id);

        if (!$kategori) {
            return null;
        }

        $validator = Validator::make($data, [
            'kode_kategori' => 'required|unique:kategoris,kode_kategori,' . $id,
            'nama_kategori' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $kategori->update($data);

        return $kategori;
    }

    public function delete(int $id)
    {
        $kategori = Kategori::find($id);

        if (!$kategori) {
            return false;
        }

        $kategori->delete();

        return true;
    }
}
