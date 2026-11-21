# Backend setup (Laravel + Sanctum SPA)

## laravel-app/.env
```
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=app_db
DB_USERNAME=app_user
DB_PASSWORD=<same as MYSQL_PASSWORD in root .env>
SESSION_DRIVER=database
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

## config/cors.php
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => array_filter(explode(',', env('FRONTEND_URL', 'http://localhost:5173'))),
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

## bootstrap/app.php
```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
    $middleware->alias([
        'role'         => \App\Http\Middleware\EnsureRole::class,
        'log.activity' => \App\Http\Middleware\LogActivity::class,
    ]);
})
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(fn (Request $r) => $r->is('api/*') || $r->expectsJson());
})
```

## users table additions
`phone` (unique), `role` (string, default `viewer`), `is_active` (bool), `last_login_at`, and for a self-service
role a FK such as `tenant_id` / `student_id` (unique, nullable).

## First admin login
Add an artisan closure command `app:user {phone} {name} {role=owner}` that asks for the password with
`$this->secret()` and validates `Password::min(8)->letters()->numbers()`.
