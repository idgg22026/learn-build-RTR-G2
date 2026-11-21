#!/usr/bin/env bash
# Rebuild dist/fullstack-laravel-vue-builder.zip (for upload in the Claude app: Settings → Capabilities → Skills).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/plugin/skills"
mkdir -p ../../dist && rm -f ../../dist/fullstack-laravel-vue-builder.zip
zip -qr ../../dist/fullstack-laravel-vue-builder.zip fullstack-laravel-vue-builder -x '*.DS_Store'
echo "dist/fullstack-laravel-vue-builder.zip"
