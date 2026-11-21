---
name: new-project
description: Start a new Laravel + Vue + Docker project with the RTR structure. Plans roles and modules first, then creates the skeleton.
argument-hint: "<folder-name> [short description of the app]"
disable-model-invocation: true
---

# New project (RTR structure)

Arguments: $ARGUMENTS
The first word is the folder name, and the rest is a description of the app. If either is missing, ask the user.

First load the `fullstack-laravel-vue-builder` skill from this plugin. Its SKILL.md, references and templates are the source of truth.

1. **Plan (Phase 0).** Together with the user, fill `PLAN.md`: problem, roles (owner/staff/viewer plus an optional
   self-service role), modules, ERD, money rules and screens. Ask short questions only where the description leaves a
   real choice open. Show the roles and modules tables and get a yes before moving on.
2. **Skeleton.** From the folder where the project should live, run:
   `bash <fullstack-laravel-vue-builder base dir>/scripts/new-project.sh <folder> "<App Name>"`
   Then write the agreed plan into `<folder>/PLAN.md`.
3. **Apps.** If Docker is available and the user agrees, run the same script with `--create` (it downloads images
   and packages). Otherwise give the user the commands from SKILL.md Phase 1.
4. **Backend setup and auth (Phases 1–2).** Apply `references/backend-setup.md`, then the auth templates (`EnsureRole`,
   `api-routes.php`, `http.js`, `auth.store.js`, `router.js`), plus the layout with a data-driven sidebar.
5. **First module.** Use `/rtr-fullstack-builder:add-module` for the first module in the plan, and run its test.
6. Finish with a short list of what exists, what the user should run, and the next module to build.
