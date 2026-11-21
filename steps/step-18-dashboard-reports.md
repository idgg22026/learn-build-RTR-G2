# Step 18 — Dashboard, expenses and reports

## Goal
The owner opens the app and sees, for the chosen month: **income, collected, net profit, occupied rooms, tenants,
outstanding** (with % change vs last month and a sparkline), a 12-month income/expense chart, the income mix donut,
collection by payment method, and alerts. Expenses (one-off and monthly recurring) feed a **profit & loss** report.

## You will learn
- One service that builds the whole dashboard in a few queries (`DashboardService::overview`)
- Charts **without a chart library**: small SVG components (`TrendChart`, `DonutChart`, `BarChart`) + a `scale.js` helper
- Recurring expenses that create a row each month

## Files
| File | Action |
|---|---|
| `2026_11_16_090000_create_expenses.php` (expenses, recurring_expenses) | Generated, then edited |
| `app/Services/ProfitReportService.php`, `DashboardService.php`, `ExpenseService.php`, `PaymentScoreService.php` | Created manually |
| `app/Http/Controllers/DashboardController.php`, `ExpenseController.php` | Generated, then edited |
| `src/components/dashboard/KpiCard.vue`, `TrendChart.vue`, `DonutChart.vue`, `BarChart.vue`, `scale.js` | Created manually |
| `src/pages/DashboardPage.vue`, `src/pages/reports/ProfitLossPage.vue`, `src/pages/expenses/ExpenseListPage.vue` | Created manually |

## Do it

**`DashboardService::overview($period)`** returns one JSON object for the whole page:
```php
return [
    'period'     => $period,
    'kpis'       => $this->kpis($months, $now, $before, $invoices, $paidByMonth),
    'trend'      => array_map(fn ($m) => ['period' => $m['period'], 'income' => $m['income'],
                                          'expenses' => $m['expenses'], 'net' => $m['net']], $months),
    'income_mix' => ['rent' => $now['rent'], 'water' => $now['water'], 'electric' => $now['electric'], 'other' => $now['other']],
    'collection' => $this->collection($invoices),   // cash / ABA / deposit, with %
    'rooms'      => $this->rooms($invoices),
    'alerts'     => $this->alerts($period, $invoices, $now),
    'recent'     => $this->recent(),
];
```
It is **owner only**: `Route::get('dashboard/overview', ...)` inside the `role:owner` group. Staff see a simpler
dashboard built from `dashboard/badges`.

**`KpiCard.vue`** — gradient card with a sparkline drawn as an SVG path:
```vue
<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" class="kpi-card"
             :style="{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }">
    <div class="kpi-top"><div class="kpi-title">{{ title }}</div><i class="kpi-icon" :class="icon"></i></div>
    <div class="kpi-value">{{ value }}</div>
    <div class="kpi-sub">
      <template v-if="change != null">
        <i class="fas" :class="change >= 0 ? 'fa-caret-up' : 'fa-caret-down'"></i> {{ Math.abs(change) }}% vs last month
      </template>
      <span v-else>{{ sub }}</span>
    </div>
    <svg v-if="spark.length > 1" class="kpi-spark" viewBox="0 0 100 32" preserveAspectRatio="none">
      <path :d="area" fill="rgba(255,255,255,0.18)" />
      <path :d="line" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.6" vector-effect="non-scaling-stroke" />
    </svg>
  </component>
</template>

<script setup>
const props = defineProps({
  title: String, value: String, sub: String, change: { type: Number, default: null },
  icon: String, colors: { type: Array, default: () => ['#6366f1', '#8b5cf6'] },
  spark: { type: Array, default: () => [] }, to: String,
})
const points = computed(() => {
  const v = props.spark.map(Number), min = Math.min(...v), span = Math.max(...v) - min || 1
  return v.map((y, i) => [(i / (v.length - 1)) * 100, 28 - ((y - min) / span) * 22])
})
const line = computed(() => points.value.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '))
const area = computed(() => `${line.value} L100,32 L0,32 Z`)
</script>
```
Use it six times in `DashboardPage.vue` with the colours from the Figma **KPI Card** variants
(Purple, Green, Orange, Blue, Pink, Teal).

**Short money** for cards and axes (`utils/money.js`): `formatRielShort(3298800) → "៛3.30M"`.

## Check
Run `php artisan rtr:demo --fresh` (step 20) and open the dashboard as owner: six cards, a trend line that starts
when tenants moved in, a donut where rent ≈ 87%. Log in as staff → no profit numbers anywhere.

## Practice
Build `PaymentScoreService`: for each tenant, the share of invoices paid **on time** in the last 6 months → a score
0–100 and a label (Excellent / Good / Late). Show it as a small table on the dashboard (owner only).

## Commit
```bash
git add . && git commit -m "Step 18: dashboard KPIs, SVG charts, expenses and profit report"
```
