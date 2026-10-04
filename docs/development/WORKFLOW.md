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

The LOADOUT product tree intentionally contains no app or package source while the website redesign is being planned. The three source references live under `references/` as independent pinned Git submodules; their exact SHAs and reuse limits are in `docs/source-audit/SOURCE_BASES.md`. Do not copy code from the unlicensed references into LOADOUT without permission.

## Current setup status

The clean source-reference, audit-documentation, workflow, and CI commits on `chore/reference-layout` have been promoted through local `development`, `testing`, and `main` merge commits. The previous unpushed lane history is preserved locally as `backup/local-lanes-before-clean-layout`. Nothing has been pushed. The remote's latest state could not be refreshed because the configured network proxy refused the GitHub connection; the last locally recorded `origin/main` is initializer `1a3119aecf18175e8b881613ad6912ca03c93a0d`. Do not claim that branch rules are active or that this history has been published.

## Pull request checklist

1. Branch from `development` and keep the change scoped.
2. Run applicable CI and local checks; there is no app build/test suite until LOADOUT-owned code is added.
3. Open a PR to `development` and wait for the required checks.
4. Request optional review when useful; no one person's approval is mandatory.
5. Merge once required checks pass, then promote through `testing` and `main` with separate PRs.
6. Preserve a clear record for policy, scoring, payout, security, and deployment changes.