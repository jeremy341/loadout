#!/usr/bin/env bash
# Writes app=true to $GITHUB_OUTPUT when a change can affect the landing app, and
# app=false when it only touches documentation. When in doubt it answers true.
#
# The comparison base is always a commit that was already verified:
#   pull request            the base branch tip
#   development/testing/main  the lane's previous tip (a lane only receives checked commits)
#   any other branch        where the branch left development
set -euo pipefail

zero='^0+$'
base=""
case "${EVENT_NAME:-}" in
  pull_request)
    base="${PR_BASE_SHA:-}"
    ;;
  push)
    case "${REF:-}" in
      refs/heads/development | refs/heads/testing | refs/heads/main)
        base="${BEFORE_SHA:-}"
        ;;
      *)
        base="$(git merge-base HEAD origin/development 2>/dev/null || true)"
        ;;
    esac
    ;;
esac

if [[ -z "$base" || "$base" =~ $zero ]] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "No verified base commit; every check runs."
  echo "app=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

app=false
while IFS= read -r file; do
  case "$file" in
    docs/* | plans/* | .ulpi/* | assets/* | README.md | AGENTS.md | PRODUCT.md | LOADOUT_DESIGN_SYSTEM.md | LICENSE)
      ;;
    *)
      echo "Changes the app: $file"
      app=true
      break
      ;;
  esac
done < <(git diff --name-only "$base" HEAD)

echo "app=$app" >> "$GITHUB_OUTPUT"
if [[ "$app" != "true" ]]; then
  echo "Only documentation changed since ${base}; lint, build and browser steps are skipped."
fi
