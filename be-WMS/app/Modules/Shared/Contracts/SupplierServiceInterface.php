<?php

namespace App\Modules\Shared\Contracts;

interface SupplierServiceInterface
{
    public function getAll();

    public function getById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);

    /**
     * Mendapatkan ringkasan data supplier untuk dashboard.
     */
    public function getSummary(): array;

    /**
     * Top supplier berdasarkan jumlah transaksi masuk.
     */
    public function getTopSuppliers(int $limit = 5): array;
}
