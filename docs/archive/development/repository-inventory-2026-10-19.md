> **Archived 2026-10-20:** dated inventory from before the platform landed. The parent layout has changed; current guidance is in [the workspace guide](../../development/workspace.md).

# LOADOUT parent workspace inventory

This note maps the parent `C:\Users\jerem\Documents\LOADOUT` workspace as observed on 2026-10-19. It is a navigation aid, not a claim that every checkout is current. Check each repository's branch and working-tree status before using it. The parent README is the quick index; this file records the repo's internal layout and cleanup boundaries.

## Parent workspace

| Path | Contents and handling |
|---|---|
| `loadout-all/` | Active repository for the current documentation alignment. Its `plans/` and `docs/source-audit/` are canonical within this checkout. |
| `loadout/`, `loadout-copy/`, `loadout-docs/`, `loadout-mole/`, `loadout-orry/`, `loadout-site/` | Separate LOADOUT Git checkouts on different task branches. Preserve each checkout and its branch; inspect status before working there. |
| `goose-lee/` | Separate Goose Lee Slack-bot repository. |
| `worktrees/` | Git worktrees for LOADOUT and Goose tasks, plus a retained patch. Never remove a directory without checking Git worktree ownership and preserving its state. |
| `mole-work/` | Orry/Mole sprite, cursor and animation source workspace. Treat its images and raw sheets as source artwork. |
| `reports/` | Dated implementation, accessibility, Docs, navigation, Orry, Goose and character-lore reports, including browser/test artifacts. These are retained evidence, not disposable duplicates by default. |
| `scratch/` | Local scripts, logs, screenshots, generated reports, PR drafts, bundles, and temporary run outputs. The files may be reproducibility evidence; review provenance before removing any. |
| `.claude/` | Local launch configuration and scripts. Keep local to the parent workspace. |
| `New logo*.png`, `2305wpx size logo.png` | Parent-level logo artwork; verify against the asset catalog before changing or removing. |
| `heres how you start a ysws.txt` | Parent-level YSWS note. It may be an older reference; compare with current plans before relying on it. |

## Inside `loadout-all/`

| Path | Owner |
|---|---|
| `apps/landing/` | Public homepage and draft Docs app. |
| `content/docs/` | Participant-facing Docs renderer and search input only. |
| `plans/` | Canonical internal product, program, economy, operations, and future-feature plans. `00-index.md` maps policy owners. |
| `docs/source-audit/` | Pinned source revisions, licensing and attribution notes, comparison, and decisions. |
| `references/` | Pinned third-party source submodules. Inspect through source audit; do not modify their contents. |
| `docs/development/` | Contributor, operations, content, and repository-navigation instructions. |
| `.ulpi/design/` | LOADOUT design briefs and decision records; current design system remains authoritative. |
| `assets/` | Project-owned asset source, archive and catalog. |

## Cleanup findings and safeguards

- A SHA-256 scan found identical files across reports/scratch, but the matches were run markers, a repeat-run helper, before/after captures with different labels, or generated CodeScene/test outputs. Their labels and locations carry provenance, so this pass retains them.
- No repository, worktree, report, scratch artifact, logo, or artwork was deleted or moved.
- Historical plan examples may retain old rates and score scales when clearly marked superseded. Current policy lives in Plans 01, 02, 11, 15 and 22, with the feature inventory in `plans/proposals/future-platform-ui.md`.
- The dated YSWS ecosystem report is research context, not current LOADOUT policy. Owner decisions in the canonical plans take precedence.

## Rebuild or extend this inventory

Before classifying a duplicate, record its absolute path, type, owning checkout/worktree, branch and HEAD where relevant, size, SHA-256, provenance, and canonical destination. Identical bytes alone do not make a source/master and a runtime capture interchangeable. Preserve uncommitted work, Git metadata, unique reports, submodules, raw art, and user-supplied assets.
