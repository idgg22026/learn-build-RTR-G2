# Step 1 — Plan the product and set up your tools

## Goal
You know **what** RTR Room does, **who** uses it, and you have an empty project folder with the same structure as the
original repository.

## You will learn
- How to turn a business problem into features, roles and screens before writing code
- Why the project is split into **two apps** (API + SPA) and run with Docker

## 1. The business problem
A landlord in Cambodia rents rooms. Every month someone must:
1. read each room's **electricity and water meters**,
2. calculate the bill with **tiered prices** (EDC/PPWSA style),
3. add **rent** (in USD) and convert to **riel** with today's exchange rate,
4. send an **invoice**, collect **cash / ABA KHQR** payments,
5. track **deposits**, **contracts**, **repairs**, **expenses** and **profit**.

RTR Room automates all of this.

## 2. Users and roles (write this table first!)

| Role | Can do | Where |
|---|---|---|
| `owner` | Everything, incl. delete, settings, money corrections, logins, reports | Admin app |
| `staff` | Daily work: rooms, tenants, meter readings, invoices, payments | Admin app |
| `viewer` | Read only | Admin app |
| `tenant` | Own room, invoices, meter history, repairs, payment proof, contract | Mobile portal |

> **Main point:** roles decide your routes (`routes/api.php` groups), your menu (`Sidebar.vue`) and your router
> guard (`meta.roles`). Decide them on day 1.

## 3. Feature list → modules
| Module | Backend | Frontend page |
|---|---|---|
| Auth | `AuthController`, `TwoFactorController` | `LoginPage`, `QrLoginPage`, `AccountSecurityPage` |
| Rooms | `RoomController`, `RoomItemController` | `rooms/RoomListPage` |
| Tenants | `TenantController`, `TenantService` | `tenants/TenantListPage` |
| Utilities | `MeterReadingController`, `MainMeterController`, `UtilityTariff` | `utilities/UtilityPage` |
| Invoices | `InvoiceController`, `InvoiceService`, `PaymentProofController` | `invoices/InvoiceListPage`, `InvoicePrintPage` |
| Deposit & contract | `DepositController`, `ContractController` | `DepositPrintPage`, `ContractPrintPage` |
| Requests | `MaintenanceController`, `AnnouncementController` | `requests/RequestListPage` |
| Expenses & reports | `ExpenseController`, `ProfitReportService`, `DashboardService` | `DashboardPage`, `reports/*`, `expenses/*` |
| Users | `UserController` | `users/UserListPage` |
| Tenant portal | `PortalController` | `portal/*` |

## 4. Install the tools
| Tool | Why | Check |
|---|---|---|
| Git | version control | `git --version` |
| Docker Desktop (with Compose v2) | runs MySQL, PHP, Node without installing them | `docker compose version` |
| VS Code + extensions *Vue (Official)*, *PHP Intelephense*, *Docker* | editor | — |
| (optional) PHP 8.3 + Composer, Node 22 | run tools outside Docker | `php -v`, `node -v` |

## 5. Create the skeleton
```bash
mkdir Fullstack-RTR-G2 && cd Fullstack-RTR-G2
git init
mkdir -p docker/laravel docker/vuejs scripts .github/workflows
printf ".env\n" > .gitignore
```

## Check
`ls` shows `docker/ scripts/ .github/ .gitignore`.

## Practice
Write a one-page `PLAN.md` for **your own** idea (e.g. a gym or a school fee manager): the problem, a role table,
and a module table like the ones above. You will reuse this plan with the skill in `skills/`.

## Commit
```bash
git add . && git commit -m "Step 1: project plan and folder skeleton"
```
