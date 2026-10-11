# Development workflow

This is the authoritative contribution workflow for people and AI. Repository: `jeremy341/loadout`. A future transfer to `hackclub/loadout` requires acceptance and Hack Club approval; do not create a temporary organization.

## Start a task

1. Read AGENTS.md, this guide, and the relevant canonical plan or design brief.
2. Check status, branch, recent commits, and current remote lanes. Preserve existing user work.
3. Post the scope, temporary branch and intended lane in `#loadout-development`. If no Slack tool is available, ask a maintainer to post; do not claim it was sent.
4. Start a temporary `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/` or `chore/` branch from the latest development.
5. Implement only the authorized scope. Fold a batch of small tweaks into one commit titled “Added …” or “Updated …” before it leaves your machine.

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

## Promotion path and commit hygiene

One change should leave one commit on each lane, not a trail of merge commits. Move the commit that was checked; do not merge it again.

```text
temporary branch (one commit) → development → testing → main
```

| Lane | Required checks | How a commit gets in |
| --- | --- | --- |
| development | Repository integrity, Landing quality, Promotion lane | Fast-forward push of a commit whose checks passed on its branch, or a squash-merged PR. No merge commits. |
| testing | Repository integrity, Landing quality, Landing browser, Promotion lane | Fast-forward push of the development commit whose checks passed. No PR. |
| main | Repository integrity, Landing quality, Landing browser, Promotion lane | Promotion PR from testing, merged with a merge commit, until the owner opens fast-forward pushes (see [branch protection setup](branch-protection-setup.md)). |

Status: the CI side of this section is live once it merges. Direct pushes to testing and linear history on development are GitHub settings that the owner applies; until then testing still needs a promotion PR. [Branch protection setup](branch-protection-setup.md) lists the exact steps.

```powershell
git fetch origin
git switch -c fix/short-name origin/development
# edit; keep one commit for the whole batch
git fetch origin; git rebase origin/development
git push -u origin HEAD                 # CI checks this exact commit
# when Repository integrity, Landing quality and Landing browser are green:
git push origin HEAD:development        # fast-forward, no merge commit
git push origin HEAD:testing            # the same commit; nothing is rebuilt or merged
```

Promote testing to main with a PR when the batch should go live.

Rules that keep the history short:

- **Batch.** Fold a run of tweaks (a value changed three times, copy cuts plus a colour) into one branch and one commit before pushing: `git reset --soft origin/development`, then `git commit`. Do not open a PR per tweak.
- **No "Update branch" merges.** Rebase onto development instead. A PR into development is squash-merged.
- **Skips.** Landing quality and Landing browser still report green, but lint, build and browsers do not run, when a change only touches `docs/`, `plans/`, `.ulpi/`, `assets/` or the root Markdown files ([the rule](../../.github/scripts/app-changed.sh)). Any code, content, workflow or dependency change runs everything. `[skip ci]` is not used because required checks must report.
- **One verified commit.** Every code change runs the full set, including the production build and the browser suite, so the same green commit can go to every lane.
- **Lineage.** testing and main only receive commits that already reached their source lane. The Lane lineage job turns red if a push breaks that. Never force-push; repair the lane with a normal revert.
- **Realigning lanes.** If lanes drift apart (merge commits that exist on only one of them), merge testing and main into development once, on a checked branch, so later promotions are fast-forwards. The steps are in [branch protection setup](branch-protection-setup.md).

Either trusted maintainer may open, review and merge a check-green PR while another is offline. Human review is optional. Do not add Jeremy-only, owner-only, CODEOWNER-only or latest-pusher approval gates.

GitHub's personal-repository rules cannot constrain development direct pushes to named write collaborators. Check live protections rather than treating this guide as proof; [branch protection setup](branch-protection-setup.md) records the settings and dated evidence.

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

Push the temporary branch and wait for the required checks on that exact commit. Then fast-forward it into development and testing, and promote testing to main with a PR. Do not bypass a failed check or send feature work directly to main.

Vercel Production follows main at [loadout-ysws.vercel.app](https://loadout-ysws.vercel.app/). Preview URLs are deployment-specific. Verify commit, readiness and stable URL before announcing publication; see [deployment and rollback](deployment-and-rollback.md).

## Authenticated GitHub CLI

Run `gh auth status --hostname github.com` in the command environment that will run authenticated operations. A sandbox may see a stale Windows keyring while the user's PowerShell is logged in. Use a narrowly scoped host-backed/elevated invocation, verify status, then run the authorized command. Changing directories or repeatedly logging in does not resolve that separation.

Never ask for a pasted token, use `gh auth token` or `--show-token`, set a persistent GH_TOKEN workaround, or expose credentials. If host execution is unavailable, ask the user for non-secret command output.

## Handoff and documentation changes

Record what changed, the PR/commit, actual check results, deployment evidence, and unresolved decisions. Public content follows [content authoring](content-authoring.md); internal changes update the owning document and [documentation index](../README.md).

## Human and AI contributors

People and AI follow the same scope, preservation, review, and publication rules. Provide AI contributors with the task's audience, authorized changes, exclusions, and current plan/design brief; they must read the owning sources and must not treat old prompts, screenshots, or source-reference content as current policy. AI-generated changes remain subject to the same checks and human review options as other work. Agents use GPT-6 Luna at medium reasoning unless the owner requests another setting.

Never commit secrets, .env values, .vercel, dependencies, caches, build output, Playwright output or review captures. Before retiring internal plans or design records, move unique current decisions to their owner, update inbound links, and record the disposition. Do not apply blanket deletion to active proposals, user drafts, or reference sources.
