# Step 19 — Khmer/English and security

## Goal
Every screen works in **Khmer and English** (tenants default to Khmer), and the app is hardened: **two-factor login**
for staff, rate limits, an **activity log** of every change, private files, and logins that stop working at once when
disabled.

## You will learn
- A tiny i18n system without a library (`t()` + reactive `lang`)
- TOTP two-factor authentication (Google Authenticator) with recovery codes
- Defence in depth: hide in the UI **and** check on the server

## Files
| File | Action |
|---|---|
| `src/i18n/index.js`, `en.js`, `km.js`, `km-pages.js`, `src/components/common/LangSwitch.vue` | Created manually |
| `2026_11_18_090000_add_two_factor_to_users.php`, `app/Support/Totp.php`, `TwoFactorController.php` | Created |
| `app/Http/Middleware/LogActivity.php`, `app/Models/ActivityLog.php` | Created manually |
| `src/pages/AccountSecurityPage.vue` | Created manually |

## Part A — i18n

**`src/i18n/index.js`** (core)
```js
import { computed, ref } from 'vue'
import en from './en'
import km from './km'
import kmPages from './km-pages'

// Keys: named ones ('menu.rooms') in en.js / km.js, and on admin pages the English text itself
// (t('Add Room')) with its Khmer in km-pages.js.
const MESSAGES = { en, km: { ...kmPages, ...km } }
const STORAGE_KEY = 'rtr-lang'

function readSaved() {
  try { const v = localStorage.getItem(STORAGE_KEY); return v === 'en' || v === 'km' ? v : null } catch { return null }
}
const chosen = ref(readSaved())
const fallback = ref('en')
export const lang = computed(() => chosen.value ?? fallback.value)

export function setLang(value) {
  chosen.value = value
  try { localStorage.setItem(STORAGE_KEY, value) } catch {}
}
export function setDefaultLang(value) { fallback.value = value }

export function t(key, params = {}) {
  if (!key) return ''
  const text = MESSAGES[lang.value][key] ?? MESSAGES.en[key] ?? key
  return text.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`)
}
```
In `main.js`:
```js
app.config.globalProperties.$t = t
// Without a choice on this device, tenants see Khmer and everyone else English
watch(() => auth.user?.role, (role) => { if (role) setDefaultLang(role === 'tenant' ? 'km' : 'en') }, { immediate: true })
```
Fonts: `body { font-family: 'Source Sans Pro', 'Kantumruy Pro', 'Khmer OS Siemreap', 'Noto Sans Khmer', sans-serif; }`
and `html[lang='km'] .nav-header { letter-spacing: 0; }`. Never put `letter-spacing` on Khmer text, because it breaks the stacked characters.

## Part B — Security checklist (all in the project)
| Risk | Defence | Where |
|---|---|---|
| Password guessing | `throttle:5,1` on every login route; same error for wrong phone or password | `routes/api.php`, `AuthController` |
| Stolen password | TOTP 2FA + 10 single-use recovery codes; 5 wrong codes → start again | `Totp.php`, `TwoFactorController`, `AuthController::loginTwoFactor` |
| Code reuse | store the last used time-step, refuse the same code twice | `Totp::verify($secret, $code, $lastUsed)` |
| Disabled user keeps working | `EnsureRole` checks `is_active` on **every** request and logs out | `EnsureRole.php` |
| Tenant after moving out | access ends 30 days after move-out automatically | `User::tenantAccessEnded()` |
| CSRF | Sanctum XSRF cookie + `withXSRFToken` | `http.js` |
| Session fixation | `session()->regenerate()` after login | `AuthController::loggedIn` |
| Leaked file links | private disk + **signed, 2-hour** URLs | `PrivateFile.php` |
| Who changed what? | every non-GET request is logged (user, method, path, status, IP), **no request bodies** | `LogActivity.php` |
| Viewer pressing buttons | UI hides (`$can`) **and** routes refuse (`role:` groups) | `main.js`, `routes/api.php` |
| Demo data on production | `rtr:demo` and `rtr:fresh-start` refuse when `APP_ENV=production` | console commands |

**`LogActivity.php`**
```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);

    if (! $request->isMethodSafe() && $request->user()) {
        ActivityLog::create([
            'user_id'    => $request->user()->id,
            'method'     => $request->method(),
            'path'       => substr($request->path(), 0, 255),
            'status'     => $response->getStatusCode(),
            'ip_address' => $request->ip(),
        ]);
    }
    return $response;
}
```
Alias it as `log.activity` in `bootstrap/app.php` and add it to the login routes and the main `auth:sanctum` group.

## Check
- Switch to ខ្មែរ → menu, buttons, months and money labels change; reload → the choice is kept.
- Turn on 2FA in *Account security*, scan the QR, log out, log in → asks for the 6-digit code.
- Disable a staff login while they are logged in → their next click sends them to the login page.
- `select * from activity_logs order by id desc limit 5;` shows your last changes.

## Practice
Find every hard-coded English string in one page (e.g. `ExpenseListPage.vue`), wrap it in `t('...')`, and add the
Khmer in `km-pages.js`. Then write a small script that lists `t('…')` keys missing from `km-pages.js`.

## Commit
```bash
git add . && git commit -m "Step 19: Khmer/English i18n, two-factor login and activity log"
```
