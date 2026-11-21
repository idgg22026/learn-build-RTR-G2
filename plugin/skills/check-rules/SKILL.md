---
name: check-rules
description: Review an RTR-style Laravel + Vue project (or one module) against the 13 RTR rules and the module checklist, and report what breaks them.
argument-hint: "[module or path]  (empty = whole project)"
disable-model-invocation: true
---

# Check the RTR rules

Scope: $ARGUMENTS (an empty scope means the whole project).

First load the `fullstack-laravel-vue-builder` skill. Use its "Rules you must keep" and "Checklists" sections as the
standard. For each rule, look for concrete evidence in the code:

| Rule | Where to look |
|---|---|
| Thin controllers | `app/Http/Controllers`: queries or business logic beyond validate → service → resource |
| Transactions and locks | services that write more than one row; payments or stock without `lockForUpdate()` |
| Integer money and snapshots | `float`/`double` money columns; bills that read current prices instead of stored ones |
| Void instead of delete | `->delete()` or `forceDelete()` on money records |
| Constants for allowed values | `Rule::in([...])` with literal arrays instead of `Model::CONST` |
| Permissions twice | routes outside the `role:` groups; Vue buttons without `$can()`; routes without `meta.roles` |
| Ownership in the portal | `{model}` route parameters in the self-service group without an owner check |
| Private files | uploads on the `public` disk; URLs without signing |
| Append-only migrations | migrations edited after later migrations exist (`git log` on old migration files) |
| Tests | modules without a `tests/Feature/*Test.php`, or tests without a 403 case |

Run `php artisan test` if possible. Report each finding with its file and line, why it matters, and the fix, with
the most serious first. Do not change code unless the user asks. End with a short list of what already follows
the rules.
