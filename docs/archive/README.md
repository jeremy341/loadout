# Archive

This folder holds completed records and one-time audits. They are kept for provenance, not as current policy. Each moved file has a banner naming the current owner.

Read current policy from [`plans/00-index.md`](../../plans/00-index.md), [`docs/README.md`](../README.md) and the design system. Do not add new working plans here; archive a record only after its lasting decisions have a current owner.

## Contents

### `restructure-2026-10-10/`

| File | What it is | Current owner |
|---|---|---|
| `restructure-manifest.md`, `restructure-manifest.csv` | One-time file-disposition audit for the workspace and repository restructure | [`docs/development/workspace.md`](../development/workspace.md); Git history |
| `2026-10-10-workspace-and-repository-restructure.md` | Execution plan for that restructure | Complete; Git history |
| `2026-10-10-workspace-repository-restructure-design.md` | Design spec for that restructure | Complete; Git history |

### `superpowers/plans/`

| File | What it is | Current owner |
|---|---|---|
| `2026-10-18-internal-docs-alignment.md` | Historical internal-docs alignment checklist | [`plans/00-index.md`](../../plans/00-index.md) |
| `2026-10-19-dino-domain-and-pending-changes.md` | Historical dino.icu domain and content refresh plan | [`plans/06-public-homepage.md`](../../plans/06-public-homepage.md) |

### `development/`

| File | What it is | Current owner |
|---|---|---|
| `repository-inventory-2026-10-19.md` | Dated workspace inventory from before the platform landed | [`workspace.md`](../development/workspace.md) |

## Rules

- Keep the original filename; add a date only when the name has none.
- Put a one-line banner at the top: archived date, reason, current owner.
- Fix inbound links in the same change.
- Never archive a file that code, CI or the Docs renderer reads.
