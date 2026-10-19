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

Use Bun 1.3.14. See [local setup](SETUP.md) for ports, environment names and Windows execution notes.

## Promotion path

Every change reaches `main` through three lanes. The feature PR is squash-merged into `development`; promotion PRs then create merge commits on `testing` and `main`. Landing quality reruns on each lane when the diff affects the app. Only the browser suite may skip, and only when the candidate tree matches its source-lane commit and that exact commit has a recorded successful `Landing browser` check.

```text
short-lived branch → PR (squash) → development → testing → main
```

| Lane | How a commit gets in |
| --- | --- |
| development | Feature PR from a short-lived branch, squash-merged. |
| testing | Promotion PR from development, merged with a merge commit. |
| main | Release PR from testing, merged with a merge commit. Vercel deploys main. |

The workflow's expected status-check names are maintained once in [the required-check contract](required-checks.md). That contract describes workflow configuration, not proof of GitHub branch protection; see [branch protection setup](branch-protection-setup.md) for dated settings evidence. Landing quality reruns for app-affecting diffs on each lane. Browser shards can skip only when the candidate tree matches the source-lane commit and that exact commit has a recorded successful `Landing browser` check run. Changes limited to the ignored internal documentation/planning paths and root-file allowlist skip app checks; public `content/docs/` edits are app-affecting and run them (see Skips below).

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
gh pr create --base testing --head development --title "Promote: short summary" --body "What moves to testing"
gh pr merge <number> --merge

# When the batch goes live (owner):
gh pr create --base main --head testing --title "Release: short summary" --body "What ships"
gh pr merge <number> --merge
```

### Fast lane

For a change that is ready and small, one command carries it through all three lanes. It waits for checks on each lane's pull request candidate; Landing quality runs again on app-affecting promotion diffs, while the browser suite skips only with successful exact source-lane check evidence.

```powershell
pwsh scripts/ship.ps1 status           # lane heads, what is waiting, open pull requests (changes nothing)
pwsh scripts/ship.ps1 run 71 -DryRun   # checks everything and prints the plan (changes nothing)
pwsh scripts/ship.ps1 run 71           # ships pull request 71
```

`run` waits for the pull request's checks, squash-merges it into development, opens a development-to-testing pull request and merges it with a merge commit once its checks pass, then opens a testing-to-main release pull request and merges it the same way. Merging that last pull request deploys to production. Run it only for a change you are ready to ship.

- It stops at the first check that fails. It never forces a push, never bypasses a check and never touches branch protection. Run it again to carry on after a fix or a timeout.
- It refuses while other changes already wait between main and development, because the promotion pull requests carry everything on development. Release those first, or pass `-IncludeQueued` to ship them together.
- It accepts a pull request into development from a `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/` or `chore/` branch, and refuses drafts.
- It needs PowerShell 7 and the GitHub CLI signed in with write access to the repository.

The Lane lineage workflow reports breaks from the development → testing → main line. Promotion pull requests retain the merge commits made on testing and main and validate each lane's candidate. Workflow policy alone does not show which GitHub protection settings currently enforce these rules; see the dated readback in [branch protection setup](branch-protection-setup.md).

Rules that keep the history short:

- **One change, one squash.** Squash is the only way a PR reaches development. The squash commit takes the PR title and an empty body, so branch commits and tool trailers do not reach development history. Branch commits do not reach development, so you do not have to tidy them.
- **Stay current by rebasing, not merging.** Do not merge `development` into your branch and do not press "Update branch". Run `git fetch origin && git rebase origin/development`, then `git push --force-with-lease` on your own branch.
- **Batch small tweaks.** Fold a run of tweaks (a value changed a few times, copy cuts plus a colour) into one branch and one PR, not a PR per tweak.
- **Pushes.** A push to a feature branch runs no CI; open the PR to run the checks. Pushes to development, testing and main run the checks on that commit.
- **Skips.** `app-changed.sh` ignores only internal `docs/`, `plans/`, `.ulpi/`, `assets/` and root `README.md`, `AGENTS.md`, `PRODUCT.md`, `LOADOUT_DESIGN_SYSTEM.md` and `LICENSE` ([the rule](../../.github/scripts/app-changed.sh)). Those changes skip Landing quality's lint, typecheck, unit, and build steps and skip browser shards; the stable aggregator still reports. Public `content/docs/` is not on that ignore list, so public Docs edits are app-affecting and run the app checks. Landing quality runs whenever app-affecting files change, including on promotion PRs. Browser shards can skip only when the exact source-lane commit has recorded successful `Landing browser` check-run evidence ([the rule](../../.github/scripts/verified-tree.sh)); tree equality alone is insufficient. The five browser jobs feed one `Landing browser` aggregator. The Playwright container marks its checkout safe before Git checks. `[skip ci]` is not used.
- **Lineage.** Promotion PRs create merge commits on testing and main; each merge commit must contain the source-lane commit in its ancestry, and the destination lane must move forward. The Lane lineage job checks this after the merge. A direct push also triggers that post-push check if repository settings allow it, but this workflow does not itself block the push beforehand. Use the PR route and never force-push testing or main; repair with a normal revert.
- **No AI co-author lines.** Do not add co-author lines that name an AI tool to commit messages. Commit grouping and the pre-commit check are in [agent commit rules](agent-commits.md).

Either trusted maintainer may open, review and merge a check-green PR while another is offline. Human review is optional. Do not add Jeremy-only, owner-only, CODEOWNER-only or latest-pusher approval gates.

GitHub's personal-repository rules cannot constrain development direct pushes to named write collaborators. Check live protections rather than treating this guide as proof; [branch protection setup](branch-protection-setup.md) records dated evidence.

Promotion heads observed on 2026-10-19 were development `34f0668`, testing `2eee7ef`, and main `eb94498`. These are dated observations, not a claim about current branch protection.

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

Vercel Production follows main at [loadout.dino.icu](https://loadout.dino.icu/). Preview URLs are deployment-specific. Verify commit, readiness and stable URL before announcing publication; see [deployment and rollback](deployment-and-rollback.md).

## Authenticated GitHub CLI

Run `gh auth status --hostname github.com` in the command environment that will run authenticated operations. A sandbox may see a stale Windows keyring while the user's PowerShell is logged in. Use a narrowly scoped host-backed/elevated invocation, verify status, then run the authorized command. Changing directories or repeatedly logging in does not resolve that separation.

Never ask for a pasted token, use `gh auth token` or `--show-token`, set a persistent GH_TOKEN workaround, or expose credentials. If host execution is unavailable, ask the user for non-secret command output.

## Handoff and documentation changes

Record what changed, the PR/commit, actual check results, deployment evidence, and unresolved decisions. Public content follows [content authoring](content-authoring.md); internal changes update the owning document and [documentation index](../README.md).

## Human and AI contributors

People and AI follow the same scope, preservation, review, and publication rules. Provide AI contributors with the task's audience, authorized changes, exclusions, and current plan/design brief; they must read the owning sources and must not treat old prompts, screenshots, or source-reference content as current policy. AI-generated changes remain subject to the same checks and human review options as other work. Agents use GPT-6 Luna at medium reasoning unless the owner requests another setting.

Never commit secrets, .env values, .vercel, dependencies, caches, build output, Playwright output or review captures. Before retiring internal plans or design records, move unique current decisions to their owner, update inbound links, and record the disposition. Do not apply blanket deletion to active proposals, user drafts, or reference sources.
