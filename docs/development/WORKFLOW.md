# Development workflow

This is the authoritative contribution workflow for people and AI. Repository: `jeremy341/loadout`. A future transfer to `hackclub/loadout` requires acceptance and Hack Club approval; do not create a temporary organization.

## Start a task

1. Read AGENTS.md, this guide, and the relevant canonical plan or design brief.
2. Check status, branch, recent commits, and current remote lanes. Preserve existing user work.
3. Post the scope, temporary branch and intended lane in `#loadout-development`. If no Slack tool is available, ask a maintainer to post; do not claim it was sent.
4. Start a temporary `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/` or `chore/` branch from the latest development.
5. Implement only the authorized scope. Group reviewable changes into natural commits such as “Added …” or “Updated …”.

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

```text
temporary branch → PR into development → promotion PR into testing → promotion PR into main
```

| Lane | Required checks | Direct push |
| --- | --- | --- |
| development | Repository integrity, fast Landing quality, Promotion lane | Existing rules allow an exact commit whose required checks are satisfied; ordinary contributions use a PR. |
| testing | Repository integrity, full Landing quality/build, Landing browser, Promotion lane | Blocked; only development promotion PRs. |
| main | Repository integrity, full Landing quality/build, Landing browser, Promotion lane | Blocked; only testing promotion PRs. |

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

Push the temporary branch, open the development PR and wait for required checks. After merge, promote development to testing, then testing to main. Do not bypass a failed check or send feature work directly to main.

Vercel Production follows main at [loadout-ysws.vercel.app](https://loadout-ysws.vercel.app/). Preview URLs are deployment-specific. Verify commit, readiness and stable URL before announcing publication; see [deployment and rollback](deployment-and-rollback.md).

## Authenticated GitHub CLI

Run `gh auth status --hostname github.com` in the command environment that will run authenticated operations. A sandbox may see a stale Windows keyring while the user's PowerShell is logged in. Use a narrowly scoped host-backed/elevated invocation, verify status, then run the authorized command. Changing directories or repeatedly logging in does not resolve that separation.

Never ask for a pasted token, use `gh auth token` or `--show-token`, set a persistent GH_TOKEN workaround, or expose credentials. If host execution is unavailable, ask the user for non-secret command output.

## Handoff and documentation changes

Record what changed, the PR/commit, actual check results, deployment evidence, and unresolved decisions. Public content follows [content authoring](content-authoring.md); internal changes update the owning document and [documentation index](../README.md).

## Human and AI contributors

People and AI follow the same scope, preservation, review, and publication rules. Provide AI contributors with the task's audience, authorized changes, exclusions, and current plan/design brief; they must read the owning sources and must not treat old prompts, screenshots, or source-reference content as current policy. AI-generated changes remain subject to the same checks and human review options as other work. Agents use GPT-6 Luna at medium reasoning unless the owner requests another setting.

Never commit secrets, .env values, .vercel, dependencies, caches, build output, Playwright output or review captures. Before retiring internal plans or design records, move unique current decisions to their owner, update inbound links, and record the disposition. Do not apply blanket deletion to active proposals, user drafts, or reference sources.
