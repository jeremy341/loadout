# LOADOUT

**Build your own technical stack.** LOADOUT is a technical-builder YSWS concept focused on tools, systems, compute, and hardware. Its product model and program details are still being prepared; this repository does not represent an accepted Hack Club program or a promise of dates, rewards, or availability.

## Current state

`apps/landing` is the LOADOUT public homepage, adapted from the verified Pixl landing baseline. It follows the supplied paper-grid and pixel-cloud reference, with the four canonical tracks, separate Research Mode, progression, planned reward categories, and FAQ. The homepage is ready for a first Vercel preview; indexing remains disabled unless explicitly configured. Work follows the `development` → `testing` → `main` lanes described in [the development workflow](docs/development/WORKFLOW.md).

## Source references

The `references/` folders are pinned Git submodules, each with its own upstream history and independent commit:

- **Pixl** — PRIMARY ENGINEERING BASE
- **YSWS Template** — GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE
- **Stardance** — PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE

Use `git clone --recurse-submodules https://github.com/jeremy341/loadout.git` to populate the source folders. LOADOUT stores pinned submodule pointers for all three references. The homepage adapts Pixl's Next.js composition, Lenis scrolling, scroll-direction navigation, and motion patterns; its MIT notices remain preserved. The temporary Pixl assets, locale pages, copy, configuration, and service routes have been removed from the application. YSWS Template and Stardance remain reference-only because no reuse license was identified.

See [the source audit](docs/source-audit/SOURCE_BASES.md) for exact SHAs, license facts, source paths, and reuse decisions. LOADOUT keeps its own scoring dimensions: Originality, Technical Depth, Execution, and Documentation; Stardance does not replace that model.

See [the public-site port audit](docs/source-audit/PUBLIC_SITE_PORT.md) for baseline verification, final source/target mappings, asset boundaries, and homepage evidence.

## Development setup

Start with [AGENTS.md](AGENTS.md) and the [human and AI workflow](docs/development/HUMAN_AND_AI_WORKFLOW.md). See also [Vercel preview setup](docs/development/VERCEL_PREVIEW.md), [branch protection setup](docs/development/BRANCH_PROTECTION_SETUP.md), and [CodeScene setup](docs/development/CODESCENE_SETUP.md). Plans, bootstrap inputs, and their status are indexed in [`PLAN/README.md`](PLAN/README.md); design screenshots are indexed in [`docs/design/references/README.md`](docs/design/references/README.md). Run `bun install --frozen-lockfile`, then `bun run dev` for the local preview. Use `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`, and `bun run test:e2e` to verify changes. CI definitions cover repository integrity, landing quality, and browser/accessibility checks; GitHub runs and required-check settings still need verification after publication.
