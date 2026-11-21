# Step 15 — Invoices and payments

## Goal
Pick a month → **preview** who can be invoiced → **generate** invoices → record **payments** in USD or riel →
**print** an A4 invoice. Old invoices never change when prices change.

## You will learn
- Preview → confirm → generate (no surprises for the user)
- Invoice numbering inside a transaction (`INV-202611-0001`)
- Money rules: store riel as **integers**, keep the exchange rate on the invoice, `lockForUpdate()` on payment
- Statuses `unpaid → partial → paid` (and `void` instead of delete)

## The billing rule of RTR Room
> One invoice = **water and electricity of month M** + **rent of month M+1** (rent is paid in advance).
> Rent is in USD and converted with the exchange rate saved on the invoice. A tenant who moved in mid-month pays only
> the occupied days.

## Files
| File | Action |
|---|---|
| `create_invoices_tables`, `create_invoice_items_table`, `add_rent_period_to_invoices` | Generated, then edited |
| `app/Models/Invoice.php`, `InvoiceItem.php`, `InvoicePayment.php` | Generated, then edited |
| `app/Services/InvoiceService.php` | Created manually |
| `app/Http/Controllers/InvoiceController.php`, `app/Http/Resources/InvoiceResource.php` | Generated, then edited |
| `src/services/invoiceService.js`, `src/pages/invoices/InvoiceListPage.vue`, `InvoicePrintPage.vue` | Created manually |
| `src/components/invoices/GenerateInvoicesModal.vue`, `InvoiceDetailModal.vue` | Created manually |

## Do it

**Snapshot migration** (excerpt)
```php
$table->string('invoice_number', 30)->unique();       // e.g. INV-202611-0001
$table->char('period', 7);                            // utilities month
$table->decimal('rent_usd', 10, 2);
$table->unsignedInteger('exchange_rate');             // riel per 1 USD AT THAT TIME
$table->unsignedBigInteger('rent_riel');
foreach (['electric', 'water'] as $u) {
    $table->decimal("{$u}_previous", 10, 2)->nullable();
    $table->decimal("{$u}_current", 10, 2)->nullable();
    $table->unsignedInteger("{$u}_rate")->nullable();
    $table->unsignedBigInteger("{$u}_amount")->default(0);
}
$table->bigInteger('adjustment_riel')->default(0);    // + extra, - discount
$table->unsignedBigInteger('total_riel');
$table->unsignedBigInteger('paid_riel')->default(0);
$table->string('status', 10)->default('unpaid');      // unpaid, partial, paid, void
```

**`Invoice` model helpers**
```php
public const STATUSES = ['unpaid', 'partial', 'paid', 'void'];

public function balance(): int
{
    return $this->isVoid() ? 0 : max(0, $this->total_riel - $this->paid_riel);
}

public function isOverdue(): bool
{
    return $this->balance() > 0 && $this->due_date !== null && $this->due_date->lt(today());
}
```

**`InvoiceService::preview($period)`** returns one row per tenant with a status:
`ready` (has a reading), `rent_only`, `missing_reading` (save the reading first), `invoiced`.

**`InvoiceService::generate()`**
```php
$chosen = collect($this->preview($period))
    ->whereIn('status', ['ready', 'rent_only'])
    ->when($tenantIds !== null, fn ($items) => $items->whereIn('tenant_id', $tenantIds));

if ($chosen->isEmpty()) {
    throw ValidationException::withMessages(['period' => "Nothing is ready to invoice for {$period}."]);
}

return DB::transaction(function () use ($chosen, $period, $issueDate, $dueDate) {
    $number = $this->lastSequence($period);     // highest INV-YYYYMM-#### so far
    return $chosen->map(fn (array $row) =>
        $this->create(Tenant::with('room')->findOrFail($row['tenant_id']), $period, ++$number, $issueDate, $dueDate)
    )->values()->all();
});
```

**`InvoiceService::addPayment()`**
```php
return DB::transaction(function () use ($invoice, $data) {
    $invoice = Invoice::lockForUpdate()->findOrFail($invoice->id);     // two cashiers cannot double-pay

    $amount = $data['currency'] === 'USD'
        ? $this->toRiel((float) $data['amount'], $invoice->exchange_rate)
        : (int) round((float) $data['amount']);

    if ($amount > $invoice->balance()) {
        throw ValidationException::withMessages(['amount' => 'This is more than the balance of ៛' . number_format($invoice->balance()) . '.']);
    }

    $invoice->payments()->create([
        'paid_at' => $data['paid_at'], 'currency' => $data['currency'], 'amount_received' => $data['amount'],
        'amount_riel' => $amount, 'method' => $data['method'], 'reference' => $data['reference'] ?? null,
    ]);

    return $this->syncPaid($invoice);   // paid_riel = sum(payments); status = paid / partial / unpaid
});
```

**Routes** — reading for all staff roles; generate/pay for owner+staff; **edit, void, delete payment: owner only**.

**Vue** — `InvoiceListPage.vue` has 4 summary boxes (count, billed, collected, outstanding), a month picker with ◀ ▶,
search, status filter, and a table (number, room/tenant, total, balance, due date, status badge, open/print).
`GenerateInvoicesModal.vue` shows the preview with checkboxes; rows with `missing_reading` are disabled.
`InvoicePrintPage.vue` is a route **outside** the admin layout so `window.print()` gives a clean A4 page.

## Check
1. Save readings for October, then *Generate invoices* → 5 invoices `INV-202610-0001…0005`.
2. Pay `$50` on one → status **Partial**, balance reduced by `50 × exchange_rate`.
3. Change the exchange rate in Settings → the old invoice total does **not** change.
4. Pay more than the balance → 422.

## Practice
Add **extra lines** (`invoice_items`: description, amount_riel; e.g. "Parking", "Late fee") with
`POST /invoices/{invoice}/items` and `DELETE /invoices/{invoice}/items/{item}` using `->scopeBindings()`.
Recalculate `total_riel` after each change and refuse changes when the invoice is paid.

## Commit
```bash
git add . && git commit -m "Step 15: invoices with preview, generate, payments and print"
```
