# RTR-G2 Guideline: how this project is built, module by module

This document studies [phousopheap/Fullstack-RTR-G2-](https://github.com/phousopheap/Fullstack-RTR-G2-) one
part at a time and pulls out the **main points** you can reuse to build any similar full-stack app.
Read it after (or alongside) the [20 steps](steps/).

---

## 1. The big picture

```
 Browser (Vue SPA :5173)                         Laravel API (:8000)                     MySQL (:3306)
 ┌───────────────────────┐   cookie + XSRF   ┌──────────────────────────────┐        ┌──────────────┐
 │ pages/  → services/ ──┼──────────────────►│ routes/api.php (role groups) │        │ 33 migrations│
 │   ▲         http.js   │   JSON            │   ↓ middleware: auth:sanctum │        │ rooms        │
 │ stores/ (auth,badges) │◄──────────────────┤     role:… , log.activity    │        │ tenants      │
 │ router (meta.roles)   │                   │   ↓ FormRequest (validate)   │        │ meter_readings│
 │ i18n (en/km)          │                   │   ↓ Controller (thin)        │───────►│ invoices …   │
 └───────────────────────┘                   │   ↓ Service (business rules) │        └──────────────┘
                                             │   ↓ Model (Eloquent)         │        storage/app/private
                                             │   ↓ Resource (JSON shape)    │───────► (signed links)
                                             └──────────────────────────────┘
```

| Number | What |
|---|---|
| 20 controllers (+ base `Controller`) | one per resource, plus `PortalController` for tenants |
| 16 services | `app/Services`, where every money/date/meter rule lives |
| 24 models | `app/Models`, with constants for allowed values |
| 33 migrations | never edited after running; changes are new files |
| 13 feature test files | they call the real API (12 real + the example test) |
| 22 Vue pages + 28 components | one folder per feature |

---

## 2. Main points (the 15 rules this project follows)

1. **Two apps, one repo, Docker for everyone.** `laravel-app/` + `vuejs-app/` + `compose.yaml`. Ports bound to `127.0.0.1`.
2. **Roles first.** `owner > staff > viewer`, plus `tenant` in a separate portal. They shape routes, menus and the router guard.
3. **Routes grouped by permission level, not by feature.** *read* (owner, staff, viewer) → *work* (owner, staff) → *owner only*.
4. **Thin controllers, fat services.** A controller validates, calls one service method, and returns a Resource.
5. **Every rule that touches money runs in `DB::transaction()`**, with `lockForUpdate()` when two people could change the same row.
6. **Snapshot what you bill.** An invoice copies rent, rate, exchange rate, usage and amounts. Later price changes never rewrite history.
7. **Money as integers in the smallest unit** (riel). USD only as `decimal(10,2)` with the rate stored beside it.
8. **Never delete money records, void them.** Soft delete rooms and tenants; corrections are owner-only and logged.
9. **Allowed values live in model constants** (`Room::STATUSES`), reused in `Rule::in()`, resources and Vue dropdowns.
10. **Validation errors point at the field** (`readings.3.electric_current`), and Vue shows them under that input.
11. **Private by default.** Uploads go to `storage/app/private`; the API returns signed links that expire after 2 hours.
12. **Hide in the UI *and* refuse on the server.** `$can('owner')` in templates, plus `role:owner` on the route.
13. **One service file per API resource on the frontend** (`roomService.js`). Pages never call `axios` directly.
14. **Bilingual from the start.** `t('…')` everywhere; tenants default to Khmer, staff to English.
15. **Tests through the API + a demo command through the API.** If the demo works, the rules work.

---

## 3. Module-by-module study

### 3.1 Infrastructure (`compose.yaml`, `docker/`)
- **Files:** `compose.yaml`, `docker/laravel/Dockerfile`, `docker/vuejs/Dockerfile`, `scripts/backup.sh`, `.github/workflows/ci.yml`
- **How it works:** four services. The code is mounted as a volume, so edits are live. MySQL data sits in a named volume.
- **Main points:** secrets come from the root `.env` with `${VAR:?message}`, so Compose fails loudly if one is missing. PHP has the `gd` extension because tests generate fake images. The upload limit is raised to 10 MB. The backup script checks that the dump has more than 10 tables before it keeps it.
- **Reuse it:** copy the folder as-is and rename the containers.

### 3.2 Authentication and roles
- **Files:** `AuthController`, `TwoFactorController`, `EnsureRole`, `LogActivity`, `User`, `UserService`, `Support/Totp.php`; Vue: `services/http.js`, `stores/auth.js`, `router/index.js`, `LoginPage`, `QrLoginPage`, `AccountSecurityPage`
- **How it works:**
  - Staff log in with **phone + password**. The phone number is normalised, so `+855 12…` and `012…` are the same. Sanctum stores the session in a cookie, and the XSRF token protects it.
  - With 2FA on, the password step saves a **pending** marker in the session for 5 minutes. The next step asks for a TOTP code or a recovery code, and 5 wrong codes reset the login.
  - Tenants log in with a **QR card**: a random 48-character token whose sha256 is stored, sent as `/qr#token`, plus their phone number. 5 wrong tries lock the card.
  - `EnsureRole` runs on every request. A disabled login, or a tenant 30 days after moving out, is logged out at once.
- **Main points:** the same error message for a wrong phone or a wrong password; `throttle:5,1`; `session()->regenerate()` after login. The frontend interceptor retries once on 419 and redirects to login on 401.

### 3.3 Rooms
- **Files:** `RoomController`, `RoomItemController`, `RoomItemService`, `Store/UpdateRoomRequest`, `RoomResource`, `Room`, `RoomItem`; Vue: `pages/rooms/RoomListPage.vue`, `components/rooms/*`
- **How it works:** standard CRUD with search, status filter and pagination, plus a quick status change. Room items (bed, fan…) form the handover list that the contract copies on the move-in day.
- **Main points:** `unique()->whereNull('deleted_at')`, so a deleted room's number can be reused. An occupied room can't be deleted (422 with a clear message). Status `owner_use` takes the room out of billing.
- **This is the template module.** Copy its shape for any new resource.

### 3.4 Tenants
- **Files:** `TenantController`, `TenantService` (327 lines), `Store/UpdateTenantRequest`, `TenantResource`, `Tenant`, `TenantDocument`, `TenantOccupant`, `Support/PrivateFile`; Vue: `TenantListPage`, `TenantFormModal`, `MoveOutModal`, `DepositModal`
- **How it works:** create or update in a transaction. The room is locked and marked occupied, the start meters default to the room's last reading, and the photo and up to 5 documents are stored privately. Co-occupants are synced, and the handover list is saved.
- **Main points:** `multipart/form-data` with `_method=PUT`, because PHP can't read multipart PUT bodies. Arrays go as JSON strings and are decoded in `prepareForValidation()`. `room()` uses `withTrashed()`, so old records still show the room.

### 3.5 Utilities: tariffs, meter readings, main meters
- **Files:** `Setting`, `UtilityTariff`, `MeterReadingService` (444 lines), `UsageAlert`, `MainMeterController`, `UtilityBalanceService`, `MeterReplacement`; Vue: `UtilityPage`, `TariffSettingsModal`, `MainMetersCard`, `MeterReplacementModal`, `utils/tariff.js`
- **How it works:**
  - Settings are key/value rows with **defaults in code** (`Setting::DEFAULTS`).
  - `UtilityTariff` is pure static maths. **A**: the whole usage is charged at its tier's rate. **B**: progressive, each part at its own tier's rate. **C**: the room's own per-unit or fixed rate. The minimum charge comes after, and amounts round to 100 riel.
  - The meter sheet has one row per occupied room. A bulk save runs in one transaction, and errors point at the exact row.
  - A month can be locked. Only the owner unlocks.
  - Meter replacements split usage into the old meter part plus the new meter part.
  - Main meters (the building's EDC/PPWSA meters) compare the total billed with the utility's bill, to find losses.
- **Main points:** read settings **once** per request (`allValues()`), not once per room. The JS tariff is only for a live preview; the server saves the real amount.

### 3.6 Invoices and payments
- **Files:** `InvoiceService` (665 lines, the biggest), `InvoiceController`, `InvoiceResource`, `Invoice`, `InvoiceItem`, `InvoicePayment`, `PaymentProofService`, `PaymentProofController`; Vue: `InvoiceListPage`, `InvoicePrintPage`, `GenerateInvoicesModal`, `InvoiceDetailModal`, `PaymentProofsModal`, `PaymentSettingsModal`, `EdcCheckCard`
- **How it works:**
  - **Preview** lists every tenant with a status (`ready` / `rent_only` / `missing_reading` / `invoiced`).
  - **Generate** takes the chosen tenants and numbers invoices `INV-YYYYMM-####` inside a transaction.
  - Each invoice holds the utilities of month M plus the rent of month M+1, pro-rated by occupied days, with move-in credit and chargeable repairs.
  - **Payments** in USD or KHR are converted with the invoice's own rate, and an overpayment is refused.
  - Tenants send **KHQR receipts**, which staff confirm (a real payment is created) or reject.
  - For rooms that pay EDC directly, there is an EDC check.
- **Main points:** `lockForUpdate()` on payment. Statuses are derived from `paid_riel` by `syncPaid()`, never set by hand. Invoices are voided, not deleted. Nested resources use `->scopeBindings()`. The print page sits outside the admin layout.

### 3.7 Deposit, contract, move-out
- **Files:** `DepositService` (377 lines), `ContractService`, `DepositController`, `ContractController`, `MoveInPayment`, `DepositTransaction`, `DepositSettlement`, `MoveOutNotice`; Vue: `ContractSheet`, `ContractPrintPage`, `DepositPrintPage`, `MoveOutModal`
- **How it works:** the move-in payment holds the deposit plus prepaid rent, which becomes credit on the first invoice. A 30-day notice rule applies, overstay is capped at 15 days, and deductions are typed `damage` or `other`. The settlement is stored with every number, and only the owner can cancel it.
- **Main points:** guard clauses at the top of the service, then one transaction. Printable pages carry their own `@page` CSS and Khmer fonts.

### 3.8 Requests: repairs and announcements
- **Files:** `MaintenanceController`, `RepairService`, `MaintenanceRequest`, `AnnouncementController`, `Announcement`; Vue: `RequestListPage`
- **How it works:** a small state machine: reported → quoted → approved → started → completed (or cancelled). A repair that the tenant pays for is added to the next invoice, or gets its own `REP-` invoice. Announcements have date ranges and show in the portal.
- **Main point:** model the workflow as explicit endpoints (`/quote`, `/approve`, `/start`, `/complete`) instead of one free "status" field.

### 3.9 Expenses, reports, dashboard
- **Files:** `ExpenseService`, `ProfitReportService`, `DashboardService`, `PaymentScoreService`, `ExpenseController`, `DashboardController`; Vue: `DashboardPage`, `KpiCard`, `TrendChart`, `DonutChart`, `BarChart`, `scale.js`, `ProfitLossPage`, `UtilityBalancePage`, `ExpenseListPage`
- **How it works:** one endpoint returns the whole dashboard: KPIs with % change vs last month, a 12-month trend, income mix, collection by method, alerts and recent activity. Recurring expenses create a row each month. Money collected on the owner's behalf for EDC is kept out of income.
- **Main points:** charts are small hand-written SVG components, so there is no heavy chart library. The detailed dashboard is owner-only, and staff get counts from `dashboard/badges`.

### 3.10 Users and logins
- **Files:** `UserController`, `UserService`; Vue: `UserListPage`
- **How it works:** the owner creates staff and viewer logins, resets passwords, resets 2FA, disables and enables logins, and issues or disables tenant login cards. The first owner is created on the command line with `php artisan rtr:user`, which asks for the password without showing it.
- **Main point:** disabling a login also logs it out everywhere.

### 3.11 Tenant portal
- **Files:** `PortalController` (373 lines); Vue: `pages/portal/*`, `QrLoginPage`
- **How it works:** a separate route group `role:tenant` with `prefix('portal')`. The tenant always comes from `$request->user()->tenant`, and any `{invoice}` in the URL is checked against it (404 if it isn't theirs). The design is mobile-first, with a bottom tab bar, and Khmer is the default language.
- **Main point:** never trust an id from the URL in a self-service area.

### 3.12 Frontend architecture
| Folder | Rule |
|---|---|
| `services/` | one file per API resource, returns `res.data` (or `res.data.data`) |
| `pages/<feature>/` | one page per menu item: loads data, owns filters and pagination |
| `components/<feature>/` | modals (`show` prop, `close`/`saved` emits), badges, cards |
| `stores/` | only cross-page state: `auth` (user and role helpers), `badges` (menu counts, refreshed on a timer) |
| `utils/` | pure helpers: `money.js`, `swal.js`, `tariff.js`, `khmer.js`, `markdown.js` |
| `i18n/` | `t()`, `lang`, `monthName()`; English keys with a Khmer map |
| `assets/rtr-theme.css` | design tokens (`--rtr-navy`, `--rtr-blue`…) that override AdminLTE |

Routes are lazy-loaded (`() => import(...)`), carry `meta.title` and `meta.roles`, and the guard checks every matched record.

### 3.13 Quality
- **Tests:** `RefreshDatabase`, `Storage::fake`, `Sanctum::actingAs`, and data built through the API. The tests cover contracts, the dashboard, demo data, EDC, expenses, history import, main meters, payment proofs, private files, room items and 2FA.
- **Demo data:** `rtr:demo [--fresh]` goes through the real HTTP kernel and refuses to run in production. `rtr:fresh-start` keeps only the owner and settings, and asks you to type `FRESH START`.
- **CI:** Laravel tests on SQLite in memory plus a Vue build, with `composer audit` and `npm audit` as warnings.

---

## 4. How to build a project like this (the order that works)

| Phase | Do | Done when |
|---|---|---|
| 0. Plan | roles table, module table, ERD, screens in Figma | you can say who does what on which screen |
| 1. Skeleton | Docker, Laravel + Sanctum, Vue + UI kit | `/up` and `:5173` both load |
| 2. Auth | users with roles, login, `role:` groups, router guard, layout | each role sees only its menu |
| 3. First module (template) | migration → model → request → resource → controller → routes → service.js → page → modal → test | full CRUD works and a test passes |
| 4. Core modules | repeat the template; put rules in services | each module has a feature test |
| 5. Money modules | snapshot tables, transactions, locks, void instead of delete | totals match by hand on 3 examples |
| 6. Self-service area | separate role, separate route prefix, ownership checks | a user can't see another user's data |
| 7. Reports | one service per report, SVG charts | the owner gets answers in one screen |
| 8. Hardening | i18n, 2FA, throttles, activity log, private files | the checklist in step 19 is all ✅ |
| 9. Ship | demo command, CI, backups, production checklist | a clean machine runs it with the README alone |

## 5. Common mistakes this project avoids
- Business rules in controllers or in Vue → put them in **services**.
- Using `float` for money → use **integer riel**, and store the rate beside any USD amount.
- Recalculating old invoices from current prices → **snapshot** them.
- Deleting a paid invoice → **void** it, keeping the reason and who did it.
- Trusting the frontend to hide buttons → **check the role on the server**.
- Public upload folders → **private disk + signed links**.
- A demo that goes straight into the database → **seed through the API**.
- Editing an old migration → **add a new migration**.
