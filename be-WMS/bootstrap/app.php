<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', // PASTIKAN ini ada!
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // ->withMiddleware(function (Middleware $middleware) {
    //     // Middleware global - tambah di sini
    //     $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        
    //     // Middleware group 'web'
    //     $middleware->web([
    //         \Illuminate\Cookie\Middleware\EncryptCookies::class,
    //         \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    //         \Illuminate\Session\Middleware\StartSession::class,
    //         \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    //         \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    //         \Illuminate\Routing\Middleware\SubstituteBindings::class,
    //         // \Illuminate\Session\Middleware\AuthenticateSession::class,
    //     ]);
        
    //     // Middleware group 'api'
    //     $middleware->api([
    //         \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
    //         \Illuminate\Routing\Middleware\SubstituteBindings::class,
    //     ]);
        
    //     // Alias middleware (jika perlu)
    //     // $middleware->alias([
    //     //     'auth' => \App\Http\Middleware\Authenticate::class,
    //     // ]);
    // })
    ->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    
    $middleware->web([/* ... */]);
    
    // API middleware TANPA throttle
    $middleware->api([
        \App\Http\Middleware\PrometheusMetrics::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
})
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();