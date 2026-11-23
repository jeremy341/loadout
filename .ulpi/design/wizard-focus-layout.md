# Wizard focus layout (staging)

Binds to `.ulpi/design/DESIGN.md`, `docs/design/system/design-system.md` and `.ulpi/design/redesign-phase-2-wizard.md` (flow, copy and states stay as written there). Written 22 Nov 2026, before code; updated the same day for all steps, the koi and the focus-ring fix. Staging only: see `docs/development/staging-posture.md`. This pass changes layout, not flow or copy.

**Surface.** `/dashboard/projects/new`, in the `(focus)` route group (`FocusFrame`, `focus.css`). **Status.** Staging; the page is not for live use.

**Design read.** One question per screen on a quiet, dark engineering-paper page. The target (owner screenshots, 22 Nov 2026) is: no sidebar, no topbar; the koi pond swimming behind; a narrow centred column; a thin progress strip with a close on its left; the question in the vertical middle with its helper line; the fields under it; a small Back and a small Next at the bottom of the column. LOADOUT's own look stays (graphite and stone, Pixelify headings, IBM Plex Mono body, DotGothic16 labels, square corners, 1px outlines, no glow). The target's italic serif heading and rounded cards are not copied: the design system bans a new font, a new radius and soft SaaS panels (owner kept Pixelify, 22 Nov 2026). This is the one visual difference left against the screenshots. Dials: variance 3, motion 2, density 3.

Skills loaded for this change: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites, pixel-art-animator. Applied: the first five. The two icons are small hand-drawn `crispEdges` SVG marks (svg-design). No sprite is made, no frame animation (pixel-art-sprites and pixel-art-animator not applied).

## Layout (all steps)

- One column, 560px at most, centred. Strip on top; the close sits to the left of the strip from 1000px and above it below that.
- Strip: 3px segments (done and current use `--pf-state`, later ones use `--pf-rule`), labels 11px DotGothic16, lower case ("01 kind"). The current label stays underlined so colour is never the only cue. Hardware shows five segments. Software shows six, because its track has its own step (owner, 22 Nov 2026: six is fine). The lib's five steps and their rules are not changed.
- The question sits in the vertical middle (the body centres between the strip and the bar). Lower case, Pixelify.
- Bar: Back on the left from step 2, a small Next (44px high, word and a pixel arrow, `aria-hidden`) at the right end. Step 4 says Skip while no link is typed. Step 6 (or 5 for hardware) says Create project.
- Backdrop: grid, film grain and the koi pond (`PlatformBackdrop` with `sidebar={false}`), so the koi swim behind the column and no sidebar panel is drawn. The pond is decoration only and never takes input.
- Accessibility tab: the shared fixed tab on the left edge, as on the homepage and the shell. Only its colours follow `--pf-*`.

## Per step

1. **What kind of project is it?** Question and its hint centred. Two compact cards in two columns, 12px gap, 16px padding: a 36px square tile with a hand-drawn mark (software: angle brackets; hardware: a chip), the name, the approved hint. Selected card: full-strength border; no tilt, no lift beyond the existing hover.
2. **Which track is it?** (software only). Same centred question and "You can change it until you submit." Three compact cards (Tools, Systems, Compute) in a row, name and the approved line. Hardware skips this step.
3. **What's your idea?** Left aligned in a 480px body (the body is centred in the viewport; owner put this step back to left aligned, 22 Nov 2026, after the centring pass). Question and helper line, textarea, counter (no key hint: Enter in the box is a plain new line and never moves to the next step; Next does that), then "Need a spark?" in a quiet 11px label with "More ideas" as an underlined text control (44px hit area) on the same row, and three solid rows with a 1px rule border and left aligned text.
4. **What's it called?** Left aligned in the centred 480px body (owner, 22 Nov 2026, after the centring pass). Question and helper, a large name field underlined with a 1px rule (name left aligned in it), counter, a compact 300px live preview card and the public-by-default notice, all from the left edge of the body.
5. **Link it up.** Question and helper centred. Source and demo address side by side from 700px, stacked below it (labels and typed addresses left aligned), then the Hackatime or Lapse block. Optional step; Skip is the button label until a link is typed.
6. **Ready to start?** Question centred over one compact 300px preview card, centred. Create project posts once.

The step numbers above follow the software path. For hardware, steps 3 to 6 are 2 to 5 and the strip has five segments.

## Centring decision (22 Nov 2026, owner)

The question, helper line, fields and preview card sit on the viewport's centre line on every step except the idea and name steps, which the owner put back to left aligned inside their centred 480px body (see steps 3 and 4). Earlier, steps 3 to 6 were left aligned inside a 480px body, which read as left of centre even though the column itself was centred. Now: the 480px body stays centred in the 560px column, and everything in it is centred on that axis (heading, helper, key hint, counters under fields, "Need a spark?" head, spark rows, the 300px preview card, the notice). Text a person edits (the idea box and the link addresses) stays left aligned so it is easy to read and edit; the name field centres its text because it reads as the title. The progress strip stays at the top (close to its left from 1000px) and Back and Next stay at the bottom, unchanged. The koi, the accessibility tab, the small Next and Back and the five or six segment strip are unchanged. Measured at 1440 and 390 on the idea, name and review steps: heading, body, preview card and name field centres are all at half the viewport width (720 and 195), with no sideways scroll.

At phone width the gutter is now the same 48px on both sides (it was 48px left and 16px right), so the column is centred on the viewport and still clear of the fixed accessibility tab. No new font, colour, radius or motion. Focus: nothing changed; Tab still shows the `--pf-focus` outline.

## States

Unchanged from `redesign-phase-2-wizard.md`: Next is `aria-disabled` until the step is valid and says what is missing on press; errors in polite live regions; draft in `sessionStorage`; Close asks before dropping a typed draft.

**Focus on load (fix).** The wizard moves focus to the new step's heading, or to the field a server error names, only when the step really changes. It no longer runs on first load or on a restored draft, so no ring is drawn around the first question when the page opens. The old guard was a ref set on the first effect run; React Strict Mode runs effects twice in development, so the second run focused the heading. The guard now compares the step with the step focus was last moved for. Keyboard focus is unchanged: Tab shows the `--pf-focus` outline, and pressing Next with the keyboard still lands on the new heading with its outline (`:focus-visible`). After a mouse click the heading is focused but draws no ring.

## Responsive

No horizontal scroll at 320, 390, 471, 700, 900, 1440. Under 600px the cards stack, the Next button goes wide, 48px, and the column keeps a 48px gutter on both sides, so it stays centred and the fixed accessibility tab never covers the question.

## Accessibility

Skip link first, then the accessibility tab, then the wizard. Targets 44px or more. Icons `aria-hidden`; card names stay the radio's accessible name. Focus outline `--pf-focus`. Reduced motion and "Reduce motion" turn all movement off. Forced colours: borders use `CanvasText`. axe WCAG 2.2 AA on step 1.

## Acceptance

1. No sidebar and no topbar; the koi pond swims behind; the accessibility tab is on the left edge.
2. Every step matches the structure above: strip with close, question with helper, fields, Back and Next at the bottom.
3. No focus ring on any element after load; Tab still shows one.
4. No sideways scroll at 390px.
5. The e2e helper still finds the radios by `Software` and `Hardware`, the button by `Next` or `Skip`, and the headings by their words (including `Which track is it?`).

Open item for the owner: the target's italic serif heading would need a new font. It is not added here.
