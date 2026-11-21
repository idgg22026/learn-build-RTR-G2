#!/usr/bin/env bash
# Generate a full CRUD module (Laravel API + Vue page) from the RTR templates.
#
#   bash make-module.sh <Thing> [things] [Label]      run it from the project root (the folder with laravel-app/ and vuejs-app/)
#   bash make-module.sh Product                        → products, "Product"
#   bash make-module.sh Category categories "Category"
#
# Creates 11 files and never overwrites an existing one. Then it prints the routes, router entry and menu item to add.
set -euo pipefail

THING="${1:-}"
if [[ -z "$THING" || ! "$THING" =~ ^[A-Z][A-Za-z0-9]*$ ]]; then
  echo "Usage: make-module.sh <Thing (PascalCase, e.g. Product)> [things (plural, e.g. products)] [Label]" >&2
  exit 1
fi
lower_first() { echo "$(tr '[:upper:]' '[:lower:]' <<< "${1:0:1}")${1:1}"; }
snake() { sed -E 's/([a-z0-9])([A-Z])/\1_\2/g' <<< "$1" | tr '[:upper:]' '[:lower:]'; }
thing="$(lower_first "$THING")"                       # product   (variable, route segment)
THINGS_DEFAULT="$(snake "$THING")s"
things="${2:-$THINGS_DEFAULT}"                        # products  (table, URL, folder)
LABEL="${3:-$THING}"                                  # Product   (text for users)
CONST="$(snake "$THING" | tr '[:lower:]' '[:upper:]')" # PRODUCT  (JS constant prefix)

ROOT="$(pwd)"
API="$ROOT/laravel-app"
WEB="$ROOT/vuejs-app/src"
TPL="$(cd "$(dirname "${BASH_SOURCE[0]}")/../templates" && pwd)"
[[ -d "$API/app" && -d "$WEB" ]] || { echo "Run this from the project root: laravel-app/ and vuejs-app/src/ must exist." >&2; exit 1; }

fill() { sed -e "s/{Thing}/$THING/g; s/{things}/$things/g; s/{thing}/$thing/g; s/{THING_LABEL}/$LABEL/g; s/{THING}/$CONST/g" "$1"; }
created=()
put() { # template → destination
  local src="$1" dst="$2"
  if [[ -e "$dst" ]]; then echo "skip (exists): ${dst#$ROOT/}"; return; fi
  mkdir -p "$(dirname "$dst")"
  fill "$src" > "$dst"
  created+=("${dst#$ROOT/}")
}

STAMP="$(date +%Y_%m_%d_%H%M%S)"
put "$TPL/laravel/migration.php"    "$API/database/migrations/${STAMP}_create_${things}_table.php"
put "$TPL/laravel/Model.php"        "$API/app/Models/$THING.php"
put "$TPL/laravel/StoreRequest.php" "$API/app/Http/Requests/Store${THING}Request.php"
if [[ ! -e "$API/app/Http/Requests/Update${THING}Request.php" ]]; then
  fill "$TPL/laravel/StoreRequest.php" \
    | sed -e "s/class Store${THING}Request/class Update${THING}Request/" \
          -e "s/Rule::unique('$things', 'code')->whereNull('deleted_at')\]/Rule::unique('$things', 'code')->ignore(\$this->route('$thing'))->whereNull('deleted_at')]/" \
    > "$API/app/Http/Requests/Update${THING}Request.php"
  created+=("laravel-app/app/Http/Requests/Update${THING}Request.php")
fi
put "$TPL/laravel/Resource.php"     "$API/app/Http/Resources/${THING}Resource.php"
put "$TPL/laravel/Service.php"      "$API/app/Services/${THING}Service.php"
put "$TPL/laravel/Controller.php"   "$API/app/Http/Controllers/${THING}Controller.php"
put "$TPL/laravel/FeatureTest.php"  "$API/tests/Feature/${THING}Test.php"
put "$TPL/vue/service.js"           "$WEB/services/${thing}Service.js"
put "$TPL/vue/FormModal.vue"        "$WEB/components/$things/${THING}FormModal.vue"
put "$TPL/vue/ListPage.vue"         "$WEB/pages/$things/${THING}ListPage.vue"

echo
echo "Created ${#created[@]} files:"
printf '  %s\n' "${created[@]}"
cat <<NEXT

Next, add these by hand (they go inside existing files):

1) laravel-app/routes/api.php: put each line in its role group
   // read  (role:owner,staff,viewer)
   Route::get('$things', [\\App\\Http\\Controllers\\${THING}Controller::class, 'index']);
   Route::get('$things/{$thing}', [\\App\\Http\\Controllers\\${THING}Controller::class, 'show']);
   // work  (role:owner,staff)
   Route::post('$things', [\\App\\Http\\Controllers\\${THING}Controller::class, 'store']);
   Route::match(['put', 'patch'], '$things/{$thing}', [\\App\\Http\\Controllers\\${THING}Controller::class, 'update']);
   // owner (role:owner)
   Route::delete('$things/{$thing}', [\\App\\Http\\Controllers\\${THING}Controller::class, 'destroy']);

2) vuejs-app/src/router/index.js: a child of the admin layout
   { path: '$things', name: '$things', component: () => import('@/pages/$things/${THING}ListPage.vue'), meta: { title: '${LABEL}s' } },

3) vuejs-app/src/components/includes/Sidebar.vue: a menu item
   { label: '${LABEL}s', to: '/$things', icon: 'fas fa-box', color: '#60a5fa' },

4) Edit the migration columns, then run:
   docker compose exec laravel php artisan migrate
   docker compose exec laravel php artisan test --filter=${THING}Test
NEXT
