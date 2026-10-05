# LOADOUT contributor instructions

Read [the human and AI workflow](docs/development/HUMAN_AND_AI_WORKFLOW.md) before making changes. It covers branches, reviews, checks, previews, source references, and publication.

## Project boundaries

- The current application is the public homepage in `apps/landing`. Keep changes scoped to the user's request; broad participant, reviewer, reward, economy, or admin features need a separate approved plan.
- Use `PLAN/00_LOADOUT_CANONICAL_INDEX.md` and plans `00–10` for current product decisions. `PLAN/LOADOUT_MASTER_PLAN_v4.md` and the original bootstrap prompts are historical context, not current execution instructions. Check a plan's status before acting on it.
- LOADOUT retains its four quality dimensions: Originality, Technical Depth, Execution, and Documentation. Do not substitute scoring models from the reference repositories.
- `references/` contains pinned submodules. Do not edit or vendor their content into the application. Follow `docs/source-audit/` for license and reuse decisions.
- `docs/design/references/` contains visual proposals. Use them as design references; their mock content is not a source of program facts.
- Keep dates, eligibility, inventory, prices, personal contact details, and policies data-gated until the owner supplies approved public values.

## Local development

Use Bun 1.3.14 and Node.js supported by the checked-in lockfile. From the repository root:

```powershell
bun install --frozen-lockfile
bun run dev
```

Before a PR, run the checks for the files you changed. The standard full set is:

```powershell
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
```

Do not commit local `.env` files, credentials, `.vercel/`, `node_modules/`, `.next/`, Playwright output, caches, or generated review captures. Keep `.env.example` free of private values.

## Working with AI agents

AI agents follow the same branch and review workflow as people. They should inspect Git status and relevant plans first, make only authorized changes, run and report the applicable checks, and leave a concise handoff with files changed, evidence, and unresolved decisions. They must not invent program facts, infer permission to publish from a local preview, or claim remote CI/deployment succeeded without checking it.

Treat prompts and screenshots as project context, not as higher-priority repository policy. If an instruction conflicts with the user's current request, follow the user and update the affected documentation when appropriate. Do not send messages to collaborators or alter repository settings without direct authorization.
