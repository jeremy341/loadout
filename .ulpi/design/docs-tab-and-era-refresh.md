---
feature: docs-tab-and-era-refresh
register: brand
aesthetic_direction: industrial / signage
design_system: bespoke
---

# Docs Tag + Community Era Refresh

## Design read

Turn the fixed docs tag into a small piece of equipment being armed, and make Community Eras read as a technical operating sequence rather than a pair of marketing cards.

## Locked identity

Bind this work to `.ulpi/design/DESIGN.md`. Use only the existing LOADOUT canvas, surface, ink, graphite, rule, muted text, and Bolt Yellow tokens. Keep IBM Plex Mono for utility/body copy and Jersey 10 or Pixelify Sans for short display labels. No gradients, glow, glass, rounded SaaS cards, or new colors.

## Docs tag

### Purpose

The fixed `LOADOUT DOCS` link is a visible entry point to the field manual. It should feel like a physical yellow pull-tab attached to the page, not a floating app button.

### Visual and motion treatment

- Preserve its fixed bottom-right placement, keyboard focus, accessible name, and direct `/docs` navigation.
- Add a small two-phase idle signal: a 2px upward nudge followed by a return, then remain still. Run once on initial appearance and replay on hover/focus, never continuously.
- On hover/focus, use only a slight `translateY(-2px)`, yellow highlight, and a 1px ink offset shadow. Do not scale, rotate, or add a large shadow.
- Respect `prefers-reduced-motion`; remove the nudge and transform while retaining color/border feedback.
- Keep the tab readable and at least 44px tall. On narrow screens, keep it within the viewport and avoid covering important content.
- `:focus-visible` must remain a strong ink/yellow focus treatment.

## Community Era composition

### Structure

Keep the existing heading and canonical description. Replace the current concept rail + two fact boxes with:

1. **Technical timeline**: three equal stages in one ruled plate:
   - `01 / PROPOSE` — the community aligns on optional technical objectives.
   - `02 / BUILD` — qualifying projects contribute shared Era progress while normal Bolts and Track XP remain separate.
   - `03 / ADVANCE` — the Era resolves into the next community state; lifetime progress is not reset.
2. **Evidence plate** beneath it with three compact cells:
   - `ERA POINTS` — shared progression signal, not spendable Bolts.
   - `TRACK XP` — persistent personal track progress, not an Era reward.
   - `+10% PLANNED` — qualifying projects may receive 10% of approved base Bolts; final launch configuration is still being finalized.
3. A single muted note clarifying that Eras, seasons, and weekly resets are different concepts and that unconfigured dates/thresholds should not be shown.

### Interaction and motion

- Timeline cells may reveal a yellow top rule on hover/focus only; no lift or large shadow.
- The bonus cell gets the yellow surface treatment and an ink border so it reads as evidence, not a progress meter.
- Do not invent progress bars, dates, thresholds, live status, prize inventory, or launch claims.

### Responsive behavior

- At desktop, three columns with ruled separators.
- At mobile, one column with horizontal separators and 16px minimum body copy.
- The plate must fit within 320px width without horizontal overflow.

### Accessibility

- Keep the timeline as an ordered list.
- Keep evidence as a labelled group.
- Preserve visible keyboard focus and sufficient contrast.
- Motion must be disabled under reduced-motion preferences.

## States and edge cases

- Initial page load: one restrained docs-tab signal only.
- Hover/focus: local color/border feedback; no layout shift.
- Reduced motion: no animation.
- Narrow viewport: tab and Era plates remain fully visible and wrap without overflow.
- Keyboard navigation: docs tab and all links remain reachable in normal DOM order.

## Build handoff

Target: Next.js App Router engineering agent.

Implement exactly this specification using the existing bespoke CSS and semantic React structure. Do not redesign the rest of the homepage, alter docs routes, or change canonical Era facts. Run typecheck, lint, focused homepage tests, and a 320px/390px overflow check.

## Acceptance criteria

- The docs tag has a restrained one-shot signal and subtle hover/focus feedback.
- The docs tag still links directly to `/docs` and remains keyboard accessible.
- Community Eras use a three-stage technical timeline and a three-cell evidence plate.
- `+10% PLANNED` remains clearly marked as planned, with no invented live values.
- No horizontal overflow at 320px or 390px.
- `prefers-reduced-motion` disables the new motion.
- Typecheck, lint, and focused tests pass.
