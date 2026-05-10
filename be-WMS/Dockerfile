FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    nginx \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && pecl install redis && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# PHP-FPM: naikkan jumlah worker agar bisa handle concurrent request
RUN echo '[www]' > /usr/local/etc/php-fpm.d/www.conf \
 && echo 'user = www-data' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'group = www-data' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'listen = 127.0.0.1:9000' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm = dynamic' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.max_children = 50' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.start_servers = 10' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.min_spare_servers = 5' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.max_spare_servers = 20' >> /usr/local/etc/php-fpm.d/www.conf \
 && echo 'pm.max_requests = 500' >> /usr/local/etc/php-fpm.d/www.conf

# Konfigurasi Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Script entrypoint: jalankan PHP-FPM + Nginx bersamaan
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Set working directory
WORKDIR /var/www

EXPOSE 8000

CMD ["/start.sh"]
