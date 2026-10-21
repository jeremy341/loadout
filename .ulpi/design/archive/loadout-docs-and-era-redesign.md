> **Archived 2026-10-20:** completed or superseded design brief, kept for provenance. Current visual authority: [design system](../../../docs/design/system/design-system.md).

# LOADOUT Docs and Community Era Redesign

**Status:** Superseded by the approved Docs refresh brief in [`docs-refresh.md`](docs-refresh.md) and the current public Era overview in [Plan 11](../../../plans/11-eras-and-community-progression.md). Keep as historical research only; do not treat these earlier content/layout proposals as the active Docs specification.

## Design Read

An industrial field manual that feels like a usable build dossier, not a marketing microsite: paper, graphite, ruled evidence, and practical depth.

## Locked direction

**Technical / utilitarian** within LOADOUT's existing **industrial / signage** identity. The docs should be recognized as LOADOUT even without the logo through the graph-paper background, Jersey 10 headings, IBM Plex Mono reading voice, graphite navigation plates, thin ink rules, and Bolt Yellow evidence markers.

Every screen must read as the same product if placed side by side.

## Product truth to cover

Use the canonical plans as the source of truth:

- `plans/00-index.md`
- `plans/01-product-and-program.md`
- `plans/02-economy-and-rewards.md`
- `docs/design/system/design-system.md`
- `plans/11-eras-and-community-progression.md`
- `plans/02-economy-and-rewards.md`
- `plans/15-loadout-irl-ruhr.md`
- `plans/06-public-homepage.md`
- `.ulpi/design/community-era-overview.md`

The public docs must explain, without inventing live values:

- LOADOUT identity and the Digital Loadout / Physical Loadout loop.
- Project fit gate and examples of strong/weak technical signal.
- Four tracks: Tools, Systems, Compute, Hardware.
- Research Mode as an optional modifier, never a fifth track.
- Tracking, journals, Hackatime, and Lapse as planned tools.
- Shipping, validity review, quality dimensions, and documentation expectations.
- Bolts versus lifetime Track XP.
- Levels, track pricing, discounts, Requisitions, and Custom Orders.
- Community Eras, optional objectives, Era Points, cadence rules, and the planned +10% qualifying-project Bolt bonus.
- Seasons versus Eras versus weekly resets.
- Team projects, AI use, appeals, anti-abuse, and current development status.

Do not present unconfigured dates, thresholds, inventory, prices, eligibility promises, or launch schedules as live facts.

## Page architecture

Keep the existing route-per-page information architecture, but redesign the shell:

- `/docs` redirects to `/docs/start`.
- Persistent left rail: LOADOUT mark, return link, grouped route navigation, active route.
- Main reading canvas uses the same graph-paper background as the homepage and a narrow 65–75ch reading measure.
- Right rail is a quiet “on this page” evidence index, not a second navigation system.
- Every page gets previous/next navigation and a “source status” note when content is planned/configurable.
- Use ruled sections, comparison ledgers, process diagrams, and evidence tables. Avoid generic equal card grids.
- The first `/docs/start` page should establish the core loop with a large ruled diagram and short “what LOADOUT is / is not” table.

## Project Fit UI

Replace the homepage's current project-fit cards with a four-row comparison ledger using all four canonical examples:

1. Workflow command-line tool — stronger signal.
2. Inference runtime — stronger signal.
3. Copied tutorial site — weaker signal.
4. Basic AI chat screen — weaker signal.

Each row includes signal label, project title, explanation, and a restrained status marker. No card lift, no large shadow, no animated padding. On mobile, rows stack with the status label below the explanation.

## Community Eras UI

- Remove the visible label **“Planned community concept”** entirely.
- Keep the section title and explanatory copy focused on community technical progression.
- Make the existing “Build the next Era” block a clear three-stage ruled sequence:
  `Approved projects` → `Shared Era Points` → `Next technical theme`.
- Use a prominent but compact yellow “+10% planned qualifying-project Bolt bonus” evidence cell.
- Explicitly state Era Points are separate from Bolts and Track XP.
- Do not show fake progress bars, countdowns, thresholds, dates, or named future eras as live facts.

## Motion and states

- Reduce hover to color/rule emphasis only. No card lift, padding expansion, or large shadow changes.
- Preserve a short 120–160ms color/border transition.
- Focus state: 2px ink outline with 3px offset.
- `prefers-reduced-motion`: transitions removed.
- Native details/summary FAQ and grouped nav remain keyboard operable.
- Long docs pages must remain readable at 320px wide with no horizontal overflow.

## Acceptance criteria

- Docs visually belongs to the LOADOUT homepage, not Pixl.
- `/docs` and every existing `/docs/<slug>` route still work.
- All canonical product facts above are findable within the docs.
- “Planned community concept” is absent from the rendered homepage and docs.
- Homepage Project Fit renders four rows with restrained states.
- Community Era block has clear three-stage UI and planned bonus explanation.
- Desktop, tablet, and 320px mobile have no horizontal overflow.
- Typecheck, lint, route checks, and the existing homepage test suite pass.

## Build handoff

Target: Next.js senior engineer.

Implement exactly this spec. Theme the implementation with the locked LOADOUT design language in `.ulpi/design/DESIGN.md`; do not redesign the identity or reintroduce Pixl styling.
