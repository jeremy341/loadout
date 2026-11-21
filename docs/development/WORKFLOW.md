# Development workflow

This is the authoritative contribution workflow for people and AI. Repository: `jeremy341/loadout`. A future transfer to `hackclub/loadout` requires acceptance and Hack Club approval; do not create a temporary organization.

## Start a task

1. Read AGENTS.md, this guide, and the relevant canonical plan or design brief.
2. Pull before you start, every session: `git fetch origin`, then `git switch main` and `git pull --ff-only`. Branch from `origin/main`, never from an older local branch. Starting from an old local branch is the usual cause of conflicts and extra commits.
3. Check status, branch and recent commits. Preserve existing user work.
4. Post the scope and temporary branch in `#loadout-development`. If no Slack tool is available, ask a maintainer to post; do not claim it was sent.
5. Start a temporary `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/` or `chore/` branch from `origin/main`: `git switch -c fix/short-name origin/main`.
6. Implement only the authorized scope. Several small commits on your branch are fine: the squash merge turns them into one commit on main.

For dirty checkouts, classify tracked and untracked deltas against the live base before interpreting a raw diff. Use an isolated worktree when needed; do not silently reset, stash or delete the user's files.

## Clone and run

```powershell
git clone https://github.com/jeremy341/loadout.git
cd loadout
git submodule update --init
git submodule status
git fetch origin main
git switch main
git switch -c feature/short-task-name
bun install --frozen-lockfile
bun run dev
```

Do not use `--recursive` or `--recurse-submodules`: Stardance's nested secrets repository was unavailable during audit. The four top-level references remain pinned; see [source bases](../source-audit/source-bases.md). Tracked images under `docs/design/references/` arrive with the clone.

Use Bun 1.3.14. See [local setup](SETUP.md) for ports, environment names and Windows execution notes.

## Merge path

There is one lane. A pull request from a short-lived branch goes straight into `main`, is checked once, and is squash-merged. Vercel deploys `main`, so merging is publishing.

```text
short-lived branch → PR → checks → squash merge → main (Vercel deploys)
```

```powershell
git fetch origin
git switch -c fix/short-name origin/main
# edit and commit, then
git push -u origin HEAD
gh pr create --base main --head fix/short-name --title "Short summary" --body "What changed and why"
# turn on auto-merge so it lands the moment the checks are green:
gh pr merge <number> --squash --auto
```

The required checks are listed once in [the required-check contract](required-checks.md). That contract describes workflow configuration, not proof of GitHub branch protection; see [branch protection setup](branch-protection-setup.md) for dated settings evidence.

All of the checks start at the same moment and run in parallel: Repository integrity, Landing quality (lint, typecheck, unit tests and the production build), and eight browser runners that cover the suite exactly once. A pull request normally finishes in about three minutes. Vercel also builds a preview for every pull request, so check the change there before you merge.

Rules that keep the history short:

- **One change, one squash.** Squash is the only way a PR reaches main. The squash commit takes the PR title and an empty body, so branch commits and tool trailers do not reach main history. Branch commits do not reach main, so you do not have to tidy them.
- **Stay current by rebasing, not merging.** Do not merge `main` into your branch and do not press "Update branch". Run `git fetch origin && git rebase origin/main`, then `git push --force-with-lease` on your own branch.
- **Batch small tweaks.** Fold a run of tweaks (a value changed a few times, copy cuts plus a colour) into one branch and one PR, not a PR per tweak.
- **Pushes.** A push to a feature branch runs no CI; open the PR to run the checks. Nothing reruns after the merge, because the pull request already checked the same tree.
- **Skips.** `app-changed.sh` ignores only internal `docs/`, `plans/`, `.ulpi/`, `assets/` and root `README.md`, `AGENTS.md`, `PRODUCT.md` and `LICENSE` ([the rule](../../.github/scripts/app-changed.sh)). Those changes skip Landing quality's lint, typecheck, unit, and build steps and skip the browser runners; the stable `Landing browser` aggregator still reports. Public `content/docs/` is not on that ignore list, so public Docs edits are app-affecting and run the app checks. The Playwright container marks its checkout safe before Git checks. `[skip ci]` is not used.
- **No AI co-author lines.** Do not add co-author lines that name an AI tool to commit messages. Commit grouping and the pre-commit check are in [agent commit rules](agent-commits.md).
- **Never rewrite `main`.** No force-pushes, no `git reset` of `main`, no amended `main` commits. Repair `main` with a normal revert.

Either trusted maintainer may open, review and merge a check-green PR while another is offline. Human review is optional. Do not add Jeremy-only, owner-only, CODEOWNER-only or latest-pusher approval gates.

GitHub's personal-repository rules cannot constrain `main` pushes to named write collaborators. Check live protections rather than treating this guide as proof; [branch protection setup](branch-protection-setup.md) records dated evidence.

History note: on 2026-10-11 the lanes were aligned to one commit and the co-author lines were removed from history. Commit SHAs from before that date are gone from origin. If your local branches show SHAs that origin no longer has, save your work, switch away from the branch, and run `git fetch origin && git branch -f main origin/main`.

The earlier development → testing → main relay was retired on 2026-11-15. Three pull requests and three full check runs for every change gave no extra safety, because every run checked the same tree. The retired `development` and `testing` branches are not used.

CodeScene is advisory. Codecov upload is not implemented; [quality integrations](quality-integrations.md) distinguishes setup from working coverage.

## Verify and publish

Run the relevant checks; a full Docs or landing change uses:

```powershell
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
git diff --check
```

Review the actual diff and stage explicit paths if unrelated work exists. Docs source/link tests are included in the unit command. Website work also requires viewport, keyboard and reduced-motion evidence; follow [the UI skill guide](ui-skills.md). Any UI change needs a scoped design brief in `.ulpi/design/` before code and an axe accessibility check on the changed pages, with the result recorded in the handoff (working rule, 20 Nov 2026; the UI skill guide and design system own the detail).

Open a PR into `main` from your branch, wait for the required checks, and squash-merge it (or turn on auto-merge). Do not bypass a failed check.

Vercel Production follows main at [loadout.dino.icu](https://loadout.dino.icu/). Preview URLs are deployment-specific. Verify commit, readiness and stable URL before announcing publication; see [deployment and rollback](deployment-and-rollback.md).

## Authenticated GitHub CLI

Run `gh auth status --hostname github.com` in the command environment that will run authenticated operations. A sandbox may see a stale Windows keyring while the user's PowerShell is logged in. Use a narrowly scoped host-backed/elevated invocation, verify status, then run the authorized command. Changing directories or repeatedly logging in does not resolve that separation.

Never ask for a pasted token, use `gh auth token` or `--show-token`, set a persistent GH_TOKEN workaround, or expose credentials. If host execution is unavailable, ask the user for non-secret command output.

## Handoff and documentation changes

Record what changed, the PR/commit, actual check results, deployment evidence, and unresolved decisions. Public content follows [content authoring](content-authoring.md); internal changes update the owning document and [documentation index](../README.md).

## Human and AI contributors

People and AI follow the same scope, preservation, review, and publication rules. Provide AI contributors with the task's audience, authorized changes, exclusions, and current plan/design brief; they must read the owning sources and must not treat old prompts, screenshots, or source-reference content as current policy. AI-generated changes remain subject to the same checks and human review options as other work. Agents use GPT-6 Luna at medium reasoning unless the owner requests another setting.

Never commit secrets, .env values, .vercel, dependencies, caches, build output, Playwright output or review captures. Before retiring internal plans or design records, move unique current decisions to their owner, update inbound links, and record the disposition. Do not apply blanket deletion to active proposals, user drafts, or reference sources.
