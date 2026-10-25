#!/usr/bin/env bash
# Fails when a file the owner asked us to keep is missing or empty. The Repository integrity job runs this on every
# pull request to development, testing and main. Rule: AGENTS.md, "Kept files".
set -euo pipefail

repo_root="${KEPT_FILES_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
kept_files=(
  "docs/keepsakes/NETICS PROMISE NEVER DELETE.png"
)

status=0
for path in "${kept_files[@]}"; do
  if [[ ! -s "${repo_root}/${path}" ]]; then
    printf '::error::Kept file is missing or empty: %s\n' "$path" >&2
    printf 'Never delete, move or rename it. See AGENTS.md, "Kept files".\n' >&2
    status=1
  fi
done
exit "$status"
