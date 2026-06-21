<?php

namespace App\Modules\Transaction\Listeners;

use App\Modules\Transaction\Events\TransactionApproved;
use App\Modules\Shared\Contracts\TransactionServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class GenerateInvoicePdf implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Delay agar UpdateInventoryStock selesai membuat BatchOutflow terlebih dahulu.
     * Tanpa delay, listener ini bisa berjalan paralel dan tidak menemukan data FIFO.
     */
    public int $delay = 5;

    protected TransactionServiceInterface $transactionService;

    /**
     * Create the event listener.
     */
    public function __construct(TransactionServiceInterface $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Handle the event.
     */
    public function handle(TransactionApproved $event): void
    {
        $transaksi = $event->transaksi;

        if ($transaksi->jenis !== 'keluar') {
            return;
        }

        try {
            // Ambil detail FIFO yang baru saja dicatat oleh UpdateInventoryStock
            $fifoDetail = \App\Modules\Inventory\Models\BatchOutflow::with('stockBatch')
                ->where('transaksi_keluar_id', $transaksi->id)
                ->get()
                ->map(fn($out) => [
                    'kode_batch' => $out->stockBatch->kode_batch ?? '-',
                    'diambil' => $out->jumlah,
                    'tanggal_masuk' => $out->stockBatch?->tanggal_masuk?->format('Y-m-d') ?? '-',
                    'sisa_stok_batch' => $out->stockBatch?->sisa_stok ?? 0,
                ])
                ->toArray();

            $path = $this->transactionService->generateInvoiceKeluar($transaksi, $fifoDetail);
            $transaksi->update(['invoice_generated' => $path]);
            
            Log::info("Invoice generated for {$transaksi->kode_transaksi} at {$path}");
        } catch (\Exception $e) {
            Log::error("Failed to generate invoice for {$transaksi->kode_transaksi}: " . $e->getMessage());
        }
    }
}
