<?php

namespace App\Modules\Transaction\Events;

use App\Modules\Transaction\Models\Transaksi;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Transaksi $transaksi;
    public int $userId;

    /**
     * Create a new event instance.
     */
    public function __construct(Transaksi $transaksi, int $userId)
    {
        $this->transaksi = $transaksi;
        $this->userId = $userId;
    }
}
