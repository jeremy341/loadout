# Development workflow

This is the authoritative contribution workflow for people and AI. Repository: `jeremy341/loadout`. A future transfer to `hackclub/loadout` requires acceptance and Hack Club approval; do not create a temporary organization.

## Start a task

1. Read AGENTS.md, this guide, and the relevant canonical plan or design brief.
2. Pull before you start, every session: `git fetch origin`, then `git switch development` and `git pull --ff-only`. Branch from `origin/development`, never from a local `main`, `testing` or an older branch. Starting from an old local development is the usual cause of conflicts and extra commits.
3. Check status, branch and recent commits. Preserve existing user work.
4. Post the scope, temporary branch and intended lane in `#loadout-development`. If no Slack tool is available, ask a maintainer to post; do not claim it was sent.
5. Start a temporary `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/` or `chore/` branch from `origin/development`: `git switch -c fix/short-name origin/development`.
6. Implement only the authorized scope. Several small commits on your branch are fine: the squash merge turns them into one commit on development.

For dirty checkouts, classify tracked and untracked deltas against the live base before interpreting a raw diff. Use an isolated worktree when needed; do not silently reset, stash or delete the user's files.

## Clone and run

```powershell
git clone https://github.com/jeremy341/loadout.git
cd loadout
git submodule update --init
git submodule status
git fetch origin development testing main
git switch --track origin/development
git switch -c feature/short-task-name
bun install --frozen-lockfile
bun run dev
```

Do not use `--recursive` or `--recurse-submodules`: Stardance's nested secrets repository was unavailable during audit. The four top-level references remain pinned; see [source bases](../source-audit/source-bases.md). Tracked images under `docs/design/references/` arrive with the clone.

Use Bun 1.3.14. See [local setup](setup.md) for ports, environment names and Windows execution notes.

## Promotion path

Every change reaches `main` through three lanes. Most of the checking happens once, on the commit that lands on `development`. The later lanes move that same commit forward; they do not rebuild it.

```text
short-lived branch → PR (squash) → development → testing → main
```

| Lane | How a commit gets in | Required checks |
| --- | --- | --- |
| development | Squash-merged PR from a short-lived branch. PR required; no direct pushes. Force pushes off. | Repository integrity, Landing quality, Promotion lane |
| testing | Fast-forward push of a development commit that already passed. No PR. Force pushes off. Until the owner has removed the PR requirement, a PR from development, merged with a merge commit. | Repository integrity, Landing quality, Landing browser, Promotion lane |
| main | Release PR from testing, merged with a merge commit, one per batch. PR required; force pushes off. Vercel deploys main. | Repository integrity, Landing quality, Landing browser, Promotion lane |

Checks belong to the commit. The commit that passed on development already has its browser-suite result, so promoting it to testing or main does not run the suite again. Docs-only changes skip the heavy steps (see Skips below).

```powershell
# Every change, owner and co-developer alike
git fetch origin
git switch -c fix/short-name origin/development
# edit and commit, then
git push -u origin HEAD
gh pr create --base development --head fix/short-name --title "Short summary" --body "What changed and why"
# when the checks are green:
gh pr merge <number> --squash

# When a batch is ready for testing (owner):
git fetch origin
git push origin origin/development:refs/heads/testing     # fast-forward

# When the batch goes live (owner):
gh pr create --base main --head testing --title "Release: short summary" --body "What ships"
gh pr merge <number> --merge
```

Rules that keep the history short:

- **One change, one squash.** Squash is the only way a PR reaches development. The squash commit takes the PR title and an empty body, so branch commits and tool trailers do not reach development history. Branch commits do not reach development, so you do not have to tidy them.
- **Stay current by rebasing, not merging.** Do not merge `development` into your branch and do not press "Update branch". Run `git fetch origin && git rebase origin/development`, then `git push --force-with-lease` on your own branch.
- **Batch small tweaks.** Fold a run of tweaks (a value changed a few times, copy cuts plus a colour) into one branch and one PR, not a PR per tweak.
- **Pushes.** A push to a feature branch runs no CI; open the PR to run the checks. Pushes to development, testing and main run the checks on that commit.
- **Skips.** Landing quality and Landing browser still report green, but lint, build and browsers do not run, when a change only touches `docs/`, `plans/`, `.ulpi/`, `assets/` or the root Markdown files ([the rule](../../.github/scripts/app-changed.sh)). Any code, content, workflow or dependency change runs everything. `[skip ci]` is not used because required checks must report.
- **Lineage.** testing and main only move forward, by a commit that already reached their source lane. The Lane lineage job reports a break. Never force-push testing or main; repair with a normal revert.
- **No AI co-author lines.** Do not add co-author lines that name an AI tool to commit messages. Commit grouping and the pre-commit check are in [agent commit rules](agent-commits.md).

Either trusted maintainer may open, review and merge a check-green PR while another is offline. Human review is optional. Do not add Jeremy-only, owner-only, CODEOWNER-only or latest-pusher approval gates.

GitHub's personal-repository rules cannot constrain development direct pushes to named write collaborators. Check live protections rather than treating this guide as proof; [branch protection setup](branch-protection-setup.md) records the settings and dated evidence.

History note: on 2026-10-11 the three lanes were aligned to one commit and the co-author lines were removed from history. Commit SHAs from before that date are gone from origin. If your local branches show SHAs that origin no longer has, save your work, switch away from the branch, and run `git fetch origin && git branch -f development origin/development`.

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

Review the actual diff and stage explicit paths if unrelated work exists. Docs source/link tests are included in the unit command. Website work also requires viewport, keyboard and reduced-motion evidence; follow [the UI skill guide](ui-skills.md).

Open a PR into development from your branch and wait for the required checks. Squash-merge it. Promote to testing and then to main as described above. Do not bypass a failed check or send feature work directly to main.

Vercel Production follows main at [loadout-ysws.vercel.app](https://loadout-ysws.vercel.app/). Preview URLs are deployment-specific. Verify commit, readiness and stable URL before announcing publication; see [deployment and rollback](deployment-and-rollback.md).

## Authenticated GitHub CLI

Run `gh auth status --hostname github.com` in the command environment that will run authenticated operations. A sandbox may see a stale Windows keyring while the user's PowerShell is logged in. Use a narrowly scoped host-backed/elevated invocation, verify status, then run the authorized command. Changing directories or repeatedly logging in does not resolve that separation.

Never ask for a pasted token, use `gh auth token` or `--show-token`, set a persistent GH_TOKEN workaround, or expose credentials. If host execution is unavailable, ask the user for non-secret command output.

## Handoff and documentation changes

Record what changed, the PR/commit, actual check results, deployment evidence, and unresolved decisions. Public content follows [content authoring](content-authoring.md); internal changes update the owning document and [documentation index](../README.md).

## Human and AI contributors

People and AI follow the same scope, preservation, review, and publication rules. Provide AI contributors with the task's audience, authorized changes, exclusions, and current plan/design brief; they must read the owning sources and must not treat old prompts, screenshots, or source-reference content as current policy. AI-generated changes remain subject to the same checks and human review options as other work. Agents use GPT-6 Luna at medium reasoning unless the owner requests another setting.

Never commit secrets, .env values, .vercel, dependencies, caches, build output, Playwright output or review captures. Before retiring internal plans or design records, move unique current decisions to their owner, update inbound links, and record the disposition. Do not apply blanket deletion to active proposals, user drafts, or reference sources.
