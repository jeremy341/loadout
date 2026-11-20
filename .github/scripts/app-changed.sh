#!/usr/bin/env bash
# Writes app=true to $GITHUB_OUTPUT when a change can affect the landing app, and
# app=false when it only touches documentation or reference pin entries.
# When in doubt it answers true.
#
# The comparison base is the tip of main that the pull request targets, so only what the pull request
# adds is looked at. Anything else (a manual run, a missing base) runs every check.
set -euo pipefail

zero='^0+$'
base=""
if [[ "${EVENT_NAME:-}" == "pull_request" ]]; then
  base="${PR_BASE_SHA:-}"
fi

if [[ -z "$base" || "$base" =~ $zero ]] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "No verified base commit; every check runs."
  echo "app=true" >> "$GITHUB_OUTPUT"
  exit 0
fi

app=false
while IFS= read -r file; do
  case "$file" in
    docs/* | plans/* | .ulpi/* | assets/* | references/* | README.md | AGENTS.md | PRODUCT.md | LICENSE)
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
  echo "Only documentation or reference pins changed since ${base}; Landing checks are skipped."
fi
