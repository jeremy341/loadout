# LOADOUT

**Build your own technical stack.** LOADOUT is a technical-builder YSWS concept focused on tools, systems, compute, and hardware. Its product model and program details are still being prepared; this repository does not represent an accepted Hack Club program or a promise of dates, rewards, or availability.

## Current state

The LOADOUT product tree is intentionally empty while the website redesign and implementation plan are being prepared. No landing page, app runtime, or deployment configuration is included yet. Work follows the `development` → `testing` → `main` lanes and short-lived branches described in [the development workflow](docs/development/WORKFLOW.md).

## Source references

The `references/` folders are pinned Git submodules, each with its own upstream history and independent commit:

- **Pixl** — PRIMARY ENGINEERING BASE
- **YSWS Template** — GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE
- **Stardance** — PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE

Use `git clone --recurse-submodules https://github.com/jeremy341/loadout.git` to populate the source folders. The LOADOUT repository stores submodule pointers rather than copying upstream source files. Pixl's MIT notice remains inside its reference checkout. YSWS Template and Stardance have no identified reuse license, so their code is not vendored into LOADOUT.

See [the source audit](docs/source-audit/SOURCE_BASES.md) for exact SHAs, license facts, source paths, and reuse decisions. LOADOUT keeps its own scoring dimensions: Originality, Technical Depth, Execution, and Documentation; Stardance does not replace that model.

## Development setup

Read [the workflow](docs/development/WORKFLOW.md), [branch protection setup](docs/development/BRANCH_PROTECTION_SETUP.md), and [CodeScene setup](docs/development/CODESCENE_SETUP.md) before preparing a change. CI currently validates repository integrity; application build and test checks will be added with the first LOADOUT-owned code.