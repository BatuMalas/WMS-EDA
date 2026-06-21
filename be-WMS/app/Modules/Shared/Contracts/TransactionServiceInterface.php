<?php

namespace App\Modules\Shared\Contracts;

interface TransactionServiceInterface
{
    public function getAll();

    public function getById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);

    public function approve(int $id);

    public function reject(int $id);

    public function masukHariIni();

    public function keluarHariIni();

    public function laporan(string $periode);

    public function stokBarang();

    /**
     * Mendapatkan ringkasan data transaksi untuk dashboard.
     */
    public function getSummary(): array;

    /**
     * Arus barang masuk/keluar per bulan (untuk bar chart).
     */
    public function getMonthlyFlow(int $months = 6): array;

    /**
     * Top N barang paling sering keluar (fast-moving products).
     */
    public function getTopMovingProducts(int $limit = 10): array;

    /**
     * Mutasi stok terbaru (transaksi approved).
     */
    public function getRecentMutations(int $limit = 10, ?string $startDate = null, ?string $endDate = null): array;

    /**
     * Hitung profit/loss bulan ini.
     */
    public function getMonthlyProfit(): array;
}
