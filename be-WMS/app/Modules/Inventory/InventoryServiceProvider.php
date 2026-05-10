<?php

namespace App\Modules\Inventory;

use App\Modules\Inventory\Services\BarangService;
use App\Modules\Shared\Contracts\InventoryServiceInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class InventoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(InventoryServiceInterface::class, BarangService::class);
    }

    public function boot(): void
    {
        // Load routes modul dengan prefix 'api' dan middleware 'api'
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Routes/api.php');

        // Load migrations modul
        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');
    }
}
