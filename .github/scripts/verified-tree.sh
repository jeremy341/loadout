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
# check is asked of the GitHub API, which is why this needs the `checks: read` permission.
set -euo pipefail

verified=false
why=""
sha=""

tree_of() { git rev-parse "$1^{tree}" 2>/dev/null || echo "missing"; }

# Is there a recorded successful browser check on this exact commit? Strict: every reported
# `Landing browser` conclusion for the commit must be success, and there must be at least one.
browser_passed() {
  local sha="$1"
  [[ -n "${GITHUB_REPOSITORY:-}" ]] || return 1
  command -v gh >/dev/null 2>&1 || return 1
  gh api "repos/${GITHUB_REPOSITORY}/commits/${sha}/check-runs?per_page=100" \
    --jq '[.check_runs[] | select(.name == "Landing browser") | .conclusion] | (length > 0 and all(. == "success"))' 2>/dev/null \
    | grep -qx 'true'
}

candidate=""
lanetree=""
if [[ "${EVENT_NAME:-}" == "pull_request" && ( "${BASE_REF:-}" == "testing" || "${BASE_REF:-}" == "main" ) ]]; then
  # actions/checkout checks out the merge candidate for a pull request, so HEAD is the tree the
  # promotion would produce. Equal to the head commit's tree means the promotion adds nothing:
  # that very commit is the one whose browser run must already have succeeded.
  candidate="$(tree_of HEAD)"
  lanetree="$(tree_of "origin/${HEAD_REF:-}")"
  sha="$(git rev-parse "origin/${HEAD_REF:-}" 2>/dev/null || true)"
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
    lanetree="$(tree_of "origin/$source")"
    sha="$(git rev-parse "origin/$source" 2>/dev/null || true)"
    why="the pushed tree equals origin/$source"
  fi
fi

if [[ -n "$sha" && "$candidate" != "missing" && "$candidate" == "$lanetree" ]]; then
  if browser_passed "$sha"; then
    verified=true
    echo "Browser suite skipped: $why and $sha has a successful Landing browser check."
  else
    echo "The tree matches, but $sha has no successful Landing browser check on record; the suite runs."
  fi
fi

echo "verified=$verified" >> "$GITHUB_OUTPUT"
if [[ "$verified" == "false" ]]; then
  echo "Nothing proves this exact tree passed the browser suite; the suite runs."
fi
