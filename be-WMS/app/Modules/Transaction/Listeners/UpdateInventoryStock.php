<?php

namespace App\Modules\Transaction\Listeners;

use App\Modules\Transaction\Events\TransactionApproved;
use App\Modules\Shared\Contracts\InventoryServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class UpdateInventoryStock implements ShouldQueue
{
    use InteractsWithQueue;

    protected InventoryServiceInterface $inventoryService;

    /**
     * Create the event listener.
     */
    public function __construct(InventoryServiceInterface $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Handle the event.
     */
    public function handle(TransactionApproved $event): void
    {
        $transaksi = $event->transaksi;

        // Idempotency Check: Pastikan stok belum diupdate untuk transaksi ini
        // Jika barang masuk, cek apakah sudah ada batch-nya
        // Jika barang keluar, cek apakah sudah ada record batch_outflows
        if ($this->isAlreadyProcessed($transaksi)) {
            Log::info("Transaction {$transaksi->kode_transaksi} already processed for inventory. Skipping.");
            return;
        }

        if ($transaksi->jenis === 'masuk') {
            $this->inventoryService->tambahStok(
                $transaksi->barang_id,
                $transaksi->jumlah,
                [
                    'transaksi_masuk_id' => $transaksi->id,
                    'tanggal_masuk' => $transaksi->tanggal,
                    'supplier_id' => $transaksi->supplier_id,
                    'harga_satuan' => $transaksi->harga_satuan ?? 0,
                    'gudang_id' => $transaksi->gudang_id,
                    'keterangan' => $transaksi->keterangan,
                ]
            );
        } elseif ($transaksi->jenis === 'keluar') {
            $res = $this->inventoryService->kurangiStok(
                $transaksi->barang_id,
                $transaksi->jumlah,
                $transaksi->id
            );

            if ($res === false) {
                // Strategi penanganan jika stok tiba-tiba tidak cukup di background
                Log::error("Async Inventory Update Failed: Insufficient stock for {$transaksi->kode_transaksi}");
                
                // Opsional: Revert status transaksi atau tandai sebagai error
                $transaksi->update(['status' => 'error']);
                return;
            }

            // Simpan detail FIFO jika diperlukan (misal untuk generate invoice nanti)
            // Karena ini asinkron, kita simpan detailnya ke metadata atau kolom tertentu
            $transaksi->update([
                'inventory_processed_at' => now(),
            ]);
        }
    }

    /**
     * Cek apakah transaksi sudah diproses stoknya (Idempotency).
     */
    protected function isAlreadyProcessed($transaksi): bool
    {
        if ($transaksi->jenis === 'masuk') {
            return \App\Modules\Inventory\Models\StockBatch::where('transaksi_masuk_id', $transaksi->id)->exists();
        } else {
            return \App\Modules\Inventory\Models\BatchOutflow::where('transaksi_keluar_id', $transaksi->id)->exists();
        }
    }
}
