# Working in LOADOUT: people and AI agents

This guide applies equally to human contributors and coding agents. Repository-wide guardrails are in [`AGENTS.md`](../../AGENTS.md). Branch and GitHub permission details are in [`WORKFLOW.md`](WORKFLOW.md) and [`BRANCH_PROTECTION_SETUP.md`](BRANCH_PROTECTION_SETUP.md).

## 1. Clone the complete workspace

All plan documents, design reference images, and source repositories are already represented in Git. Clone the repository and initialize its pinned source submodules; do not manually copy source code, images, or references between directories:

```powershell
git clone --recurse-submodules https://github.com/jeremy341/loadout.git
cd loadout
git submodule update --init --recursive
git submodule status
bun install --frozen-lockfile
```

This downloads Pixl, YSWS Template, and Stardance at the exact commits recorded in `docs/source-audit/SOURCE_BASES.md`. Their files are available in `references/`; the 26 tracked concept images are under `docs/design/references/`. Verify the pins before a source audit. Do not modify submodule contents or copy them into app code.

**Initial clone transition:** GitHub's default `main` still needs the baseline-sync PR. Until that PR is merged, clone with `--branch development` to get the complete current repository. The active catch-up PR is prepared from a temporary branch to `main`. After it merges, ordinary clones can use default `main`.

## 2. Start each task

1. Read `AGENTS.md`, this guide, and the relevant current plan under `PLAN/`.
2. Check `git status --short --branch`, the current branch, and recent commits. Preserve existing work; do not silently reset, delete, or replace it.
3. Check plan status and source-audit decisions before treating a screenshot, research note, or old prompt as current product requirements.
4. If an important requirement is unclear, complete independent safe work and identify the decision that still needs the owner's input.

## 3. Slack kickoff, branches, and review flow

Before starting substantive work, post a brief kickoff in `#loadout-development` with the scope, temporary branch name, and intended PR target. If the AI runtime has no connected Slack tool, ask the human collaborator to post it; do not claim that it was sent. Then make a short-lived branch. After the baseline-sync PR is merged, branch from the latest `main`. Until then, branch from the fully populated `development` ref. Use `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/`, or `chore/` prefixes. Every task PR targets `main`.

Either trusted maintainer may create/push short-lived branches, open/review PRs, and merge into `main` after all required checks pass. Human review is encouraged but is not required. Do not add owner-only, Jeremy-only, CODEOWNER-only, latest-pusher, or other one-person approval rules. Direct pushes to permanent branches should be blocked once GitHub rules are configured and verified. Do not claim these rules are active based only on local documentation. `development` and `testing` are retained staging/history branches; do not use them for routine feature work.

Group commits around reviewable changes. Use clear messages such as “Added …”, “Updated …”, or “Documented …”. Do not mix a broad feature migration into a homepage or documentation change.

## 4. Make changes and verify them

- Keep product code under `apps/landing`; preserve the independent pinned source submodules in `references/`.
- Treat `PLAN/00–11` as the current planning set, but check each document's status. Plan 11 is approved design only; do not start Era implementation from it alone. The master plan and bootstrap prompts are preserved historical context; do not execute old prompts again.
- Keep program policy and numeric promises consistent with approved canonical plans and owner-provided public data.
- For website changes, inspect desktop and mobile layouts, keyboard use, reduced-motion behavior, and no-JavaScript fallbacks when relevant.
- Load all seven skills in [UI skills](UI_SKILLS.md) on every UI change. `frontend-design-ui-ux` produces the design spec only; implementation follows its completed handoff.
- Run `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, and `bun run test:e2e` for a full landing-page change. State which checks ran and report failures plainly.
- Review `git diff --check`, `git diff --stat`, and the actual staged diff before committing. Stage explicit paths rather than the whole workspace when unrelated files may exist.

## 5. Keep the repository safe and reproducible

Never commit `.env` values, access tokens, credentials, private keys, local Vercel configuration, dependencies, build output, test output, caches, or temporary files. Commit `.env.example` only with public, non-secret defaults. Keep image references in `docs/design/references/`; they guide design and do not establish program facts or represent production assets.

When using a source repository, keep its recorded commit pin, license status, exact paths, and ADAPT / REIMPLEMENT / REFERENCE ONLY / IGNORE decisions current in `docs/source-audit/`. Do not copy reference code or media into LOADOUT without a recorded rights decision.

## 6. Preview and publish

For the Vercel project settings and first-demo checklist, see [`VERCEL_PREVIEW.md`](VERCEL_PREVIEW.md). `apps/landing` is the application root in the Bun workspace. `main` is the production branch; pushes to `development` should create a preview when the Vercel project is connected and configured. Verify the actual Vercel build, deployment URL, branch, and commit before sharing a demo. A successful local build does not establish a deployment.

Do not promote a preview to production or change domains as part of demo preparation. Publish only to the branch and environment the owner requested. Never expose environment values in logs or reports.

## Handoff

Every contributor or agent should leave a short record of:

- what changed and why;
- the commit or PR, if one was created;
- checks run and their actual results;
- the preview URL and deployed commit, if verified;
- remaining owner decisions or setup steps.
