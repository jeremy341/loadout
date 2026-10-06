# Development workflow

Repository: public personal-account repository `jeremy341/loadout`. The intended later destination is `hackclub/loadout` only if the YSWS is accepted and Hack Club approves a transfer. Do not create an interim organization.

## Branch lanes

- `main` is the canonical default and routine PR destination.
- `development` and `testing` are retained staging/history lanes. Use them only under an explicit migration or release plan.

All work uses a short-lived branch: branch from the latest `main`, make a focused change, and open a PR into `main`. Use `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/`, or `chore/` prefixes. Do not commit task work directly to `main`, `development`, or `testing`.

**Initial baseline sync complete:** PR #1 merged the full populated `development` baseline and contributor updates into `main` at merge commit `f55b883b09d2f2e583ffc76fa452128afd5da1e2`. The default `main` branch now contains the application, plans, tracked design images, and pinned source submodules. Clone `main` and branch every task from it.

Both trusted maintainers can create/push short-lived branches, open/review PRs, and merge a check-green PR to `main`. Jeremy owns the personal-account repository. GitHub verified `fazin-ahamed` has `write` permission on 2026-10-05.

Human review is recommended when both maintainers are available. It is optional and must not be a merge gate. There are no owner-only, Jeremy-only, CODEOWNER-only, or latest-pusher approval requirements.

## Product and source layout

`apps/landing` contains the LOADOUT public homepage, adapted from the verified Pixl baseline. The temporary source-only assets and locale pages were removed. The three source references remain under `references/` as independently pinned Git submodules; exact SHAs, paths, licenses, reuse decisions, and clone instructions are in `docs/source-audit/`. Run `git submodule update --init` (not recursive); Stardance's nested `secrets` remote is unavailable, while the parent Stardance checkout remains intact at its pin.

## Current setup status

PR #1 synced the full application, plans, images, and source pins from `development` into `main`; PR #2 finalized default-branch onboarding. All three CI checks passed on both PRs. GitHub branch protection is active on `main`, `development`, and `testing`: PR required, `Repository integrity`, `Landing quality`, and `Landing browser` required, zero approval count, no bypasses, admins enforced, no force pushes or branch deletion. Local verification from 2026-10-05: build, lint, TypeScript, four unit tests, and 24 browser cases pass.

Vercel project `jerry-team1/loadout-ysws` was verified on 2026-10-06 as connected to `jeremy341/loadout`, rooted at `apps/landing`, and tracking `main` as its Production Branch. Its only assigned Production domain is [loadout-ysws.vercel.app](https://loadout-ysws.vercel.app/). Vercel creates unique Preview URLs for PR deployments; use the stable Production URL for public sharing. See [Vercel deployment setup](VERCEL_PREVIEW.md) for the verified configuration and preview behavior.

## Pull request checklist

1. Clone default `main` with `--recurse-submodules` and verify the pins.
2. Post a kickoff in `#loadout-development` before substantive work.
3. Create a short-lived branch from `main` and keep the change scoped.
4. Run lint, typecheck, unit tests, production build, and Playwright checks. CI runs these in `Landing quality` and `Landing browser`, alongside `Repository integrity`.
5. Open a PR to `main` and wait for every required check.
6. Request optional review when useful; no one person's approval is mandatory. Either trusted maintainer may merge after checks pass.
7. Preserve a clear record for policy, scoring, payout, security, and deployment changes.
