<?php

namespace App\Providers;

use App\Modules\Auth\AuthServiceProvider;
use App\Modules\Customer\CustomerServiceProvider;
use App\Modules\Inventory\InventoryServiceProvider;
use App\Modules\Supplier\SupplierServiceProvider;
use App\Modules\Transaction\TransactionServiceProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register module service providers
        // Auth harus pertama karena middleware dibutuhkan modul lain
        $this->app->register(AuthServiceProvider::class);
        $this->app->register(InventoryServiceProvider::class);
        $this->app->register(SupplierServiceProvider::class);
        $this->app->register(TransactionServiceProvider::class);
        $this->app->register(CustomerServiceProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
