# Architecture map

```
project/
├── compose.yaml                 mysql · phpmyadmin · laravel · vuejs (ports on 127.0.0.1)
├── docker/{laravel,vuejs}/      tiny Dockerfiles; code is volume-mounted
├── laravel-app/
│   ├── app/Http/Controllers/    thin; one per resource (+ PortalController for a self-service role)
│   ├── app/Http/Middleware/     EnsureRole (role:a,b), LogActivity (non-GET audit)
│   ├── app/Http/Requests/       Store*/Update* validation; Rule::in(Model::CONST)
│   ├── app/Http/Resources/      exact JSON sent to Vue; signed file URLs added here
│   ├── app/Models/              constants, casts, relations, small helpers (balance(), isOverdue())
│   ├── app/Services/            ALL business rules; transactions; locks; snapshots
│   ├── app/Support/             PrivateFile (signed links), Totp (2FA)
│   ├── app/Console/Commands/    app:demo, imports
│   ├── database/migrations/     append-only
│   ├── routes/api.php           grouped by permission level (read → work → owner)
│   ├── routes/console.php       app:user (create login), app:fresh-start
│   └── tests/Feature/           through the API, RefreshDatabase, Storage::fake
└── vuejs-app/src/
    ├── services/                one file per API resource (http.js = axios + interceptors)
    ├── stores/                  auth (user + role getters), badges (menu counts)
    ├── router/index.js          lazy routes, meta.title, meta.roles, beforeEach guard
    ├── layouts/AdminLayout.vue  Navbar + Sidebar + <router-view>
    ├── pages/<feature>/         one page per menu item
    ├── components/<feature>/    FormModal, StatusBadge, cards
    ├── utils/                   money, swal, domain maths preview
    ├── i18n/                    t(), lang, en/km dictionaries
    └── assets/theme.css         :root tokens overriding the UI kit
```

## Request flow
`Vue page → service.js → http.js (cookie + XSRF) → routes/api.php (auth:sanctum, role:…) → FormRequest →
Controller → Service (DB::transaction) → Model → Resource → JSON → page state → template`

## Response conventions
- List: `Resource::collection($paginator)` → `{ data: [...], meta: {current_page, last_page, from, to, total}, links }`
- Create: `201` + `{ data, message }`. Update: `{ data, message }`. Delete: `{ message }`
- Business refusal: `422` + `{ message, errors: { field: [msg] } }` via `ValidationException::withMessages`
- Not logged in: `401`. Wrong role: `403`. Not yours: `404`.
