# Step 13 — Settings and utility tariffs

## Goal
The owner can change the **exchange rate**, **electricity and water tiers**, the tier **method**, the minimum charge
and contract details. A pure PHP class calculates every utility charge.

## You will learn
- A flexible key/value `settings` table with **defaults in code**
- Writing business rules as **pure static functions** (easy to unit-test)
- Two tiered-price methods: *whole* (A) and *progressive* (B), plus a room's own rate (C)

## Files
| File | Action |
|---|---|
| `database/migrations/xxxx_create_settings_table.php` | Generated, then edited (`key` unique, `value` text) |
| `app/Models/Setting.php` | Generated, then edited |
| `app/Services/UtilityTariff.php` | Created manually |
| `app/Http/Controllers/SettingController.php` | Generated, then edited |
| `src/components/utilities/TariffSettingsModal.vue`, `src/utils/tariff.js` | Created manually |

## Do it

**`app/Models/Setting.php`**
```php
class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    // Used when a key has not been saved yet
    public const DEFAULTS = [
        'exchange_rate'      => 4100,          // riel per 1 USD
        'electric_tier_mode' => 'whole',       // A = "whole", B = "progressive"
        'water_tier_mode'    => 'progressive',
        'electric_tiers'     => [              // riel per kWh
            ['up_to' => 10, 'rate' => 380], ['up_to' => 50, 'rate' => 480],
            ['up_to' => 200, 'rate' => 610], ['up_to' => null, 'rate' => 730],
        ],
        'water_tiers'        => [              // riel per m³
            ['up_to' => 7, 'rate' => 400], ['up_to' => 15, 'rate' => 720], ['up_to' => 25, 'rate' => 960],
            ['up_to' => 50, 'rate' => 1250], ['up_to' => 100, 'rate' => 1900], ['up_to' => null, 'rate' => 2200],
        ],
        'electric_min_charge' => 0,
        'water_min_charge'    => 0,
        'payment_due_days'    => 5,
    ];

    public static function getValue(string $key): mixed
    {
        $raw = static::where('key', $key)->value('value');
        return $raw === null ? (self::DEFAULTS[$key] ?? null) : self::decode($raw);
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => is_array($value) ? json_encode($value) : (string) $value]);
    }

    public static function allValues(): array
    {
        $saved = static::pluck('value', 'key')->map(fn ($raw) => self::decode($raw))->all();
        return array_merge(self::DEFAULTS, array_intersect_key($saved, self::DEFAULTS));
    }
}
```

**`app/Services/UtilityTariff.php`** — the heart of the calculation:
```php
/**
 * whole:       the whole usage is charged at the rate of the tier it falls into
 *              e.g. 60 kWh → 60 × 610 = 36,600
 * progressive: each part of the usage is charged at its own tier's rate
 *              e.g. 20 m³ → 7 × 400 + 8 × 720 + 5 × 960 = 13,360 → 13,400
 */
public static function calculate(float $usage, array $tiers, string $mode = 'whole'): array
{
    $tiers = self::sorted($tiers);
    if ($usage <= 0) return ['amount' => 0, 'rate' => (int) $tiers[0]['rate']];

    if ($mode === 'progressive') {
        $amount = 0; $lower = 0;
        foreach ($tiers as $tier) {
            $upper = $tier['up_to'];
            $units = ($upper === null ? $usage : min($usage, $upper)) - $lower;
            if ($units > 0) $amount += $units * $tier['rate'];
            if ($upper === null || $usage <= $upper) break;
            $lower = $upper;
        }
        return ['amount' => self::roundRiel($amount), 'rate' => (int) round($amount / $usage)];
    }

    foreach ($tiers as $tier) {
        if ($tier['up_to'] === null || $usage <= $tier['up_to']) {
            return ['amount' => self::roundRiel($usage * $tier['rate']), 'rate' => (int) $tier['rate']];
        }
    }
}

// Round to the nearest 100 riel, e.g. 12,340 → 12,300
public static function roundRiel(float $amount): int
{
    return (int) (round($amount / 100) * 100);
}
```
`UtilityTariff::charge($usage, 'electric', $settings, $room)` first checks the room's own rate
(`electric_rate_type` = `per_unit` | `fixed`), then the tiers, then applies the minimum charge.

**Routes**: `GET settings` for `owner,staff,viewer`; `PUT settings` for `owner` only. Validate tiers with
`'electric_tiers.*.up_to' => ['nullable', 'numeric', 'min:0']`, `'electric_tiers.*.rate' => ['required', 'integer', 'min:0']`.

## Check (unit test)
```php
public function test_progressive_water(): void
{
    $tiers = Setting::DEFAULTS['water_tiers'];
    $this->assertSame(13400, UtilityTariff::calculate(20, $tiers, 'progressive')['amount']);
    $this->assertSame(36600, UtilityTariff::calculate(60, Setting::DEFAULTS['electric_tiers'], 'whole')['amount']);
}
```
```bash
docker compose exec laravel php artisan test --filter=progressive_water
```

## Practice
Write the same calculation in JavaScript (`src/utils/tariff.js`) to show a **live preview** in the meter-reading
form before saving. Both must give the same result. Why is the server still the one that saves the amount?

## Commit
```bash
git add . && git commit -m "Step 13: settings with defaults and tiered utility tariffs"
```
