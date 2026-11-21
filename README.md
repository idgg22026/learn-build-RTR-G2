# Learn Build RTR-G2

A 20-step course that teaches you to build **RTR Room**, the room-rental manager from
[phousopheap/Fullstack-RTR-G2-](https://github.com/phousopheap/Fullstack-RTR-G2-), from an empty folder to a tested,
Dockerised full-stack app.

| Layer | Technology |
|---|---|
| Backend API | Laravel 13 (PHP 8.3), Sanctum SPA cookie login, MySQL 8 |
| Frontend | Vue 3 (`<script setup>`), Vite, Pinia, Vue Router, Axios |
| UI kit | AdminLTE 3 + Bootstrap 4 + Font Awesome 5, SweetAlert2 |
| Dev environment | Docker Compose: `mysql`, `phpmyadmin`, `laravel`, `vuejs` |
| Quality | PHPUnit feature tests, GitHub Actions CI |

## What is in this folder

| Path | What it is |
|---|---|
| [steps/](steps/) | **The 20 lessons.** Do them in order. |
| [GUIDELINE.md](GUIDELINE.md) | The project analysed module by module: architecture, rules, and the main points to copy into your own projects |
| [figma/](figma/) | The Figma UX/UI file (design system + screens) and a script to finish the prototype |
| [skills/fullstack-laravel-vue-builder/](skills/fullstack-laravel-vue-builder/) | A Claude Code **skill** made from this project, so you (or Claude) can start the next project the same way |

## The project structure you will build

This follows the structure of the original repository exactly:

```
Fullstack-RTR-G2/
├── compose.yaml              # 4 services: mysql, phpmyadmin, laravel, vuejs
├── docker/
│   ├── laravel/Dockerfile    # php:8.3-cli + composer + pdo_mysql, gd, zip, bcmath
│   └── vuejs/Dockerfile      # node:22-alpine, runs "npm run dev"
├── laravel-app/              # the API (http://localhost:8000/api)
│   ├── app/
│   │   ├── Console/Commands/ # rtr:demo, imports
│   │   ├── Http/
│   │   │   ├── Controllers/  # thin: validate → call a Service → return a Resource
│   │   │   ├── Middleware/   # EnsureRole, LogActivity
│   │   │   ├── Requests/     # Store/Update form requests (validation rules)
│   │   │   └── Resources/    # JSON shape sent to Vue
│   │   ├── Models/           # Eloquent models, constants, relations
│   │   ├── Services/         # ALL business rules (invoices, meters, deposits…)
│   │   └── Support/          # PrivateFile (signed links), Totp (2FA)
│   ├── database/migrations/  # one migration per change, never edit an old one
│   ├── routes/api.php        # routes grouped by role
│   └── tests/Feature/        # one test file per feature
├── vuejs-app/                # the SPA (http://localhost:5173)
│   └── src/
│       ├── assets/rtr-theme.css
│       ├── components/<feature>/  # modals, badges, cards for each feature
│       ├── i18n/             # en.js, km.js (Khmer)
│       ├── layouts/AdminLayout.vue
│       ├── pages/<feature>/  # one page per menu item
│       ├── router/index.js   # meta.roles on every route
│       ├── services/         # one file per API resource (roomService.js…)
│       ├── stores/           # Pinia: auth, badges
│       └── utils/            # money, swal, tariff, khmer
├── scripts/backup.sh
└── .github/workflows/ci.yml
```

## The 20 steps

| # | Step | You build | Main files |
|---|---|---|---|
| 1 | [Plan the product and set up tools](steps/step-01-plan-and-tools.md) | Feature list, roles, folder skeleton | `README`, folders |
| 2 | [Docker Compose environment](steps/step-02-docker-compose.md) | 4 containers running | `compose.yaml`, `docker/*/Dockerfile` |
| 3 | [Create the Laravel API app](steps/step-03-laravel-app.md) | Laravel + MySQL + Sanctum | `laravel-app/`, `.env`, `bootstrap/app.php` |
| 4 | [Create the Vue SPA](steps/step-04-vue-app.md) | Vue + AdminLTE + Pinia + Router | `vuejs-app/`, `main.js` |
| 5 | [Design the database](steps/step-05-database-design.md) | ERD + first migrations | `database/migrations/*rooms*` |
| 6 | [Eloquent models](steps/step-06-models.md) | Room, Tenant models with constants and relations | `app/Models/` |
| 7 | [First REST API: Rooms CRUD](steps/step-07-rooms-api.md) | Request → Controller → Resource | `RoomController`, `StoreRoomRequest`, `RoomResource` |
| 8 | [Users, roles and login (backend)](steps/step-08-auth-backend.md) | Phone login, Sanctum cookies, `role:` middleware | `AuthController`, `EnsureRole`, `cors.php` |
| 9 | [Login on the frontend](steps/step-09-auth-frontend.md) | Axios client, auth store, router guard, Login page | `http.js`, `stores/auth.js`, `router/index.js` |
| 10 | [Admin layout and theme](steps/step-10-layout-theme.md) | Sidebar, Navbar, theme CSS | `AdminLayout.vue`, `Sidebar.vue`, `rtr-theme.css` |
| 11 | [Rooms page (full CRUD UI)](steps/step-11-rooms-page.md) | Table, filters, pagination, modal form, errors | `RoomListPage.vue`, `RoomFormModal.vue` |
| 12 | [Tenants, files and the Service layer](steps/step-12-tenants-services.md) | Tenant CRUD with photo/ID upload in a DB transaction | `TenantService`, `PrivateFile` |
| 13 | [Settings and utility tariffs](steps/step-13-settings-tariffs.md) | Key/value settings, tiered electricity and water prices | `Setting`, `UtilityTariff` |
| 14 | [Monthly meter readings](steps/step-14-meter-readings.md) | Reading sheet, usage, lock month | `MeterReadingService`, `UtilityPage.vue` |
| 15 | [Invoices and payments](steps/step-15-invoices.md) | Preview → generate → pay (USD/riel) → print | `InvoiceService`, `InvoiceListPage.vue` |
| 16 | [Deposit, contract and move-out](steps/step-16-deposit-contract.md) | Move-in payment, settlement, printable contract | `DepositService`, `ContractPrintPage.vue` |
| 17 | [Tenant portal (mobile)](steps/step-17-tenant-portal.md) | QR login card, portal pages, KHQR payment proof | `PortalController`, `pages/portal/*` |
| 18 | [Dashboard, expenses and reports](steps/step-18-dashboard-reports.md) | KPI cards, SVG charts, profit & loss | `DashboardService`, `KpiCard.vue` |
| 19 | [Khmer/English and security](steps/step-19-i18n-security.md) | i18n, 2FA, rate limits, activity log, signed files | `i18n/`, `TwoFactorController`, `LogActivity` |
| 20 | [Tests, demo data, CI and deployment](steps/step-20-tests-ci-deploy.md) | Feature tests, `rtr:demo`, GitHub Actions, backup | `tests/Feature/`, `ci.yml`, `backup.sh` |

## How each step is written

Every step file has the same parts, so you always know where you are:

1. **Goal**: what works at the end of the step.
2. **You will learn**: the concepts.
3. **Files**: every file you create or change, with its path in the project.
4. **Do it**: commands and code, in order.
5. **Check**: how to prove it works (a URL, a `curl`, a test).
6. **Practice**: a small exercise to do on your own. This is where you really learn.
7. **Commit**: the git commit message to use.

> Tip: keep the original repository open next to you. When a step says *"see the full file"*, open that path
> in [phousopheap/Fullstack-RTR-G2-](https://github.com/phousopheap/Fullstack-RTR-G2-) and compare.

## Run the finished project (to see the goal first)

```bash
git clone https://github.com/phousopheap/Fullstack-RTR-G2-.git && cd Fullstack-RTR-G2-
printf 'MYSQL_ROOT_PASSWORD=rootsecret\nMYSQL_PASSWORD=secret\n' > .env   # read by compose.yaml
cp laravel-app/.env.example laravel-app/.env   # then set DB_* as in DEMO.md (DB_HOST=mysql, DB_PASSWORD=secret)
cp vuejs-app/.env.example vuejs-app/.env
docker compose build
docker compose run --rm laravel composer install
docker compose run --rm vuejs npm ci
docker compose up -d
docker compose exec laravel php artisan key:generate --force
docker compose exec laravel php artisan migrate --force
docker compose exec laravel php artisan rtr:demo
```

Open http://localhost:5173 and log in with phone `010000001`, password `Demo1234` (owner).
