<?php

namespace App\Modules\Auth;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Register middleware aliases
        $router = $this->app['router'];
        $router->aliasMiddleware('jwt.auth', \App\Modules\Auth\Middleware\JwtAuthenticate::class);
        $router->aliasMiddleware('role', \App\Modules\Auth\Middleware\CheckRole::class);

        // Load routes
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Routes/api.php');

        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');
    }
}
