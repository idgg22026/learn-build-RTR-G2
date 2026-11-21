# Step 14 — Monthly meter readings

## Goal
Staff open **Utilities**, pick a month, and type the new electricity and water numbers for every occupied room on one
sheet. The server calculates usage and charges, warns about unusual usage, and the owner can **lock** the month.

## You will learn
- A "sheet" endpoint (all rooms for one month) and a bulk save in one transaction
- Validation messages that point to the exact row (`readings.3.electric_current`)
- Locking data that money depends on

## Files
| File | Action |
|---|---|
| `fix_meter_readings_table`, `utility_improvements` migrations | Generated, then edited |
| `app/Models/MeterReading.php`, `MeterReplacement.php` | Generated, then edited |
| `app/Services/MeterReadingService.php`, `app/Services/UsageAlert.php` | Created manually |
| `app/Http/Controllers/MeterReadingController.php` | Generated, then edited |
| `src/services/utilityService.js`, `src/pages/utilities/UtilityPage.vue` | Created manually |

## The API
| Method & path | Role | Does |
|---|---|---|
| `GET /meter-readings?period=2026-11` | owner, staff, viewer | the sheet: every room, previous reading, saved reading |
| `POST /meter-readings` `{period, read_at, readings: [{room_id, electric_current, water_current}]}` | owner, staff | save many |
| `POST /meter-readings/{id}/photo` | owner, staff | meter photo (private file) |
| `POST /meter-readings/lock` / `unlock` | staff / **owner** | freeze the month |
| `POST /meter-replacements` | owner, staff | a broken meter was replaced |

## Do it

**`MeterReadingService::saveMany()`**
```php
public function saveMany(string $period, array $rows, ?string $readAt = null): int
{
    $settings = Setting::allValues();   // read once, not once per room
    $saved = 0;

    DB::transaction(function () use ($period, $rows, $readAt, $settings, &$saved) {
        foreach ($rows as $index => $row) {
            // Skip rooms where nothing was entered
            if (($row['electric_current'] ?? null) === null && ($row['water_current'] ?? null) === null) continue;

            $room = Room::with('activeTenant')->find($row['room_id']);
            if (! $room?->activeTenant) {
                throw ValidationException::withMessages(["readings.{$index}.room_id" => 'This room has no active tenant.']);
            }

            $this->saveForTenant($room, $room->activeTenant, $period,
                ['electric' => $row['electric_current'] ?? null, 'water' => $row['water_current'] ?? null],
                $readAt, $row['notes'] ?? null, $settings,
                ['electric' => "readings.{$index}.electric_current", 'water' => "readings.{$index}.water_current"]);
            $saved++;
        }
    });

    return $saved;
}
```

**`saveForTenant()` — the rules**
```php
if ($existing?->isLocked()) {
    throw ValidationException::withMessages([$errorKeys['electric'] => "Room {$room->room_number}: the {$period} reading is locked."]);
}
$previous = $this->previousReading($room->id, $tenant, $period);   // last month, or the move-in start meter

foreach (['electric', 'water'] as $utility) {
    $current = (float) $input[$utility];
    if ($current < $previous[$utility]) {
        throw ValidationException::withMessages([$errorKeys[$utility] => "New reading cannot be less than {$previous[$utility]}."]);
    }
    $usage  = round($current - $previous[$utility], 2);
    $charge = UtilityTariff::charge($usage, $utility, $settings, $room);   // step 13

    $values["{$utility}_previous"] = $previous[$utility];
    $values["{$utility}_current"]  = $current;
    $values["{$utility}_usage"]    = $usage;
    $values["{$utility}_rate"]     = $charge['rate'];
    $values["{$utility}_amount"]   = $charge['amount'];
}
return MeterReading::updateOrCreate(['room_id' => $room->id, 'tenant_id' => $tenant->id, 'period' => $period], $values + [...]);
```

**`UtilityPage.vue`** — one row per room, two `<input type="number">` per row, showing *previous → new = usage*
and the live charge from `utils/tariff.js`. On 422, map `errors['readings.3.electric_current']` back to row 3
and add `is-invalid` to that input. A progress bar shows "3 / 5 rooms read".

## Check
- Save 120 kWh when last month was 100 → usage 20, charge from the tiers.
- Save 90 → red error on that row: "cannot be less than 100".
- Lock the month as staff, then try to save → error "locked". Unlock works only for the owner.

## Practice
Add **usage alerts**: when usage changes more than `usage_warning_percent` (setting, default 50) from last month,
return a warning list with the sheet, and show an amber ⚠ next to that room. Compare with `UsageAlert.php`.

## Commit
```bash
git add . && git commit -m "Step 14: monthly meter readings with bulk save and month lock"
```
