# LOADOUT hero atmosphere

**Status:** Implemented locally and verified during the redesign-foundation pass  
**Surface:** Public homepage hero and shared paper background  
**Audience:** Prospective builders scanning the LOADOUT program overview  
**Reference:** `Loadout – Redesign.html` (warm light-paper direction only)

## Design read

**Coalfield field manual:** warm stone paper and disciplined print grain set the page; ASCII hoist and headframe studies place the hero in a technical workshop without turning the background into an image asset.

## Scope

- Shift the shared palette from cool grey to warm stone, coal ink, subdued Bolt Yellow, and a small rust accent.
- Keep the paper grid and add only a faint, even print-grain layer.
- Frame the existing hero with static, decorative ASCII mine structures.
- Keep the current section order, copy, links, content, and interactions unchanged.
- Do not use the prepared hero-workshop PNGs or introduce new raster scenery. The old cloud SVGs were removed with the abandoned hero workshop on 2026-10-20.
- Remove the separate industrial skyline background so the ASCII treatment carries the workshop reference in the hero.

## Visual tokens

Use the shared tokens in `docs/design/system/design-system.md`: canvas `#DDD3BF`, surface `#E9E2D4`, muted surface `#D2C8B7`, ink `#1A1714`, muted text `#5A5145`, graphite `#29241F`, Bolt Yellow `#D7B34D`, and limited rust `#C4491F`. The 24px grid remains primary; the 120px guide and grain stay subordinate to text.

## Component and responsive behavior

- Existing hero title, supporting copy, calls to action, facts, badge, frame, and scroll cue retain their markup and order.
- ASCII studies are fixed-width `<pre>` content with `aria-hidden="true"`, no pointer events, and no animation. Position them outside the central text/action area on wide desktop.
- Hide the ASCII details before they collide with side labels or buttons at tablet/mobile widths. Keep all actual content visible.
- The current hero uses the ASCII treatment; the old PaperScenery cloud motion and scenery SVGs were removed on 2026-10-20.
- Keep page and Docs route scrolling behavior unchanged.

## Accessibility and acceptance

- Text and controls retain readable contrast; decor never carries program information.
- No horizontal overflow at desktop, tablet, or mobile widths.
- Reduced-motion settings keep ASCII art static.
- The page uses no prepared workshop PNGs as a background.
- Existing section content, anchor links, actions, and order remain unchanged.
- Run the app build and inspect desktop plus narrow viewport renders before reporting completion.

## Implementation handoff

Implement the brief in `apps/landing/app/loadout.css`, `apps/landing/app/_components/LoadoutHero.tsx`, and `apps/landing/app/_components/PaperScenery.tsx`. Do not change product copy, pricing, eligibility, RSVP semantics, homepage section order, Docs behavior, or asset source files.
