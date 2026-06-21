<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

/**
 * Controller untuk menyajikan metrik aplikasi dalam format Prometheus.
 * Endpoint ini di-scrape oleh Prometheus setiap 5 detik.
 */
class MetricsController extends Controller
{
    public function index(): \Illuminate\Http\Response
    {
        $output = '';

        try {
            // ─── HTTP Request Total Counter ──────────────────
            $output .= "# HELP http_requests_total Total number of HTTP requests\n";
            $output .= "# TYPE http_requests_total counter\n";

            $counterKeys = Redis::keys('prom:http_requests_total:*');
            foreach ($counterKeys as $key) {
                // Hapus prefix database Redis jika ada (misal "laravel_database_")
                $cleanKey = $this->cleanRedisKey($key);
                // Format: prom:http_requests_total:{method}:{route}:{status}
                $parts = explode(':', $cleanKey);
                if (count($parts) >= 5) {
                    $method = $parts[2];
                    $route  = $parts[3];
                    $status = $parts[4];
                    $value  = Redis::get($key) ?? 0;
                    $output .= "http_requests_total{method=\"{$method}\",route=\"{$route}\",status_code=\"{$status}\"} {$value}\n";
                }
            }

            // ─── HTTP Request Duration Histogram ─────────────
            $output .= "\n# HELP http_request_duration_seconds HTTP request duration in seconds\n";
            $output .= "# TYPE http_request_duration_seconds histogram\n";

            // Collect unique routes from duration keys
            $sumKeys = Redis::keys('prom:http_duration_sum:*');
            foreach ($sumKeys as $sumKey) {
                $cleanSumKey = $this->cleanRedisKey($sumKey);
                $parts = explode(':', $cleanSumKey);
                if (count($parts) >= 3) {
                    $route = $parts[2];
                    $sum   = Redis::get($sumKey) ?? 0;
                    $count = Redis::get("prom:http_duration_count:{$route}") ?? 0;

                    // Buckets
                    $buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
                    foreach ($buckets as $bucket) {
                        $bucketVal = Redis::get("prom:http_duration_bucket:{$route}:{$bucket}") ?? 0;
                        $output .= "http_request_duration_seconds_bucket{route=\"{$route}\",le=\"{$bucket}\"} {$bucketVal}\n";
                    }
                    $infVal = Redis::get("prom:http_duration_bucket:{$route}:+Inf") ?? 0;
                    $output .= "http_request_duration_seconds_bucket{route=\"{$route}\",le=\"+Inf\"} {$infVal}\n";
                    $output .= "http_request_duration_seconds_sum{route=\"{$route}\"} {$sum}\n";
                    $output .= "http_request_duration_seconds_count{route=\"{$route}\"} {$count}\n";
                }
            }

            // ─── Laravel Queue Metrics (from Redis) ──────────
            $output .= "\n# HELP laravel_queue_size Current size of Laravel queue\n";
            $output .= "# TYPE laravel_queue_size gauge\n";

            $queues = ['default'];
            foreach ($queues as $queue) {
                try {
                    $size = Redis::llen("queues:{$queue}") ?? 0;
                    $output .= "laravel_queue_size{queue=\"{$queue}\"} {$size}\n";
                } catch (\Exception $e) {
                    $output .= "laravel_queue_size{queue=\"{$queue}\"} 0\n";
                }
            }

        } catch (\Exception $e) {
            $output = "# Error collecting metrics: " . $e->getMessage() . "\n";
        }

        return response($output, 200, [
            'Content-Type' => 'text/plain; version=0.0.4; charset=utf-8',
        ]);
    }

    /**
     * Bersihkan prefix Redis key (laravel_database_ prefix).
     */
    private function cleanRedisKey(string $key): string
    {
        // Laravel menambahkan prefix "laravel_database_" secara default
        $prefix = config('database.redis.options.prefix', '');
        if ($prefix && str_starts_with($key, $prefix)) {
            return substr($key, strlen($prefix));
        }
        return $key;
    }
}
