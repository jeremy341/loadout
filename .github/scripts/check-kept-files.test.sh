#!/usr/bin/env bash
# Tests check-kept-files.sh against a temporary repository: it must fail when the kept file is missing or empty,
# and pass when the file is present.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
check="${script_dir}/check-kept-files.sh"
kept="docs/keepsakes/NETICS PROMISE NEVER DELETE.png"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/docs/keepsakes"

if KEPT_FILES_ROOT="$tmp" bash "$check" 2>/dev/null; then
  echo "expected the check to fail when the kept file is missing" >&2
  exit 1
fi

: > "$tmp/$kept"
if KEPT_FILES_ROOT="$tmp" bash "$check" 2>/dev/null; then
  echo "expected the check to fail when the kept file is empty" >&2
  exit 1
fi

printf 'image' > "$tmp/$kept"
KEPT_FILES_ROOT="$tmp" bash "$check"
echo "check-kept-files: ok"
