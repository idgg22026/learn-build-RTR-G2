# Step 8 — Users, roles and login (backend)

## Goal
Owner/staff/viewer log in with **phone + password**. The API uses a **session cookie** (Sanctum SPA mode) and
every route group checks the role.

## You will learn
- Sanctum SPA authentication: `/sanctum/csrf-cookie` → `POST /api/login` → cookie on every request
- A custom `role:` middleware that also blocks disabled logins **immediately**
- Grouping routes by permission level
- Rate limiting login (`throttle:5,1`)

## Files
| File | Action |
|---|---|
| `database/migrations/xxxx_add_login_fields_to_users.php` | Generated, then edited |
| `app/Models/User.php` | Edited |
| `app/Http/Middleware/EnsureRole.php` | Created manually |
| `app/Http/Controllers/AuthController.php` | Generated, then edited |
| `bootstrap/app.php`, `routes/api.php`, `routes/console.php` | Edited |

## Do it

**Migration** (`make:migration add_login_fields_to_users`)
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('email')->nullable()->change();
    $table->string('phone', 20)->nullable()->unique()->after('name');
    $table->string('role', 20)->default('viewer')->after('phone');
    $table->foreignId('tenant_id')->nullable()->unique()->after('role')->constrained()->nullOnDelete();
    $table->boolean('is_active')->default(true)->after('tenant_id');
    $table->timestamp('last_login_at')->nullable();
});
```

**`User.php`** (add)
```php
public const ROLES = ['owner', 'staff', 'viewer', 'tenant'];
public const STAFF_ROLES = ['owner', 'staff', 'viewer'];

// "012 345-678", "+855 12 345 678" and "12345678" all become "012345678"
public static function normalizePhone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone);
    if (str_starts_with($digits, '855') && strlen($digits) > 9) {
        $digits = substr($digits, 3);
    }
    return $digits === '' || str_starts_with($digits, '0') ? $digits : '0' . $digits;
}
```
Add `'phone', 'role', 'tenant_id', 'is_active'` to `$fillable` and `'is_active' => 'boolean'` to the casts.

**`app/Http/Middleware/EnsureRole.php`**
```php
public function handle(Request $request, Closure $next, string ...$roles): Response
{
    $user = $request->user();

    if (! $user || ! $user->is_active) {
        if ($user && $request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
        }
        abort(401, 'Please log in.');
    }

    if (! in_array($user->role, $roles, true)) {
        abort(403, 'You do not have permission to do this.');
    }

    return $next($request);
}
```
Register it in `bootstrap/app.php`:
```php
$middleware->alias(['role' => \App\Http\Middleware\EnsureRole::class]);
```

**`AuthController.php`** (core)
```php
public function login(Request $request)
{
    $data = $request->validate([
        'phone'    => ['required', 'string', 'max:30'],
        'password' => ['required', 'string', 'max:255'],
    ]);

    $credentials = [
        'phone'     => User::normalizePhone($data['phone']),
        'password'  => $data['password'],
        'is_active' => true,
        fn ($query) => $query->whereIn('role', User::STAFF_ROLES),
    ];

    if (! Auth::guard('web')->attempt($credentials)) {
        // The same message whether the phone or the password is wrong
        throw ValidationException::withMessages(['phone' => 'The phone number or password is wrong.']);
    }

    $request->session()->regenerate();            // stop session fixation
    $user = $request->user();
    $user->forceFill(['last_login_at' => now()])->save();

    return response()->json(['data' => $this->present($user)]);
}

public function me(Request $request)
{
    return response()->json(['data' => $this->present($request->user())]);
}

public function logout(Request $request)
{
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return response()->json(['message' => 'Logged out.']);
}

private function present(User $user): array
{
    return ['id' => $user->id, 'name' => $user->name, 'phone' => $user->phone, 'role' => $user->role];
}
```
(The real project uses `validate()` + `getLastAttempted()` so it can ask for a 2FA code before logging in — step 19.)

**`routes/api.php`** — the permission ladder used by the whole project:
```php
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware(['auth:sanctum', 'role:owner,staff,viewer,tenant'])->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    // Owner, staff and viewer can READ
    Route::middleware('role:owner,staff,viewer')->group(function () {
        Route::get('rooms', [RoomController::class, 'index']);
        Route::get('rooms/{room}', [RoomController::class, 'show']);
    });

    // Owner and staff: daily WORK
    Route::middleware('role:owner,staff')->group(function () {
        Route::post('rooms', [RoomController::class, 'store']);
        Route::match(['put', 'patch'], 'rooms/{room}', [RoomController::class, 'update']);
        Route::patch('rooms/{room}/status', [RoomController::class, 'updateStatus']);
    });

    // Owner only: DELETE, settings, money corrections, logins
    Route::middleware('role:owner')->group(function () {
        Route::delete('rooms/{room}', [RoomController::class, 'destroy']);
    });
});
```

**Create the first owner** — add the `rtr:user` command to `routes/console.php`
(see the full version in the original file; it asks for the password with `$this->secret()`):
```bash
docker compose exec laravel php artisan rtr:user 012345678 "Owner Name" owner
```

## Check
```bash
curl -s localhost:8000/api/rooms -H 'Accept: application/json'     # 401 {"message":"Unauthenticated."}
```
The full cookie login is tested from Vue in step 9 and with a feature test in step 20.

## Practice
Write a feature test: a `viewer` gets **403** on `POST /api/rooms`, and a `staff` gets **201**.
Use `Sanctum::actingAs(User::factory()->create(['role' => 'viewer']))`.

## Commit
```bash
git add . && git commit -m "Step 8: phone login with Sanctum cookies and role middleware"
```
