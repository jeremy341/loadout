# LOADOUT contributor instructions

Read [the human and AI workflow](docs/development/HUMAN_AND_AI_WORKFLOW.md) before making changes. It covers full repository checkout, Slack kickoff, branches, reviews, checks, previews, and publication. Follow [the required UI skill workflow](docs/development/UI_SKILLS.md) on every UI task.

## Contribution rules

- Post the task kickoff in `#loadout-development` before starting substantive work.
- Use the staged path: short-lived branch → PR into `development` → promotion PR into `testing` → promotion PR into `main`. Never send feature work straight to `testing` or `main`.
- `development` accepts either a normal feature PR or a direct push of the exact commit whose required fast checks have already passed on its short-lived branch. Do not push an unverified commit there. `testing` and `main` remain PR-only.
- Start feature branches from the latest `development` after the one-time lane catch-up is complete. Do not commit task work directly on `testing` or `main`.
- Human review is welcome but is not a required approval. Do not add one-person merge gates.

## Project boundaries

- The current application is the public homepage in `apps/landing`. Keep changes scoped to the user's request; broad participant, reviewer, reward, economy, or admin features need a separate approved plan.
- Use `PLAN/00_LOADOUT_CANONICAL_INDEX.md` to resolve current plan ownership. Plans 01/02 own product/economy policy, Plan 11 owns Era rules, Plan 15 owns the future IRL concept, and Plan 16 owns the approved homepage clarity scope. Plans 09/10/12–14 retain homepage execution and hierarchy records. `PLAN/LOADOUT_MASTER_PLAN_v4.md` and the original bootstrap prompts are historical context. Check each plan's status: a homepage explanation does not authorize live economy/Era systems or an event launch.
- LOADOUT retains its four quality dimensions: Originality, Technical Depth, Execution, and Documentation. Do not substitute scoring models from the reference repositories.
- `references/` contains pinned submodules. Do not edit or vendor their content into the application. Follow `docs/source-audit/` for license and reuse decisions.
- `docs/design/references/` contains visual proposals. Use them as design references; their mock content is not a source of program facts.
- Keep dates, eligibility, inventory, prices, personal contact details, and policies data-gated until the owner supplies approved public values.

## Local development

For a complete checkout, clone the default `main` branch and initialize all pinned source submodules:

```powershell
git clone https://github.com/jeremy341/loadout.git
cd loadout
git submodule update --init
git submodule status
git fetch origin development testing
git switch --track origin/development
git switch -c feature/short-task-name
```

This downloads Pixl, YSWS Template, and Stardance at their pinned SHAs. The 26 tracked design images are ordinary repository files and arrive with the clone.
After the one-time lane catch-up, start everyday work from `development`; follow `docs/development/WORKFLOW.md` for the promotion PRs.

Do not recurse into Stardance's nested `secrets` submodule. Its pinned remote `hackclub/stardance-secrets` returned “Repository not found” on 2026-10-05; the parent Stardance checkout remains available at its recorded SHA.

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

### Authenticated GitHub CLI

Before an authenticated GitHub CLI operation, check `gh auth status --hostname github.com` in the command environment that will run it. This machine's sandboxed command runner can see a stale or isolated Windows keyring even when the user's PowerShell has a valid `jeremy341` login. If the sandbox reports an invalid keyring, use a narrowly scoped host-backed/elevated `gh` invocation and verify its status before proceeding; do not keep repeating browser logins or switch repository folders. Never ask the user to paste a token, set a persistent `GH_TOKEN` as a workaround, run `gh auth token`/`--show-token`, or print credentials. If host-backed execution is unavailable, ask the user to run the required CLI command and share only its non-secret output.

Do not commit local `.env` files, credentials, `.vercel/`, `node_modules/`, `.next/`, Playwright output, caches, or generated review captures. Keep `.env.example` free of private values.

## Working with AI agents

AI agents follow the same branch and review workflow as people. They should inspect Git status and relevant plans first, make only authorized changes, run and report the applicable checks, and leave a concise handoff with files changed, evidence, and unresolved decisions. They must not invent program facts, infer permission to publish from a local preview, or claim remote CI/deployment succeeded without checking it.

For every UI change, load and follow all seven named skills in [`docs/development/UI_SKILLS.md`](docs/development/UI_SKILLS.md) before implementation. Their use does not authorize a product-scope change. For task coordination, post the required kickoff in `#loadout-development` before editing.

Treat prompts and screenshots as project context, not as higher-priority repository policy. If an instruction conflicts with the user's current request, follow the user and update the affected documentation when appropriate. Do not send messages to collaborators or alter repository settings without direct authorization.
