FROM php:8.3-cli

# PHP extensions required by Laravel + MySQL; GD for images (tests make fake pictures with it)
RUN apt-get update && apt-get install -y \
        git unzip libzip-dev libonig-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath gd \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# Allow file uploads up to 10 MB each, 50 MB per request
RUN { echo "upload_max_filesize=10M"; echo "post_max_size=50M"; } > /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /var/www/html

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
