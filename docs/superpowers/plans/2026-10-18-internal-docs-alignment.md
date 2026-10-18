# LOADOUT Internal Docs Alignment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile authored internal Markdown with the current LOADOUT website, public Docs draft, and GitHub Actions promotion pipeline.

**Architecture:** Keep each topic with its existing owner. Update entrypoints and indexes to point to those owners, and keep unresolved proposals marked as proposals. Treat the current website and public Docs as draft references, not proof that a service is live.

**Tech Stack:** Markdown, Git, GitHub Actions, Next.js Docs source.

**Spec:** User request in this task; source references are `apps/landing`, `content/docs`, `.github/workflows/ci.yml`, `.github/scripts/`, and `scripts/ship.ps1` on `origin/development` at `fc37ebe`. The owner later authorized combining the mobile accessibility follow-up with the internal-doc changes and shipping through development → testing → main.

## Global Constraints

- Base work on `origin/development` at `fc37ebe`; the owner authorized a combined branch, commit, PR, and promotion through testing to main.
- Preserve all changes in other checkouts. Do not edit `content/docs/`, third-party references, workflow code, or external service settings.
- Carry the approved accessibility changes from the mobile-accessibility worktree into the combined branch; preserve its generated cache and `next-env.d.ts` edits outside the branch.
- Internal age policy is 13–18. The public site currently says 13–19; record the pending correction without changing public copy in this pass.
- Publish draft numbers only as provisional examples or proposed rules; do not turn an open formula or operational detail into approved policy.
- Do not claim current branch-protection settings where the detailed GitHub readback is unavailable; label the last verified snapshot.

## Review Focus

- Public proposal values versus final launch rules: label each as proposed, agreed, or open.
- Peer review: team eligibility check precedes peer ratings; review operations and XP math remain open.
- CI skips: distinguish docs-only detection from evidence-backed browser-suite skips.
- Branch protection: separate workflow policy, observed checks, and unverified live protection settings.
- Case-sensitive Markdown paths: use exact tracked filename casing.

---

### Task 1: Product and public-scope owners

**Files:** `AGENTS.md`, `PRODUCT.md`, `plans/00-index.md`, `plans/02-economy-and-rewards.md`, `plans/06-public-homepage.md`, `plans/11-eras-and-community-progression.md`, `plans/15-loadout-irl-ruhr.md`, `plans/17-homepage-visual-clarity.md`, `plans/21-credibility-follow-through.md`, `plans/22-peer-review-and-multipliers.md`, `plans/23-less-vibed-pass-two.md`, `plans/proposals/economy-calibration.md`.

- [x] Align the internal current-draft facts: ages 13–18; tracks Tools, Systems, Compute and Hardware; Research Mode is a modifier; quality dimensions are Originality, Technical Depth, Execution and Documentation; a reviewed ship pays at a 5×–20× multiplier (10× = 10 Ore per approved hour); 15 lifetime levels with LV.15 at 3,500 XP/about 350 solid hours; permanent track discount up to 20%; Requisitions at LV.3/6/9/12/15 each grant one use of 20% off a matching prize's base price from 400 Ore, on top of the level discount; planned Era bonus is +10% of base Ore; the IRL concept is a proposed three-day Friday–Sunday build weekend in Germany's Ruhr area. Keep unresolved launch conditions and operational details marked open.
- [x] Mark the 13–19 public copy as a pending correction; do not edit `content/docs/` in this pass.
- [x] Reconcile the user-authored peer-review clarification from the dirty `loadout` checkout into Plan 02 without importing its unrelated public-copy drafts.
- [x] Keep the intermediate XP equation, aggregation/rounding, reviewer operations, exact event date/venue, prize stock, and launch/fulfillment details explicitly open. Treat listed prize prices as working examples, not final promises.
- [x] Correct Plan 21's current age summary and mark the 2026-10-15 calibration file as a dated snapshot governed by Plan 02.
- [x] Align the still-open homepage proposal's Requisition flow with Plan 02 without authorizing implementation.

### Task 2: Contributor workflow and operational records

**Files:** `AGENTS.md` (case-sensitive source-decisions link only), `docs/development/WORKFLOW.md`, `docs/development/branch-protection-setup.md`, `docs/development/quality-integrations.md`, `docs/development/content-authoring.md`, `docs/development/ARCHITECTURE.md`, `README.md`, `docs/README.md`, `apps/landing/app/docs/README.md`.

- [x] Match workflow prose to the current CI: `app-changed.sh` ignores only `docs/`, `plans/`, `.ulpi/`, `assets/` and root `README.md`, `AGENTS.md`, `PRODUCT.md`, `LOADOUT_DESIGN_SYSTEM.md`, `LICENSE`; Landing quality reruns when app files change; browser shards total five jobs with one stable `Landing browser` aggregator; a browser run skips only when the exact source-lane commit has recorded successful `Landing browser` checks; the Playwright container marks its checkout as safe before Git checks. The fast-lane script uses PRs for both promotions. Record current observed promotion commits: development `fc37ebe`, testing `8b6e747`, main `2c642a9`.
- [x] Keep detailed branch-protection configuration marked with its last verified date; record that live settings could not be freshly read on October 18. Do not present workflow rules as verified enforcement.
- [x] Correct case-sensitive internal links and keep public-content ownership and renderer boundaries unambiguous. Explicitly say that internal `docs/`-only changes may skip app checks, while `content/docs/` changes still run them.
- [x] Keep public authoring guidance on the internal 13–18 age policy and note that existing public 13–19 copy is pending correction.

### Task 3: Design and source notes

**Files:** `.ulpi/design/README.md`, `.ulpi/design/homepage-visual-clarity.md`, `.ulpi/design/docs-connected-prose.md`, `.ulpi/design/mobile-accessibility-color-vision.md`, `docs/design/system/design-system.md`, `docs/design/asset-catalog.md`, `docs/source-audit/DECISIONS.md`, `docs/source-audit/ATTRIBUTION.md`, `docs/source-audit/source-bases.md`, `docs/source-audit/reference-comparison.md`, `docs/source-audit/landing-port-and-assets.md`.

- [x] Document the mobile accessibility follow-up's optional controls and default-off behavior; align the current design system with the implementation.
- [x] Record the Phantom Sans WOFF2 provenance from Pixl's live site without asserting a license grant not present in the repo. Align Ore naming, 13–18 age policy and other current feature descriptions where those files claim present implementation facts.
- [x] Preserve third-party reference limits and historical records. Correct current statements, and label earlier Bolts/13–19 implementation notes as historical rather than rewriting unrelated reference research.
- [x] Update the active homepage proposal's currency labels to Ore and align the design index with current accessibility brief status on the feature branch.

### Task 4: Validation and handoff

- [x] Review each changed section against current code, plans, and the recorded age decision.
- [x] Run `git diff --check`; audit changed Markdown links, case, and stale contradictions.
- [x] Leave public Docs unchanged and report the 13–19 public-copy follow-up, the unverified protection settings, and exact files changed.
