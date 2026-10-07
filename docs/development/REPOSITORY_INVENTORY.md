# Documentation and workspace inventory — 2026-10-07

## Reconciliation baseline

The original loadout checkout remains on feature/homepage-mechanics-clarity at04e3212 with dirty tracked files and untracked Docs/design files. It was not reset or cleaned.

The Docs refresh starts from current development771f683 in its own worktree. Development/testing/main had the same published tree444f70a before this task. Apparent missing Docs/design files in a raw original-checkout diff often correspond to untracked files already published; do not interpret them as requested deletions.

Remaining tracked differences inspected against the current base include import-order changes in layout/page, an older Docs-route expectation in homepage.spec.ts, and generated next-env dev references. Preserve them in the original checkout; they are not silently imported into this Docs-only task.

## Repo cleanup performed in this scope

- Public guide objects are replaced by eighteen canonical Markdown pages; the obsolete guide-content.ts source and its superseded test are retired.
- WORKFLOW owns contribution rules; AGENTS and the human/AI quickstart link to it.
- CodeScene status, recursive-submodule advice, fixed image counts and stale Docs-tab descriptions are corrected.
- Canonical product plans, source audits, licenses and design images remain.
- Design briefs and prompts stay at stable paths with historical/status explanations; no blanket deletion or invented “complete docs” claim.

## Parent folder: inventory only

The parent LOADOUT workspace includes .tmp, Art assets, PLAN, UI, loadout and multiple Git worktree directories, plus loose images/design source files. The parent PLAN directory is a separate copy of planning inputs; compare against the repository before any consolidation.

Art assets, Aseprite files, raw images and user attachments may be unique. Worktree directories may contain task history or ignored artifacts. None are removed or relocated in this change.

For a later cleanup, inventory exact paths, sizes, hashes, Git ownership and uniqueness; present deletion/move candidates for separate approval. Never recursively delete a computed target without checking its absolute resolved path and workspace boundary.
