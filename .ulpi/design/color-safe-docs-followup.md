# Color-safe palette and Docs follow-up

Status: owner-requested follow-up after the 2026-10-17 production release. Implement on a short-lived branch and use the normal PR lanes.

Implementation scope update, 2026-10-18: the owner requested unchanged normal UI and effects, allowing a new footer Accessibility entry point. [The approved implementation brief](accessibility-preferences-preserve-ui.md) owns settings placement, shared preferences, semantic fixes and verification. The earlier proposal to add a button beside the theme switch is superseded by the footer entry point.

## Design read

Reading this as two practical improvements for teen builders: a persistent color-safe option in LOADOUT's existing industrial field-manual UI, plus clearer public Docs about the program and its fictional characters.

## Direction

Keep the established field-manual design system. The palette control is a compact labeled button beside the current theme switch; it changes accent tokens only and preserves the visitor's light/dark choice. Do not add filters, gradients, new art, or motion. The Docs continue using flat Markdown content and the current sidebar.

### Color-safe palette

- Add one persistent **Color-safe palette** toggle on the homepage, Docs, and the 404/cave-in shell.
- The button uses a native `<button>`, a stable accessible name, `aria-pressed`, visible on/off wording, keyboard focus, and the site's hard-edge button treatment.
- Keep light/dark theme preference separate. Persist the color-safe preference in local storage and synchronize it across routes/tabs.
- Dark safe accents: blue `#56B4E9` and orange `#E69F00`; light safe accents: blue `#005A8D` and dark ochre `#7A4600`. Pair accent backgrounds with readable text; keep shape, underline, labels, and existing icon outlines so color is never the only cue.
- Contrast targets against the current page backgrounds: dark blue on `#222627` 6.62:1, dark orange on `#222627` 6.78:1, dark ink on dark blue 7.66:1, light blue on `#DDD3BF` 4.97:1, light ink on light blue 6.69:1, and light ochre on `#DDD3BF` 5.23:1.
- Forced-colors mode continues to use system colors. The control must not interfere with reduced motion, zoom, or keyboard navigation.

## Public Docs changes

- `team.md` is for real organizers and their roles only. Remove the Orry and Goose Lee character profiles from it; retain the existing organizer anchors. A short link may point readers to the separate character page.
- Add `characters.md` under COMMUNITY. Mark the profiles as fiction and write from the friend-facing source files. Use internal backstories only to verify details; do not publish open questions, unconfirmed accident mechanics, or private notes.
- Keep identity respectful and explicit: Goose Lee's mistaken belief that his background gives him Bruce Lee's martial-arts talent is his own misconception, not a claim about Asian people.
- Make the `start.md` overview explain the proposed program and its distinct loop plainly, while keeping its development/not-open status accurate.
- Explain the Ore rating as the multiplier on approved hours in `progress.md`: e.g. 10 approved hours at rating 10 earn 100 base Ore. Keep the separate +10% Era example labeled planned and do not invent a stacking rule or an XP formula.

## Component and content states

| Surface | State | Expected result |
|---|---|---|
| Homepage / Docs | Default palette | Existing colors and content are unchanged. |
| Homepage / Docs | Color-safe on | Safe accent tokens apply while light/dark mode remains unchanged. |
| Any route | Reload or route change | Saved color-safe state is restored. |
| Any route | Storage unavailable | Toggle works for the current page; the default palette remains usable. |
| Any route | Forced colors | System colors stay legible and the button remains operable. |
| Docs | Character page | Fiction label appears; only friend-facing story is public. |
| Docs | Program explanation | Multiplier example uses the approved hours × rating rule and separates Ore from Track XP. |

## Acceptance

- The color-safe button is available on homepage, Docs, and error pages; its name, pressed state, focus, persistence, route synchronization, and mobile reflow are tested.
- Axe checks pass on homepage and Docs in both themes with the palette enabled. The project remains usable with forced colors and reduced motion.
- Team and character pages are clearly distinct. Existing organizer anchors remain valid; a route/link check covers the new character page.
- Public claims match Plans 01 and 02. The example does not publish unsettled multiplier aggregation, XP weighting, or Era stacking.
- Lint, typecheck, unit tests, production build, relevant browser tests, and `git diff --check` pass.
