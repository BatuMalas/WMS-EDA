<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware untuk mengumpulkan metrik HTTP dalam format Prometheus.
 * Data disimpan di Redis agar bisa diakses oleh endpoint /metrics.
 */
class PrometheusMetrics
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        /** @var Response $response */
        $response = $next($request);

        $duration = microtime(true) - $startTime;
        $method   = $request->method();
        $route    = $request->route()?->uri() ?? $request->path();
        $status   = $response->getStatusCode();

        // Simpan metrik ke Redis
        try {
            // Counter: total requests
            $counterKey = "prom:http_requests_total:{$method}:{$route}:{$status}";
            Redis::incr($counterKey);

            // Histogram bucket: duration (in seconds)
            $buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
            foreach ($buckets as $bucket) {
                if ($duration <= $bucket) {
                    $bucketKey = "prom:http_duration_bucket:{$route}:{$bucket}";
                    Redis::incr($bucketKey);
                }
            }
            // +Inf bucket (always incremented)
            Redis::incr("prom:http_duration_bucket:{$route}:+Inf");

            // Sum & Count for histogram
            Redis::incrbyfloat("prom:http_duration_sum:{$route}", $duration);
            Redis::incr("prom:http_duration_count:{$route}");

        } catch (\Exception $e) {
            // Jangan ganggu request jika Redis error
            \Log::warning('PrometheusMetrics: Redis error - ' . $e->getMessage());
        }

        return $response;
    }
}
