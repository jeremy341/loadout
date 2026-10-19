# Branch protection and repository access

Repository: `jeremy341/loadout`, personal account. Treat this document as a live settings record only after comparing it with GitHub's branch-protection API.

## Dated read-only observations

On 2026-10-10, GitHub returned these branch heads, protection flags, and required status-check names:

| Branch | Commit | Protected | Required checks reported |
|---|---|---:|---|
| `development` | `b2628762133907e2e051543a29dcbf69bf02d041` | Yes | Repository integrity, Landing quality, Promotion lane |
| `testing` | `cdd23fea985619ffff1213734d82452d0d55d3fc` | Yes | Repository integrity, Landing quality, Landing browser, Promotion lane |
| `main` | `cd1834a52249424ed135adb65c5f15bd6ef7d56b` | Yes | Repository integrity, Landing quality, Landing browser, Promotion lane |

PR #32, merged into `development`, had successful Repository integrity, Landing quality, Promotion lane, and CodeScene checks. `Landing browser` was skipped on the development lane. The detailed protection readback on 2026-10-11 is the latest full settings snapshot. On 2026-10-18, the GitHub connector returned HTTP 403 for the detailed branch-protection endpoint, so live enforcement could not be freshly verified. The workflow and ship script describe repository policy and expected check names; they do not prove that GitHub currently enforces them. No settings were changed during the October 18 read.

## Collaborators

GitHub's live collaborator API showed these accounts on 2026-10-06:

| Account | Access |
|---|---|
| `jeremy341` | admin/owner |
| `fazin-ahamed` | write |
| `NeticYTOF` | write |

The 2026-10-06 settings record showed the development direct-push rule applying to both write collaborators and the owner. On a personal repository, GitHub cannot limit that branch rule to only a selected trusted maintainer.

## Lane policy in the workflow

```text
short-lived branch → PR → development → promotion PR → testing → promotion PR → main
```

- `development`: feature PRs from the supported short-lived branch prefixes are accepted by the workflow.
- `testing`: promotion PRs from `development` are accepted by the workflow.
- `main`: release PRs from `testing` are accepted by the workflow.

The current workflow check-name contract is maintained in [required-checks.md](required-checks.md). The tables below preserve dated branch-protection observations and are not a second current policy source.

The following settings are from the 2026-10-11 protection readback and have not been freshly verified:

- Human approvals: zero required on every lane. No Jeremy-only, owner-only, CODEOWNER, latest-pusher, or other one-person rule.
- Administrators were subject to rules. No bypass actors were present. Force pushes and branch deletion were disabled.
- CodeScene and Codecov were not required GitHub branch checks; CodeScene feedback was advisory. Copilot code review was not included.

## Lane settings

Applied on 2026-10-11 (repository options):

- Merge options: squash merges and merge commits allowed; rebase merges off; merged branches deleted automatically; squash commits take the PR title with an empty body.
- `development` moved by fast-forward to `main`'s commit, then one squash commit for the docs update. No content changes on the lanes.
- Co-author lines removed from all three lanes' history (same file tree on all three).

### Historical fast-forward recommendation (superseded)

This proposal predates the current PR-based promotion path. Its testing recommendation and toggle are superseded by `scripts/ship.ps1` and the 2026-10-11 readback, both of which use a testing promotion PR. Do not use this table as current guidance or as a live settings report.

| Branch | PR required | Force pushes | Required checks | Why |
|---|---|---|---|---|
| `development` | Yes, 0 approvals | Off | Repository integrity, Landing quality, Promotion lane | Every change arrives as a squash-merged PR, so the history stays one commit per change. |
| `testing` | No | Off | Repository integrity, Landing quality, Landing browser, Promotion lane | Historical proposal: fast-forward a development commit without a PR. Superseded. |
| `main` | Yes, 0 approvals | Off | Repository integrity, Landing quality, Landing browser, Promotion lane | One release PR per batch, merged with a merge commit, so main records each release. |

### Rules read back on 2026-10-11

| Branch | PR required | Force pushes |
|---|---|---|
| `development` | No | On |
| `testing` | Yes | Off |
| `main` | Yes | Off |

### Historical owner toggles (superseded)

The earlier proposal suggested requiring a PR on `development`, removing the PR requirement on `testing`, and optionally disabling force pushes on `development`. These are historical instructions, not actions to take. In particular, removing the testing PR requirement conflicts with the current PR-based ship path and the 2026-10-11 readback. Refresh the live settings before considering any change; the October 18 read returned HTTP 403.

## Workflow check names and dated PR settings

| Branch | Check names listed in the 2026-10-11 protection readback | PR setting read back on 2026-10-11 |
|---|---|---|
| `development` | `Repository integrity`, `Landing quality`, `Promotion lane` | Not required; permits checked direct pushes |
| `testing` | `Repository integrity`, `Landing quality`, `Landing browser`, `Promotion lane` | Required; only `development` may promote |
| `main` | `Repository integrity`, `Landing quality`, `Landing browser`, `Promotion lane` | Required; only `testing` may promote |

CI runs on pull requests into the three lanes and on pushes to the three lanes; pushes to feature branches run no CI. The current workflow defines `Landing quality` and `Landing browser` on each lane event. Landing quality's lint, typecheck, unit, and production-build steps run whenever app-affecting files change. Browser coverage has five shard jobs and one stable `Landing browser` aggregator. The browser suite skips only when the exact source-lane commit has a recorded successful `Landing browser` check run ([the rule](../../.github/scripts/verified-tree.sh)); tree equality alone is insufficient. `Promotion lane` validates the PR source and target. These are workflow behaviors; the October 18 live protection settings could not be read.

The 2026-10-11 protection readback showed required status checks sourced from GitHub Actions. It recorded `development` as requiring an up-to-date branch; `testing` and `main` did not require source-branch freshness. The workflow checks promotion candidates and avoids reverse-merges of lane merge commits. These historical settings require a fresh protection read before relying on them.

## Historical verification record

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

### Full settings readback on 2026-10-11

The most recent full readback recorded the rules in the "Rules read back on 2026-10-11" table above. It is historical evidence and does not establish that the settings remain in force.

### Attempted refresh on 2026-10-18

The detailed branch-protection endpoint returned HTTP 403. Live enforcement, approvals, bypass actors, administrator enforcement, force-push/deletion settings, and freshness settings could not be confirmed. Lane heads observed that day were development `fc37ebe`, testing `8b6e747`, and main `2c642a9` (PRs #111–#113). Do not treat workflow configuration or those commit observations as proof of branch protection.

### Branch endpoint summary on 2026-10-19

GitHub's branch endpoints reported development `34f0668616f330b75c62276481314ca869eb28d0`, testing `2eee7ef6cee78bf9b4935921be07130aa05a38ff`, and main `eb94498cdb40b891a16f8542daf7a2ec0b9d879f` as protected, with the check names listed in [the current workflow contract](required-checks.md). The detailed branch-protection endpoint remained unavailable to this integration, so pull-request requirements, approvals, bypass rules, force pushes, and freshness settings were not confirmed.

## Personal-account limitation

GitHub personal repositories do not provide the organization-style branch rule that limits pushes to a selected set of collaborators. Allowing direct updates to `development` therefore applies to every collaborator with write access. The 2026-10-11 readback recorded `testing` and `main` as PR-required, but current enforcement could not be verified on 2026-10-18. If tighter identity-based push restrictions become necessary, document the GitHub limitation; do not create a temporary organization.

## Manual follow-up

- Re-read the detailed protection configuration with an authorized GitHub session before changing protections or asserting that each optional setting remains current.
- Recheck collaborator access and protections if repository roles or branch rules change.
