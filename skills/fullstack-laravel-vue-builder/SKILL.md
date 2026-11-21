---
name: fullstack-laravel-vue-builder
description: Plan and build a full-stack business app with Laravel 13 (API, Sanctum SPA cookies, role middleware, Service layer) + Vue 3 (Vite, Pinia, Vue Router, AdminLTE/Bootstrap) + Docker Compose, following the proven structure of the RTR Room project. Use when the user wants to start a new management system (rental, school, clinic, shop, gym, inventory…), add a new CRUD module to such a project, or asks "build it like RTR".
---

# Full-stack Laravel + Vue builder (RTR structure)

This skill reproduces the architecture of RTR Room (`laravel-app/` + `vuejs-app/` + `compose.yaml`) for a **new**
project or a **new module**. Follow the phases in order and do not skip the plan.

## Phase 0: Plan before code (always)

Ask for, or write together with the user, a `PLAN.md` with:
1. **Problem**: one paragraph.
2. **Roles table**: role, what it can do, which app. Default ladder: `owner` (everything) > `staff` (daily work) > `viewer` (read only), plus an optional self-service role such as `tenant`, `student` or `customer` with its own portal.
3. **Modules table**: module, models, service, page.
4. **ERD**: tables, key columns and relations. Mark money tables that need **snapshots**.
5. **Screens**: list them, and design them in Figma if available (see `references/figma-design.md`).

Do not start Phase 1 until the roles and modules tables exist.

## Phase 1: Skeleton

Copy `templates/docker/` to the project root (`compose.yaml`, `docker/laravel/Dockerfile`, `docker/vuejs/Dockerfile`).
Rename `cadt_*` containers and the database name. Then:
```bash
docker run --rm -v "$PWD":/app -w /app composer:2 create-project laravel/laravel laravel-app
docker compose run --rm laravel php artisan install:api
docker run --rm -it -v "$PWD":/app -w /app node:22-alpine npm create vue@latest vuejs-app   # Router + Pinia
docker compose run --rm vuejs npm i admin-lte@^3.2 bootstrap@^4.6 jquery @fortawesome/fontawesome-free@^5.15 axios sweetalert2
```
Apply `references/backend-setup.md` (`.env`, `cors.php`, `bootstrap/app.php`).

## Phase 2: Auth and layout

Use the templates:
- `templates/laravel/EnsureRole.php` → `app/Http/Middleware/EnsureRole.php`, alias `role`
- `templates/laravel/api-routes.php` → the permission-ladder skeleton for `routes/api.php`
- `templates/vue/http.js`, `templates/vue/auth.store.js`, `templates/vue/router.js`
Then build `AdminLayout.vue` + `Sidebar.vue` (data-driven menu with `ownerOnly`) + `Navbar.vue`, and a theme CSS file
with tokens on `:root`.

## Phase 3: First module = the template for all others

For each new resource `{Thing}` (e.g. `Room`, `Student`, `Product`), generate these files **in this order**:

| # | File | Template |
|---|---|---|
| 1 | `database/migrations/xxxx_create_{things}_table.php` | `templates/laravel/migration.php` |
| 2 | `app/Models/{Thing}.php` (constants, casts, relations, SoftDeletes) | `templates/laravel/Model.php` |
| 3 | `app/Http/Requests/Store{Thing}Request.php` + `Update…` | `templates/laravel/StoreRequest.php` |
| 4 | `app/Http/Resources/{Thing}Resource.php` | `templates/laravel/Resource.php` |
| 5 | `app/Services/{Thing}Service.php` (only if there are rules beyond plain CRUD) | `templates/laravel/Service.php` |
| 6 | `app/Http/Controllers/{Thing}Controller.php` | `templates/laravel/Controller.php` |
| 7 | routes in the right role groups of `routes/api.php` | `templates/laravel/api-routes.php` |
| 8 | `tests/Feature/{Thing}Test.php` (role access + one rule) | `templates/laravel/FeatureTest.php` |
| 9 | `vuejs-app/src/services/{thing}Service.js` | `templates/vue/service.js` |
| 10 | `vuejs-app/src/components/{things}/{Thing}FormModal.vue` | `templates/vue/FormModal.vue` |
| 11 | `vuejs-app/src/pages/{things}/{Thing}ListPage.vue` | `templates/vue/ListPage.vue` |
| 12 | router entry with `meta: { title, roles }` + sidebar menu item | — |

Replace the placeholders in the templates: `{Thing}` = `Item` (class), `{thing}` = `item` (variable and route segment),
`{things}` = `items` (table, URL and folder), `{THING}` = `ITEM` (JS constant prefix), `{THING_LABEL}` = `Item` (text shown
to users). For example:
```bash
sed -e 's/{Thing}/Item/g; s/{things}/items/g; s/{thing}/item/g; s/{THING_LABEL}/Item/g; s/{THING}/ITEM/g' \
  templates/laravel/Controller.php > laravel-app/app/Http/Controllers/ItemController.php
```
Replace `{things}` before `{thing}`, as above. Run the feature test before moving on.

## Phase 4+: Rules you must keep (non-negotiable)

1. **Controllers are thin.** Validate with a FormRequest, call one service method, return a Resource.
2. **Every multi-row write is in `DB::transaction()`.** Use `lockForUpdate()` when two users could change the same row (payments, stock, seats, rooms).
3. **Money:** integers in the smallest unit (riel, cents). Keep any foreign-currency amount together with the rate used.
4. **Snapshots:** bills, receipts and orders copy every number they used. Never recalculate an old document from current prices.
5. **No hard delete of money records:** void them with a reason. Soft delete master data.
6. **Allowed values are model constants**, reused in `Rule::in()` and sent to Vue.
7. **Validation errors use field keys** (`items.3.qty`), and Vue maps them to the input (`errors[key][0]`).
8. **Files:** private disk plus a temporary signed URL (see `references/security.md`).
9. **Permissions twice:** route groups `role:…` on the server, `$can()` / `meta.roles` in Vue.
10. **Self-service role:** separate `prefix()` group. The current record comes from `$request->user()`, and any id in the URL is checked for ownership (404 otherwise).
11. **Migrations are append-only** once they have run anywhere.
12. **i18n from day one** if more than one language is needed (`references/i18n.md`).
13. **Demo command through the API** (`app:demo --fresh`) that refuses `APP_ENV=production`.

## Checklists

**Before you say a module is done:**
- [ ] Feature test: allowed role passes, lower role gets 403, invalid input gets 422 with the right key
- [ ] Money and dates are calculated in a service, with a unit test for the formula
- [ ] The list page has search, a filter, pagination, an empty state and an error state
- [ ] The form modal shows server errors under each field and a toast on success
- [ ] Buttons are hidden for roles that cannot use them
- [ ] Text goes through `t()` if the app is bilingual

**Before release:** see `references/deploy-checklist.md`.

## References (load when needed)
- `references/architecture.md`: the folder map and the request flow, with a one-line reason for each folder
- `references/backend-setup.md`: `.env`, CORS, Sanctum, `bootstrap/app.php`, always-JSON errors
- `references/security.md`: login throttling, 2FA, QR/passwordless login, signed files, activity log
- `references/i18n.md`: the tiny `t()` system and the Khmer font notes
- `references/figma-design.md`: how to turn the theme tokens into a Figma design system and screens
- `references/deploy-checklist.md`: production, CI and backups
