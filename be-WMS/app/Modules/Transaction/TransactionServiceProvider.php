<?php

namespace App\Modules\Transaction;

use App\Modules\Transaction\Services\TransaksiService;
use App\Modules\Shared\Contracts\TransactionServiceInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use App\Modules\Transaction\Events\TransactionApproved;
use App\Modules\Transaction\Listeners\UpdateInventoryStock;
use App\Modules\Transaction\Listeners\LogApprovalActivity;
use App\Modules\Transaction\Listeners\GenerateInvoicePdf;

class TransactionServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(TransactionServiceInterface::class, TransaksiService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Routes/api.php');

        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');

        // Event Registration
        Event::listen(
            TransactionApproved::class,
            UpdateInventoryStock::class
        );
        Event::listen(
            TransactionApproved::class,
            LogApprovalActivity::class
        );
        Event::listen(
            TransactionApproved::class,
            GenerateInvoicePdf::class
        );
    }
}
