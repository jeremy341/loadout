# LOADOUT - Source Audit, Repository Bootstrap & Development Workflow

## Later workspace decision (2026-10-04)

This later user decision supersedes earlier instructions in this plan to keep references outside the repository or avoid submodules. The three references now live as pinned Git submodules at `loadout/references/pixl/`, `loadout/references/ysws-template/`, and `loadout/references/stardance/`, each at the exact SHA recorded in `loadout/docs/source-audit/SOURCE_BASES.md`. Run `git submodule update --init` for the complete accessible source checkout. Do not recurse into Stardance's nested `secrets` submodule: its remote returned “Repository not found” on 2026-10-05. The parent LOADOUT history stores URLs and gitlinks, not copies of upstream source files. This matters because the YSWS Template and Stardance have no identified reuse license.

The LOADOUT product root is intentionally free of app/package code while the website redesign is planned. The previously implemented homepage was removed; do not restore it or the Pixl landing surface. Wait for a separate redesign instruction before adding a homepage or broad feature migration. The Stardance specialist audit and LOADOUT's canonical four quality dimensions remain unchanged.

**Status:** Canonical engineering workflow before large-scale LOADOUT implementation  
**Sources to audit:** `hackclub/pixl`, `EDRipper/ysws-template`, and `hackclub/stardance`  
**Actual product repo:** independent `jeremy341/loadout` repository initially  
**Active contribution flow (user decision, 2026-10-06):** short-lived branch → PR to `development` → promotion PR to `testing` → promotion PR to `main`.

**Direct-push exception:** any account with repository write access may push the exact commit to `development` after that SHA has passed the development checks on a short-lived branch. `testing` and `main` stay PR-only. The personal-repository branch rule cannot be scoped to only two named maintainers.

## 0. Core Decision

LOADOUT will use three existing codebases as local references:

```text
hackclub/pixl
→ PRIMARY ENGINEERING BASE

EDRipper/ysws-template
→ GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE

hackclub/stardance
→ PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE
```

They are not merged together as three applications. Pixl remains the only primary engineering base. Stardance is consulted narrowly for peer review and payout mechanics; its Rails architecture and its scoring formula are not LOADOUT targets.

The actual LOADOUT repository remains one coherent codebase.

```text
UNDERSTAND ALL THREE SOURCES
        ↓
AUDIT FEATURE BY FEATURE
        ↓
CHOOSE THE BEST SOURCE OR REIMPLEMENT
        ↓
ADAPT TO LOADOUT
        ↓
KEEP ONE COHERENT ARCHITECTURE
```

Pixl is the primary starting source because the existing LOADOUT migration plan was designed around its monorepo, landing site, admin/review tooling, server, project infrastructure, shop/fulfillment foundation, Hackatime integration, and moderation systems.

The YSWS template is the general operations/infrastructure reference for features such as configuration, permissions, fulfillment, account/admin flows, integrations, and other reusable YSWS patterns.

Stardance is a specialist source for peer/project review, rating aggregation, percentile and multiplier mechanics, payout preview/locking, moderation, and reviewer quality controls. It must not replace LOADOUT's planned quality dimensions: **Originality, Technical Depth, Execution, Documentation**. LOADOUT's own resulting quality assessment remains an input to its Bolt multiplier.

---

# 1. Local Workspace

Recommended local structure:

```text
loadout-workspace/
├── PLAN/
│   └── supplied project plans
└── loadout/
    ├── references/
    │   ├── pixl/          (pinned Git submodule)
    │   ├── ysws-template/ (pinned Git submodule)
    │   └── stardance/     (pinned Git submodule)
    ├── docs/
    └── LOADOUT-owned product files
```

The three references are pinned submodules inside the LOADOUT Git repository under `loadout/references/`.

The later user decision above explicitly permits the three reference submodules. Do not vendor or copy upstream source files into the LOADOUT product tree, especially from sources with no reuse license.

---

# 2. Source URLs

Canonical starting sources:

```text
PIXL
https://github.com/hackclub/pixl.git
branch: main

YSWS TEMPLATE
https://github.com/EDRipper/ysws-template.git
branch: master

STARDANCE
https://github.com/hackclub/stardance.git
branch: use the repository's current default branch; record the exact branch and SHA
```

Keep the source repositories as Git submodules under `loadout/references/`, pinned to the exact audited SHAs. Do not flatten, vendor, or copy their files into the product tree. Submodule worktrees retain independent upstream histories, while the parent repo records only gitlinks and URLs.

---

# 3. Record Exact Source Versions

Before doing any audit or copy:

```bash
git -C references/pixl rev-parse HEAD
git -C references/ysws-template rev-parse HEAD
git -C references/stardance rev-parse HEAD
```

Attempt to fetch all three repositories. If any source is inaccessible, record the exact URL and error, do not invent its SHA/license/architecture, mark its matrix observations unverified, and continue with the audits and work that do not depend on that source. Revisit the source only if access changes.

For each accessible source, record:

- repository URL
- branch
- exact commit SHA
- clone date
- detected license
- any source-specific notes

in:

```text
loadout/docs/source-audit/SOURCE_BASES.md
```

This gives LOADOUT a precise reproducible starting point without importing Pixl's Git history into the LOADOUT repository.

---

# 4. Licensing and Attribution

## 4.1 Pixl

Preserve all required license and copyright notices from the Pixl source.

The LOADOUT README should clearly state that the project was initially bootstrapped from the open-source Pixl codebase and substantially modified for LOADOUT.

Do not remove a required MIT copyright/license notice.

## 4.2 YSWS template

Before transplanting code from `EDRipper/ysws-template`, inspect:

- root license files
- package metadata
- README
- repository metadata
- source headers
- any explicit reuse permission

If a compatible license or explicit permission cannot be established:

- inspect and learn from the architecture
- record the idea in the audit
- reimplement the concept independently
- do not copy substantial source code into LOADOUT

Do not guess that code is reusable just because the repository is public.

## 4.3 Stardance

Inspect the current root license, repository metadata, package manifests, source headers, and relevant review/payout files. Record the exact Stardance commit and license in `SOURCE_BASES.md`. Do not copy substantial Stardance code unless its license allows it and the attribution basis is recorded. The intended use is a narrow implementation reference; do not adopt the Rails architecture or import the Stardance scoring formula as LOADOUT policy.

## 4.4 Attribution log

Create:

```text
docs/source-audit/ATTRIBUTION.md
```

For transplanted/adapted code, record:

- source repository
- source path
- source SHA
- license/permission basis
- LOADOUT destination
- whether it was copied, adapted, or independently reimplemented

---

# 5. Audit Before Migration

Do not begin mass migration based on repository names or assumptions.

Run an explicit source audit.

Create:

```text
docs/source-audit/
├── SOURCE_BASES.md
├── FEATURE_MATRIX.md
├── UI_MATRIX.md
├── ARCHITECTURE_NOTES.md
├── DECISIONS.md
└── ATTRIBUTION.md
```

For every source-derived idea considered for LOADOUT, `DECISIONS.md` must record the source repository, exact path, source SHA, license basis, and a decision of `ADAPT`, `REIMPLEMENT`, `REFERENCE ONLY`, or `IGNORE`. This applies to Pixl, the YSWS Template, and Stardance. A `KEEP` entry in the feature matrix describes disposition of an existing capability; it does not replace this explicit idea classification.

---

# 6. Feature Audit Matrix

`FEATURE_MATRIX.md` should use a table like:

Audit Stardance only in the peer-review/payout specialist scope and any cross-cutting auth, permission, data-integrity, or audit controls directly used by those workflows. Mark unrelated Stardance capabilities out of scope; do not treat it as a third full-stack base to clone.

| Capability | Pixl | YSWS Template | Stardance | LOADOUT decision | Source path(s) | Notes |
|---|---|---|---|---|---|---|
| Hack Club auth | inspect | inspect | inspect | TBD | ... | ... |
| permission levels | inspect | inspect | inspect | TBD | ... | ... |
| participant account | inspect | inspect | inspect | TBD | ... | ... |
| impersonation | inspect | inspect | inspect | TBD | ... | ... |
| projects | inspect | inspect | inspect | TBD | ... | ... |
| collaborators | inspect | inspect | inspect | TBD | ... | ... |
| Hackatime | inspect | inspect | inspect | TBD | ... | ... |
| Lapse | inspect | inspect | inspect | TBD | ... | ... |
| journals/devlogs | inspect | inspect | inspect | TBD | ... | ... |
| ship/submission | inspect | inspect | inspect | TBD | ... | ... |
| review queue | inspect | inspect | inspect | TBD | ... | ... |
| peer/project ratings | inspect | inspect | inspect | TBD | ... | ... |
| rating criteria and feedback | inspect | inspect | inspect | TBD | ... | ... |
| reviewer assignment and quality | inspect | inspect | inspect | TBD | ... | ... |
| score aggregation / percentiles | inspect | inspect | inspect | TBD | ... | ... |
| multiplier and payout preview/finalization | inspect | inspect | inspect | TBD | ... | ... |
| reviewer permissions | inspect | inspect | inspect | TBD | ... | ... |
| moderation | inspect | inspect | inspect | TBD | ... | ... |
| shop | inspect | inspect | inspect | TBD | ... | ... |
| regional pricing | inspect | inspect | inspect | TBD | ... | ... |
| HCB fulfillment | inspect | inspect | inspect | TBD | ... | ... |
| order tracking | inspect | inspect | inspect | TBD | ... | ... |
| screenshot/CDN storage | inspect | inspect | inspect | TBD | ... | ... |
| Slack bot / DM | inspect | inspect | inspect | TBD | ... | ... |
| notifications | inspect | inspect | inspect | TBD | ... | ... |
| FAQ/content | inspect | inspect | inspect | TBD | ... | ... |
| program config | inspect | inspect | inspect | TBD | ... | ... |
| deployment | inspect | inspect | inspect | TBD | ... | ... |
| encrypted DB/data | inspect | inspect | inspect | TBD | ... | ... |
| fraud/double-dip checks | inspect | inspect | inspect | TBD | ... | ... |

For each row, choose one final action when the source is inspectable:

```text
KEEP
ADAPT
REIMPLEMENT
REFERENCE ONLY
IGNORE
```

Never leave the matrix with vague statements such as "probably use Pixl."

If a source cannot be inspected, mark its row `UNVERIFIED — NOT AUDITED`, include the access result, and make no reuse decision based on assumptions. This explicit evidence state takes precedence over filling in an unsupported KEEP/ADAPT decision.

For each Stardance review/payout idea, classify the idea explicitly as one of:

```text
ADAPT
REIMPLEMENT
REFERENCE ONLY
IGNORE
```

Record the exact Stardance path and reasoning in `DECISIONS.md`. A framework or scoring formula is never copied merely because an implementation detail is useful.

## 6.1 Stardance peer review and payout specialist audit

Read the implementation, not just the public description. Inspect at least the supplied candidate paths and follow related models, controllers, jobs, views, schema, and tests:

```text
app/models/post/ship_event/payouts.rb
app/models/post/ship_event.rb
app/views/admin/payout_reviews/
app/views/projects/_ship_card.html.erb
```

Search the repository for related rating/review models, reviewer assignment, payout calculation/finalization, admin controls, and test coverage. Record the exact file paths and commit SHA that were inspected. Specifically determine and document:

- peer/project review lifecycle and state transitions;
- rating dimensions/criteria and whether a reviewer must give reasons or written feedback;
- who gets assigned a review, how many ratings are required, and how incomplete assignments are handled;
- aggregation method, percentile calculation, and any normalization or tie behavior;
- multiplier calculation, payout preview versus final/locked payout, and when values become immutable;
- missing-review behavior, timeout/reassignment, and whether payouts are held or estimated;
- outlier detection, outlier handling, and any minimum/maximum or robust-statistic rules;
- anti-gaming, reciprocal voting, collusion, reviewer quality, and fraud controls;
- admin overrides, audit trail, review correction, re-review, appeal, and reopening behavior;
- database models/relations/constraints and tests that reveal intended behavior, including edge cases and rounding.

For each observed idea, choose `ADAPT`, `REIMPLEMENT`, `REFERENCE ONLY`, or `IGNORE`. Say why. Do not leave “use Stardance scoring” as a decision.

**LOADOUT scoring boundary:** LOADOUT's quality dimensions remain **Originality, Technical Depth, Execution, Documentation**. The LOADOUT reviewer assessment feeds LOADOUT's Bolt multiplier as defined in plan `02`. Stardance is an implementation reference for reliable peer-review, aggregation, multiplier, and payout-state mechanics; it does not replace these canonical dimensions or set LOADOUT's policy/formula. Do not adopt Stardance's Rails architecture.

---

# 7. UI Audit Matrix

Audit the visual/product implementations separately from backend features.

`UI_MATRIX.md` should inspect:

```text
public landing
login/auth
account management
dashboard
project creation
project detail
journals/devlogs
submission/ship flow
review dashboard
admin
shop
fulfillment/order flow
FAQ/docs
mobile behavior
empty/error/loading states
```

For each screen:

- what is structurally useful?
- what should LOADOUT preserve?
- what is source-specific branding?
- what is technically reusable?
- what is visually unacceptable?
- what can be simplified?
- which LOADOUT plan owns the replacement behavior?

Do not select a UI merely because it already exists.

LOADOUT's canonical visual owner is `03_LOADOUT_UI_DESIGN_SYSTEM.md`.

The public homepage additionally follows `06_LOADOUT_PUBLIC_HOMEPAGE.md`.

---

# 8. Architecture Audit

`ARCHITECTURE_NOTES.md` must identify:

- framework/runtime per app
- package manager
- monorepo tooling
- database layer
- authentication model
- permission model
- background jobs
- storage/CDN model
- integrations
- deployment assumptions
- environment-variable surface
- server/client boundaries
- testing stack
- migration system
- potentially dangerous source-specific coupling

Explicitly identify where all three source repositories use incompatible stacks. Stardance may be implemented in Rails; do not introduce or migrate LOADOUT to Rails to reuse its review mechanics. Describe an implementation-neutral interface/data-flow model, then select `ADAPT`, `REIMPLEMENT`, `REFERENCE ONLY`, or `IGNORE` for each relevant mechanic.

Do not introduce a second frontend framework into LOADOUT merely to reuse one feature.

Prefer adapting a feature to the existing LOADOUT/Pixl-derived stack when that keeps the architecture coherent.

---

# 9. Actual LOADOUT Repository

Create a fresh independent Git repository:

```text
jeremy341/loadout
```

The initial repository is owned by Jeremy's personal GitHub account. Do not create a temporary GitHub organization. Keep the intended later transfer path to `hackclub/loadout` only if Hack Club accepts LOADOUT as a YSWS and approves the transfer.

It is not a GitHub fork.

It does not contain Pixl's Git history.

The initial codebase is bootstrapped from a clean Pixl worktree snapshot after recording the exact Pixl SHA.

## Initial copy rules

Copy the tracked Pixl worktree into `loadout/`, excluding:

```text
.git/
node_modules/
.next/
dist/
build/
coverage/
temporary artifacts
local secrets
.env files containing real credentials
```

Before the first push:

1. inspect `.github/workflows`
2. do not activate Pixl-specific deployment workflows against the new repository
3. disable/remove/replace workflows that assume Pixl infrastructure
4. inspect deployment configuration for source-specific hosts/secrets
5. scan for accidental secrets or credentials
6. preserve required license notices
7. add a LOADOUT README with explicit Pixl attribution
8. add `docs/source-audit/SOURCE_BASES.md`

The pinned source submodule remains at its audited commit, so source files are available for comparison without becoming LOADOUT product files.

### Complete collaborator checkout

Run `git clone https://github.com/jeremy341/loadout.git`, then `cd loadout`, `git submodule update --init`, and `git submodule status`. The default `main` contains the complete repository. Git downloads all tracked design images from `docs/design/references/`; top-level submodule initialization downloads Pixl, YSWS Template, and Stardance at the recorded SHAs. Do not manually recopy them or use a partial/filtered clone for onboarding. Avoid `--recursive` because Stardance's nested `secrets` remote is unavailable.

---

# 10. Initial Repository Commit

Recommended initial commit:

```text
chore: bootstrap LOADOUT from Pixl source snapshot
```

The commit should contain:

- cleaned Pixl source snapshot
- preserved license
- LOADOUT README/attribution
- source-base record
- inactive/safe CI state
- no real secrets
- no copied reference Git histories; exactly the three declared submodules are linked beneath `references/`

This is the one permitted bootstrap exception before normal protected-branch workflow begins.

Do not use `testing` or `main` as development workspaces. The checked-commit direct-push exception for `development` is defined in §17.

---

# 11. Default Branch and Staged Release Lanes

`main` remains the canonical default branch and Vercel Production source. Routine work follows all three lanes; `development` is the integration lane, `testing` is the release-candidate lane, and `main` is production.

```text
development
testing
main
```

Intended roles:

| Branch | Purpose | Deployment |
|---|---|---|
| `development` | integrate everyday changes; short-lived branches target it by PR | preview |
| `testing` | validate a complete release candidate promoted from `development` | preview/staging |
| `main` | canonical production source, reached only from `testing` by PR | production |

The initial bootstrap baseline was synchronized to GitHub's default `main` by PR #1. `main` contains the complete application, plans, docs, images, and source submodule pins. New contributors clone `main`, fetch all three lanes, and create short-lived task branches from the latest `development` after the one-time catch-up.

Historical branch relationships from bootstrap:

```text
main
├── testing
└── development
```

The remote lanes need a one-time catch-up after the user-requested PR #8 merge into `main`. At the workflow-change start, `origin/main` was nine commits ahead of `origin/development`; `origin/testing` had nine commits absent from main and one testing-only commit. Route the workflow change into development first, then promote it through testing and main. Verify the final three tree hashes before recording the lanes as synchronized.

---

# 12. Short-Lived Branches

After the one-time catch-up, all new work branches from the latest `development`. During catch-up only, a branch based on `main` may open a PR to `development` to restore the shared baseline before promotions continue.

Prefixes:

```text
feature/*
fix/*
refactor/*
docs/*
experiment/*
chore/*
```

Examples:

```text
feature/public-homepage
feature/builder-profile
feature/requisitions
feature/review-dashboard
fix/shop-quote-rounding
refactor/auth-permissions
experiment/template-regional-pricing
chore/ci-bootstrap
```

Branches describe work, not people.

Avoid:

```text
jeremy
alex-work
homepage-final-v2
random-test
```

---

# 13. Pull-Request Flow

The required flow is:

```text
short-lived branch
        ↓ PR
development
        ↓ promotion PR
testing
        ↓ promotion PR
main
```

Normally:

- create a short-lived branch for every task and open a PR into `development`
- either trusted maintainer may directly push the exact short-lived-branch commit to `development` after the development checks for that SHA have passed; an unverified SHA is rejected by required status checks
- promote only `development` → `testing` and `testing` → `main`; the `Promotion lane` check rejects other head/base pairs
- wait for every check required by the target lane before merging
- either trusted maintainer may merge a check-green PR; human review is encouraged but not technically required
- never commit locally on `testing` or `main`; do not force-push or delete permanent lanes
- delete short-lived branches after merge when safe

Do not require approval from Jeremy, the owner, a team, a CODEOWNER, or a person other than the latest pusher. Do not restrict the cofounder to review-only access. Human review remains optional.

---

# 14. Multiple Contributors

The repository remains under `jeremy341` while LOADOUT is being developed.

Add trusted co-organizers/developers as repository collaborators.

Suggested roles:

```text
OWNER
Jeremy

CO-ORGANIZER / CORE MAINTAINER
personal-repository collaborator with write access

CONTRIBUTORS
work through PRs
```

The cofounder GitHub username is `fazin-ahamed`; GitHub reports active `write` permission as of 2026-10-05. Both maintainers can work and merge independently across time zones.

### Required task kickoff

Before starting a task, each human or AI contributor posts a concise kickoff in `#loadout-development` with the task scope, temporary branch, and intended target (`development`, `testing`, or `main`). Feature work targets `development`; testing and main are only reached through their promotion PRs. Include material changes or blockers in follow-up messages and share the PR when it is ready. Never post tokens, credentials, or private participant data. Do not claim a Slack post was sent unless it was actually posted.

**OFFICIAL / FIRST-PARTY GitHub permission note (checked 2026-10-04):** a personal-account repository has owner and collaborator permission levels. Collaborators have write access and can create/push branches, open/review PRs, and merge PRs on protected branches when the PR has no required approval. Repository-wide settings and collaborator invitations remain owner tasks. See [personal-repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).

Do not add CODEOWNERS or required-review rules that give Jeremy sole approval power or block an independent maintainer working in another time zone. Optional reviewer requests and PR discussion remain encouraged.

---

# 15. Eventual Hack Club Transfer

Developing first under:

```text
jeremy341/loadout
```

does not prevent a later transfer to:

```text
hackclub/loadout
```

if Hack Club accepts the YSWS and approves the transfer.

Before transfer, record:

- active GitHub Apps
- repository secrets
- environments
- branch protections/rulesets
- Vercel project
- CodeScene project
- error monitoring
- webhooks
- deployment credentials

After transfer:

- update local `origin`
- verify all collaborators/teams
- verify rulesets and branch protection
- re-authorize external GitHub Apps if required
- verify Vercel/deploy integration
- verify CodeScene
- verify secrets/environments
- run staging + production smoke tests

Do not assume third-party app authorization automatically follows an organization transfer.

---

# 16. CI Strategy

Copy the philosophy of the Poorup workflow, not its project-specific complexity.

## Staged lane checks

GitHub Actions runs checks for short-lived branch pushes so that a direct push to `development` can reuse successful results for the exact same commit SHA. It also runs on every PR and on pushes to the permanent lanes.

`development` is the fast lane:

```text
Repository integrity
lint
typecheck
unit tests
Promotion lane validation
```

`testing` and `main` promotions run `Repository integrity`, full `Landing quality` including the production build, `Landing browser`, and `Promotion lane`. The release PR reruns the full checks on the main merge candidate; this ensures the exact candidate being promoted is green. Add backend/database checks when those systems exist. CodeScene remains advisory and is not a required branch check; Copilot code review is not part of this pipeline.

Human review is recommended, but it must not be a required GitHub approval. Either trusted maintainer may merge after all required checks pass.

Do not create expensive test sharding or large nightly campaigns before the test suite actually needs them.

---

# 17. Branch Protection

The previous all-PR protection configuration was verified on 2026-10-06. The active lane-specific configuration is recorded in `docs/development/BRANCH_PROTECTION_SETUP.md` after applying and reading back the new settings.

Recommended starting policy:

The goal is a **lane and CI gate with zero required human approvals**. Apply rules to administrators and configure no bypass actors. Both maintainers can work independently and merge check-green PRs.

## `development` integration lane

- feature PRs are the normal route; direct pushes of exact pre-checked commits are allowed
- required fast checks: `Repository integrity`, `Landing quality`, and `Promotion lane`
- no human approval required
- no force pushes or deletion
- push checks to feature branches provide successful statuses before the direct update
- zero required approvals
- no administrator or collaborator bypass
- feature PRs must be up to date; direct pushes use the exact checked commit SHA

## `testing` release-candidate lane

- PR required; the only allowed source is `development`
- direct updates blocked by required PR rule
- zero required approvals
- no administrator or collaborator bypass
- required heavy CI
- browser QA required when available
- do not require source freshness; full CI runs on the promotion merge candidate

## Production lane: `main`

- PR required; the only allowed source is `testing`
- direct updates blocked by required PR rule
- zero required approvals
- no administrator or collaborator bypass
- production/release checks required
- do not require source freshness; full CI runs on the promotion merge candidate
- no force push
- no branch deletion

Do not require an approving review from Jeremy, a repository owner, a team, a CODEOWNER, or a person other than the latest pusher. Do not enable a “require approval of the most recent reviewable push” setting. Human review is a recommendation only.

**Personal-account limitations (checked 2026-10-04):** GitHub's “restrict who can push” branch restriction is not available on user-owned repositories. Requiring PRs for protected branches blocks direct updates, while collaborator write access leaves temporary branches available. Protected branches/rulesets are supported on public repositories with GitHub Free; private repositories require a paid plan with protection support. If a setting is absent, record the exact limitation; do not create a temporary organization or change visibility/plan. See [protected branch availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and [ruleset PR behavior](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

Only the repository owner may be able to apply account/repository settings or invite the cofounder. Record current settings and all remaining manual actions rather than claiming an unconfigured rule is active.

Do not invent CI check names before the workflows run. After CI has posted checks that GitHub can select, require the actual stable GitHub Actions checks for each lane; choose GitHub Actions as the expected source when available.

After repository creation, always create both:

```text
docs/development/WORKFLOW.md
docs/development/BRANCH_PROTECTION_SETUP.md
```

`WORKFLOW.md` documents the PR flow, independent maintainer merge ability, optional human review, and pending cofounder invite. `BRANCH_PROTECTION_SETUP.md` records the actual rules and checks, zero-approval policy, absence of bypasses, personal-account limitations, and any remaining manual steps. Never claim the invite or an unconfigured protection is active.

---

# 18. CodeScene

Use CodeScene similarly to Poorup:

> **New code must not make the project worse.**

CodeScene is primarily a maintainability signal for changed code.

Rules:

- analyze the diff/touched functions
- do not launch repository-wide "improve the score" refactors
- fix serious regressions introduced by the current change
- unrelated legacy hotspots require a separate explicit refactor task
- CodeScene findings do not override tests or human judgment
- do not claim CodeScene is installed until the GitHub App/project actually exists

If the cloud GitHub integration cannot be configured automatically, document the exact manual setup steps in:

```text
docs/development/CODESCENE_SETUP.md
```

---

# 19. Deployment Lanes

`main` is the production source of truth. Every release travels through `development` and `testing`. Vercel's production branch is `main`; use Preview deployments for development/testing changes and never treat a preview as a production release.

Do not let an imported Pixl workflow deploy LOADOUT to a Pixl environment.

Do not let the reference YSWS template determine the deployment architecture automatically.

The source audit decides which patterns are worth adapting.

---

# 20. Config Strategy

The YSWS template includes a program configuration concept.

Audit it.

LOADOUT should eventually own its own canonical configuration layer for facts such as:

- program name
- URLs
- event dates
- currency display
- integrations
- shop categories
- public announcement
- feature flags

Do not blindly copy another project's JSON schema.

Prefer one LOADOUT-owned config contract that matches LOADOUT's actual product model.

---

# 21. First Implementation Scope

After the audit and repository bootstrap, do not migrate every feature at once.

First product implementation:

```text
PUBLIC HOMEPAGE
```

Follow:

```text
03_LOADOUT_UI_DESIGN_SYSTEM.md
06_LOADOUT_PUBLIC_HOMEPAGE.md
```

Use Pixl `apps/landing` as the primary engineering base.

The YSWS template frontend is reference-only unless the audit identifies a specific implementation worth adapting and licensing permits it.

---

# 22. What Not to Build Yet

Do not use the source audit as an excuse to build everything discovered.

Defer until their proper migration phase:

- full participant dashboard migration
- complete economy engine
- Requisition engine
- Custom Orders backend
- advanced missions/seasons
- Signal automation
- complex Slack bot
- IRL event system
- elaborate avatar editor
- every YSWS template feature just because it exists

The source audit maps the terrain. It does not automatically expand scope.

---

# 23. Audit Decision Rules

When multiple sources implement the same capability, prefer:

1. the implementation that best fits canonical LOADOUT behavior
2. the implementation that fits the chosen stack
3. the safer implementation
4. the implementation with better tests
5. the implementation with less source-specific coupling
6. the simpler implementation when capability is otherwise equivalent

If none of the implementations is a good fit:

```text
REIMPLEMENT
```

That is a valid and expected outcome.

---

# 24. Required Audit Output Before Large Migration

Before moving beyond the public homepage, the repository should contain a clear summary:

```text
SOURCE AUDIT COMPLETE

PIXL
KEEP       ...
ADAPT      ...
IGNORE     ...

YSWS TEMPLATE
ADAPT      ...
REFERENCE  ...
IGNORE     ...

STARDANCE
ADAPT      ...
REIMPLEMENT ...
REFERENCE  ...
IGNORE     ...

BUILD NEW
...

LICENSING
...

MAJOR RISKS
...

NEXT MIGRATION SLICE
...
```

Another contributor should be able to read the audit and understand why each source is being used.

---

# 25. Acceptance Criteria

This workflow plan is correctly implemented when:

- Pixl, YSWS Template, and Stardance are linked as independent pinned submodules under `loadout/references/`
- exact source SHAs and license facts are recorded for accessible sources; inaccessible-source attempts are documented without invented values
- Stardance peer-review, rating, multiplier, payout-state, moderation, reviewer-quality, and test behavior are mapped to exact source paths when accessible
- each Stardance-derived idea has an explicit `ADAPT`, `REIMPLEMENT`, `REFERENCE ONLY`, or `IGNORE` decision
- LOADOUT's Originality / Technical Depth / Execution / Documentation scoring dimensions remain canonical and feed LOADOUT's Bolt multiplier
- Stardance's Rails architecture and scoring formula have not replaced LOADOUT's architecture or scoring model
- LOADOUT is an independent Git repository with fresh history
- required Pixl attribution/license notices are preserved
- YSWS template code is not copied without a verified reuse basis
- only the three declared reference submodules are committed; no reference code is vendored into the LOADOUT product tree
- old Pixl deploy workflows cannot accidentally target source infrastructure
- `development`, `testing`, and `main` exist
- normal work follows short-lived branch → PR to `development` → promotion PR to `testing` → promotion PR to `main`
- after the baseline-sync PR, a default-branch clone contains all plans, tracked design images, and initialized source submodules
- the UI skill workflow and the Slack kickoff channel are documented for human and AI contributors
- the repository remains `jeremy341/loadout` under the personal account initially, with no temporary organization
- `fazin-ahamed` has verified `write` permission
- both maintainers can create/push short-lived branches, review PRs, and merge check-green lane PRs independently across time zones
- no required owner-specific or CODEOWNER approval blocks either maintainer
- required CI checks pass before merges; direct pushes to `development` are allowed only for an exact pre-checked commit; direct pushes to `testing` and `main` are blocked
- `docs/development/WORKFLOW.md` and `docs/development/BRANCH_PROTECTION_SETUP.md` describe the flow, actual controls, and remaining setup
- any personal-repository plan limitation is documented rather than routed through a temporary organization
- CI is proportional to the current project size
- CodeScene is diff-focused and does not drive random refactors
- the source audit exists before broad feature migration
- the first implementation target is the public homepage
- the repository remains transferable to the Hack Club organization later
