#!/usr/bin/env bash
# Writes verified=true to $GITHUB_OUTPUT when the browser suite can be skipped because the exact
# tree it would test has already PASSED it.
#
# Two things must both hold, and the answer stays false whenever either is uncertain:
#   1. the tree under test is the tree of a lane commit (a promotion that adds nothing, or a push
#      to testing/main that carries the source lane's tree), and
#   2. that exact commit has a recorded successful `Landing browser` check run.
#
# Tree equality alone is not evidence: a lane can receive a tree whose browser run failed or never
# ran, and skipping then would report a required check green without testing anything. The commit
# check asks the GitHub API (see browser-check-passed.mjs), which is why this needs `checks: read`.
#
# The lane commit comes from a SHA, never from `origin/<branch>`: a pull request checks out the
# merge ref and does not fetch the other branches, and lane-lineage shows those refs only appear
# on push events. The script prints what it resolved, so a silent non-skip is diagnosable.
set -euo pipefail

verified=false
why=""
candidate=""
lanetree=""
sha=""

tree_of() { git rev-parse "$1^{tree}" 2>/dev/null || echo "missing"; }

# Strict: every reported `Landing browser` conclusion on the commit must be success, and there must
# be at least one. Anything the helper cannot establish counts as not passed.
browser_passed() {
  local commit="$1"
  local answer=""
  [[ -n "${GITHUB_REPOSITORY:-}" && -n "$commit" ]] || return 1
  if command -v node >/dev/null 2>&1; then
    answer="$(node "$(dirname "$0")/browser-check-passed.mjs" "$GITHUB_REPOSITORY" "$commit" "${GH_TOKEN:-}" 2>/dev/null || true)"
  elif command -v gh >/dev/null 2>&1; then
    answer="$(gh api "repos/${GITHUB_REPOSITORY}/commits/${commit}/check-runs?per_page=100" \
      --jq '[.check_runs[] | select(.name == "Landing browser") | .conclusion] | (length > 0 and all(. == "success"))' 2>/dev/null || true)"
  fi
  [[ "$answer" == "true" ]]
}

if [[ "${EVENT_NAME:-}" == "pull_request" && ( "${BASE_REF:-}" == "testing" || "${BASE_REF:-}" == "main" ) ]]; then
  # HEAD is the merge candidate the promotion would produce. Equal to the pull request's own head
  # tree means the promotion adds nothing, and that head commit is the one with the browser run.
  candidate="$(tree_of HEAD)"
  sha="${PR_HEAD_SHA:-}"
  lanetree="$(tree_of "$sha")"
  why="the promotion adds nothing over ${HEAD_REF:-}"
elif [[ "${EVENT_NAME:-}" == "push" ]]; then
  source=""
  case "${REF:-}" in
    refs/heads/testing) source="development" ;;
    refs/heads/main) source="testing" ;;
    *) ;;
  esac
  if [[ -n "$source" ]]; then
    candidate="$(tree_of HEAD)"
    sha="$(git rev-parse "origin/$source" 2>/dev/null || true)"
    lanetree="$(tree_of "$sha")"
    why="the pushed tree equals origin/$source"
  fi
fi

echo "tree under test:   ${candidate}"
echo "lane commit:       ${sha:-none}"
echo "lane commit tree:  ${lanetree}"

if [[ -n "$sha" && "$candidate" != "missing" && "$candidate" == "$lanetree" ]]; then
  if browser_passed "$sha"; then
    verified=true
    echo "Browser suite skipped: $why and $sha has a successful Landing browser check."
  else
    echo "The tree matches, but $sha has no successful Landing browser check on record."
  fi
fi

echo "verified=$verified" >> "$GITHUB_OUTPUT"
if [[ "$verified" == "false" ]]; then
  echo "Nothing proves this exact tree passed the browser suite; the suite runs."
fi
