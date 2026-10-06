# Development workflow

Repository: public personal-account repository `jeremy341/loadout`. The intended later destination is `hackclub/loadout` only if the YSWS is accepted and Hack Club approves a transfer. Do not create an interim organization.

## Branch lanes

The required promotion order is:

```text
short-lived branch
  └─ PR → development
       └─ promotion PR → testing
            └─ promotion PR → main
```

- `development` is the active integration lane. Open routine feature, fix, docs, and chore PRs here. A write collaborator may also push a commit directly once that exact SHA has the required fast checks. GitHub does not verify that the commit came from a short-lived branch; that is the documented route for preparing a direct push. Because this is a personal-account repo, the same direct-push capability applies to every collaborator with write access.
- `testing` is the release-candidate lane. Only promote `development` into it by PR.
- `main` is the production lane. Only promote `testing` into it by PR; Vercel Production deploys from `main`.

Never open a feature PR directly into `testing` or `main`. Do not commit on `testing` or `main`. Use `feature/`, `fix/`, `refactor/`, `docs/`, `experiment/`, or `chore/` prefixes for short-lived branches. After the one-time lane catch-up, create them from the latest `development`.

**Lane catch-up complete:** PR #9 promoted the updated `main` baseline and workflow into `development`, PR #10 promoted it into `testing`, and PR #11 promoted it into `main`. On 2026-10-06, all three lane refs resolved to the same tree, `36ab682f9388f142a6a296d0b6f00b50ed532fc7`. The live branch rules were read back after those promotions; see [branch protection setup](BRANCH_PROTECTION_SETUP.md).

Both trusted maintainers can create/push short-lived branches, open/review PRs, and merge a check-green PR at each lane without waiting for the other. The development direct-push rule also applies to every repository collaborator with write access. Jeremy owns the personal-account repository; GitHub verified `fazin-ahamed` and `NeticYTOF` have `write` access on 2026-10-06.

Human review is recommended when both maintainers are available. It is optional and must not be a merge gate. There are no owner-only, Jeremy-only, CODEOWNER-only, or latest-pusher approval requirements.

## Product and source layout

`apps/landing` contains the LOADOUT public homepage, adapted from the verified Pixl baseline. The temporary source-only assets and locale pages were removed. The three source references remain under `references/` as independently pinned Git submodules; exact SHAs, paths, licenses, reuse decisions, and clone instructions are in `docs/source-audit/`. Run `git submodule update --init` (not recursive); Stardance's nested `secrets` remote is unavailable, while the parent Stardance checkout remains intact at its pin.

## CI and merge rules

GitHub Actions runs on branch pushes and on PRs to the three lanes. `Promotion lane` accepts only a short-lived branch → `development`, `development` → `testing`, or `testing` → `main` PR.

| Target | Required checks | Human approval | Direct push |
|---|---|---|---|
| `development` | `Repository integrity`, fast `Landing quality`, `Promotion lane` | None | Allowed only for an exact commit whose checks already passed on a short-lived branch |
| `testing` | `Repository integrity`, full `Landing quality` including build, `Landing browser`, `Promotion lane` | None | Blocked; use a promotion PR from `development` |
| `main` | `Repository integrity`, full `Landing quality` including build, `Landing browser`, `Promotion lane` | None | Blocked; use a promotion PR from `testing` |

Both maintainers may open, review, and merge check-green PRs independently across time zones. Human review is encouraged, never required; no Jeremy-only, owner-only, CODEOWNER, or latest-pusher gate is allowed. CodeScene remains advisory and is not a required branch check.

The lane-specific GitHub settings were applied and read back after the rollout. `BRANCH_PROTECTION_SETUP.md` records the exact live rules, collaborator access, and branch tree verification.

PR #1 synced the initial full baseline and PR #2 finalized onboarding. PR #8 later merged the final homepage icon work into `main` at `432c6445bf7cfb17ca8a1c13169be67c6be200be`.

Vercel project `jerry-team1/loadout-ysws` was verified on 2026-10-06 as connected to `jeremy341/loadout`, rooted at `apps/landing`, and tracking `main` as its Production Branch. Its only assigned Production domain is [loadout-ysws.vercel.app](https://loadout-ysws.vercel.app/). Vercel creates unique Preview URLs for PR deployments; use the stable Production URL for public sharing. See [Vercel deployment setup](VERCEL_PREVIEW.md) for the verified configuration and preview behavior.

## Pull request checklist

1. Clone default `main` with `--recurse-submodules` and verify the pins. Fetch `development` and `testing` too.
2. Post a kickoff in `#loadout-development` before substantive work.
3. Create a short-lived branch from the latest `development` and keep the change scoped.
4. Push the short-lived branch so its exact commit gets CI; the development lane runs integrity and fast quality checks.
5. Open a PR to `development` and wait for every required check. Direct-push only the exact checked commit if choosing the direct-push path.
6. Promote `development` → `testing` by PR; wait for integrity, full quality/build, browser, and promotion checks.
7. Promote `testing` → `main` by PR; wait for the same full checks. This is the only production route.
8. Request optional review when useful; no one person's approval is mandatory. Either trusted maintainer may merge after checks pass.
9. Preserve a clear record for policy, scoring, payout, security, and deployment changes.
