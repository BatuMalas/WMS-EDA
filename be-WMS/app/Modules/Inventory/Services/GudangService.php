<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Gudang;
use App\Modules\Inventory\Models\StockBatch;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class GudangService
{
    public function getAll()
    {
        return Gudang::latest()->get();
    }

    public function getById(int $id)
    {
        return Gudang::find($id);
    }

    public function create(array $data)
    {
        $validator = Validator::make($data, [
            'kode_gudang' => 'required|unique:gudangs',
            'nama_gudang' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return Gudang::create($data);
    }

    public function update(int $id, array $data)
    {
        $gudang = Gudang::find($id);

        if (!$gudang) {
            return null;
        }

        $validator = Validator::make($data, [
            'kode_gudang' => 'required|unique:gudangs,kode_gudang,' . $id,
            'nama_gudang' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $gudang->update($data);

        return $gudang;
    }

    public function delete(int $id)
    {
        $gudang = Gudang::find($id);

        if (!$gudang) {
            return false;
        }

        // Cek apakah masih ada stok batch di gudang ini
        if ($gudang->availableBatches()->count() > 0) {
            return 'has_stock';
        }

        $gudang->delete();

        return true;
    }

    /**
     * Ambil daftar gudang yang memiliki stok available untuk barang tertentu.
     */
    public function getGudangByBarang(int $barangId): array
    {
        $batches = StockBatch::where('barang_id', $barangId)
            ->where('sisa_stok', '>', 0)
            ->whereNotNull('gudang_id')
            ->with('gudang')
            ->get();

        // Group by gudang_id
        $gudangMap = [];
        foreach ($batches as $batch) {
            $gid = $batch->gudang_id;
            if (!isset($gudangMap[$gid])) {
                $gudangMap[$gid] = [
                    'gudang_id' => $gid,
                    'kode_gudang' => $batch->gudang->kode_gudang ?? '-',
                    'nama_gudang' => $batch->gudang->nama_gudang ?? '-',
                    'total_stok' => 0,
                    'jumlah_batch' => 0,
                ];
            }
            $gudangMap[$gid]['total_stok'] += $batch->sisa_stok;
            $gudangMap[$gid]['jumlah_batch'] += 1;
        }

        return array_values($gudangMap);
    }
}
