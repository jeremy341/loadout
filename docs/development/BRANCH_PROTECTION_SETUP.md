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

- `development`: feature PRs are the normal route. Direct pushes are allowed only when the exact commit SHA already has successful `Repository integrity`, fast `Landing quality`, and `Promotion lane` statuses. A fresh unverified commit remains blocked by required status checks.
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

Pushes to branches run CI so a direct update to `development` can reuse successful checks from the exact same commit SHA. `Landing browser` is skipped on the fast development lane and required on testing/main promotions. `Landing quality` runs lint, typecheck, and unit tests on development; testing and main also run the production build. `Promotion lane` validates the PR head/base pair and accepts only the three edges in the lane diagram; on ordinary branch pushes it is skipped, which GitHub accepts as a satisfied required status.

Required status checks come from GitHub Actions. `development` requires an up-to-date branch so feature PRs and checked direct updates build on the current integration lane. `testing` and `main` do not require source-branch freshness: each promotion reruns the full checks on GitHub's merge candidate, avoiding reverse-merges of lane merge commits. Required checks must pass before a lane merge.

## Live verification record

### Verified before rollout on 2026-10-06

Immediately before this workflow update, GitHub reported `development`, `testing`, and `main` protected with `Repository integrity`, `Landing quality`, and `Landing browser`, strict up-to-date checks, `required_approving_review_count: 0`, enforced for administrators, and no force pushes or branch deletions. All three required a PR. No bypass actors were present.

The live refs were not synchronized: `origin/main` was nine commits ahead of `origin/development`; `origin/testing` had nine commits absent from main and one testing-only commit. The workflow rollout must travel through development → testing → main, then compare the three final tree hashes.

### Verified after rollout on 2026-10-06

The GitHub branch-protection API was read back after PRs #9, #10, and #11 carried the workflow through all lanes:

| Branch | PR required | Required checks | Up to date | Required approvals |
|---|---:|---|---:|---:|
| `development` | No | `Repository integrity`, `Landing quality`, `Promotion lane` | Yes | None |
| `testing` | Yes | `Repository integrity`, `Landing quality`, `Landing browser`, `Promotion lane` | No | 0 |
| `main` | Yes | `Repository integrity`, `Landing quality`, `Landing browser`, `Promotion lane` | No | 0 |

All checks require GitHub Actions as the expected source (app ID `15368`). Admin enforcement is enabled on every lane. No bypass actors are configured. Force pushes and branch deletion are disabled. `testing` and `main` require PRs, but their full CI checks run on the promotion merge candidate; `development` requires check statuses but no PR gate.

After PR #11, the lanes had identical content trees: `development` `4b3d0ee4359a616ef19d13c4f30e82e1f31754ce`, `testing` `b4e8458c178b5f89e42cd56911a8339e9541be34`, and `main` `e2de9be54c7e13282aae793d102ff739b6b328c9` all resolved to tree `36ab682f9388f142a6a296d0b6f00b50ed532fc7`.

The `main` push checks passed, and Vercel reported a successful Production deployment for `e2de9be54c7e13282aae793d102ff739b6b328c9`. The configured stable Production domain remains [loadout-ysws.vercel.app](https://loadout-ysws.vercel.app/).

GitHub returned no additional repository rulesets on 2026-10-06. There are no separate ruleset bypass actors overriding these branch protections.

## Personal-account limitation

GitHub personal repositories do not provide the organization-style branch rule that limits pushes to a selected set of collaborators. Allowing direct updates to `development` therefore applies to every collaborator with write access. The branch rule checks the commit's required statuses; it does not verify that the same commit was first pushed to a short-lived branch. Using a checked short-lived branch is the documented path. `testing` and `main` remain PR-only. If tighter identity-based push restrictions become necessary, document the GitHub limitation; do not create a temporary organization.

## Manual follow-up

- None. Recheck collaborator access and protections if repository roles or branch rules change.
