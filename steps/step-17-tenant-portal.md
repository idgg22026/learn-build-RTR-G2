# Step 17 — Tenant portal (mobile)

## Goal
Each tenant gets a **login card with a QR code**. Scanning it opens `/qr#TOKEN`; the tenant types their phone number
and sees a mobile portal: balance to pay, invoices, meter history, repairs, deposit, contract, and can upload an
**ABA KHQR payment receipt** for the owner to confirm.

## You will learn
- Passwordless login with a **hashed token** + a second factor (the phone number) + lockout after 5 tries
- A separate route group `role:tenant` → `prefix('portal')` that only ever reads **the logged-in tenant's own data**
- Mobile-first pages with a bottom tab bar
- Duplicate detection for uploads (image hash, transaction reference)

## Files
| File | Action |
|---|---|
| `add_login_fields_to_users` migration (`qr_token_hash`, `qr_failed_attempts`, `qr_locked_at`) | Generated, then edited |
| `app/Services/UserService.php` (`issueTenantCard`, `disableTenantLogin`) | Created manually |
| `app/Http/Controllers/AuthController.php` (`loginWithQr`), `PortalController.php` | Edited / created |
| `create_payment_proofs_table`, `app/Services/PaymentProofService.php`, `PaymentProofController.php` | Created |
| `src/pages/QrLoginPage.vue`, `src/pages/portal/PortalHomePage.vue`, `PortalContractPage.vue`, `PortalHelpPage.vue` | Created manually |

## Do it

**Issue a card** (owner) — only the **hash** is stored; the token is shown once in the QR:
```php
public function issueTenantCard(Tenant $tenant): array
{
    if ($tenant->status !== 'active') {
        throw ValidationException::withMessages(['tenant' => 'Only a tenant who is still renting can have a login.']);
    }
    $token = Str::random(48);
    $user = DB::transaction(function () use ($tenant, $token) {
        $user = User::firstOrNew(['tenant_id' => $tenant->id]);
        $user->password ??= Str::random(40);             // tenants never log in with a password
        $user->forceFill([
            'name' => $tenant->full_name, 'role' => 'tenant', 'is_active' => true,
            'qr_token_hash' => User::hashQrToken($token),  // sha256
            'qr_failed_attempts' => 0, 'qr_locked_at' => null,
        ])->save();
        $this->logOutEverywhere($user);                   // an old card stops working at once
        return $user;
    });
    return ['user' => $user, 'token' => $token];          // the token is never stored, only returned once
}
```
Vue builds the link `${location.origin}/qr#${token}` and draws the card with the `qrcode` package:
`QRCode.toDataURL(link)` → `<img>`, ready to print.

**Log in with the card** — `POST /api/login/qr { token, phone }` (`throttle:5,1`):
```php
$user = User::where('qr_token_hash', User::hashQrToken($data['token']))
    ->where('role', 'tenant')->where('is_active', true)->first();

if (! $user) throw ValidationException::withMessages(['token' => 'This QR code is no longer valid.']);
if ($user->qr_locked_at) throw ValidationException::withMessages(['phone' => 'This login card is locked.']);

$expected = User::normalizePhone((string) $user->tenant?->phone);
if ($expected === '' || ! hash_equals($expected, User::normalizePhone($data['phone']))) {
    $attempts = $user->qr_failed_attempts + 1;
    $user->forceFill(['qr_failed_attempts' => $attempts,
        'qr_locked_at' => $attempts >= User::MAX_QR_ATTEMPTS ? now() : null])->save();
    throw ValidationException::withMessages(['phone' => 'The phone number is wrong.']);
}
$user->forceFill(['qr_failed_attempts' => 0])->save();
Auth::guard('web')->login($user);
```
Why `#TOKEN` and not `?token=`? The part after `#` is **never sent to the server or written in logs**.

**Portal routes** — the tenant id always comes from the logged-in user, never from the URL:
```php
Route::middleware('role:tenant')->prefix('portal')->group(function () {
    Route::get('home', [PortalController::class, 'home']);
    Route::get('invoices', [PortalController::class, 'invoices']);
    Route::get('meter-readings', [PortalController::class, 'meterReadings']);
    Route::get('deposit', [PortalController::class, 'deposit']);
    Route::get('contract', [PortalController::class, 'contract']);
    Route::post('notice', [PortalController::class, 'storeNotice']);
    Route::get('repairs', [PortalController::class, 'repairs']);
    Route::post('repairs', [PortalController::class, 'storeRepair']);
    Route::post('invoices/{invoice}/proofs', [PortalController::class, 'storeProof'])->middleware('throttle:10,1');
});

// PortalController
private function tenant(Request $request): Tenant
{
    $tenant = $request->user()->tenant;
    abort_if(! $tenant, 403, 'This login is not linked to a tenant.');
    return $tenant;
}

public function storeProof(Request $request, Invoice $invoice)
{
    $tenant = $this->tenant($request);
    abort_if($invoice->tenant_id !== $tenant->id, 404);   // never someone else's invoice
    $today = now('Asia/Phnom_Penh')->toDateString();      // Cambodia time, not UTC
    $data = $request->validate([
        'image'           => ['required', 'image', 'max:5120'],
        'currency'        => ['required', Rule::in(['KHR', 'USD'])],
        'amount'          => ['required', 'numeric', 'gt:0'],
        'paid_on'         => ['required', 'date', 'before_or_equal:' . $today, 'after:-60 days'],
        'transaction_ref' => ['nullable', 'string', 'max:60'],
    ]);
    $proof = $this->proofService->submit($tenant, $invoice, $data, $request->file('image'));
    return response()->json(['message' => 'Your receipt is sent. The owner will check it.'], 201);
}
```

**Payment proof** (`PaymentProofService::submit`) refuses: a void/paid invoice, more than `MAX_PENDING` waiting
receipts, the **same picture** (`hash_file('sha256', …)`) or the **same ABA transaction ref** sent before.
Staff then **confirm** (creates a real payment through `InvoiceService::addPayment`) or **reject** with a reason.

**Vue** — add routes with `meta.roles: ['tenant']`:
```js
{ path: '/qr', name: 'qr-login', component: () => import('@/pages/QrLoginPage.vue'), meta: { public: true } },
{ path: '/portal', name: 'portal', component: () => import('@/pages/portal/PortalHomePage.vue'), meta: { roles: ['tenant'] } },
```
`PortalHomePage.vue` = big blue **balance card** (`៛604,600 ≈ $147.46` + "View invoice"), *My room* card,
announcements, move-out notice form, and a fixed **bottom tab bar** (Home, Invoices, Utilities, Repairs, Deposit).
See the Figma frame *05 · Tenant Portal (mobile)*.

## Check
1. As owner, *Logins → Tenant login card* → open the printed URL in a private window → type the wrong phone 5 times → locked.
2. Issue a new card → log in → only your own room/invoices are visible.
3. In DevTools, call `GET /api/rooms` as the tenant → **403**.
4. Upload the same receipt twice → second time 422 "already sent".

## Practice
Add **repairs**: the tenant reports a problem with a photo; staff quote a price; the tenant approves or declines; when
done and the tenant pays, the cost is added to the next invoice (`MaintenanceRequest::chargeable()` in
`InvoiceService::preview`). Compare with `RepairService.php` and `MaintenanceController.php`.

## Commit
```bash
git add . && git commit -m "Step 17: tenant QR login, mobile portal and payment proofs"
```
