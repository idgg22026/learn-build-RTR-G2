#!/usr/bin/env bash
# Start a new project with the RTR structure: Docker files, root .env, PLAN.md, and (with --create) the two apps.
#
#   bash new-project.sh <folder> [app-name]            only the skeleton (fast, no downloads)
#   bash new-project.sh <folder> [app-name] --create   also creates laravel-app/ and vuejs-app/ with Docker
set -euo pipefail

DIR="${1:-}"; NAME="${2:-}"; CREATE="no"
for a in "$@"; do [[ "$a" == "--create" ]] && CREATE="yes"; done
[[ "$NAME" == "--create" ]] && NAME=""
[[ -n "$DIR" ]] || { echo "Usage: new-project.sh <folder> [app-name] [--create]" >&2; exit 1; }
[[ -e "$DIR" && -n "$(ls -A "$DIR" 2>/dev/null)" ]] && { echo "Folder $DIR exists and is not empty." >&2; exit 1; }
NAME="${NAME:-$(basename "$DIR")}"
SLUG="$(tr '[:upper:] -' '[:lower:]__' <<< "$NAME" | tr -cd 'a-z0-9_')"
TPL="$(cd "$(dirname "${BASH_SOURCE[0]}")/../templates" && pwd)"

mkdir -p "$DIR/docker/laravel" "$DIR/docker/vuejs" "$DIR/.github/workflows" "$DIR/scripts"
cp "$TPL/docker/docker/laravel/Dockerfile" "$DIR/docker/laravel/Dockerfile"
cp "$TPL/docker/docker/vuejs/Dockerfile" "$DIR/docker/vuejs/Dockerfile"
cp "$TPL/docker/ci.yml" "$DIR/.github/workflows/ci.yml"
sed -e "s/cadt_/${SLUG}_/g; s/rtr_room/${SLUG}/g; s/rtr_user/${SLUG}_user/g" "$TPL/docker/compose.yaml" > "$DIR/compose.yaml"
sed -e "s/{APP_NAME}/$NAME/g" "$TPL/PLAN.md" > "$DIR/PLAN.md"
pw() { LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 20; }
printf 'MYSQL_ROOT_PASSWORD=%s\nMYSQL_PASSWORD=%s\n' "$(pw)" "$(pw)" > "$DIR/.env"
printf '.env\nlaravel-app/.env\nvuejs-app/.env\n' > "$DIR/.gitignore"

echo "Skeleton ready in $DIR (database: $SLUG, user: ${SLUG}_user, passwords in $DIR/.env)."

if [[ "$CREATE" == "yes" ]]; then
  cd "$DIR"
  docker run --rm -v "$PWD":/app -w /app composer:2 create-project laravel/laravel laravel-app
  docker compose build
  docker compose run --rm laravel php artisan install:api --no-interaction
  docker run --rm -v "$PWD":/app -w /app node:22-alpine sh -c "npm create vue@latest vuejs-app -- --router --pinia --default"
  docker compose run --rm vuejs npm install admin-lte@^3.2 bootstrap@^4.6 jquery@^3.7 @fortawesome/fontawesome-free@^5.15 axios sweetalert2
  echo "VITE_API_URL=http://localhost:8000/api" | tee vuejs-app/.env > vuejs-app/.env.example
  echo "Apps created. Now follow references/backend-setup.md (.env, cors.php, bootstrap/app.php)."
else
  cat <<NEXT
Next:
  1. Fill in $DIR/PLAN.md (roles, modules, ERD, screens).
  2. Create the apps:  bash $(basename "$0") ... --create   (or run the commands in SKILL.md, Phase 1)
NEXT
fi
