---
name: add-module
description: Add a CRUD module (migration, model, requests, resource, service, controller, test, Vue service, list page, form modal) to an RTR-style Laravel + Vue project.
argument-hint: "<Thing> [plural] [fields…]  e.g. Product products code:string name:string price:decimal"
disable-model-invocation: true
---

# Add a module

Arguments: $ARGUMENTS
The first word is the model name in PascalCase (for example `Product`). An optional second word is the plural table
name. Any `field:type` pairs are the columns. If no name was given, ask for it.

First load the `fullstack-laravel-vue-builder` skill from this plugin.

1. Check that the current folder has `laravel-app/` and `vuejs-app/src/`. If not, find the project root or ask.
2. Run the generator from the project root:
   `bash <fullstack-laravel-vue-builder base dir>/scripts/make-module.sh <Thing> [plural] [Label]`
   It creates 11 files and never overwrites. Read its "Next" output.
3. Replace the template's example columns (`code`, `name`, `price`, `status`, `notes`) with the requested fields,
   **in every generated file**: the migration, `$fillable` and `$casts`, the Store/Update rules, the Resource, the
   form modal fields, the list table columns, and the test payloads. Keep each field's type consistent everywhere.
4. Move any business rule (totals, stock, dates, money) into `{Thing}Service` inside `DB::transaction()`. Money is
   stored as integers in the smallest unit, and bills keep a snapshot of the numbers they used.
5. Add the routes to the right role groups in `routes/api.php`, the router entry with `meta.title`/`meta.roles`, and
   the sidebar item, exactly as the script printed.
6. Run `php artisan migrate` and `php artisan test --filter=<Thing>Test` (in Docker:
   `docker compose exec laravel …`). If there is a `vuejs-app/node_modules`, also run `npm run build`. Fix failures
   before you report.
7. Report the files you changed, the routes and their roles, and the test result.
