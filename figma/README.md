# RTR Room: Figma UX/UI

The design is taken from the real project: colours from `vuejs-app/src/assets/rtr-theme.css`, the font from the
same file (Source Sans Pro, with Kantumruy Pro for Khmer), and layouts from `Sidebar.vue`, `Navbar.vue`,
`KpiCard.vue`, `RoomListPage.vue`, `InvoiceListPage.vue`, `PortalHomePage.vue` and the help screenshots in
`vuejs-app/public/help/`.

## Get the complete design (about 1 minute)

Your Figma plan (Starter, View seat) allows only a few AI (MCP) calls, and that limit stopped the build twice.
So the whole design is packed in a small **Figma plugin** that runs in your own Figma and needs **no AI calls**.

1. Download the folder [`build-plugin/`](build-plugin/) (`manifest.json` + `code.js`).
2. Open the **Figma desktop app**.
3. Open the empty file **[RTR Room — UX/UI (RTR-G2) v2](https://www.figma.com/design/wmbQir2fgHSm53ASZ2vpnN)**
   (or any new, empty design file).
4. **Menu → Plugins → Development → Import plugin from manifest…** → choose `build-plugin/manifest.json`.
5. **Menu → Plugins → Development → RTR Build Design**.
6. After a few seconds: *"RTR design built: design system, 6 screens and prototype."*
7. Go to the page **📱 Screens & Prototype** and press **▶ Present** to click through it.

> Run it in an **empty** file. Each run creates a new set of variables, styles and pages.

## What the plugin builds

### Page 🎨 Design System
| Element | Type | Matches code |
|---|---|---|
| **RTR Tokens**: 15 colours, 4 spacing values, 4 radii | Variables with `var(--rtr-…)` code syntax | `:root` in `rtr-theme.css` |
| Heading/H1, H2, Card title, Body/Regular, Body/Strong, Caption, Label/Overline, Number/KPI | Text styles | theme font sizes |
| Shadow/Card | Effect style | `.card` box-shadow |
| **Button**: Primary · Outline · Warning · Danger (`Label`) | Component set | `.btn`, 8px radius |
| **Status Badge**: Paid · Unpaid · Partial · Overdue · Available · Occupied · Maintenance · Owner use | Component set | `RoomStatusBadge.vue`, invoice statuses |
| **Input** (`Placeholder`) | Component | `.form-control` |
| **Nav Item**: Default · Active (`Label`) | Component set | `.rtr-sidebar .nav-link` |
| **KPI Card**: Purple · Green · Orange · Blue · Pink · Teal (`Title`, `Value`, `Sub`) | Component set | `KpiCard.vue` |

### Page 📱 Screens & Prototype
| Frame | Size | Built from |
|---|---|---|
| **App Sidebar**, **App Navbar** | layout components | `Sidebar.vue`, `Navbar.vue` |
| 01 · Login | 1440×900 | `LoginPage.vue` |
| 02 · Dashboard | 1440×900 | `DashboardPage.vue`: 6 KPI cards, 12-month trend, income donut |
| 03 · Rooms | 1440×900 | `RoomListPage.vue`: filters, table, badges, actions, pagination |
| 04 · Invoices | 1440×900 | `InvoiceListPage.vue`: summary boxes, month picker, invoice table |
| 05 · Tenant Portal (mobile) | 390×844 | `PortalHomePage.vue`: balance card, my room, bottom tabs |
| 06 · Add Room (modal) | 500 wide overlay | `RoomFormModal.vue`, with a validation error example |

### Prototype links
- Login → **Log in** → Dashboard
- Sidebar **Dashboard / Rooms / Invoices** on every admin screen → that screen
- Rooms → **+ Add Room** → the *Add Room* modal as an overlay. **×**, **Cancel** and **Save** close it.
- Flow starting points: *Admin* (Login) and *Tenant portal (mobile)*

Khmer text (៛, ខ្មែរ) is set in **Kantumruy Pro** automatically, because Source Sans Pro has no Khmer letters.

## The first file (if you still have it)
The first file, *RTR Room — UX/UI (RTR-G2)* (`https://www.figma.com/design/rZzDawRBToVMFUXC1XabIK`), was finished
earlier: the design system, all six screens, the prototype links and the Khmer font. Two small visual issues were
left: every status badge shows the text "Paid" (the colours are right), and the **Open** button at the end of each
invoice row is cut off. [`finish-plugin/`](finish-plugin/) fixes both. Import its `manifest.json` the same way.

Later in the session that file could no longer be opened from here, so it may have been moved or deleted. If you
can't find it in your Figma drafts, use `build-plugin/` above, which builds everything again with these fixes
already included.

## Use the design while coding
- Select a colour in Figma: *Dev Mode* shows `var(--rtr-blue)`, the same name as in `rtr-theme.css`.
- Each component's description names its `.vue` file.
- Step 10 of the course ([`../steps/step-10-layout-theme.md`](../steps/step-10-layout-theme.md)) builds this layout in code.
