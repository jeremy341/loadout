# LOADOUT documentation index

This repository has separate public, contributor, and planning material. Use the canonical owner listed here; do not treat every Markdown file as participant guidance.

| Source | Audience | Authority | Status |
|---|---|---|---|
| [`content/docs/`](../content/docs/) | Builders and visitors | Public explanation of the current program draft | Draft; no live submission or reward services |
| [`development/WORKFLOW.md`](development/WORKFLOW.md) | Contributors and AI agents | Contribution, branch, review, verification, and release process | Current operating policy |
| [`development/agent-commits.md`](development/agent-commits.md) | Contributors and AI agents | Commit messages, co-author lines and grouping commits | Current operating rule |
| [`development/SETUP.md`](development/SETUP.md) | Developers | Local setup and environment names | Current implementation reference |
| [`development/ARCHITECTURE.md`](development/ARCHITECTURE.md) | Developers | Application boundaries and runtime architecture | Current implementation reference |
| [`development/workspace.md`](development/workspace.md) | Contributors | Recommended local layout, worktrees and companion checkouts | Current layout guide |
| [`related-projects/`](related-projects/README.md) | Maintainers | Outside projects that connect to LOADOUT, their owners and contracts | Current registry; confirm unverified owners |
| [`development/platform-handoff.md`](development/platform-handoff.md) | Next developer and their agent | What the platform PR contains, the owner decision to redo the site from Pixl (copy, restyle, cut and keep), licence and workflow rules, known gaps and a ready prompt | Read first when picking up `apps/platform` |
| [`development/platform-preview.md`](development/platform-preview.md) | Developers | Running, resetting and retiring the participant platform preview (`apps/platform`) | Current implementation reference; preview runs on sample data |
| [`design/system/design-system.md`](design/system/design-system.md) | Designers and UI contributors | Shared visual tokens, layout, motion, and asset rules | Current design authority |
| [`development/content-authoring.md`](development/content-authoring.md) | Docs maintainers | Public Markdown source and publication gate | Current publishing guide |
| [`development/deployment-and-rollback.md`](development/deployment-and-rollback.md), [`development/quality-integrations.md`](development/quality-integrations.md) | Maintainers | Hosting, CI, integrations, and evidence | Operational records; refresh before relying on dated status |
| [`development/rivet-handoff.md`](development/rivet-handoff.md) | Rivet maintainers | Handoff between the website and Rivet's public Docs source | Website-side handoff only; bot changes are separate |
| [`source-audit/`](source-audit/) | Engineers and reviewers | Reference pins, licenses, attribution, and comparative audits, including the [Pixl platform port map](source-audit/pixl-platform-port-map.md) and the [platform preview open questions](source-audit/platform-preview-open-questions.md) | Preserve source boundaries; upstream repos stay pinned |
| [`../plans/00-index.md`](../plans/00-index.md) | Organizers and maintainers | Product decisions, proposals, and plan status | Product rules are not automatically public copy |
| [`.ulpi/design/DESIGN.md`](../.ulpi/design/DESIGN.md), [briefs index](../.ulpi/design/README.md), [`design/references/README.md`](design/references/README.md) | UI contributors | Tool entrypoint, brief status, and visual references | Design references are not product facts |
| [`archive/`](archive/README.md) | Maintainers | Completed records and one-time audits, with their current owners | Read-only by convention; not current policy |

## Publication boundary

Only reviewed files in `content/docs/` enter the website's public Docs renderer and search index. Internal workflows, plans, source audits, design history, workspace reports, and private notes remain outside that pipeline.

## Keeping documentation current

Update the owning file and its inbound index when a policy or implementation fact changes. Historical plans should link to current owners and state whether they are open, completed, or superseded. Do not duplicate full workflow policy in `AGENTS.md` or quickstarts.
