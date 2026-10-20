# Workspace guide

This page describes a recommended local layout for people who work on LOADOUT with more than one checkout, task or companion project. It is a convenience, not a build requirement: a fresh clone of this repository is fully usable on its own. [WORKFLOW.md](WORKFLOW.md) owns process, [SETUP.md](SETUP.md) owns installation, and [Related projects](../related-projects/README.md) owns companion repositories.

## Recommended layout

```text
LOADOUT/                     parent notebook (plain folder or a local-only Git repo)
  README.md                  local workspace map
  REGISTRY.md                project and owner pointers
  loadout/                   clean clone; do not edit here
  worktrees/                 one task worktree per open pull request
  companions/                Orry bot, Orry site, Goose Lee (own repositories)
  art/mole-source/           raw mole sheets and frame inputs
  reports/                   audits and evidence
  scratch/                   disposable captures and notes
```

Nothing in this layout is required by the application. Do not add a sibling folder to a build path, import or CI configuration.

## First-time setup

Run these from the product checkout:

```powershell
git clone https://github.com/jeremy341/loadout.git
cd loadout
git submodule update --init
git submodule status
git fetch origin development testing main
bun install --frozen-lockfile
bun run dev
```

Use Bun 1.3.14. Do not use `--recursive` or `--recurse-submodules`: Stardance declares an inaccessible nested `secrets` repository. The landing app runs on port 3000; the platform preview runs on port 3100 with `bun run dev:platform`.

## Worktrees for tasks

Keep `loadout/` on `development` and do task work in a separate worktree. One branch per worktree; never check out `development` in two places.

```powershell
cd loadout
git fetch origin
git worktree add ..\worktrees\fix-nav-20261021 -b fix/nav origin/development
cd ..\worktrees\fix-nav-20261021
git submodule update --init
bun install --frozen-lockfile
```

Each worktree needs its own dependencies and, for the landing app, its own dev port. Remove a worktree only after its pull request has merged and `git status` is clean:

```powershell
git worktree remove ..\worktrees\fix-nav-20261021
git worktree prune
```

Never remove a worktree you did not create.

## Keeping the main checkout clean

```powershell
cd loadout
git fetch origin
git switch development
git pull --ff-only
```

If the checkout is dirty, classify tracked and untracked deltas against the live base before touching anything. Do not reset, stash or delete someone else's files. See the preservation rule in [WORKFLOW.md](WORKFLOW.md).

If local branches show commits that `origin` no longer has (the history rewrite of 2026-10-11), save any unique work, switch away, then run `git fetch origin && git branch -f development origin/development`.

## Companion projects

[Orry](../related-projects/orry.md), [Goose Lee](../related-projects/goose-lee.md) and [Mole art](../related-projects/mole-art.md) have their own repositories or source folders. Keep them outside this repository, and never vendor their code, tokens, databases or `.env` files here. The Orry bot reads `content/docs/` from GitHub, not from a local path.

## Local-only material

Audits, Playwright output, review captures and PR drafts belong in the parent workspace, outside this repository. `.env*`, `.vercel/`, `.claude/`, `.superpowers/`, `node_modules/`, `.next/` and test output stay ignored here. Never commit a database, browser profile or trace.

## Common failures

- Empty reference folder in a new worktree: run `git submodule update --init` there.
- Stardance nested `secrets` error: you used recursive initialization. Re-run without `--recursive`.
- Stale commit SHAs from before 2026-10-11: see the history note above.
- `next-env.d.ts` changes after a build: leave generated-only changes out of commits.
- Credential warnings in a sandbox: verify the host-backed environment instead of repeating `gh auth login`; never print the token.

## Maintaining this page

Update this file when the recommended layout, tool versions or companion projects change, and refresh the date below. Do not list personal paths or machines.

Last verified: 2026-10-20.
