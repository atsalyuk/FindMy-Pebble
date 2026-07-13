#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
REPO_ROOT=$(CDPATH= cd -- "$PROJECT_DIR/.." && pwd)
TMP_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/findmy-pebble.XXXXXX")
TMP_DIR="$TMP_ROOT/pebble"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p "$TMP_DIR"
rsync -a \
  --delete \
  --exclude build \
  --exclude node_modules \
  --exclude .git \
  --exclude .DS_Store \
  "$PROJECT_DIR"/ "$TMP_DIR"/

if [ -f "$REPO_ROOT/tsconfig.base.json" ]; then
  cp "$REPO_ROOT/tsconfig.base.json" "$TMP_ROOT/tsconfig.base.json"
fi

cd "$TMP_DIR"
npm install --workspaces=false
./node_modules/.bin/tsc -p tsconfig.json
node ./tools/transpile-src.mjs
pebble build

mkdir -p "$PROJECT_DIR/build"
rsync -a --delete "$TMP_DIR/build"/ "$PROJECT_DIR/build"/
