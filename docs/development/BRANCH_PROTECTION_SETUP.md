# Branch protection and repository access

Repository: `jeremy341/loadout`, personal account. Treat this document as a live settings record only after comparing it with GitHub's branch-protection API.

## Collaborators

GitHub's live collaborator API showed these accounts on 2026-10-06:

| Account | Access |
|---|---|
| `jeremy341` | admin/owner |
| `fazin-ahamed` | write |
| `NeticYTOF` | write |

The development direct-push rule applies to both write collaborators and the owner. On a personal repository, GitHub cannot limit that branch rule to only a selected trusted maintainer.

## Lane policy

```text
short-lived branch → PR → development → promotion PR → testing → promotion PR → main
```

- `development`: feature PRs are the normal route. Direct pushes are allowed only for the exact commit SHA whose `Repository integrity`, fast `Landing quality`, and `Promotion lane` checks already passed on a short-lived branch. A fresh unverified commit remains blocked by required status checks.
- `testing`: PR required, only from `development`.
- `main`: PR required, only from `testing`.
- Human approvals: zero required on every lane. No Jeremy-only, owner-only, CODEOWNER, latest-pusher, or other one-person rule.
- Administrators are subject to rules. Do not add bypass actors. Force pushes and branch deletion stay disabled.
- CodeScene and Codecov are not required GitHub branch checks; CodeScene feedback remains advisory. Copilot code review is not included.

## Required GitHub Actions checks

| Branch | Required status checks | PR rule |
|---|---|---|
| `development` | `Repository integrity`, `Landing quality`, `Promotion lane` | Not required; permits checked direct pushes |
| `testing` | `Repository integrity`, `Landing quality`, `Landing browser`, `Promotion lane` | Required; only `development` may promote |
| `main` | `Repository integrity`, `Landing quality`, `Landing browser`, `Promotion lane` | Required; only `testing` may promote |

Pushes to short-lived branches run CI so a direct update to `development` can reuse successful checks from the exact same commit SHA. `Landing browser` is skipped on the fast development lane and required on testing/main promotions. `Landing quality` runs lint, typecheck, and unit tests on development; testing and main also run the production build. `Promotion lane` validates the PR head/base pair and accepts only the three edges in the lane diagram.

Required status checks come from GitHub Actions. `development` requires an up-to-date branch so feature PRs and checked direct updates build on the current integration lane. `testing` and `main` do not require source-branch freshness: each promotion reruns the full checks on GitHub's merge candidate, avoiding reverse-merges of lane merge commits. Required checks must pass before a lane merge.

## Live verification record

### Verified before rollout on 2026-10-06

Immediately before this workflow update, GitHub reported `development`, `testing`, and `main` protected with `Repository integrity`, `Landing quality`, and `Landing browser`, strict up-to-date checks, `required_approving_review_count: 0`, enforced for administrators, and no force pushes or branch deletions. All three required a PR. No bypass actors were present.

The live refs were not synchronized: `origin/main` was nine commits ahead of `origin/development`; `origin/testing` had nine commits absent from main and one testing-only commit. The workflow rollout must travel through development → testing → main, then compare the three final tree hashes.

### Verified after rollout

Update this section only after reading GitHub's live API response for all three branches. Record the verification date, required check names, PR requirement, approval count, admin enforcement, bypasses, and force/delete settings. Until then, the target table above is a desired configuration, not proof that it is active.

## Personal-account limitation

GitHub personal repositories do not provide the organization-style branch rule that limits pushes to a selected set of collaborators. Allowing direct updates to `development` therefore applies to every collaborator with write access. The checked-commit status gate still applies, and `testing`/`main` remain PR-only. If tighter identity-based push restrictions become necessary, document the GitHub limitation; do not create a temporary organization.

## Manual follow-up

- After pushing the updated workflow through the lanes, apply and verify the lane-specific protections above.
- Keep human review recommended but optional; either trusted maintainer may merge when the target lane's required checks pass.
