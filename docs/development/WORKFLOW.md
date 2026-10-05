# Development workflow

Repository: public personal-account repository `jeremy341/loadout`. The intended later destination is `hackclub/loadout` only if the YSWS is accepted and Hack Club approves a transfer. Do not create an interim organization.

## Branch lanes

- `main` is the canonical default and routine PR destination.
- `development` and `testing` are retained staging/history lanes. Use them only under an explicit migration or release plan.

All work uses a short-lived branch: branch from the latest `main`, make a focused change, and open a PR into `main`. Use `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/`, or `chore/` prefixes. Do not commit task work directly to `main`, `development`, or `testing`.

**Initial baseline sync:** the complete LOADOUT code/plans/assets currently live on `development`; `main` has two independent older commits. The short-lived `docs/eras-community-workflow` branch contains the baseline merge and this plan update, and its PR should synchronize `main`. Until it merges, use `development` as the clone source, then branch temporary task work and target the catch-up PR/main as documented in the human/AI workflow. After the catch-up PR merges, clone default `main` and branch all work from `main`.

Both trusted maintainers can create/push short-lived branches, open/review PRs, and merge a check-green PR to `main`. Jeremy owns the personal-account repository. `fazin-ahamed` was invited with write permission; GitHub showed the invitation awaiting acceptance when last checked on 2026-10-04.

Human review is recommended when both maintainers are available. It is optional and must not be a merge gate. There are no owner-only, Jeremy-only, CODEOWNER-only, or latest-pusher approval requirements.

## Product and source layout

`apps/landing` contains the LOADOUT public homepage, adapted from the verified Pixl baseline. The temporary source-only assets and locale pages were removed. The three source references remain under `references/` as independently pinned Git submodules; exact SHAs, paths, licenses, and reuse decisions are in `docs/source-audit/`. YSWS Template and Stardance remain reference-only.

## Current setup status

The homepage baseline, assets, plans, design references, audits, tests and CI are pushed on `development`. The 2026-10-05 head is recorded in GitHub; `Repository integrity` passed for the bootstrap push. Remote branch protections and CodeScene activation remain unverified. CI defines `Repository integrity`, `Landing quality`, and `Landing browser`; check the GitHub Actions run list for the actual result from each workflow before making them required. Local evidence on 2026-10-05: build, lint, TypeScript, four unit tests and 24 browser cases pass.

Vercel project `jerry-team1/loadout` uses root directory `apps/landing`. Its public production demo is live at [loadout-jerry-team1.vercel.app](https://loadout-jerry-team1.vercel.app/). See [Vercel deployment setup](VERCEL_PREVIEW.md). The main GitHub branch is the future production source. The Vercel project still lacks a Git repository connection, so auto-deploy is not active.

## Pull request checklist

1. During the baseline sync, clone the populated `development` ref; after it merges, clone default `main`.
2. Post a kickoff in `#loadout-development` before substantive work.
3. Create a short-lived branch and keep the change scoped. After the baseline sync, branch from `main`.
4. Run lint, typecheck, unit tests, production build, and Playwright checks. CI runs these in `Landing quality` and `Landing browser`, alongside `Repository integrity`.
5. Open a PR to `main` and wait for every required check.
6. Request optional review when useful; no one person's approval is mandatory. Either trusted maintainer may merge after checks pass.
7. Preserve a clear record for policy, scoring, payout, security, and deployment changes.
