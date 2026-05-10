#!/bin/sh
# =============================================================
# Entrypoint: jalankan PHP-FPM + Nginx bersamaan
# =============================================================
set -e

# Pastikan storage & cache writable
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true

# Jalankan PHP-FPM di background
php-fpm -D

# Tunggu FPM siap
sleep 1

echo "[start.sh] PHP-FPM started"
echo "[start.sh] Starting Nginx on port 8000..."

# Jalankan Nginx di foreground (agar container tetap hidup)
exec nginx -g "daemon off;"
