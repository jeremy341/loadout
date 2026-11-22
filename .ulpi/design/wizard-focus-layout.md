# Wizard focus layout (staging)

Binds to `.ulpi/design/DESIGN.md`, `docs/design/system/design-system.md` and `.ulpi/design/redesign-phase-2-wizard.md` (flow, copy and states stay as written there). Written 22 Nov 2026, before code. Staging only: see `docs/development/staging-posture.md`. This pass changes layout, not flow or copy.

**Surface.** `/dashboard/projects/new`, in the `(focus)` route group (`FocusFrame`, `focus.css`). **Status.** Staging; the page is not for live use.

**Design read.** One question per screen on a quiet, dark engineering-paper page. The target (owner screenshot, 22 Nov 2026) is: no sidebar, no topbar, no koi; a centred question; two compact cards with a small icon each; a thin progress strip with a close on its left; one small Next button at the bottom right of the column. LOADOUT's own look stays (graphite and stone, Pixelify headings, IBM Plex Mono body, DotGothic16 step labels, square corners, 1px outlines, no glow). The target's italic serif heading and rounded cards are not copied: the design system bans a new font, a new radius and soft SaaS panels. Dials: variance 3, motion 2, density 3.

Skills loaded for this change: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites, pixel-art-animator. Applied: the first five. The two icons are small hand-drawn `crispEdges` SVG marks (svg-design). No sprite is made, no frame animation (pixel-art-sprites and pixel-art-animator not applied).

## Layout

- One centred column, 600px at most. Strip on top; the close sits to the left of the strip from 1000px and above it below that.
- The question is centred and lowercase, in the page's vertical middle. Content below it is centred under it on step 1; on later steps the fields stay left aligned in the column.
- Step 1 cards: two columns, 12px gap, padding 16px, no fixed aspect ratio. A 36px square tile holds the icon (software: angle brackets; hardware: a chip). Name, then the approved hint. Selected card: full-strength border and brighter fill; the other dims. No tilt, no lift beyond the existing 4px hover.
- Progress strip: 3px segments (done and current use `--pf-state`, later ones use `--pf-rule`), labels 11px DotGothic16. The current label stays underlined so colour is never the only cue.
- Next: small button (44px high), the word "Next" and an arrow drawn in CSS-free markup (`aria-hidden`), at the right end of the column. Back stays on the left from step 2. Create project keeps its label.
- Backdrop: grid and film grain only. No koi.
- Accessibility tab: the shared fixed tab on the left edge, as on the homepage and the shell. Only its colours follow `--pf-*`.

## States

Unchanged from `redesign-phase-2-wizard.md`: Next is `aria-disabled` until the step is valid and says what is missing on press; errors in polite live regions; draft in `sessionStorage`; Close asks before dropping a typed draft.

## Responsive

No horizontal scroll at 320, 390, 471, 700, 900, 1440. Under 600px the cards stack, the Next button goes full width, 48px.

## Accessibility

Skip link first, then the accessibility tab, then the wizard. Targets 44px or more. Icons `aria-hidden`; card names stay the radio's accessible name. Focus outline `--pf-focus`. Reduced motion and "Reduce motion" turn all movement off. Forced colours: borders use `CanvasText`. axe on step 1 in both themes.

## Acceptance

1. No sidebar, no topbar, no koi on the page; the accessibility tab is on the left edge.
2. Heading centred and lowercase; two compact cards with icons; thin strip; small Next at the bottom right.
3. No sideways scroll at 390px.
4. The e2e helper still finds the radios by `Software` and `Hardware`, the button by `Next` or `Skip`, and the heading by `What kind of project is it?`.

Open item for the owner: the target's italic serif heading would need a new font. It is not added here.
