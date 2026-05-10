<?php

namespace App\Modules\Shared\Contracts;

interface CustomerServiceInterface
{
    public function getAll();

    public function getById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);

    /**
     * Mendapatkan ringkasan data customer untuk dashboard.
     */
    public function getSummary(): array;
}
