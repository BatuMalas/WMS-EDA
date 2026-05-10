<?php

namespace App\Modules\Transaction\Listeners;

use App\Modules\Transaction\Events\TransactionApproved;
use App\Models\ActivityLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class LogApprovalActivity implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(TransactionApproved $event): void
    {
        $transaksi = $event->transaksi;

        ActivityLog::log(
            'approve_transaksi',
            'transaction',
            'Menyetujui transaksi ' . $transaksi->kode_transaksi . ' (' . $transaksi->jenis . ', ' . $transaksi->jumlah . ' unit) - [Processed Async]',
            $transaksi,
            null,
            $event->userId
        );
    }
}
