# LOADOUT

**Build your own technical stack.** LOADOUT is a technical-builder YSWS concept focused on tools, systems, compute, and hardware. The program is still being prepared; this repository does not claim acceptance, launch dates, eligibility, or available rewards.

## The website

`apps/landing` contains the public homepage and program-draft Docs. Visit [loadout-ysws.vercel.app](https://loadout-ysws.vercel.app/) or read the [public Docs](https://loadout-ysws.vercel.app/docs/start). Public Markdown is maintained in `content/docs/`; internal plans, workflow, source audits, and design notes are not published or indexed.

The site has no live participant accounts, project-submission, review, reward, ordering, or event service. The RSVP link expresses interest and does not enroll anyone.

## Working on the repository

Start with [`AGENTS.md`](AGENTS.md) and the [documentation index](docs/README.md). [Local setup](docs/development/setup.md) covers installation and environment names. [The development workflow](docs/development/WORKFLOW.md) owns task kickoff, branches, checks, promotion, and release. Plans and their status are indexed in [`plans/00-index.md`](plans/00-index.md); the visual system is in [`docs/design/system/design-system.md`](docs/design/system/design-system.md).

Use Bun 1.3.14. From the repository root, run `bun install --frozen-lockfile` and then `bun run dev`. The standard check commands are documented in WORKFLOW.md. Do not commit secrets, local settings, caches, dependencies, or generated review captures.

## Upstream references

`references/` contains four pinned Git submodules. The top-level repository records their URLs and exact commits, not copied source trees. Initialize them with `git submodule update --init`; do not use recursive initialization because Stardance declares an inaccessible nested `secrets` repository.

- **Pixl** is the primary engineering reference. Its MIT notice is preserved. LOADOUT adapts selected landing composition and interaction patterns.
- **YSWS Template** is an operations and infrastructure reference. No compatible reuse license was identified.
- **Stardance** is a review-mechanics reference. No compatible reuse license was identified.
- **Stasis** is a Hack Club hardware-hackathon/event-program reference. No compatible reuse license was identified; do not reuse its code, copy, or media without permission.

Do not copy Template or Stardance code or media without permission. Exact pins, rights, decisions, and comparisons are in [`docs/source-audit/`](docs/source-audit/).
