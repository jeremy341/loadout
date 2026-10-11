# LOADOUT workspace and repository disposition

**Audit date:** 2026-10-10. **Base:** `development` at `b2628762133907e2e051543a29dcbf69bf02d041`. The attached [CSV](restructure-manifest.csv) has the path/disposition records spanning the parent workspace, protected worktrees, repository files, copied assets, and source references.

This is a disposition and verification record, not blanket permission to remove files. Compare hashes and inspect unique content before deleting a candidate. Pinned source repositories, public Docs slugs, dirty user worktrees, and current product policies remain protected.

## Completed layout and content work

- Five task worktrees live under the parent `worktrees/` directory. Their Git branch, commit, and dirty state were verified after moving.
- Workspace inventory files are in `reports/inventory/`; human notes are in `scratch/notes/`. The empty parent `UI/` folder was removed.
- Assets have owned homes under `assets/`, `docs/design/references/`, and `apps/landing/public/loadout/`. The 31 workshop PNGs were copied from the protected dirty hero worktree and hash-checked. Thirty-one exact copies in the old parent artwork folder were removed; five unique variants remain archived. Forty-two icon sources were renamed without changing pixels; scenery SVGs moved without changing bytes; CSS references changed only to the new paths. The custom Bolt SVG remains byte-for-byte unchanged.
- Plans now live in `plans/`, keep their numeric IDs, and use lowercase kebab-case. Current policy owners are indexed in `plans/00-index.md`. Completed plans and bootstrap prompts were reconciled and retired; Plan 17 remains open. The master file is now a short history index. `plans/README.md` is only a compatibility pointer.
- Internal Docs have one workflow guide and an audience/authority index. Overlapping source audits are combined. Design tokens have one canonical home; `.ulpi/design/README.md` indexes open, completed, and superseded briefs.
- GitHub, CI, Vercel status, CodeScene, Codecov workflow, and Rivet facts were checked read-only on 2026-10-10. No external configuration, bot, Slack, GitHub setting, or deployment was changed.

## Parent plan snapshot

The one-time `planning/PLAN-snapshot/` was copied from repository `plans/` and verified: **12 files, 0 missing, 0 extra, 0 SHA-256 mismatches**. `planning/README.md` says the repository is canonical and there is no synchronization.

The old parent `PLAN/` folder remains. Its nonmatching lines were audited against the repository versions: its Plan 00 and Plan 07 workflow edits describe an older direct-to-main policy; the Plan 05 event sketch predates the three-day Plan 15 concept. The only lasting parent Plan 05 design guardrail was carried into Plan 15. The parent-only bootstrap file was only a 643-byte compatibility pointer; its useful repository/branch guidance is in `docs/development/WORKFLOW.md`, and its pending invite note is stale.

The automatic safety review rejected removal of the whole parent `PLAN/` directory, citing those unique historical differences despite the reconciliation and verified snapshot. The original folder was left untouched. Its deletion needs a follow-up owner decision; do not remove it as part of another cleanup command.

## Generated files and protected local work

- The owner-approved `.tmp/bun-cache` was removed after verifying its exact in-workspace path and non-reparse-point status: 27,245 files and 3,328 nested folders. Other `.tmp` content, including the two node-gyp temp folders and `.hm` file, remains.
- The original dirty `loadout/` checkout (46 changed entries) and dirty `worktrees/hero-workshop-background/` (36 changed entries) remain intact. No homepage/UI changes were copied from either; only listed PNG assets were copied from the hero worktree.
- The four source submodules are pinned: Pixl `8141b992e92e05583246fd914c63a101100f6fe4`, Stardance `3a0fe8148b07c1edfe005e94dfc9d1faa4b64c14`, YSWS Template `1ac191fa5eee1e57983b29ab7101f700c166e207`, and Stasis `7a230ced9ad793f0ad4cda30a7d71c02a58da6b6`. Stasis has no identified reuse license and remains reference-only.
- Public `content/docs/` filenames, URL slugs, and content are preserved. Internal workflow and planning are not included in the public Docs renderer or search.
- No implementation change was committed, pushed, or opened as a PR.

The CSV retains the pre-change source path, action, canonical target, reason, and verification for each inventoried entry, with current exception state recorded where an operation is pending.
