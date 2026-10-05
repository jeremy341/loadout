# LOADOUT - Bootstrap, Source Audit & Public Homepage Agent Prompt

## Later scope and source-layout amendment (2026-10-04)

Prompt 01's original bootstrap and homepage prototype work has already been executed. The user has since requested a full website redesign and removal of the prototype. Do not implement or restore any homepage in this prompt; keep the LOADOUT product root free of app/package code until a separate redesign brief is supplied. Sections 14–18 remain historical design requirements only, not current implementation authorization.

The three references are now independent, pinned Git submodules inside the actual repository at `references/pixl/`, `references/ysws-template/`, and `references/stardance/`. Use the exact audited SHAs in `docs/source-audit/SOURCE_BASES.md`. This later decision supersedes the old instructions below that kept references outside the repository or prohibited submodules. The parent history contains submodule pointers, not copies of upstream files; do not vendor the YSWS Template or Stardance source because no reuse license was identified.

You are working on LOADOUT, an independent Hack Club-style YSWS.

Your job is to create the local LOADOUT workspace, inspect three existing repositories in their distinct roles, create the independent LOADOUT GitHub repository, establish the three-branch workflow, perform a source audit, bootstrap the codebase from Pixl without importing Pixl's Git history, and implement the first public homepage according to the provided LOADOUT plans.

Do not treat this as a generic greenfield app and do not merge two repositories together blindly.

## Source repositories

Primary source / engineering base:

```text
https://github.com/hackclub/pixl.git
branch: main
```

Secondary feature/reference source:

```text
https://github.com/EDRipper/ysws-template.git
branch: master
```

Review/payout specialist reference:

```text
https://github.com/hackclub/stardance.git
clone to: references/stardance/
branch: use and record the current default branch
```

Use the sources in these explicit roles:

```text
Pixl
→ PRIMARY ENGINEERING BASE

YSWS Template
→ GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE

Stardance
→ PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE
```

Target repository:

```text
jeremy341/loadout
```

Target permanent branches:

```text
development
testing
main
```

## Ownership and collaboration decision

The repository stays under Jeremy's personal GitHub account as `jeremy341/loadout` for the initial development period. Do not create a temporary GitHub organization. If Hack Club accepts LOADOUT as a YSWS and approves an eventual transfer, the intended destination is `hackclub/loadout`.

A cofounder/co-organizer with GitHub username `fazin-ahamed` has been identified. Invite them as a write collaborator so they can work and merge independently across time zones. The current invitation is pending acceptance; document that state and continue the rest of the bootstrap. Do not claim their access is active until GitHub confirms acceptance.

Both Jeremy and the trusted collaborator must be able to create short-lived branches, push their own work, open and review PRs, and merge PRs when the required checks pass. Human review is encouraged, but no approval may be technically required. In particular, do not require Jeremy, the repository owner, or a CODEOWNER to approve or merge. Do not add `CODEOWNERS` rules that require an owner-specific approval, or rules requiring approval of the most recent push.

Permanent lane branches must require PRs and required CI checks, with no bypass for administrators or collaborators. Either trusted maintainer may merge a lane PR once its checks pass. Keep short-lived branches pushable by collaborators. If a GitHub personal-repository or plan limitation blocks a desired rule, document the exact limitation and the manual steps; do not create an organization as a workaround.

---

# 1. Read the plans first

Before changing code, read every supplied LOADOUT planning file completely:

```text
00_LOADOUT_CANONICAL_INDEX.md
01_LOADOUT_PRODUCT_AND_PROGRAM.md
02_LOADOUT_ECONOMY_AND_REWARDS.md
03_LOADOUT_UI_DESIGN_SYSTEM.md
04_LOADOUT_PIXL_MIGRATION_PLAN.md
05_LOADOUT_LAUNCH_AND_OPERATIONS.md
06_LOADOUT_PUBLIC_HOMEPAGE.md
07_LOADOUT_SOURCE_AUDIT_AND_REPO_WORKFLOW.md
```

Then read the research brief produced by Prompt 00:

```text
08_HACKCLUB_YSWS_ECOSYSTEM_CONTEXT.md
```

`08` provides ecosystem context and current external findings. It is not allowed to override canonical LOADOUT product decisions in `00-07` unless the human explicitly changed those plans.

If `08_HACKCLUB_YSWS_ECOSYSTEM_CONTEXT.md` is missing, STOP and ask for Prompt 00 to be run first rather than reconstructing Hack Club/YSWS context from memory.

Treat `00-07` as the product source of truth. Treat `08` as supporting research context.

If an older source file, Pixl behavior, YSWS-template behavior, old README, comment, or migration assumption conflicts with these plans, the current LOADOUT plans win.

Important canonical rules include:

- four tracks only: Tools, Systems, Compute, Hardware
- Research is a mode, not a fifth track
- track progression caps at LV.15
- Bolts are one global currency
- multi-track ship XP allocation is reviewer-controlled
- Digital Loadout and Physical Loadout are core concepts
- LOADOUT is intentionally not a general build-anything YSWS
- permanent field discounts are modest
- expensive-item savings are capped
- field Requisitions occur at LV.3 / 6 / 9 / 12 / 15
- Requisitions are scarce, one-use, non-transferable, non-expiring, and cannot bypass mastery gates
- Pixl is engineering infrastructure, not LOADOUT's identity
- current UI direction is Industrial Field Manual + Pixel Utility
- industrial styling must remain simple enough to reproduce with ordinary web CSS/components
- LOADOUT quality dimensions remain Originality, Technical Depth, Execution, Documentation
- the LOADOUT quality assessment feeds the LOADOUT Bolt multiplier
- Stardance is an implementation reference for peer review and payout mechanics, not a replacement product model or scoring policy
- do not adopt Stardance's Rails architecture

Do not revive older five-track or lime-first product assumptions from superseded files.

---

# 2. Establish the workspace

Create or use the workspace with this shape:

```text
loadout-workspace/
├── PLAN/
│   └── the supplied 00-07 plan files
└── loadout/
    ├── references/
    │   ├── pixl/          (pinned Git submodule)
    │   ├── ysws-template/ (pinned Git submodule)
    │   └── stardance/     (pinned Git submodule)
    └── LOADOUT-owned repository files
```

All three references live under `loadout/references/` as independent pinned submodules. Do not vendor or flatten their source files into the LOADOUT product tree. A recursive clone populates the reference code while GitHub stores only upstream URLs and commit pointers.

If the current directory already contains an equivalent structure, preserve it rather than making duplicate nested workspaces.

---

# 3. Initialize all three reference submodules

Initialize the pinned references from the LOADOUT repository:

```bash
git submodule update --init --recursive
```

Use the stated branches for Pixl and the YSWS Template; use Stardance's current default branch and record its name.

Record the exact SHAs:

```bash
git -C references/pixl rev-parse HEAD
git -C references/ysws-template rev-parse HEAD
git -C references/stardance rev-parse HEAD
```

Do not modify the reference clones except for harmless local build/install artifacts if necessary to inspect/run them.

If any remote cannot be cloned because it is unavailable, moved, private, or blocked by the current network/authentication, record the exact attempted URL and result. Do not claim that source was inspected or licensed, and do not copy from it. Continue the independent work that does not depend on that source; treat it as unverified and list it as a manual/future audit item. In particular, Prompt 00 reports that the public `EDRipper/ysws-template` page was inaccessible during that research run, so explicitly recheck it rather than assuming access.

---

# 4. Check licensing before code reuse

Inspect all three repositories' licensing/permission state.

For Pixl:

- preserve its required MIT/copyright notice
- record the exact source SHA
- add transparent attribution in LOADOUT

For `EDRipper/ysws-template`:

- inspect root/license files, README, package metadata, source headers, and repository metadata
- do not assume code is reusable only because it is public
- if a compatible license or explicit reuse permission is not established, use it as an architectural/feature reference only and independently reimplement ideas
- record this conclusion in the audit

Do not copy substantial template code into LOADOUT until the reuse basis is documented.

For `hackclub/stardance`:

- inspect its current root license, repository metadata, package manifests, relevant source headers, and tests
- record the exact commit SHA, default branch, and license in `SOURCE_BASES.md`
- record exact paths for any review/payout behavior discussed in `DECISIONS.md`
- classify each Stardance-derived idea as `ADAPT`, `REIMPLEMENT`, `REFERENCE ONLY`, or `IGNORE`
- do not adopt Stardance's Rails architecture or copy substantial code without a compatible license and explicit attribution basis

---

# 5. Audit all three repositories before broad migration

Create the following audit files in the actual LOADOUT repository:

```text
docs/source-audit/
├── SOURCE_BASES.md
├── FEATURE_MATRIX.md
├── UI_MATRIX.md
├── ARCHITECTURE_NOTES.md
├── DECISIONS.md
└── ATTRIBUTION.md
```

For every source-derived idea considered for LOADOUT, `DECISIONS.md` must record the source repository, exact source path, source SHA, license basis, and a decision of `ADAPT`, `REIMPLEMENT`, `REFERENCE ONLY`, or `IGNORE`. Apply this to Pixl, the YSWS Template, and Stardance. A `KEEP` entry in the feature matrix does not replace this idea classification.

Audit the source repositories by reading actual code, configuration, routes, database/model definitions, tests, workflows, and UI components.

Do not base the audit only on README claims.

## Required feature comparison

Use a comparison table with columns for Pixl, YSWS Template, Stardance, LOADOUT decision, exact source path(s), and notes. At minimum inspect:

Audit Stardance narrowly for peer review/payout mechanics and cross-cutting auth, permissions, data integrity, or audit controls used by those workflows. Mark unrelated Stardance capabilities out of scope; do not treat it as a third full-stack base to clone or port.

- Hack Club auth
- permissions / roles
- account management
- user impersonation
- project model
- collaborators
- Hackatime
- Lapse
- journals/devlogs
- submission/shipping flow
- review queue/dashboard
- peer/project rating flow
- rating criteria, reasons, and reviewer feedback
- reviewer assignment and number of ratings required
- score aggregation and percentile calculation
- multiplier calculation and payout preview versus final/locked payout
- missing-review and outlier handling
- anti-gaming/abuse and reviewer-quality controls
- admin overrides, re-review, and appeals
- review/rating database models, controllers, jobs, schema, and behavior-revealing tests
- reviewer permissions
- moderation/fraud
- shop
- regional pricing
- HCB/card fulfillment
- orders
- screenshot/CDN storage
- Slack bot / DMs
- notifications
- FAQ/content
- program config
- encrypted/sensitive data handling
- YSWS double-dip prevention
- deployment assumptions
- testing

For each capability choose:

```text
KEEP
ADAPT
REIMPLEMENT
REFERENCE ONLY
IGNORE
```

Include exact source paths.

### Stardance peer-review / payout audit

Inspect code and tests, not only Stardance's marketing pages. Start with these candidate paths and follow related rating/review models, controllers, jobs, schema, admin actions, and tests:

```text
app/models/post/ship_event/payouts.rb
app/models/post/ship_event.rb
app/views/admin/payout_reviews/
app/views/projects/_ship_card.html.erb
```

Document the actual behavior for:

- review lifecycle and state transitions;
- rating criteria/dimensions, required reasons, and feedback text;
- reviewer assignment, required rating count, and missing-review handling;
- score aggregation, percentile calculation, tie/rounding behavior, and multiplier calculation;
- payout preview versus final/locked payout, including when the amount can change;
- outlier handling, abuse/collusion detection, and reviewer quality controls;
- admin overrides, audit history, re-review, appeals, and reopening;
- database models/relations/constraints and tests that establish intended behavior.

For every observed mechanic, choose `ADAPT`, `REIMPLEMENT`, `REFERENCE ONLY`, or `IGNORE` and explain why. Never use the vague decision “copy Stardance scoring.”

LOADOUT's scoring remains **Originality, Technical Depth, Execution, Documentation**. Its own quality assessment continues to feed its Bolt multiplier under canonical plan `02`. Use Stardance to learn implementation mechanics only; do not replace those dimensions or adopt Stardance's score formula or Rails architecture.

## Required UI comparison

Inspect:

- public landing
- auth/login
- account/settings
- participant dashboard
- project creation
- project page
- journals/devlogs
- submission flow
- reviewer/admin dashboard
- shop
- order/fulfillment UI
- FAQ/docs
- mobile behavior
- empty/loading/error states

The final UI must follow LOADOUT plans, not whichever source happens to look nicer.

---

# 6. Architecture rule

Pixl is the primary engineering codebase.

`ysws-template` is the general YSWS operations/infrastructure reference.

Stardance is the peer-review / quality-scoring / multiplier specialist reference. It is not an engineering base.

Do not combine frontend frameworks or backends merely to save a component. In particular, do not adopt Stardance's Rails architecture.

Prefer one coherent architecture.

When the sources conflict, choose in this order:

1. canonical LOADOUT behavior
2. stack compatibility
3. security/correctness
4. test quality
5. lower source-specific coupling
6. simplicity

If none of the sources fits, build a clean LOADOUT implementation.

Do not replace LOADOUT's canonical quality model with Stardance's. LOADOUT scores **Originality, Technical Depth, Execution, Documentation**, and the resulting LOADOUT quality assessment feeds its Bolt multiplier as defined in plan `02`. Use Stardance only to inform robust implementation mechanics such as peer review, aggregation, multiplier boundaries, and payout state.

---

# 7. Create the independent LOADOUT repository

LOADOUT must be an independent repository with fresh history, not a GitHub fork.

If `jeremy341/loadout` does not exist and GitHub authentication allows creation, create it.

If the repository already exists and contains nontrivial work, STOP before overwriting anything and report the conflict.

Create it under the personal account `jeremy341`, public unless the existing user/project configuration says otherwise. Do not create a temporary organization. Preserve the intended future transfer path to `hackclub/loadout` only if the YSWS is accepted and Hack Club approves the transfer.

Do not import Pixl's `.git` history.

---

# 8. Bootstrap from a clean Pixl source snapshot

Copy the tracked Pixl working tree into `loadout/`, excluding:

```text
.git
node_modules
.next
dist
build
coverage
local caches
temporary artifacts
real .env secrets
```

Before the first push:

- inspect all imported GitHub workflows
- do not activate Pixl-specific deployment workflows
- remove/disable/replace workflows that assume Pixl infrastructure
- inspect for hard-coded Pixl hosts, IDs, secrets, buckets, deployment targets, and org-specific assumptions
- scan for accidental credentials
- preserve required license files
- replace/add README attribution
- create `docs/source-audit/SOURCE_BASES.md`

The untouched reference clone is the source of anything removed during cleanup.

Initial commit message:

```text
chore: bootstrap LOADOUT from Pixl source snapshot
```

This bootstrap commit is allowed before branch protection is enabled.

---

# 9. Attribution

Add a clear README attribution section similar in meaning to:

```text
LOADOUT was initially bootstrapped from the open-source Pixl codebase
by Hack Club and has since been substantially modified for LOADOUT's
own product model, progression, economy, review workflows and interface.

The exact source commit and retained notices are documented in
docs/source-audit/.
```

Do not imply Pixl authors endorse LOADOUT unless they actually do.

If code is later adapted from the YSWS template, add its source/license basis to `ATTRIBUTION.md`.

---

# 10. Establish the branch workflow

Create the permanent branches:

```text
main
testing
development
```

All should begin from the same safe bootstrap commit.

Canonical flow:

```text
feature/fix/refactor/chore branch
        ↓ PR
development
        ↓ PR
testing
        ↓ PR
main
```

Normal work branches from `development`.

Supported prefixes:

```text
feature/*
fix/*
refactor/*
docs/*
experiment/*
chore/*
```

Do not develop directly on lane branches after bootstrap.

Do not merge feature branches directly to testing/main.

Either trusted maintainer may merge each PR in the canonical flow after the required checks pass. Reviews are welcome and recommended, but are optional and must not block the only maintainer currently available in a time zone.

---

# 11. GitHub protections and collaboration

The repository is user-owned (`jeremy341/loadout`), not organization-owned. A personal-account collaborator with write access can create/push branches, open/review/merge PRs, and work independently. The repository owner must perform owner-only tasks such as inviting collaborators and changing repository-wide settings. Invite `fazin-ahamed` with write permission. If the invitation is pending acceptance, record that state and continue the rest of the work.

For a public personal repository, configure protections/rulesets that do not create a lockout. The intended merge contract is: PR required, zero required approvals, required lane checks must pass, and no administrator/collaborator bypass. Do not require owner or CODEOWNER review, or approval of the latest push. Keep short-lived branches open to normal write access. A PR requirement on each exact permanent branch blocks direct updates to that branch while preserving collaborator pushes to feature branches.

Desired starting state:

## development

- PR required
- direct pushes disabled
- zero required human approvals
- required everyday CI checks
- no bypass for repository administrators or collaborators

## testing

- PR required
- direct pushes disabled
- zero required human approvals
- heavy CI/browser checks when available
- up-to-date requirement if practical
- no bypass for repository administrators or collaborators

## main

- PR required
- direct pushes disabled
- zero required human approvals
- force pushes disabled
- deletion disabled
- production checks required
- no bypass for repository administrators or collaborators

Both maintainers must be able to merge independently when all required checks pass. Optional human review is encouraged but must not become a required check or review gate.

Do not require an approval from Jeremy, from the repository owner, from a team, or from a CODEOWNER. Do not enable a setting that requires approval from someone other than the last person to push.

GitHub documents that personal repositories have only owner and collaborator permission levels; collaborators can merge PRs, while the owner retains repository-wide controls. GitHub also documents that branch restrictions limiting who may push are not available for user-owned repositories. Do not rely on that restriction: require PRs on the three permanent lanes and keep short-lived branches writable. For public repositories, protected branches/rulesets are available on GitHub Free; private-repository protections require a plan that supports them. Verify the actual repository visibility and available settings.

Use current GitHub guidance: [personal-account repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository), [protected branch availability and bypass settings](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), and [ruleset pull-request/approval behavior](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets). Recheck the account’s actual repository visibility and controls during setup.

If GitHub settings cannot be changed automatically, or the account plan/visibility prevents a desired rule, document the exact current state, limitation, and manual steps in both:

```text
docs/development/WORKFLOW.md
docs/development/BRANCH_PROTECTION_SETUP.md
```

Once CI checks have run successfully and are selectable in GitHub settings, mark the actual GitHub Actions checks as required for the corresponding lane. Select GitHub Actions as the expected source for a check when GitHub offers that option. Do not invent check names or claim that an unconfigured rule is active.

---

# 12. CI

Create a proportional CI system. Do not copy Poorup's project-specific test complexity.

For PRs into `development`, aim for:

```text
lint
typecheck
unit tests
build
```

For `development -> testing`:

```text
all normal checks
integration tests where present
database/migration tests where present
Playwright/browser smoke or QA
auth smoke
landing smoke
critical economy/shop tests once those systems exist
```

For `testing -> main`:

```text
build
critical smoke
tree/version consistency
required checks green
```

Human review is recommended before promotion to `main`, but must remain optional in GitHub settings. Either trusted maintainer may merge once all required checks pass.

Do not invent tests for systems that do not exist yet.

---

# 13. CodeScene

Integrate CodeScene if the repository/account can connect to it.

Follow the Poorup philosophy:

```text
NEW CODE MUST NOT MAKE THE PROJECT WORSE
```

But:

- focus analysis on the diff/touched functions
- never start broad "improve CodeScene score" refactors
- unrelated legacy hotspots require separate tasks
- CodeScene is a quality signal, not an autonomous refactoring mandate
- tests and human judgment remain authoritative

If the GitHub App cannot be installed/configured from the current environment, create:

```text
docs/development/CODESCENE_SETUP.md
```

with the required manual steps.

Never claim CodeScene is active unless it actually is.

---

# 14. First product implementation: public homepage

This original homepage implementation step is superseded by the amendment above. Do not implement a page in Prompt 01. After a separate redesign brief is supplied, scope a dedicated implementation task for the public-facing slice:

```text
PUBLIC LOADOUT HOMEPAGE
```

Read and follow:

```text
03_LOADOUT_UI_DESIGN_SYSTEM.md
06_LOADOUT_PUBLIC_HOMEPAGE.md
```

Use Pixl `apps/landing` as the primary engineering base.

Preserve useful implementation structure such as routing, SEO, image handling, deployment scaffolding, and responsive primitives where appropriate.

Completely replace Pixl's story/brand/content with LOADOUT.

Do not make the homepage look like Pixl with changed colors.

Do not make it look like the generic YSWS template.

---

# 15. Homepage design rules

The homepage must communicate:

```text
Build your own technical stack.
```

and the core loop:

```text
technical project
→ prove/ship
→ Track XP + global Bolts
→ Digital Loadout
→ Physical Loadout
→ harder build
```

Canonical fields:

```text
Tools
Systems
Compute
Hardware
```

Research appears only as `Research Mode`.

Visual direction:

```text
industrial field manual
+ pixel utility
+ technical parts catalog
```

Use:

- off-white technical canvas
- subtle grid
- graphite
- steel gray
- signal orange
- Bolt gold for Bolts
- pixel/block hero headings
- mono technical labels
- simple flat cards
- real project/product imagery where available
- restrained pixel builder art

Avoid:

- fake sheet metal
- rust
- rivets everywhere
- giant hazard stripes
- 3D bevels
- glassmorphism
- neon cyberpunk
- random gears
- AI-looking decorative clutter
- huge gradients
- military/weapons branding

The UI must be realistic for a developer to recreate and maintain.

---

# 16. Do not invent product facts

Do not invent:

- event dates
- sponsors
- stock
- reward prices
- country availability
- eligibility rules not present in the plans
- testimonials
- project statistics
- RSVP URLs
- Slack URLs
- fulfillment promises

If configuration is missing, use a clearly labeled placeholder/disabled state or omit the element.

---

# 17. Config

Audit the YSWS template's config JSON concept.

Create a LOADOUT-owned public config interface only if it improves the homepage and does not prematurely lock the architecture.

At minimum it may support:

```text
program name
tagline
join URL
login URL
GitHub URL
Slack URL
rules/FAQ URLs
optional dates
announcement
applications-open state
```

Do not blindly copy another project's config schema.

---

# 18. Testing the homepage

Before claiming completion:

- run install/build using the repository's chosen package manager
- run lint
- run typecheck
- run relevant tests
- run the landing page locally
- inspect desktop and mobile layouts
- test keyboard navigation
- test reduced-motion behavior where animation exists
- verify there is no obvious horizontal overflow
- verify no Pixl-specific public copy remains
- verify no references to Build/Research as old fifth tracks remain
- verify no real secret/config values were committed

If Playwright or existing browser tests are available, use them.

Do not claim checks pass without running them.

---

# 19. Documentation to produce

At minimum, leave the repository with:

```text
README.md

docs/source-audit/
  SOURCE_BASES.md
  FEATURE_MATRIX.md
  UI_MATRIX.md
  ARCHITECTURE_NOTES.md
  DECISIONS.md
  ATTRIBUTION.md

docs/development/
  WORKFLOW.md
  BRANCH_PROTECTION_SETUP.md
  CODESCENE_SETUP.md             # if any manual setup remains
```

`WORKFLOW.md` should document:

```text
short-lived branch → development → testing → main
```

so future human and AI contributors follow the same contract.

`BRANCH_PROTECTION_SETUP.md` must always record the actual lane protections, required check names, zero-approval policy, absence of bypasses, the account/plan limitations verified, and all remaining manual steps. Record `fazin-ahamed`’s write invitation as pending until GitHub confirms acceptance. Never imply collaborator access or protection is active until it has been applied and verified.

---

# 20. Scope boundary

Do NOT continue from the homepage into mass feature migration in this task.

Do not yet implement the full:

- participant dashboard
- Requisition backend
- full economy engine
- Custom Orders backend
- missions/seasons/community
- complex Slack bot
- entire YSWS template feature set

You may audit those systems and document future source decisions.

The purpose of this task is:

```text
CONTEXT
+ SOURCE AUDIT
+ SAFE REPO BOOTSTRAP
+ COLLABORATION WORKFLOW
+ PUBLIC HOMEPAGE
```

not "finish LOADOUT."

---

# 21. Stop conditions

Stop and ask rather than guessing if:

- `jeremy341/loadout` already contains meaningful conflicting work
- the supplied plans are missing or contradictory in a way that changes product behavior
- source licensing prevents a requested direct copy
- required GitHub authentication is unavailable
- creating/changing branch protections would lock out maintainers
- a destructive action would remove user work not created during this task
- you discover secrets or credentials that require human rotation
- the Pixl source has materially changed in a way that invalidates the migration plan

Pending acceptance of `fazin-ahamed`’s write invitation is not a stop condition. Continue independent bootstrap work and document the invitation state.

Otherwise, make reasonable engineering decisions and document them.

---

# 22. Final report

When finished, report:

1. Pixl source SHA
2. YSWS-template source SHA
3. Stardance source SHA
4. licensing conclusions for all accessible sources
5. GitHub repository created/used
6. branch state
7. CI/protection state
8. CodeScene state
9. audit files created
10. major KEEP/ADAPT/REIMPLEMENT decisions, including explicit Stardance `ADAPT` / `REIMPLEMENT` / `REFERENCE ONLY` / `IGNORE` choices
11. homepage files changed
12. commands/tests actually run and their results
13. remaining manual setup
14. recommended next migration slice

Also state that the repository remains personal-account-owned, whether `fazin-ahamed` has accepted the write invitation, who can merge each lane PR, whether direct pushes are blocked, and any personal-repository plan limitation. Do not claim collaborator access is active before acceptance.

Do not say "done" for anything you did not verify.
