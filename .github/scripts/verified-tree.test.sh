#!/usr/bin/env bash
# Guards the rule in verified-tree.sh by building a lane-shaped repository and checking the
# decision for every situation the workflow can present. Run by the Landing quality job.
#
# The rule now also asks the GitHub API for a successful browser check run, so `gh` is stubbed on
# PATH: the stub answers the jq expression the rule asks for, which keeps this test offline.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
script="$repo_root/.github/scripts/verified-tree.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"

mkdir -p bin
cat > bin/gh <<'STUB'
#!/usr/bin/env bash
# Answers `... --jq <boolean expression>` with the value the test chose.
printf '%s\n' "${GH_STUB:-false}"
STUB
chmod +x bin/gh
export PATH="$tmp/bin:$PATH"
export GITHUB_REPOSITORY="stub/repo"

export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
git init -q -b development .
echo one > app.txt; git add app.txt; git commit -qm one
git branch -q testing; git branch -q main
# development moves on
echo two >> app.txt; git commit -qam two
# testing fast-forwards to development: the same tree, which is the promotion case
git checkout -q testing; git merge --ff-only -q development
# main diverges: a different tree
git checkout -q main; echo other > other.txt; git add other.txt; git commit -qm main-only
git update-ref refs/remotes/origin/development refs/heads/development
git update-ref refs/remotes/origin/testing refs/heads/testing
git update-ref refs/remotes/origin/main refs/heads/main

fails=0
check() {
  local name="$1" expected="$2" branch="$3"; shift 3
  git checkout -q "$branch"
  : > out.txt
  if ! env GITHUB_OUTPUT=out.txt "$@" bash "$script" > log.txt 2>&1; then
    printf 'FAIL %-32s the rule exited non-zero\n' "$name"; cat log.txt; fails=$((fails + 1)); return
  fi
  local got; got="$(cat out.txt)"
  if [[ "$got" == "verified=$expected" ]]; then
    printf 'ok   %-32s %s\n' "$name" "$got"
  else
    printf 'FAIL %-32s got %s, wanted verified=%s\n' "$name" "$got" "$expected"; fails=$((fails + 1))
  fi
}

# A feature pull request is the first place a tree is tested, so the suite must run.
check "feature PR into development" false development EVENT_NAME=pull_request BASE_REF=development HEAD_REF=chore/x
# A promotion of an unchanged lane is a repeat, but only with evidence that commit passed.
check "promotion PR, check passed" true development EVENT_NAME=pull_request BASE_REF=testing HEAD_REF=development GH_STUB=true
check "promotion PR, check missing" false development EVENT_NAME=pull_request BASE_REF=testing HEAD_REF=development GH_STUB=false
check "promotion PR, check failed" false development EVENT_NAME=pull_request BASE_REF=main HEAD_REF=testing GH_STUB=false
# Same for a lane push that carries the source lane's tree.
check "push testing, check passed" true testing EVENT_NAME=push REF=refs/heads/testing GH_STUB=true
check "push testing, check missing" false testing EVENT_NAME=push REF=refs/heads/testing GH_STUB=false
check "push main, different tree" false main EVENT_NAME=push REF=refs/heads/main GH_STUB=true
# A development push is where a tree is verified, so it always runs.
check "push development" false development EVENT_NAME=push REF=refs/heads/development GH_STUB=true
# Anything unclear must run rather than trust a guess.
check "manual dispatch" false development EVENT_NAME=workflow_dispatch GH_STUB=true
check "PR with unknown base" false development EVENT_NAME=pull_request BASE_REF=feature/x HEAD_REF=chore/y GH_STUB=true

echo
if [[ "$fails" -eq 0 ]]; then echo "The already-verified rule answered correctly in every case."; else echo "$fails case(s) failed."; exit 1; fi
