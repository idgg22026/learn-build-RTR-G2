# Step 10 — Admin layout and theme

## Goal
After login you see the RTR look: a **navy sidebar** with grouped, coloured menu icons, a white **navbar** with the
page title and user menu, and soft cards on a light page.

## You will learn
- AdminLTE's layout classes (`wrapper`, `main-sidebar`, `content-wrapper`) inside Vue
- Data-driven menus (an array of groups → `v-for`), with owner-only items hidden
- Overriding a UI kit with CSS variables, loaded **after** AdminLTE

## Files
| File | Action |
|---|---|
| `src/layouts/AdminLayout.vue` | Created manually |
| `src/components/includes/Sidebar.vue`, `Navbar.vue`, `Footer.vue` | Created manually |
| `src/assets/rtr-theme.css` | Created manually |

## Design reference
Open the Figma file (see [`../figma/README.md`](../figma/README.md)): page **🎨 Design System** has the colour
tokens, buttons, badges, nav item and KPI card; page **📱 Screens & Prototype** has the full layout.

## Do it

**`src/layouts/AdminLayout.vue`**
```vue
<template>
  <div class="wrapper">
    <Navbar />
    <Sidebar />
    <div class="content-wrapper">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from '@/components/includes/Navbar.vue'
import Sidebar from '@/components/includes/Sidebar.vue'
import Footer from '@/components/includes/Footer.vue'
</script>
```
Add `class="hold-transition sidebar-mini layout-fixed"` to `<body>` in `index.html`.

**`Sidebar.vue`** — the menu is data:
```js
const groups = [
  { title: 'MAIN', items: [{ label: 'Dashboard', to: '/', icon: 'fas fa-th-large', color: '#60a5fa' }] },
  { title: 'PROPERTY', items: [
    { label: 'Rooms', to: '/rooms', icon: 'fas fa-door-open', color: '#fbbf24' },
    { label: 'Tenants', to: '/tenants', icon: 'fas fa-users', color: '#f472b6' },
    { label: 'Utilities', to: '/utilities', icon: 'fas fa-bolt', color: '#facc15' },
    { label: 'Requests', to: '/requests', icon: 'fas fa-tools', color: '#a78bfa', badge: 'requests_open' },
  ] },
  { title: 'MONEY', items: [
    { label: 'Invoices', to: '/invoices', icon: 'fas fa-file-invoice-dollar', color: '#34d399', badge: 'invoices_unpaid' },
    { label: 'Expenses', to: '/expenses', icon: 'fas fa-receipt', color: '#fb923c', ownerOnly: true },
    { label: 'Reports', to: '/reports', icon: 'fas fa-chart-pie', color: '#22d3ee', ownerOnly: true },
  ] },
  { title: 'ADMIN', items: [
    { label: 'Logins', to: '/users', icon: 'fas fa-user-lock', color: '#94a3b8', ownerOnly: true },
  ] },
]
const menu = computed(() => groups
  .map((g) => ({ ...g, items: g.items.filter((i) => !i.ownerOnly || auth.isOwner) }))
  .filter((g) => g.items.length))
const isActive = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
```
```vue
<aside class="main-sidebar sidebar-dark-primary rtr-sidebar">
  <router-link to="/" class="brand-link rtr-brand">
    <span class="brand-image rtr-logo"><i class="fas fa-building"></i></span>
    <span class="brand-text"><b>RTR Room</b><small>Rental management</small></span>
  </router-link>
  <div class="sidebar">
    <nav class="mt-2">
      <ul class="nav nav-pills nav-sidebar flex-column" role="menu">
        <template v-for="group in menu" :key="group.title">
          <li class="nav-header">{{ group.title }}</li>
          <li v-for="item in group.items" :key="item.to" class="nav-item">
            <router-link :to="item.to" class="nav-link" :class="{ active: isActive(item.to) }">
              <i class="nav-icon" :class="item.icon" :style="{ color: isActive(item.to) ? '#fff' : item.color }"></i>
              <p>{{ item.label }}</p>
            </router-link>
          </li>
        </template>
      </ul>
    </nav>
  </div>
</aside>
```

**`Navbar.vue`** shows `route.meta.title`, the language switch (step 19), today's date, a bell with counts and a
user menu with *Account security* and *Log out* (`await auth.logout(); router.replace('/login')`).

**`src/assets/rtr-theme.css`** — the design tokens (same names as the Figma variables):
```css
:root {
  --rtr-navy: #0f1b3d;
  --rtr-navy-2: #14213d;
  --rtr-blue: #2563eb;
  --rtr-page: #f4f6fb;
  --rtr-ink: #14213d;
  --rtr-muted: #6b7280;
}
body, .content-wrapper { background: var(--rtr-page); }
.card { border: 0; border-radius: 14px; box-shadow: 0 4px 14px rgba(20, 33, 61, 0.07); }
.btn, .form-control, .custom-select { border-radius: 8px; }
.rtr-sidebar { background: linear-gradient(180deg, var(--rtr-navy) 0%, var(--rtr-navy-2) 55%, #0c1530 100%); }
.rtr-sidebar .nav-sidebar > .nav-item > .nav-link { margin-bottom: 3px; padding: 9px 12px; border-radius: 10px; color: #c7d2e8; }
.rtr-sidebar .nav-sidebar > .nav-item > .nav-link.active {
  background: linear-gradient(90deg, #2563eb, #3b82f6) !important; color: #fff !important;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45) !important;
}
.rtr-logo { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #fbbf24, #f97316); color: #fff; }
```
Copy the rest (navbar chip, avatar, user menu, widget) from the original `rtr-theme.css`.

## Check
Log in as **owner**: you see Expenses, Reports and Logins. Log in as **staff** (`rtr:user 012000002 Staff staff`):
those three items are gone, and typing `/users` in the address bar sends you home.

## Practice
Build the "Today" widget at the bottom of the sidebar: exchange rate and meter-reading progress. Add
`GET /api/dashboard/badges` that returns `{ exchange_rate, reading: { done, rooms, period }, counts: {...} }` and a
Pinia `badges` store that refreshes it every 60 seconds. Compare with `stores/badges.js` and `DashboardController::badges`.

## Commit
```bash
git add . && git commit -m "Step 10: admin layout, sidebar, navbar and RTR theme"
```
