# {APP_NAME}: plan

## 1. Problem
<!-- One paragraph: who has which problem today, and what the app changes. -->

## 2. Roles
| Role | Can do | App |
|---|---|---|
| owner | everything: delete, settings, money corrections, logins, reports | admin |
| staff | daily work: add and edit records, take payments | admin |
| viewer | read only | admin |
| member <!-- rename: tenant / student / customer --> | only their own data | portal (mobile) |

## 3. Modules
| Module | Models | Service (rules) | Page | Roles that write |
|---|---|---|---|---|
| | | | | |

## 4. Data (ERD)
<!-- Tables, key columns, relations. Mark money tables that need a SNAPSHOT (they copy prices and rates). -->

## 5. Money rules
<!-- Currency and smallest unit, rounding, exchange rate, what can be voided and by whom. -->

## 6. Screens
<!-- List every screen. Optional: design them in Figma (see references/figma-design.md). -->

## 7. Done when
- [ ] Each role sees only its menu, and the server refuses what the role cannot do
- [ ] Every module has a feature test
- [ ] `app:demo --fresh` fills realistic data
