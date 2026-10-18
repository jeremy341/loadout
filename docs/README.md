# LOADOUT documentation index

This repository has separate public, contributor, and planning material. Use the canonical owner listed here; do not treat every Markdown file as participant guidance.

| Source | Audience | Authority | Status |
|---|---|---|---|
| [`content/docs/`](../content/docs/) | Builders and visitors | Public explanation of the current program draft | Draft; no live submission or reward services |
| [`development/WORKFLOW.md`](development/WORKFLOW.md) | Contributors and AI agents | Contribution, branch, review, verification, and release process | Current operating policy |
| [`development/agent-commits.md`](development/agent-commits.md) | Contributors and AI agents | Commit messages, co-author lines and grouping commits | Current operating rule |
| [`development/SETUP.md`](development/SETUP.md) | Developers | Local setup and environment names | Current implementation reference |
| [`development/ARCHITECTURE.md`](development/ARCHITECTURE.md) | Developers | Application boundaries and runtime architecture | Current implementation reference |
| [`design/system/design-system.md`](design/system/design-system.md) | Designers and UI contributors | Shared visual tokens, layout, motion, and asset rules | Current design authority |
| [`development/content-authoring.md`](development/content-authoring.md) | Docs maintainers | Public Markdown source and publication gate | Current publishing guide |
| [`development/deployment-and-rollback.md`](development/deployment-and-rollback.md), [`development/quality-integrations.md`](development/quality-integrations.md) | Maintainers | Hosting, CI, integrations, and evidence | Operational records; refresh before relying on dated status |
| [`development/rivet-handoff.md`](development/rivet-handoff.md) | Rivet maintainers | Handoff between the website and Rivet's public Docs source | Website-side handoff only; bot changes are separate |
| [`source-audit/`](source-audit/) | Engineers and reviewers | Reference pins, licenses, attribution, and comparative audits | Preserve source boundaries; upstream repos stay pinned |
| [`../plans/00-index.md`](../plans/00-index.md) | Organizers and maintainers | Product decisions, proposals, and plan status | Product rules are not automatically public copy |
| [`.ulpi/design/DESIGN.md`](../.ulpi/design/DESIGN.md), [briefs index](../.ulpi/design/README.md), [`design/references/README.md`](design/references/README.md) | UI contributors | Tool entrypoint, brief status, and visual references | Design references are not product facts |
| [`development/restructure-manifest.md`](development/restructure-manifest.md) | Repository maintainers | File disposition and migration record | One-time cleanup audit; the Git repo remains canonical |

## Publication boundary

Only reviewed files in `content/docs/` enter the website's public Docs renderer and search index. Internal workflows, plans, source audits, design history, workspace reports, and private notes remain outside that pipeline.

## Keeping documentation current

Update the owning file and its inbound index when a policy or implementation fact changes. Historical plans should link to current owners and state whether they are open, completed, or superseded. Do not duplicate full workflow policy in `AGENTS.md` or quickstarts.
