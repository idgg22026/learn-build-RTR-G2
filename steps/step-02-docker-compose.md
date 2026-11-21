# Step 2 — Docker Compose environment

## Goal
`docker compose up -d` starts **MySQL, phpMyAdmin, Laravel and Vue**. Everyone in the team gets the same versions.

## You will learn
- Writing small Dockerfiles for PHP and Node
- Compose services, ports, volumes, `depends_on`, and secrets read from `.env`
- Why ports are bound to `127.0.0.1` (not reachable from other computers on the Wi-Fi)

## Files
| File | Action |
|---|---|
| `docker/laravel/Dockerfile` | Created manually |
| `docker/vuejs/Dockerfile` | Created manually |
| `compose.yaml` | Created manually |
| `.env` (root, **not committed**) | Created manually |

## Do it

**`docker/laravel/Dockerfile`**
```dockerfile
FROM php:8.3-cli

# PHP extensions required by Laravel + MySQL; GD for images (tests make fake pictures with it)
RUN apt-get update && apt-get install -y \
        git unzip libzip-dev libonig-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath gd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# Allow file uploads up to 10 MB each, 50 MB per request
RUN { echo "upload_max_filesize=10M"; echo "post_max_size=50M"; } > /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /var/www/html
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

**`docker/vuejs/Dockerfile`**
```dockerfile
FROM node:22-alpine
WORKDIR /app
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**`compose.yaml`**
```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: cadt_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:?Set it in .env}
      MYSQL_DATABASE: rtr_room
      MYSQL_USER: rtr_user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:?Set it in .env}
    ports:
      - "127.0.0.1:3307:3306"     # 3307 so it does not clash with a local MySQL
    volumes:
      - mysql_data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: cadt_phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
    ports:
      - "127.0.0.1:8080:80"
    depends_on: [mysql]

  laravel:
    build: ./docker/laravel
    container_name: cadt_laravel
    volumes:
      - ./laravel-app:/var/www/html   # your code is live-mounted
    ports:
      - "127.0.0.1:8000:8000"
    depends_on: [mysql]

  vuejs:
    build: ./docker/vuejs
    container_name: cadt_vuejs
    volumes:
      - ./vuejs-app:/app
    ports:
      - "127.0.0.1:5173:5173"

volumes:
  mysql_data:
```

**`.env`** (root — only for compose; it is in `.gitignore`)
```
MYSQL_ROOT_PASSWORD=change-me-root
MYSQL_PASSWORD=change-me
```

```bash
docker compose build
docker compose up -d mysql phpmyadmin
```
The `laravel` and `vuejs` services start in steps 3 and 4, after their folders exist.

## Check
- `docker compose ps` shows `cadt_mysql` and `cadt_phpmyadmin` running.
- Open http://localhost:8080 and log in with `rtr_user` and your `MYSQL_PASSWORD`: database `rtr_room` exists.

## Practice
Add a `mailpit` service (image `axllent/mailpit`, ports `127.0.0.1:8025:8025` and `127.0.0.1:1025:1025`) so Laravel
can send test emails. Hint: `MAIL_HOST=mailpit`, `MAIL_PORT=1025`.

## Commit
```bash
git add . && git commit -m "Step 2: Docker Compose with MySQL, phpMyAdmin, Laravel and Vue images"
```
