# LOADOUT workspace and repository restructure

## Status and purpose

Design for owner review before implementation. The goal is to make the LOADOUT workspace and Git repository easy to navigate, establish one clear home for each kind of file, rename LOADOUT-owned material consistently, and reduce stale or repeated planning documents without losing unique decisions or artwork.

The repository at `loadout/` remains the canonical source. The three pinned source repositories remain separate and read-only. Public Docs, internal engineering documentation, product policy, design briefs, and reference material remain separate audiences.

## Current evidence

- The workspace contains six Git worktrees. `loadout/` has 46 changed entries and `hero-workshop-background/` has 36; both are protected. Four secondary worktrees are clean and their commits are ancestors of current `main`.
- Current GitHub `main` is `cd1834a`; current `development` is `b262876`. The original dirty `loadout/` checkout is at `04e3212`, so it is not a safe implementation base.
- The repository's current public Docs source is already Markdown in `content/docs/`; keep its URL slugs and useful anchors. Do not treat the older local Docs source as canonical.
- `references/pixl`, `references/stardance`, and `references/ysws-template` are pinned Git submodules. Their working trees, paths, and upstream contents must not be renamed, edited, or vendored.
- Exact duplicate hashes occur mostly across worktrees and reference repositories. These are not by themselves deletion candidates. The live hero PNGs currently also exist in the source-art folder and the dirty hero worktree; select the final runtime path before removing a copy.
- Three exact duplicate files were already removed from `New homepage designs/old pngs/`. The remaining old artwork variants are unique and must be retained.

## Phase 1: workspace layout

Keep the canonical checkout path fixed and organize surrounding workspace material:

```text
LOADOUT/
├─ loadout/                         canonical Git repository; path stays fixed
├─ worktrees/                       the five other Git worktrees
│  ├─ docs-participant-manual/
│  ├─ docs-refresh/
│  ├─ docs-scrollbar-chrome/
│  ├─ hero-workshop-background/
│  ├─ homepage-refresh-full/
│  └─ workspace-restructure/        this implementation worktree
├─ assets/
│  ├─ inbox/homepage/               incoming workshop and homepage art
│  ├─ inbox/icons/                  incoming icon and Rivet art
│  ├─ inbox/ui-concepts/             incoming UI concepts
│  ├─ editable/                      Aseprite and original editable sheets
│  └─ archive/homepage-variants/     unique older variants
├─ planning/PLAN-snapshot/           one-time parent snapshot; repository is canonical
├─ reports/inventory/                inventory and duplicate CSVs plus summary
├─ scratch/notes/                    human-authored temporary notes and captures
└─ .tmp/                             generated caches and runtime temporary files
```

Use Git's worktree-aware move operation for each existing secondary checkout. Preserve every branch, commit, dirty edit, ignored file, and untracked file. The four clean checkouts stay for this pass; do not delete them as part of moving them. The `workspace-restructure/` checkout is temporary and can be removed after its PR is merged and its working tree is clean; retain its branch history. Keep generated cache locations stable under `.tmp/`.

Move unique parent artwork into its canonical repository location as part of the repo phase, verify it is present in the merged repository and on GitHub, then remove the old parent copies. Move inventory reports into `reports/inventory/`. Move human-authored notes/captures out of `.tmp/` into `scratch/notes/`; keep generated caches and runtime temporary files in `.tmp/`.

The parent `PLAN/` is reconciled against repository plans first, then moved to `planning/PLAN-snapshot/` as the previously approved one-time snapshot. Label the repository copy canonical; do not add ongoing synchronization.

## Phase 2: repository layout

Retain runtime and contributor-standard paths; reorganize LOADOUT-owned plans, documentation, and asset sources:

```text
loadout/
├─ apps/landing/                     Next.js application
│  └─ public/loadout/
│     ├─ brand/
│     ├─ hero/
│     ├─ icons/
│     └─ sprites/                     one canonical copy of each live asset
├─ assets/
│  ├─ README.md                       intake and promotion rules for future art
│  ├─ inbox/
│  │  ├─ homepage/                    unapproved homepage art
│  │  ├─ icons/                       unapproved icons and Rivet art
│  │  └─ ui-concepts/                  unapproved UI concepts
│  ├─ editable/                       original editable source files only
│  └─ archive/homepage-variants/       distinct older art variants
├─ content/docs/                      public Markdown source; slugs stay stable
├─ docs/
│  ├─ README.md                       internal-doc index and audience/status map
│  ├─ development/                    setup, workflow, architecture, release
│  ├─ design/
│  │  ├─ system/                      canonical design-system documentation
│  │  └─ references/                  visual proposals and source sprite sheets
│  └─ source-audit/                   source pins, licensing, attribution, reuse
├─ plans/                             numbered canonical product plans
├─ references/                        pinned submodules; leave contents and paths intact
└─ .ulpi/design/                      active briefs and the tool-required design entrypoint
```

Keep the root `README.md`, `AGENTS.md`, `PRODUCT.md`, package/configuration files, `.github/`, and `references/` path stable. Rename `PLAN/` to lowercase `plans/`, keep stable numeric plan IDs, and use lowercase kebab-case descriptive filenames. Update every repository link and contributor instruction in the same change. Keep `.ulpi/design/DESIGN.md` as the design tool entrypoint; establish a single canonical design-system document under `docs/design/system/` and make the entrypoint a concise link rather than a second policy copy.

## Asset ownership and naming

- Website-served files live only under `apps/landing/public/loadout/`, grouped by brand, hero, icon, and sprite use.
- `assets/inbox/` holds unapproved future files and is not imported by the application. When accepted, move an asset from the inbox to its final app path; do not leave an identical exported copy behind.
- `assets/editable/` holds native/editable masters such as `.ase` files and non-runtime sprite sheets. `docs/design/references/` holds screenshots and visual references that are not used as website assets.
- The asset catalog maps each final filename to its purpose, source, and any app/component reference. Rename only LOADOUT-owned files. Do not rename source-submodule files.
- Use lowercase kebab-case names that describe subject and purpose. Avoid `new`, `old`, `image (3)`, misspellings, and unexplained timestamps. Use sequence numbers only for ordered collections. For ambiguous screenshots, inspect their content before assigning names.
- Example mappings to verify visually: `Industrielle Pixel-Art-Werkstatt mit Freiraum.png` → `hero-workshop-concept.png`; `accesorys/` → `decorative-motifs/`; `unified_rail_sprites/` → `hero-platform-parts/`; `Bolt for Loadout.png` → `bolt-icon-reference.png`; `tracks.png` → `track-layers-icon-reference.png`; `Rivit.png` → `rivet-avatar.png`; `image (3).png` → `rivet-mascot-concept.png`; `iconpallete for loadout.ase` → `loadout-icon-palette.ase`.

## Document reconciliation and disposition

Keep product authority explicit: product/program in Plan 01, economy in Plan 02, the public homepage in Plan 06, Era rules in Plan 11, IRL concept in Plan 15, the unresolved visual-clarity proposal in Plan 17, and current Docs policy/content in Plan 18 plus `docs/` and `content/docs/`. Preserve Plan 05 operations and Plan 08 as dated ecosystem context unless link and content review proves a specific portion superseded.

Before retiring a document, transfer unique decisions and evidence to its canonical owner and check all inbound links. Candidate consolidations are:

- Merge `PLAN/README.md` into the canonical index. Replace `LOADOUT_MASTER_PLAN_v4.md` with a concise historical index to numbered plans.
- Extract lasting material from `PROMPT_00` and `PROMPT_01`, then remove the obsolete executable prompts.
- Merge Plan 03 into the design system and Plan 07 into contributor/source-audit documentation.
- Reconcile Plans 04, 09, 10, 12, 13, 14, and 16 into current homepage, product, design, source-audit, or operational owners; retire only those with no unique decisions afterward.
- Review Plan 18's completed status against the current `main` implementation. Preserve the completed rollout facts in the docs index and implementation records before considering retirement.
- Keep `docs/development/WORKFLOW.md` as the one full contribution workflow. Merge unique guidance from `HUMAN_AND_AI_WORKFLOW.md`; reduce `AGENTS.md` to essential rules and links.
- Retain focused setup, architecture, content-authoring, deployment/rollback, quality-integration, and Rivet handoff guides. Refresh their dated status; do not collapse them into one manual.
- Reconcile source-audit overlap among `FEATURE_MATRIX.md`, `UI_MATRIX.md`, `PUBLIC_SITE_PORT.md`, `PUBLIC_SITE_ASSETS.md`, `PIXL_MOTION_PARITY.md`, and `ARCHITECTURE_NOTES.md`. Preserve `SOURCE_BASES.md`, `DECISIONS.md`, and `ATTRIBUTION.md` as clear owners for pins, reuse decisions, and credits unless their contents are fully transferred.
- In `.ulpi/design/`, preserve the current design lock, Plan 17's unresolved proposal, the Docs refresh record until status is reconciled, and any still-open concept. Merge completed briefs into canonical plans/design references and remove superseded briefs only after link checks.

These are candidates, not permission to delete by filename alone. The implementation manifest must classify every affected file as keep, move, rename, rewrite, merge, or delete and name its destination or canonical owner.

## GitHub, preservation, and validation

- Start implementation from current `development` on this short-lived branch. Reconcile internal-document drafts from the dirty original checkout; do not import its unrelated homepage/UI edits.
- Preserve both dirty worktrees, all source pins, all remote branches/tags/PR history, unique artwork, and the separate PR notes. Preserve public Docs URL slugs and useful heading anchors.
- Publish repository restructuring only through temporary branch → PR to `development` → promotion PR to `testing` → promotion PR to `main`. Do not directly edit protected remote lanes or delete remote branches.
- Before file operations, compare exact hashes and verify absolute source/destination paths. Before deleting, check tracked state, inbound references, unique content, and that a canonical copy exists.
- Validate every Markdown link and renamed image/code reference, confirm public content remains separate from internal docs, confirm submodule paths/pins are unchanged, and compare workspace inventory before/after. Run repository checks required by the workflow for the changed files.
- The public homepage appearance and behavior are outside the cleanup scope. Only asset-path updates needed to preserve the current rendered site are allowed; verify the homepage and Docs after those path updates.
