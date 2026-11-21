# Security patterns (copy as needed)

| Need | Pattern |
|---|---|
| Login brute force | `->middleware('throttle:5,1')` on every login route; one generic error message |
| Session fixation | `$request->session()->regenerate()` after login; `invalidate()` + `regenerateToken()` on logout |
| Disable a user now | `EnsureRole` checks `is_active` on every request and logs out the web guard |
| 2FA | TOTP (RFC 6238, 30 s, 6 digits) + 10 one-time recovery codes (hashed); refuse a reused time-step; password step stores `two_factor_pending` in session for 5 min, max 5 code tries |
| Passwordless card (QR) | `Str::random(48)` shown once in `/qr#token` (hash fragment → never logged); store `hash('sha256', $token)`; second factor = phone; lock after 5 wrong tries; reissuing logs out everywhere |
| Private uploads | `$file->store($folder, 'local')`; return `URL::temporarySignedRoute('private-file', now()->addMinutes(120), [...], absolute: false)`; route has `signed:relative` + `throttle` |
| Ownership | in self-service controllers `abort_if($model->owner_id !== $me->id, 404)` |
| Duplicate uploads | store `hash_file('sha256', …)` and refuse a second active upload with the same hash or reference |
| Audit | `LogActivity`: user, method, path, status, IP for every non-GET; **never** the body |
| Dangerous commands | refuse when `app()->isProduction()`; ask the user to type a phrase before wiping |
| Time zones | validate dates against the business time zone (`now('Asia/Phnom_Penh')`), not UTC |
