<?php

namespace App\Modules\Customer;

use App\Modules\Customer\Services\CustomerService;
use App\Modules\Shared\Contracts\CustomerServiceInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CustomerServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CustomerServiceInterface::class, CustomerService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Routes/api.php');

        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');
    }
}
