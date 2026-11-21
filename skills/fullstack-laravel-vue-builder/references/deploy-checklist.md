# Release checklist
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, fresh `APP_KEY`
- [ ] Build Vue (`npm run build`) and serve `dist/` with Nginx; proxy `/api`, `/sanctum` to PHP-FPM
- [ ] HTTPS; `SESSION_SECURE_COOKIE=true`; `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL` = real domain
- [ ] `php artisan migrate --force`, `config:cache`, `route:cache`, `view:cache`
- [ ] Create the first admin with `php artisan app:user`, never with demo data
- [ ] Queue worker under Supervisor if jobs are used; scheduler cron `* * * * * php artisan schedule:run`
- [ ] Daily DB + storage backup that **checks the dump** and keeps 30 daily / 12 monthly; restore tested
- [ ] CI green: `php artisan test` (SQLite memory) + `npm run build`; `composer audit`, `npm audit`
