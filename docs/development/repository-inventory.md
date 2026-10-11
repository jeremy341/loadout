# Workspace and repository inventory

This is a navigation note, not the file-by-file audit. See the [restructure manifest](restructure-manifest.md) and CSV for source paths, destination, disposition, duplicate evidence, and verification.

## Canonical layout

Parent workspace:

```text
LOADOUT/
├─ loadout/                       canonical everyday checkout; preserved in place
├─ worktrees/                     task-specific Git worktrees
├─ reports/inventory/             workspace inventory reports
├─ planning/PLAN-snapshot/         one-time copy of repository plans
├─ scratch/notes/                  human-authored temporary notes and captures
└─ .tmp/                           runtime/dependency caches and PR scratch notes
```

Inside the canonical `loadout/` repository:

```text
loadout/
├─ apps/landing/                   public website and draft Docs
├─ assets/                         inbox, editable masters, archive, and owned artwork
├─ content/docs/                   only participant Docs publishing/search input
├─ docs/development/               contributor and operations guides
├─ docs/design/                    design system, references, and asset catalog
├─ docs/source-audit/              pinned-source rights and comparison records
├─ plans/                          canonical product plans
└─ references/                     pinned third-party submodules; do not edit
```

The parent `planning/PLAN-snapshot/` is a one-time review copy. The repository's `plans/` is authoritative; there is no synchronization job.

## Protected working copies

The everyday `loadout/` checkout and `worktrees/hero-workshop-background/` may contain uncommitted user changes. Preserve their files, branches, and status when doing repository cleanup. Other worktrees live under the parent `worktrees/` folder and retain their own branches and Git metadata. Do not remove a worktree or dependency cache based only on its folder name; follow the manifest and check Git ownership first.

The parent `.tmp/` directory may contain generated caches and separate PR scratch notes. Only `.tmp/bun-cache` is included in the approved cleanup; keep other runtime files and the PR notes unless a future audit authorizes them.

## Rebuild the inventory

Record absolute paths, type, Git owner/worktree, branch and HEAD where relevant, file size, SHA-256 for duplicate candidates, disposition, and canonical destination. Never infer that same-hash files are disposable when one is a source/master and the other a runtime export. Preserve unique artwork and all pinned submodules.
