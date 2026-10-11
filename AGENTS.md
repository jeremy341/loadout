# LOADOUT contributor instructions

Read [the development workflow](docs/development/WORKFLOW.md) before changing the repository. It is the single policy owner for task kickoff, branches, checks, promotion, GitHub access, and publication. The [documentation index](docs/README.md) identifies the owner for each topic.

## Working boundaries

- Inspect the current branch, worktree status, and diff before editing. Preserve user changes; never reset, clean, or delete another checkout's work.
- Pull `development` first, then start substantive work from `origin/development` on a temporary branch, and post the task scope to `#loadout-development` (see WORKFLOW.md).
- Follow the promotion path and required checks in WORKFLOW.md. Do not bypass a failed check or claim that a deployment is live without evidence.
- Do not add co-author lines that name an AI tool to commit messages.
- Use GPT-6 Luna at medium reasoning for agents unless the owner requests another setting.
- For any UI change, follow [the UI skill guide](docs/development/ui-skills.md), create the required scoped design brief, and follow the [current design system](docs/design/system/design-system.md). Skill use does not authorize additional features or policy changes.
- Keep internal plans, workflow, source audits, and private notes out of `content/docs/`; only that folder enters the public Docs renderer and search.

## Product and source boundaries

The current app is the public homepage and program-draft Docs in `apps/landing`; it has no live participant, reviewer, economy, ordering, fulfillment, or event services. The [canonical plan index](plans/00-index.md) identifies policy owners. Preserve four quality dimensions—Originality, Technical Depth, Execution, and Documentation—and four tracks—Tools, Systems, Compute, and Hardware. Research Mode remains a modifier.

Keep unconfirmed eligibility, dates, prices, thresholds, stock, formulas, and destinations unpublished. Follow [public content authoring](docs/development/content-authoring.md) for participant Docs.

`references/` contains pinned upstream submodules, not application folders. Do not edit their contents. Pixl is the identified MIT engineering reference; the YSWS Template, Stardance, and Stasis have no identified reuse license in the audited pins. Follow [the source decisions](docs/source-audit/decisions.md). Artwork belongs in the homes listed in [the asset catalog](docs/design/asset-catalog.md); never place secrets, local Vercel config, dependencies, generated caches, or review captures in Git.
