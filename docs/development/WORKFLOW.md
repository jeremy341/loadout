# Development workflow

Repository: public personal-account repository `jeremy341/loadout`. The intended later destination is `hackclub/loadout` only if the YSWS is accepted and Hack Club approves a transfer. Do not create an interim organization.

## Branch lanes

- `development` is the integration lane.
- `testing` is the staging/release-candidate lane.
- `main` is the production lane.

Normal work starts from `development` on a short-lived branch. Use `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/`, or `chore/` prefixes. Open a pull request from that branch into `development`. Promote `development` to `testing` with a separate PR, then `testing` to `main` with another separate PR. Do not merge feature work directly into `testing` or `main`.

Both trusted maintainers can create and push short-lived branches, open and review PRs, and merge a lane PR once that target lane's required CI checks pass. Jeremy owns the personal-account repository. `fazin-ahamed` was invited with write permission; GitHub showed the invitation awaiting acceptance when last checked on 2026-10-04.

Human review is recommended when both maintainers are available. It is optional and must not be a merge gate. There are no owner-only, Jeremy-only, CODEOWNER-only, or latest-pusher approval requirements.

## Product and source layout

`apps/landing` contains the LOADOUT public homepage, adapted from the verified Pixl baseline. The temporary source-only assets and locale pages were removed. The three source references remain under `references/` as independently pinned Git submodules; exact SHAs, paths, licenses, and reuse decisions are in `docs/source-audit/`. YSWS Template and Stardance remain reference-only.

## Current setup status

The homepage baseline, assets, plans, design references, audits, tests and CI are pushed on `development`. The 2026-10-05 head is recorded in GitHub; `Repository integrity` passed for the bootstrap push. Remote branch protections and CodeScene activation remain unverified. CI defines `Repository integrity`, `Landing quality`, and `Landing browser`; check the GitHub Actions run list for the actual result from each workflow before making them required. Local evidence on 2026-10-05: build, lint, TypeScript, four unit tests and 24 browser cases pass.

Vercel project `jerry-team1/landing` uses root directory `apps/landing`. Its first production demo is live at [landing-mu-taupe.vercel.app](https://landing-mu-taupe.vercel.app/), deployed from `development` commit `2ea9161cdb7125063e6d2c707ea41e0b06e001aa` at the user's request. The Vercel project is not connected to the Git repository yet, so Git pushes do not trigger deployments. To enable future auto-deploys, connect `jeremy341/loadout` and set `main` as the Production Branch. See [Vercel deployment setup](VERCEL_PREVIEW.md).

## Pull request checklist

1. Branch from `development` and keep the change scoped.
2. Run lint, typecheck, unit tests, production build, and Playwright checks. CI runs these in `Landing quality` and `Landing browser`, alongside `Repository integrity`.
3. Open a PR to `development` and wait for the required checks.
4. Request optional review when useful; no one person's approval is mandatory.
5. Merge once required checks pass, then promote through `testing` and `main` with separate PRs.
6. Preserve a clear record for policy, scoring, payout, security, and deployment changes.
