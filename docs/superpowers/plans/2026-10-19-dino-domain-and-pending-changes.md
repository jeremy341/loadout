# Make dino.icu canonical and release pending LOADOUT changes

**Status:** Historical plan. `loadout.dino.icu` is already the canonical Production origin and the release has reached `main`. This original all-in-one PR sequence is superseded: the remaining local changes are being split into focused PRs for internal plans/source research, public guidance, and the share preview. Do not execute the combined checklist below as a new release.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to execute this plan task-by-task.

**Goal:** Release the pending LOADOUT Docs, plans, source-pin, and share-preview changes through the standard PR pipeline, make `https://loadout.dino.icu` the canonical production URL, and give the Vercel alias the same canonical preview behavior.

**Architecture:** Keep the current Next.js landing app. Use its configured `siteConfig.origin` for canonical and social metadata, point the production origin at the custom domain, and keep Vercel's default domain as a redirecting alias. Transfer only the current uncommitted changes to a clean branch based on the latest `origin/development`; the accessibility/CI commit already merged through PRs #117–#119 is not part of this change.

**Tech Stack:** Next.js 16, Bun, Playwright, GitHub Actions, Vercel, pinned Pixl/Stardance source references.

**Spec:** `.ulpi/design/share-preview.md`; `docs/superpowers/plans/2026-10-18-internal-docs-alignment.md`; `docs/superpowers/specs/2026-10-19-pixl-shell-platform-design.md`.

## Global Constraints

- Preserve the existing dirty checkout. Do not reset, clean, stash, or stage the old feature branch wholesale.
- PR #117 and its testing/main promotions (#118/#119) are already merged; do not resubmit the merged accessibility/CI commit.
- DNS PR #3861 is merged; Vercel already reports `loadout.dino.icu` as valid for Production and HTTPS currently loads. No DNS changes are planned.
- PR #117 is merged through testing/main (#118/#119), and GitHub currently reports no open LOADOUT PRs. Do not repeat that release.
- Public copy now uses the approved 13–18 age range; the public-copy changes are being kept separate from the internal plan/source update.
- Set the canonical site origin to `https://loadout.dino.icu` in Production. Keep the existing indexing permission unchanged; domain setup alone does not authorize indexing.
- Retain the Vercel hostname as an alias that redirects to the custom domain after the new Production deployment is ready.
- Preserve the full set of current documentation, source attribution, logo source files, share-image generator, and the Stardance pin update. Do not edit files inside a reference submodule.
- Do not post a Slack message as part of verification. Slack may retain cached unfurls for old messages; a new share preview can be verified without altering existing messages.
- Do not edit an external Rivet repository/config as part of this batch; update only LOADOUT's local handoff with the new canonical address and keep the external sync as a follow-up.

## Review Focus

- `metadataBase`, canonical URL, `og:url`, `og:image`, and `twitter:image` must resolve to the custom production domain and the same 1200×630 image.
- Slack can cache an unfurl separately for each URL; matching server metadata may not rewrite an old Vercel preview already stored in a message.
- Active production links in the README, release summary, ship helper, and current workflow/deployment docs must use dino.icu; dated evidence must remain historically accurate.
- Public Docs and internal plans must agree on the approved review/economy decisions; preserve the explicitly deferred age-copy change.
- The Stardance submodule pointer and its attribution/source-base records must agree with the reviewed commit.

---

### Task 1: Prepare an isolated release branch from current development

**Files:**
- Source: current dirty checkout on `feature/accessibility-quality-and-ci`
- Destination: a fresh worktree/branch based on the latest `origin/development`

**Interfaces:**
- Consumes: current uncommitted tracked diff, nine current untracked files, and the latest fetched `origin/development`.
- Produces: a clean feature branch containing only the reviewed pending change set.

- [ ] **Step 1: Refresh references and confirm lane state**

Run: `git fetch origin`

Expected: `origin/development`, `origin/testing`, and `origin/main` are current; PR #117 remains the already-merged baseline.

- [ ] **Step 2: Capture the pending changes without modifying the source checkout**

Record `git diff --binary`, the exact untracked path list, the Stardance submodule pointer, and hashes for the changed social-preview images. Preserve the original checkout unchanged.

- [ ] **Step 3: Create a clean worktree from `origin/development`**

Create a short-lived branch named `feature/dino-canonical-and-content-refresh` from the fetched development head. Transfer the captured tracked patch and only the inventoried untracked files; do not copy old branch commits that are already in development.

- [ ] **Step 4: Compare the new worktree against the source inventory**

Run `git status --short`, `git diff --stat`, and `git diff --name-status` in the new worktree. Expected: only the pending Docs/plan/reference/social-preview changes listed in Task 4, plus the canonical-metadata changes in Task 2.

### Task 2: Make custom-domain metadata consistent

**Files:**
- Modify: `apps/landing/app/layout.tsx`
- Modify if needed: `apps/landing/app/site-config.ts`
- Modify: `apps/landing/app/site-config.test.ts`
- Modify: `apps/landing/e2e/homepage.spec.ts`
- Reuse: `apps/landing/app/opengraph-image.jpg`, `apps/landing/app/twitter-image.jpg`, and their `.alt.txt` files

**Interfaces:**
- Consumes: `siteConfig.origin` from `NEXT_PUBLIC_LOADOUT_SITE_URL`.
- Produces: canonical and share metadata that identify `loadout.dino.icu` in Production and use one consistent image.

- [ ] **Step 1: Add a focused metadata assertion**

Extend the site-config/unit coverage and homepage browser assertion to check the configured canonical origin, `og:url`, `og:image`, `twitter:card`, and `twitter:image`; the Open Graph and Twitter images must use the same intended 1200×630 share asset.

- [ ] **Step 2: Run the focused test to establish the expected failure**

Run the targeted `bun test` case and the relevant Playwright test. Expected: the test identifies any missing or inconsistent canonical/share metadata before implementation.

- [ ] **Step 3: Implement metadata from the configured origin**

Set the root canonical and `og:url` from `siteConfig.origin`; keep image references consistent with the checked-in Open Graph/Twitter image routes. Preserve preview `noindex` behavior and do not change `LOADOUT_ALLOW_INDEXING`.

- [ ] **Step 4: Run the focused tests**

Run the targeted site-config unit test and homepage metadata test. Expected: canonical/OG URLs resolve to the configured origin and both social tags identify the same image.

### Task 3: Promote dino.icu as the production URL in active references

**Files:**
- Modify: `README.md`
- Modify: `apps/landing/scripts/docs-release-summary.ts`
- Modify: `scripts/ship.ps1`
- Modify: `docs/development/WORKFLOW.md`
- Modify: `docs/development/vercel-preview.md`
- Modify: `docs/development/deployment-and-rollback.md`
- Review/update with a dated follow-up: `docs/development/rivet-handoff.md`
- Preserve as dated historical evidence: `docs/development/branch-protection-setup.md`

**Interfaces:**
- Consumes: `https://loadout.dino.icu/` as the new stable Production origin.
- Produces: current internal links and release tooling that direct users to the custom domain while preserving historical records.

- [ ] **Step 1: Replace active stable-URL references**

Update current README, Docs-release summary, ship-helper output, workflow, Vercel guide, and rollback instructions to use dino.icu. Keep dated observations as history and add a current note where the old domain is recorded as a historical state.

- [ ] **Step 2: Search for remaining active Vercel URLs**

Run `rg -n "loadout-ysws\.vercel\.app"` across the repository. Expected: any remaining matches are explicitly historical, or are intentional redirect/source references documented as such.

### Task 4: Integrate the current Docs, plans, preview assets, and reference update

**Files:**
- Preserve and include the current pending internal alignment in `.ulpi/design/`, `PRODUCT.md`, `plans/`, `docs/source-audit/`, `docs/development/repository-inventory.md`, and `docs/superpowers/plans/2026-10-18-internal-docs-alignment.md`.
- Preserve and include the current public Docs edits in `content/docs/eligibility.md`, `faq.md`, `progress.md`, `review.md`, and `start.md`.
- Preserve and include the social-preview brief and assets in `.ulpi/design/share-preview.md`, `assets/editable/logo/`, `apps/landing/app/opengraph-image*`, `apps/landing/app/twitter-image*`, `docs/design/asset-catalog.md`, and `docs/design/system/design-system.md`.
- Preserve and include the current Pixl shell/backend design proposal in `plans/proposals/future-platform-ui.md` and `docs/superpowers/specs/2026-10-19-pixl-shell-platform-design.md` as a draft requiring owner review.
- Include this release plan at `docs/superpowers/plans/2026-10-19-dino-domain-and-pending-changes.md` as the internal execution record.
- Preserve and include `references/README.md` and the `references/stardance` submodule pointer update.

**Interfaces:**
- Consumes: the already-reviewed dirty worktree changes; Plans 01/02/11/15/22 remain policy authorities.
- Produces: a single coherent pending-change PR without repeating the merged accessibility/CI release.

- [ ] **Step 1: Inspect the staged scope by topic**

Group the diff into public Docs, internal policy/source records, Pixl/platform proposal, and social-preview artwork. Confirm each group contains only the current owner-approved changes and the preview asset sources needed to reproduce the images.

- [ ] **Step 2: Verify the generated preview assets**

Run `pwsh -File assets/editable/logo/build-share-preview.ps1` from the repo root, then confirm the exported Open Graph and Twitter files are byte-identical, 1200×630, and under 300 KB. Confirm the supplied logo and editable source crops are included.

- [ ] **Step 3: Check the reference pointer and attribution**

Run `git -C references/stardance rev-parse HEAD` and `git submodule status references/stardance`. Expected: `d889f39060a443476a88b98a87d5088033626eff`, with the matching source-base and attribution records.

### Task 5: Run local verification and open one feature PR

**Files:**
- All explicit files inventoried in Tasks 1–4.

**Interfaces:**
- Consumes: the reviewed clean feature branch.
- Produces: one PR from the feature branch into `development` with a complete verification summary.

- [ ] **Step 1: Run repository and landing checks**

Run `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run test:e2e`, and `git diff --check` from the repository root. Expected: all commands pass; record exact outputs and any environment-specific limitations.

- [ ] **Step 2: Review the final diff**

Confirm only the planned content, reference, canonical metadata, release-link, and share-preview files are changed. Stage explicit paths only; do not use `git add -A`.

- [ ] **Step 3: Create one development PR**

Use title `Set dino.icu canonical and refresh LOADOUT content/share preview`. Include a summary of Docs/plan alignment, share-image changes, the Stardance pin, and the canonical-domain metadata. State that PR #117 is already merged and not included. Target `development`.

- [ ] **Step 4: Wait for the development checks**

Required checks per `.github/required-checks.json`: `Repository integrity`, `Landing quality`, and `Promotion lane`. Since `content/docs/` and `apps/landing` are touched, expect the landing checks to run. Fix failures on the feature branch; do not bypass checks.

### Task 6: Set the Production canonical domain and complete the promotion pipeline

**Files/settings:**
- Vercel project `jerry-team1/loadout-ysws`, Production environment and domain settings.
- The active URL documentation listed in Task 3.

**Interfaces:**
- Consumes: a check-green and merged development PR; existing Vercel-verified `loadout.dino.icu` DNS/TLS.
- Produces: Production metadata and default project links that use dino.icu, with the Vercel hostname redirecting to it.

- [ ] **Step 1: Set the Production origin before the release build**

Set `NEXT_PUBLIC_LOADOUT_SITE_URL=https://loadout.dino.icu` for Vercel Production only. Preserve the current `LOADOUT_ALLOW_INDEXING` value and all preview noindex behavior.

- [ ] **Step 2: Promote through testing**

Open the normal development-to-testing promotion PR and merge with the required checks green. Verify `Repository integrity`, `Landing quality`, `Landing browser`, and `Promotion lane`.

- [ ] **Step 3: Release through main**

Open the normal testing-to-main release PR and merge with all required checks green. Confirm Vercel reports the main deployment Ready before changing the Vercel alias behavior.

- [ ] **Step 4: Make the custom host primary**

In Vercel, keep `loadout.dino.icu` on Production and configure `loadout-ysws.vercel.app` to redirect to the custom domain if the project settings support that redirect. Do not remove the existing alias without confirming redirect behavior.

- [ ] **Step 5: Verify deployed metadata and links**

Check HTTPS on `https://loadout.dino.icu/`, canonical URL, `og:url`, both image tags, image content/dimensions, and the Vercel-host redirect. Confirm README/release scripts point to dino.icu. Note that existing Slack previews can remain cached; no Slack message edits or posts are included without separate authorization.

## Execution Notes

- No changes have been pushed from the current dirty checkout. The custom domain and TLS already work; the DNS PR needs no follow-up.
- The share preview's content and metadata can be made consistent in the site. Slack's cached unfurl for an already-posted Vercel link may continue to show the older image; testing a fresh unfurl is separate from changing or sending a Slack message.
- Recommended execution method: native sequential implementation. The content/assets can be prepared together, but branch preparation, production configuration, and promotions have ordering dependencies and should pass through one integration/review gate.
