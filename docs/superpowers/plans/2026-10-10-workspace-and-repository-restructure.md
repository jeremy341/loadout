# LOADOUT Workspace and Repository Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Each step uses checkbox syntax and has a verifiable result.

**Goal:** Organize the local LOADOUT workspace and canonical repository into clear homes for worktrees, assets, public and internal docs, product plans, and pinned source references while preserving user work and published behavior.

**Architecture:** Keep `loadout/` as the canonical repo path and move its five other worktrees under the parent `worktrees/` folder with Git worktree commands. Reorganize LOADOUT-owned assets, plans, and docs in this branch from current `development`; preserve upstream submodules and public URLs, and keep a one-time parent plan snapshot.

**Tech Stack:** Git worktrees and GitHub PR lanes; PowerShell for workspace moves/inventory; Markdown; Next.js and Bun for asset path updates and repository checks. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-10-workspace-repository-restructure-design.md`

## Global Constraints

- Repository changes start from current `development` on `chore/workspace-repo-restructure`.
- Keep the existing `loadout/` canonical checkout path fixed.
- Preserve the dirty `loadout/` and `hero-workshop-background/` worktrees and do not import unrelated homepage/UI changes from them.
- Preserve the separate pinned `references/pixl`, `references/stardance`, and `references/ysws-template` submodules without editing or renaming their contents or paths.
- Preserve all remote branches, tags, pull requests, public Docs URL slugs, and useful existing heading anchors.
- Website-served images have one canonical copy in `apps/landing/public/loadout/`; future unapproved assets stay in `assets/inbox/` and are not imported by the app.
- Do not delete a file until its unique information, inbound links, tracked state, and canonical replacement have been checked.
- Keep user-authored scratch notes; retain generated/runtime caches in `.tmp/` as specified in the design.
- Homepage appearance and behavior remain fixed; only asset path/name edits required to serve the same images are in scope.
- Promotion uses temporary branch → PR to `development` → promotion PR to `testing` → promotion PR to `main`.

## Review Focus

- User artwork with ambiguous names must be visually identified before renaming; verify the old and new image hashes and rendered asset mapping.
- Names that are duplicated across a worktree and a source folder are not duplicate removals until the retained app path is active and the source is recorded in the asset catalog.
- `content/docs/` is public; no internal plans, workflow text, source audits, or private notes may enter public content or search.
- Reference-submodule paths and SHAs must remain unchanged after workspace moves and repo renames.
- The original dirty worktrees must have the same files and Git status after every move/copy stage.

---

## Task 1: Refresh the file disposition manifest

**Files:**
- Read: parent `LOADOUT_WORKSPACE_FILES.csv`, `LOADOUT_DUPLICATE_GROUPS.csv`, `LOADOUT_WORKSPACE_AUDIT.md`
- Read: repository `plans/` (currently `PLAN/`), `.ulpi/design/`, `docs/`, `content/docs/`, `references/README.md`, `docs/design/references/README.md`
- Create: `docs/development/restructure-manifest.md`

**Interfaces:**
- Consumes: the inventory artifacts and current source from `origin/development`.
- Produces: a row for each LOADOUT-owned file to keep, move, rename, rewrite, merge, or delete; rows include current path, destination/canonical owner, reason, and verification needed.

- [ ] **Step 1: Record branch and checkout baselines**

Run:

```powershell
git status --short --branch
git worktree list --porcelain
git submodule status
```

Expected: implementation checkout is clean at current `development`; the original `loadout/` and `hero-workshop-background/` checkouts remain dirty and separate; the three submodule SHAs match `references/SOURCE_BASES.md`.

- [ ] **Step 2: Compare exact local/remote duplicate groups**

For each candidate, record all paths and mark whether copies are across worktrees, inside an upstream submodule, an intentional source/runtime pair, or a redundant LOADOUT-owned copy. Hashes alone do not authorize deletion.

- [ ] **Step 3: Build the disposition manifest**

Include every parent asset and note, all authored Markdown in `PLAN/`, `docs/`, `.ulpi/design/`, and all renamed public image paths. Record specific merge destinations for completed plan/brief decisions and separate the current `content/docs/` pages from internal docs.

- [ ] **Step 4: Check links and user content in the manifest**

Verify each proposed deletion has a canonical owner and no unique information; verify the remaining three old homepage variants are classified as keep; verify no reference-submodule file is a mutation candidate.

Expected: manifest has no unresolved keep/delete ambiguity; no files have been moved or deleted in this task.

- [ ] **Step 5: Commit the manifest**

```powershell
git add docs/development/restructure-manifest.md
git commit -m "Record workspace and repository file dispositions"
```

## Task 2: Organize parent workspace paths without losing work

**Files:**
- Move with Git: `docs-participant-manual/`, `docs-refresh/`, `docs-scrollbar-chrome/`, `hero-workshop-background/`, `homepage-refresh-full/` → `worktrees/`
- Move: root `LOADOUT_WORKSPACE_AUDIT.md`, `LOADOUT_WORKSPACE_FILES.csv`, `LOADOUT_DUPLICATE_GROUPS.csv` → `reports/inventory/`
- Move: parent `PLAN/` → `planning/PLAN-snapshot/` only after it is reconciled in Task 7
- Move: human notes/captures from `.tmp/` → `scratch/notes/` only after validating each destination
- Preserve: generated/runtime files under `.tmp/`

**Interfaces:**
- Consumes: Task 1's approved source/destination map.
- Produces: a tidy parent workspace with `loadout/` unchanged and every worktree still registered to the same branch and commit.

- [ ] **Step 1: Create destination directories**

Create `reports/inventory/`, `scratch/notes/`, `planning/`, and `worktrees/` only if absent. Resolve each absolute path and verify it is inside `C:\Users\jerem\Documents\LOADOUT` before use.

- [ ] **Step 2: Move the four clean secondary worktrees**

From the workspace root, use the Git-aware move command for `docs-participant-manual`, `docs-refresh`, `docs-scrollbar-chrome`, and `homepage-refresh-full`. For example:

```powershell
git -C C:\Users\jerem\Documents\LOADOUT\loadout worktree move C:\Users\jerem\Documents\LOADOUT\docs-participant-manual C:\Users\jerem\Documents\LOADOUT\worktrees\docs-participant-manual
```

Repeat with each exact source/destination pair. After each move, check the new checkout's status, HEAD SHA, branch name, and `git worktree list`.

- [ ] **Step 3: Move the dirty hero worktree intact**

Use the Git-aware move from `C:\Users\jerem\Documents\LOADOUT\hero-workshop-background` to `C:\Users\jerem\Documents\LOADOUT\worktrees\hero-workshop-background`. Compare its complete pre-move and post-move status, branch, HEAD, untracked file list, and selected PNG hashes. Do not edit or clean its files.

- [ ] **Step 4: Move the inventory reports**

Move the three inventory outputs to `reports/inventory/`; confirm row counts, file sizes, and hashes match before/after.

- [ ] **Step 5: Move human scratch notes and captures**

Use the manifest to move only the listed authored notes/captures from `.tmp/` into `scratch/notes/`. Keep generated caches and runtime temporary files in `.tmp/`.

- [ ] **Step 6: Verify workspace layout and worktrees**

Run `git worktree list --porcelain` and compare branch, HEAD, status, and ignored/untracked user files against the Task 1 baseline. Expected: all six prior worktrees remain present; only their parent paths changed, and no branch refs changed.

## Task 3: Consolidate and catalog LOADOUT-owned artwork

**Files:**
- Move/copy from parent `New homepage designs/` and loose image files according to `docs/development/restructure-manifest.md`
- Create: `assets/README.md`, `docs/design/ASSET_CATALOG.md`
- Move final used images to `apps/landing/public/loadout/hero/`, `icons/`, or `sprites/`
- Move editable masters to `assets/editable/`; unapproved images to `assets/inbox/`; distinct old variants to `assets/archive/homepage-variants/`
- Modify: app components/CSS that refer to renamed website assets

**Interfaces:**
- Consumes: asset map in Task 1 and current hero source files in the dirty hero worktree.
- Produces: one app path per live asset; a human-readable asset catalog; no homepage visual or motion change.

- [ ] **Step 1: Create asset directories and ownership notes**

Create the `assets/` and public subdirectories from the spec. `assets/README.md` defines inbox review, editable-source ownership, promotion into public assets, and the rule against keeping identical live exports in both locations.

- [ ] **Step 2: Visually label user-supplied artwork**

Use the sprite-sheet index and visual contents to map the icon source PNGs, Rivet artwork, clouds, stripes, industrial structures, platforms, workstations, Aseprite files, and reference mockups. Keep ambiguous source names unchanged until they have a verified semantic label.

- [ ] **Step 3: Import only authorized assets from the dirty hero worktree**

Copy listed PNGs and source masters to the implementation worktree; never move them out of `hero-workshop-background/`. Compare SHA-256 hashes. Exclude unrelated component, styling, and page changes.

- [ ] **Step 4: Assign canonical locations and names**

Place website-used assets only in `apps/landing/public/loadout/`. Place source sheets and `.ase` masters under `assets/editable/`. Place visual-only screenshots under `docs/design/references/`. Retain unique older variants under `assets/archive/homepage-variants/`.

Use lowercase kebab-case. Verify the examples in the spec against visual content before applying each rename. Preserve the bytes of user-provided images.

- [ ] **Step 5: Update image references without changing behavior**

Update only paths in TSX, CSS, Markdown, and asset catalogs. Preserve the current SVG bolt artwork and existing icon designs. Keep component composition, animation, color, positioning, and responsive behavior unchanged.

- [ ] **Step 6: Verify asset references and visual parity**

Search for every old filename/path. Confirm each used asset returns at its new path, all references resolve, and the local homepage shows the same images in the same places. Remove a source duplicate only after the retained app file is committed in this branch and verified.

## Task 4: Rename and reconcile the canonical plan library

**Files:**
- Rename: `PLAN/` → `plans/`
- Rename surviving numbered plan files to lowercase kebab-case while preserving numeric IDs
- Rewrite: `plans/00-canonical-index.md`
- Merge/rewrite: master plan, `PLAN/README.md`, `PROMPT_00`, `PROMPT_01`, and completed plan records as mapped in Task 1
- Modify: every Markdown link, AGENTS rule, workflow instruction, README, docs index, and design brief pointing to plan paths

**Interfaces:**
- Consumes: Task 1 disposition manifest; current `development` plans plus explicitly reconciled doc-only drafts from the original dirty checkout.
- Produces: one canonical numbered plan set with current owner/status, stable plan IDs, and no stale links.

- [ ] **Step 1: Reconcile dirty plan drafts**

Diff the original dirty `loadout/PLAN/` files against this branch and current `development`. Apply only authorized plan/document changes. Do not copy website app files or UI implementation changes.

- [ ] **Step 2: Create the target `plans/` tree and move retained plans**

Preserve numeric IDs. Use the manifest's exact new filenames. Keep canonical product and economy owners, Plan 05, Plan 06, Plan 08, Plan 11, Plan 15, unresolved Plan 17, and Plan 18 until its completion state has been verified.

- [ ] **Step 3: Reconcile completed plans before retiring candidates**

Transfer unique decisions from Plans 03, 04, 07, 09, 10, 12, 13, 14, and 16 to their canonical docs/plans. Replace the master plan with a concise history/index. Extract durable prompt guidance from `PROMPT_00` and `PROMPT_01`. Retire only files marked delete in the reviewed manifest.

- [ ] **Step 4: Update all plan path references**

Search LOADOUT-owned Markdown, AGENTS, app docs, workflow files, and `.ulpi/design/` for `PLAN/`, old filenames, and old headings. Update links and anchors. Leave reference submodule content untouched.

- [ ] **Step 5: Verify plan links and canonical owners**

Run repository Markdown link checks and inspect every `plans/` link. Confirm IDs and page slugs referenced by public content remain unchanged.

## Task 5: Simplify internal docs and design references

**Files:**
- Modify/rename files in `docs/development/`, `docs/source-audit/`, and `docs/design/`
- Modify: `docs/README.md`, `AGENTS.md`, `README.md`, `PRODUCT.md`, `.ulpi/design/DESIGN.md`
- Merge or delete only files designated in the disposition manifest
- Preserve: `content/docs/*.md`, `references/README.md` submodule SHAs, and the source repositories themselves

**Interfaces:**
- Consumes: canonical plans from Task 4 and final asset paths from Task 3.
- Produces: audience-specific internal Docs with a clear authority map, descriptive names, one full contributor workflow, and current integration/source facts.

- [ ] **Step 1: Establish documentation authority and index**

Rewrite `docs/README.md` to map public content, workflow, setup, architecture, design system, plans, source audit, deployment/integrations, and Rivet handoff by audience, owner, and status.

- [ ] **Step 2: Consolidate contribution rules**

Keep one full `docs/development/WORKFLOW.md`. Merge useful content from `HUMAN_AND_AI_WORKFLOW.md`, update `AGENTS.md` to link to authoritative workflow and design system, and remove the duplicate guide only if its lasting instructions are transferred.

- [ ] **Step 3: Consolidate overlapping source-audit records**

Compare line-by-line before combining the feature/UI matrices and public-site port/assets/motion records. Retain source pins, licensing, attribution, and reuse decisions as focused owner files. Preserve any unique evidence and dates.

- [ ] **Step 4: Set one design-system source**

Move/rename the canonical design-system content to `docs/design/system/`. Keep `.ulpi/design/DESIGN.md` as the tool-compatible entrypoint pointing to the canonical file. Transfer unique rules from Plan 03 and the root `LOADOUT_DESIGN_SYSTEM.md` before deleting or replacing duplicate copies.

- [ ] **Step 5: Rename LOADOUT-owned Markdown files**

Convert retained internal Markdown filenames to lowercase kebab-case. Keep tool- and convention-defined filenames such as `AGENTS.md`, `README.md`, and `.ulpi/design/DESIGN.md`. Update all inbound links and anchors in the same commit.

- [ ] **Step 6: Refresh only verified operational facts**

Use current GitHub/local evidence for workflow, deployments, integrations, coverage, and Rivet status. Keep secrets out of docs. Do not change GitHub settings, Slack channel setup, Vercel, CodeScene, Codecov, or bot runtime.

- [ ] **Step 7: Verify docs audiences and links**

Check that only `content/docs/` enters the public renderer/search. Run Markdown-link checks; verify references, plan links, code paths, image links, and public Docs routes after renames.

## Task 6: Refresh parent snapshots and remove only reviewed copies

**Files:**
- Copy canonical `plans/` to parent `planning/PLAN-snapshot/` as a one-time snapshot with a canonical-source notice
- Remove parent source-art copies only when the repository destination is confirmed
- Preserve unique artwork variants, PR notes, dirty worktrees, caches, and source-submodule contents

**Interfaces:**
- Consumes: final canonical plan and asset trees from Tasks 3–5.
- Produces: the approved parent snapshot and no redundant parent copies of promoted assets.

- [ ] **Step 1: Build the parent PLAN snapshot**

Reconcile differences and the compatibility prompt first. Copy the final repository plan set into `planning/PLAN-snapshot/`, write the repo-canonical notice, and verify per-file hashes against `loadout/plans/`.

- [ ] **Step 2: Remove only promoted exact art copies**

For each source copy, confirm the app/repository target exists, compare hashes, verify the target is tracked, and record its new path in `docs/design/ASSET_CATALOG.md`. Then remove only the verified parent duplicate. Keep differing old artwork and design references.

- [ ] **Step 3: Finalize workspace organization**

Move remaining reviewed user-authored notes and reports to their parent destinations. Keep `.tmp/` generated/runtime files. Rebuild the workspace inventory and compare retained paths, sizes, and hashes to the pre-move inventory.

## Task 7: Validate, commit, and promote through the PR lanes

**Files:**
- All paths in Tasks 1–6
- No upstream submodule file changes

**Interfaces:**
- Consumes: completed workspace/repository changes.
- Produces: reviewed logical commits on the short-lived branch, then promotion PRs through the existing protected lanes.

- [ ] **Step 1: Review the complete changed-path list**

Run `git status --short`, `git diff --stat`, and `git diff --name-status`. Confirm no `.env`, credentials, dependency folders, generated caches, unexpected UI changes, or submodule diffs are staged.

- [ ] **Step 2: Validate paths, metadata, and links**

Run the repository's Markdown/Docs validation commands and image/path checks. Verify public Docs slugs and anchors, submodule status, asset catalog coverage, parent plan snapshot equality, and unchanged protected branches.

- [ ] **Step 3: Run repository checks**

```powershell
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
```

Expected: each command exits successfully. If a command fails, record the exact failure and fix only issues in this change.

- [ ] **Step 4: Review visual parity for the asset-only paths**

Run the app and compare the homepage before/after at desktop and mobile sizes. Confirm no section layout, color, animation, or behavior changed.

- [ ] **Step 5: Create natural, focused commits**

Separate workspace/docs inventory and policy, asset reorganization/path updates, plan/docs consolidation, and workspace snapshot changes into reviewable commits. Keep all commits on `chore/workspace-repo-restructure`.

- [ ] **Step 6: Open the PR to development and follow promotion checks**

Open a PR from the short-lived branch to `development`; wait for required checks and review. Promote the exact passing changes with PRs to `testing` and then `main`. Verify the final GitHub tree and deployed Docs/homepage. Do not force-push or delete remote branches.

## Commit sequence

1. `Record workspace and repository file dispositions`
2. `Organize workspace asset and report paths`
3. `Move website art into canonical asset folders`
4. `Rename and consolidate canonical plans`
5. `Clarify internal docs and reference ownership`
6. `Refresh parent plan snapshot`
