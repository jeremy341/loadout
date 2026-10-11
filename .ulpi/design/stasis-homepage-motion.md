# Stasis-inspired homepage motion (scramble headings, magnetic corners, hover facts, footer wordmark)

Status: implemented 2026-10-11. Scope: `apps/landing` homepage only; docs route untouched.

## UI-skill record

The seven skills in `docs/development/ui-skills.md` were not available in the session that built this (the skill catalog returned none of them). The owner told the session to proceed anyway. They were not used, and this change should be re-reviewed against them once they are installed. Source basis: `docs/source-audit/DECISIONS.md` (Stasis rows).

## Changes

1. ASCII drawings removed from the hero and all six sections (components and art data kept, unused).
2. `ScrambleHeadings`: each `.h2` scrambles once, the first time 40% of it is in view (about 0.7 s).
3. `MagneticCorners`: four brackets around each hero button; open and lean toward a mouse within 50 px.
4. `HoverScramble`: the three hero facts scramble per letter under the pointer.
5. `FooterWordmark`: the LOADOUT wordmark across the foot of the footer, lit around the pointer.

## States and interactions

- Headings: idle (real text) → in view (letters random, locking left to right with jitter) → settled (original text nodes restored). Runs once per heading per page load.
- Corners: idle (static, 55% opacity) → near (data-active: full opacity, 8 px offset, lean 8% of pointer offset) → released at 60 px. Hover/press of the button itself is unchanged.
- Facts: hovering a letter scrambles it and its two neighbours for about 0.2 s; a letter cannot restart until it settles.
- Wordmark: static faint base; a brighter copy shows through a 280 px radial mask at the pointer.

## Responsive

- Hero buttons keep their sizes; the wrapper takes over the flex sizing at 800 px and 370 px. Brackets sit 5 px outside the buttons (12 px gap on phones leaves room).
- Wordmark scales with `clamp(64px, 19vw, 300px)` and matches the footer's side padding at each breakpoint.
- Touch: no pointer effects (corners and wordmark stay static).

## Accessibility

- Reduced motion: headings, facts and corners do not animate; grain behavior is unchanged.
- Headings keep their real text in the DOM; while scrambling, the heading's `aria-label` is the real text. Hero facts keep a visually hidden copy; the lettered copy is `aria-hidden`.
- Corners and wordmark are `aria-hidden` and never take pointer events. Links and buttons keep their names, focus order and focus rings.

## Acceptance criteria

- No ASCII drawing on the page; no horizontal scroll at 320, 390, 768, 1440 px.
- Headings end with their original text and no leftover `aria-label` or letter spans.
- Corners wake up near a mouse and stay still under reduced motion.
- Facts return to their text after hover.
- `bun run lint`, `typecheck`, `build` and the Playwright suite (27 tests) pass.
