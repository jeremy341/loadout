# LOADOUT documentation index

Documents serve different audiences. Follow the owning source instead of treating every Markdown file as a public rule.

| Source | Audience | Owner / authority | Status |
| --- | --- | --- | --- |
| content/docs | Builders and interested visitors | Maintainers review public wording against canonical plans. | Published program draft; not a live program. |
| [WORKFLOW](development/WORKFLOW.md) | Human and AI contributors | Repository contribution/promotion policy. | Current operational guide. |
| [SETUP](development/SETUP.md), [ARCHITECTURE](development/ARCHITECTURE.md) | Developers | Implemented checkout/runtime facts. | Current implementation reference. |
| [CONTENT_AUTHORING](development/CONTENT_AUTHORING.md) | Docs maintainers | Public content/source and release-feed gate. | Current publishing guide. |
| [Deployment](development/DEPLOYMENT_AND_ROLLBACK.md), [integrations](development/QUALITY_INTEGRATIONS.md) | Maintainers | Dated host/CI evidence and runbooks. | Refresh evidence before changes. |
| [Rivet handoff](development/RIVET_HANDOFF.md) | Netics and maintainers | Separate bot integration checklist. | Prepared; not a bot deployment. |
| [Source audit](source-audit/SOURCE_BASES.md) | Engineers/reviewers | Pins, licenses, source paths, reuse decisions. | Preserve reference boundaries. |
| [Canonical plans](../PLAN/00_LOADOUT_CANONICAL_INDEX.md) | Organizers/developers | Plans01/02 product/economy;11 Eras;15 IRL. | Policies/proposals with explicit readiness gates. |
| [Locked design](../.ulpi/design/DESIGN.md), scoped briefs | UI contributors | Current tokens plus per-change contracts. | Historical briefs do not override later approved work. |
| [Design references](design/references/README.md) | Designers | Visual examples only. | Not program facts. |

## Publication boundary

Only content/docs enters public Docs/search. This directory, PLAN and design history are internal repository references. Do not put a workflow, budget, source audit or private evidence into the public source.

## Historical and local material

Master-plan/bootstrap prompts are retained historical inputs, not executable current tasks. [The cleanup inventory](development/REPOSITORY_INVENTORY.md) distinguishes published files, old checkout deltas and parent-folder artwork.

Link to the owning document rather than maintaining copies. Mark superseded material before considering deletion, check inbound links, and preserve unique content.
