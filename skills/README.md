# Skill: fullstack-laravel-vue-builder

A Claude Code **skill** made from the RTR-G2 project. It teaches Claude (and you) to start a new project, or add a
module, with the same structure: Laravel API + Vue SPA + Docker, roles, services, snapshots, tests.

## Install

**For every project on your computer:**
```bash
git clone https://github.com/idgg22026/learn-build-RTR-G2.git
mkdir -p ~/.claude/skills
cp -r learn-build-RTR-G2/skills/fullstack-laravel-vue-builder ~/.claude/skills/
```

**For one project only** (it is shared with your team through git):
```bash
mkdir -p .claude/skills
cp -r learn-build-RTR-G2/skills/fullstack-laravel-vue-builder .claude/skills/
```

Restart Claude Code. The skill loads by itself when your request matches its description, or you can name it.

## Use it: example prompts
- *"Use the fullstack-laravel-vue-builder skill to plan a school fee manager with owner, cashier, viewer and parent roles."*
- *"Build it like RTR: add a Products module with code, name, price, status."*
- *"Add a self-service portal for students, the way the RTR tenant portal works."*

## What is inside
| Path | Content |
|---|---|
| `SKILL.md` | The phases (plan → skeleton → auth → first module → rules), the 13 rules, and the checklists |
| `references/` | Architecture map, backend setup, security patterns, i18n, Figma, release checklist |
| `templates/docker/` | `compose.yaml`, both Dockerfiles, CI workflow |
| `templates/laravel/` | migration, Model, StoreRequest, Resource, Service, Controller, routes skeleton, EnsureRole, feature test |
| `templates/vue/` | `http.js`, auth store, router with guard, `swal.js`, service, FormModal, ListPage |

The templates use the placeholders `{Thing}`, `{thing}`, `{things}`, `{THING}` and `{THING_LABEL}`. `SKILL.md`
shows a `sed` command that fills them in.
