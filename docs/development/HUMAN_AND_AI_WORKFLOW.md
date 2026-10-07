# Working in LOADOUT: people and AI agents

This guide applies equally to human contributors and coding agents. Repository-wide guardrails are in [`AGENTS.md`](../../AGENTS.md). Branch and GitHub permission details are in [`WORKFLOW.md`](WORKFLOW.md) and [`BRANCH_PROTECTION_SETUP.md`](BRANCH_PROTECTION_SETUP.md).

## 1. Clone the complete workspace

All plan documents, design reference images, and source repositories are already represented in Git. Clone the repository and initialize its pinned source submodules; do not manually copy source code, images, or references between directories:

```powershell
git clone https://github.com/jeremy341/loadout.git
cd loadout
git submodule update --init
git submodule status
bun install --frozen-lockfile
```

This downloads Pixl, YSWS Template, and Stardance at the exact commits recorded in `docs/source-audit/SOURCE_BASES.md`. Their files are available in `references/`; the 26 tracked concept images are under `docs/design/references/`. Verify the pins before a source audit. Do not modify submodule contents or copy them into app code. Avoid `--recursive`: the nested `references/stardance/secrets` submodule points to a remote that returned “Repository not found” on 2026-10-05. The parent Stardance source at its recorded SHA is available.

GitHub's default `main` contains the complete repository. Also fetch `development` and `testing`; `development` is the normal base for new temporary work branches after the one-time lane catch-up.

After fetching the current lanes, branch from `development`:

```powershell
git switch --track origin/development
git switch -c feature/short-task-name
```

## 2. Start each task

1. Read `AGENTS.md`, this guide, and the relevant current plan under `PLAN/`.
2. Check `git status --short --branch`, the current branch, and recent commits. Preserve existing work; do not silently reset, delete, or replace it.
3. Check plan status and source-audit decisions before treating a screenshot, research note, or old prompt as current product requirements.
4. If an important requirement is unclear, complete independent safe work and identify the decision that still needs the owner's input.

## 3. Slack kickoff, branches, and review flow

Before starting substantive work, post a brief kickoff in `#loadout-development` with the scope, temporary branch name, and intended lane. If the AI runtime has no connected Slack tool, ask the human collaborator to post it; do not claim that it was sent. Then make a short-lived branch from the latest `development` (except for the one-time lane catch-up). Use `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/`, or `chore/` prefixes.

Use this order for every change:

```text
short-lived branch → PR into development → promotion PR into testing → promotion PR into main
```

Either trusted maintainer may create and push short-lived branches, open/review PRs, and merge a check-green PR without waiting for Jeremy or an owner-only approval. PRs from feature branches target `development`; only `development` promotes to `testing`, and only `testing` promotes to `main`. The `Promotion lane` check rejects other source/target pairs.

Direct pushes to `development` are also allowed when the exact commit SHA already has `Repository integrity`, fast `Landing quality`, and `Promotion lane` statuses. A fresh unverified commit will be rejected by required status checks. The GitHub personal-repository rule cannot limit direct pushes to named collaborators or require that a checked commit came from a short-lived branch, so this capability applies to every write collaborator; the short-lived branch is the documented route. `testing` and `main` remain PR-only. Do not add owner-only, Jeremy-only, CODEOWNER-only, latest-pusher, or other one-person approval rules. Verify live settings in `BRANCH_PROTECTION_SETUP.md`; do not treat local docs as proof.

Group commits around reviewable changes. Use clear messages such as “Added …”, “Updated …”, or “Documented …”. Do not mix a broad feature migration into a homepage or documentation change.

## 4. Make changes and verify them

- Keep product code under `apps/landing`; preserve the independent pinned source submodules in `references/`.
- Follow `PLAN/00_LOADOUT_CANONICAL_INDEX.md` for the current planning set and each document's status. Plans 01/02 own product/economy policy, Plan 11 owns Eras, Plan 15 owns the future IRL concept, and Plan 16 owns the homepage clarity scope. A public explanation does not authorize implementing live mechanics or running an event. The master plan and bootstrap prompts are historical context; do not execute old prompts again.
- Keep program policy and numeric promises consistent with approved canonical plans and owner-provided public data.
- For website changes, inspect desktop and mobile layouts, keyboard use, reduced-motion behavior, and no-JavaScript fallbacks when relevant.
- Load all seven skills in [UI skills](UI_SKILLS.md) on every UI change. `frontend-design-ui-ux` produces the design spec only; implementation follows its completed handoff.
- Run `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, and `bun run test:e2e` for a full landing-page change. State which checks ran and report failures plainly.
- Review `git diff --check`, `git diff --stat`, and the actual staged diff before committing. Stage explicit paths rather than the whole workspace when unrelated files may exist.

## 5. Keep the repository safe and reproducible

Never commit `.env` values, access tokens, credentials, private keys, local Vercel configuration, dependencies, build output, test output, caches, or temporary files. Commit `.env.example` only with public, non-secret defaults. Keep image references in `docs/design/references/`; they guide design and do not establish program facts or represent production assets.

When using a source repository, keep its recorded commit pin, license status, exact paths, and ADAPT / REIMPLEMENT / REFERENCE ONLY / IGNORE decisions current in `docs/source-audit/`. Do not copy reference code or media into LOADOUT without a recorded rights decision.

## 6. Preview and publish

For Vercel settings, see [`VERCEL_PREVIEW.md`](VERCEL_PREVIEW.md). `apps/landing` is the application root. `development` and `testing` are preview lanes; only a `testing` → `main` promotion reaches the production branch. Verify the deployment URL, lane, and commit before sharing a demo. A successful local build does not establish a deployment.

Do not promote a preview to production or change domains as part of demo preparation. Publish only to the branch and environment the owner requested. Never expose environment values in logs or reports.

## Handoff

Every contributor or agent should leave a short record of:

- what changed and why;
- the commit or PR, if one was created;
- checks run and their actual results;
- the preview URL and deployed commit, if verified;
- remaining owner decisions or setup steps.
