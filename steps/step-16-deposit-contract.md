# Step 16 — Deposit, contract and move-out

## Goal
Record the **move-in payment** (deposit + first rent), print a bilingual **rental contract** with the room's item
list, and when a tenant leaves, **settle the deposit** (unused rent, overstay days, damage) with a printable statement.

## You will learn
- Modelling money that moves over time as **transactions** (`deposit_transactions`) instead of one number
- A settlement that is created once and can only be **cancelled by the owner** (never edited silently)
- Printable pages with their own CSS (`contract.css`, Khmer fonts in `src/assets/fonts/khmeros/`)

## Files
| File | Action |
|---|---|
| `2026_11_06_090000_create_deposit_tables.php` (move_in_payments, deposit_transactions, deposit_settlements) | Generated, then edited |
| `2026_11_08_090000_create_move_out_notices_table.php` | Generated, then edited |
| `app/Services/DepositService.php`, `ContractService.php`, `RoomItemService.php` | Created manually |
| `app/Http/Controllers/DepositController.php`, `ContractController.php` | Generated, then edited |
| `src/components/tenants/DepositModal.vue`, `MoveOutModal.vue`, `src/components/contracts/ContractSheet.vue` | Created manually |
| `src/pages/tenants/ContractPrintPage.vue`, `DepositPrintPage.vue` | Created manually |

## The rules (write them as comments at the top of the service)
- Move-in: tenant pays **deposit** (usually 1 month) + rent of the first month. Prepaid rent becomes a **credit**
  on the first invoice (`creditRiel()` in `InvoiceService`).
- Notice: the tenant must give **30 days** notice (`MoveOutNotice::NOTICE_DAYS = 30`). Without notice, unused rent is not refunded.
- Overstay: at most **15 extra days** (`DepositService::MAX_OVERSTAY_DAYS`), charged at daily rent.
- Settlement = deposit + unused rent/credit − overstay − damage − other deductions.

## Do it

**`DepositService::settle()`** (guard clauses first, then one transaction)
```php
public function settle(Tenant $tenant, array $data): DepositSettlement
{
    if ($tenant->status !== 'moved_out') {
        throw ValidationException::withMessages(['tenant' => 'Move this tenant out before settling the deposit.']);
    }
    if (DepositSettlement::where('tenant_id', $tenant->id)->exists()) {
        throw ValidationException::withMessages(['tenant' => 'The deposit of this tenant is already settled.']);
    }
    $days = (int) ($data['overstay_days'] ?? 0);
    if ($days > self::MAX_OVERSTAY_DAYS) {
        throw ValidationException::withMessages(['overstay_days' => 'A tenant can stay at most 15 extra days.']);
    }

    $deposit    = $this->balance($tenant);
    $overstay   = round($days * $this->dailyRent($tenant), 2);
    $deductions = collect($data['deductions'] ?? []);
    $damage     = round((float) $deductions->where('type', 'damage')->sum('amount_usd'), 2);

    return DB::transaction(function () use (...) {
        $settlement = DepositSettlement::create([...]);   // every number is stored, like an invoice
        // write a deposit_transactions row "refund" or "applied", and close open invoices with the deposit
        return $settlement;
    });
}
```

**Routes**
```php
// owner, staff, viewer
Route::get('tenants/{tenant}/deposit', [DepositController::class, 'show']);
Route::get('tenants/{tenant}/contract', [ContractController::class, 'show']);
// owner, staff
Route::post('tenants/{tenant}/move-in-payment', [DepositController::class, 'storeMoveIn']);
Route::post('tenants/{tenant}/handover', [ContractController::class, 'saveHandover']);
// owner only
Route::post('tenants/{tenant}/settlement', [DepositController::class, 'settle']);
Route::delete('deposit-settlements/{depositSettlement}', [DepositController::class, 'cancelSettlement']);
```

**Printable contract** — `ContractPrintPage.vue` is a top-level route (no admin layout) that loads
`GET /tenants/{id}/contract` and renders `ContractSheet.vue`: landlord (from Settings), tenant, room, rent, deposit,
term, payment due days, extra terms, and the **handover item list** saved on the move-in day.
```css
/* contract.css */
@page { size: A4; margin: 15mm; }
@media print { .no-print { display: none !important; } }
.contract { font-family: 'Khmer OS Siemreap', 'Kantumruy Pro', serif; }
.contract h1 { font-family: 'Khmer OS Muol Light', serif; }
```

## Check
1. Add a tenant, record a move-in payment of $120 deposit + $120 rent → the first invoice shows a credit.
2. Open *Contract* → print preview is a clean A4 page in Khmer.
3. Move the tenant out, settle with 3 overstay days and a $10 damage deduction → the statement shows the maths.
4. As **staff**, try to cancel the settlement → 403.

## Practice
Let the **tenant** send a move-out notice from the portal (`POST /portal/notice` with a date ≥ today + 30 days, and
`DELETE /portal/notice` to cancel). Show an orange "Moving out on …" badge in the admin tenant list.

## Commit
```bash
git add . && git commit -m "Step 16: move-in payment, contract print, move-out and deposit settlement"
```
