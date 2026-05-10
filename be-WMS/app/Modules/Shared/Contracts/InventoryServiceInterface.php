<?php

namespace App\Modules\Shared\Contracts;

interface InventoryServiceInterface
{
    public function getAll();

    public function getById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);

    public function tambahStok(int $id, int $jumlah, array $batchData = []);

    public function kurangiStok(int $id, int $jumlah, ?int $transaksiKeluarId = null);

    public function getStockBatches(int $barangId);

    public function getAgingStock(): array;

    /**
     * Mendapatkan ringkasan data inventory untuk dashboard.
     */
    public function getSummary(): array;

    /**
     * Total nilai aset seluruh inventory (SUM sisa_stok × harga_satuan).
     */
    public function getAssetValue(): float;

    /**
     * Barang yang stoknya di bawah stok_min.
     */
    public function getLowStockItems(int $limit = 10): array;

    /**
     * Distribusi stok per kategori (untuk pie chart).
     */
    public function getStockByKategori(): array;
}
