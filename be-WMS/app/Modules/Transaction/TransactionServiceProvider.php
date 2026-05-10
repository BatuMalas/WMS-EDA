<?php

namespace App\Modules\Transaction;

use App\Modules\Transaction\Services\TransaksiService;
use App\Modules\Shared\Contracts\TransactionServiceInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

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
    }
}
