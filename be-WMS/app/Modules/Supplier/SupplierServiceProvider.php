<?php

namespace App\Modules\Supplier;

use App\Modules\Supplier\Services\SupplierService;
use App\Modules\Shared\Contracts\SupplierServiceInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class SupplierServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SupplierServiceInterface::class, SupplierService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Routes/api.php');

        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');
    }
}
