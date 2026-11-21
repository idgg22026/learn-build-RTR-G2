#!/usr/bin/env bash
# Install the RTR skills for Claude Code without the plugin system.
#   bash install.sh            → all projects   (~/.claude/skills)
#   bash install.sh --project  → this project   (./.claude/skills, shared through git)
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/plugin/skills" && pwd)"
if [[ "${1:-}" == "--project" ]]; then DEST="$PWD/.claude/skills"; else DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"; fi
mkdir -p "$DEST"
for s in "$SRC"/*/; do
  n="$(basename "$s")"
  rm -rf "$DEST/$n" && cp -r "$s" "$DEST/$n"
  echo "installed $n → $DEST/$n"
done
echo "Done. Restart Claude Code, then type /new-project, /add-module or /check-rules, or just ask: \"build it like RTR\"."
