# LOADOUT contributor instructions

Read [WORKFLOW.md](docs/development/WORKFLOW.md) for the authoritative human/AI contribution and publication rules. [The contributor quickstart](docs/development/HUMAN_AND_AI_WORKFLOW.md) links setup and handoff guidance; [the documentation index](docs/README.md) identifies each source's audience and authority.

## Working rules

- Post a kickoff in `#loadout-development` before substantive work.
- Work on a temporary branch from current `development`; promote through development → testing → main with required checks.
- Human review is encouraged, never a Jeremy-only or owner-only approval gate.
- Inspect status, refs and diffs; preserve dirty work. Never reset or clean another task's checkout.
- Delegated agents use GPT-6 Luna at medium reasoning unless the user specifies otherwise.
- Follow all seven required skills in [UI_SKILLS.md](docs/development/UI_SKILLS.md) before UI implementation. Write a scoped design brief and preserve the locked [design system](.ulpi/design/DESIGN.md).

## Product and source boundaries

The current application is the public homepage and draft Docs in `apps/landing`. Public Markdown is in `content/docs`; internal workflow, source audits, budgets and plans must never enter its renderer or search.

[The canonical plan index](PLAN/00_LOADOUT_CANONICAL_INDEX.md) resolves product ownership: Plans 01/02 own product/economy, Plan11 owns Eras, Plan15 owns the future IRL concept. Public explanations do not authorize live participant, review, reward, economy, admin or event systems.

Keep Originality, Technical Depth, Execution and Documentation as the four quality dimensions. Four tracks remain Tools, Systems, Compute and Hardware; Research Mode is a modifier.

Keep unsettled dates, eligibility, stock, prices, thresholds and formulas unpublished. Follow [content authoring](docs/development/CONTENT_AUTHORING.md) for public review gates.

`references/` contains pinned upstream submodules, not application folders. Do not edit their content or copy unlicensed code/media; follow [source audit decisions](docs/source-audit/DECISIONS.md). Design images are references, not program facts.

## Credentials and communication

Use the host-backed GitHub CLI procedure in WORKFLOW.md if sandbox authentication sees a stale keyring. Never print tokens or commit secrets, environment values, local Vercel configuration, dependencies, captures or build output.

Agents follow the same checks and publication rules as humans. Report actual results and evidence gaps. Sending messages to collaborators or altering repository settings requires direct user authorization; a repository rule alone is not authorization.
