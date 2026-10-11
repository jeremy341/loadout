# Docs tag, motion, theme, depth markers, hero size (batch 3)

Status: implemented 2026-10-11. Scope: `apps/landing` homepage and the docs route styling. Plan: the approved batch plan in the working session; the numbers below are what shipped.

## UI-skill record

The seven skills in `docs/development/UI_SKILLS.md` were not available in the session that built this. The owner told the session to proceed. They were not used; re-review against them once installed.

## Changes

1. LOADOUT DOCS tag copies Pixl's bottom tab (`references/pixl/apps/landing/app/_components/LanguageSwitcher.tsx`): fixed to the bottom edge, Pixelify Sans 16/18/20px, borders 2/4/4/2px growing to 6px on hover. The docs route buttons use the same look. The footer bottom bar gets right padding so the tag does not cover its text.
2. Motion matched to main (cd1834a): `Reveal` ported to `app/_components/home/Reveal.tsx` and wrapped around each section, card stagger, hero entrance keyframes, scroll cue, level markers, button and card hover and press. The scroll-scrubbed `rv` fade was removed.
3. Dark theme lightened: background #2F2B26 (was #211E1A), plates #3A352F/#34302A, muted text #B3A995, strata gradient .18 (was .4). Docs tokens match.
4. Depth markers ("-000 M") are 160px strips with an 88px number (110px and 52px on phones).
5. Hero sized to the redesign reference at 1440: 122px title (`clamp(48px, 8.5vw, 124px)`), 260x52 buttons, full-bleed hero, corner labels moved below the nav.
6. Magnetic corners: activate 40px, release 48px, lean 4% capped at 4px.
7. Footer wordmark glow in light mode is yellow (#E3C26B).

## Acceptance

- No horizontal scroll at 320, 390, 768, 1440px; headings and buttons keep their names and focus order.
- Reduced motion turns off the hero entrance, reveals, stagger and the corner lean.
- `bun run lint`, `typecheck`, `build` and the Playwright suite (36 tests) pass.

## Later changes (same day)

- Dark theme changed to the redesign reference's own values: page #141210, plates #2B2723/#25211D, strata .4. All grain effects were removed (homepage and docs). A ruler of tick lines runs along the top edge above the nav, as wide as the nav bar.
- New logo (`app/_components/home/Logo.tsx`): a pixel slot-and-bolt mark with a heavy 6x9 pixel wordmark, themed through `--fg`, `--logo-bg`, `--logo-fg`. Used in the nav, footer, docs sidebar and `app/icon.svg`. Designed by hand; the SVG and pixel-art skills were not available.
- Nav RSVP button is 30px tall like the colour chooser (both 44px on phones).
- Hero stamp, corner labels and side words moved down and inward; community panel and footer sheet backgrounds made see-through.

## Dark palette fix

Measured causes of the odd dark look: three different box fills (#2B2723, #141210, see-through), a black gradient (.4) that darkened the page toward the bottom, cream outlines on every box, and no accent. Now: page #1C1916, one box fill #27231F, outlines rgba(239,230,212,.28) on content boxes (controls keep strong outlines), no bottom darkening, amber #E3A83F for small highlights only (links, markers, FAQ plus, step numbers, level-rail line, corner brackets). Contrast: body text 12.6:1, muted text 5.9:1, amber 7.4:1 on the box fill. Light mode unchanged. Docs tokens match.

## Logo restyled like main's buttons

The logo is now a sand badge with a 2px border, 2px radius and a hard 2px block shadow (main's `.button` look; border and shadow are cream in dark mode and ink in light mode) holding a pixel bolt, next to the name in Jersey 10 (36px, 31px on phones and in the footer). It replaces the earlier pixel-letter wordmark. Used in the nav, footer, docs sidebar and `app/icon.svg`.

## Buttons

Buttons (nav RSVP, hero RSVP and Explore tracks, hero badge) follow main: Pixelify Sans bold capitals, 2px border, 2px radius, hard block shadow that grows on hover and drops on press (border and shadow are cream in dark mode, ink in light mode).

## Numbered rulers and filler clean-up (11 October 2026)

Skills loaded for this batch: frontend-design, design-taste-frontend, web-design-guidelines, accessibility, copywriting. The other names in `docs/development/UI_SKILLS.md` (frontend-design-ui-ux, emilkowal-animations, svg-design, pixel-art-sprites, Pixel Art Animator) are not installed on this machine and were not used.

Design read: event landing page for teenage technical builders, in a Ruhr mine and drawing-sheet language; the redesign is preserved, so the dials stay where the page already is.

- `SheetRuler` (app/_components/SheetRuler.tsx, app/ruler.css) draws a numbered top edge (00 to 12) and a depth scale down the left edge, on the homepage and inside the docs main pane. On the homepage the scale is pinned to the depth markers, so the tick labelled -300 sits beside the "-300 M" strip. Both rulers are decorative (aria-hidden); phones keep the ticks and drop the side numbers.
- Removed repeated filler: the "FIG. 0X" rows that restated each marker and heading, the identical status line on the four track cards, "Technical signal" above the fit rows, "Outcome" and "Planned prize" labels, long dashes, and the stale date in the footer sheet (now the current year, status "In development").
- Running text is IBM Plex Mono on the homepage and docs; DotGothic16 is kept for short labels. Track and planned-prize cards size to their content.
- The scroll cue reads "Begin the descent"; selection and scrollbar colours follow the theme.

## Grain, rulers and docs redesign (11 October 2026)

- Grain: `NoiseGrain` is the Stasis-style film grain, a full-screen canvas of random grey noise at 30% opacity redrawn every 100ms (it was 20%, the Stasis value, which is invisible on the graphite and beige backgrounds), on the homepage and the docs. Reduced motion gets one still frame. This replaces the pixel-tile grain tried the round before.
- Rulers: the homepage has a pixel ruler along the top (tick every 32px, number every 160px) and one down the left edge (heavy mark every 800px). The right-hand ruler and the docs rulers were removed.
- Docs: restyled after the Pixl docs. Boxed sidebar with a 4px right rule and collapsible groups (label, count, chevron), Pixl's block back button, ink hover and sand active links, Pixelify Sans headings at 46px and 30px, Poppins text (loaded on the docs only), 2px rules with 4px block shadows on fact rows, callouts, quick answers and previous/next cards, and an "On this page" list that marks the section being read. The drafting grid behind the docs was dropped.

## Old icons, depth ruler, no scroll darkening (11 October 2026)

- Icons: the cards use the first site's pixel sprites (`public/loadout/sprites`) again, as `<symbol>`s in `ICON_SPRITE`. The theme tints them with a filter: as drawn in light mode; in dark mode the yellow is pulled toward the sand of the RSVP button and each icon gets a faint sand edge, because the old black outlines vanish into the dark cards.
- The page no longer darkens as you scroll: the `.strata` overlay is removed in both themes.
- The left ruler is the depth of the page in metres, pinned to the depth strips. The ticks are every 10 m and the numbers every 50 m, and the heavy mark beside each "-N M" strip reads the same number ("-500" beside the "-500 M" strip). Above the first strip it counts up (+). The top ruler stays in pixels. The right-hand ruler stays removed.

## Main's levels rail, old logo and missing animations (11 October 2026)

- Track XP and levels: the rail follows main's: five stops with a 64px requisition marker (no hexagon badge), an ink arrow between stops, the level in Pixelify 26px and the award in 16px, and plain text for "Choose where to grow.". The scroll-driven amber line is gone.
- Logo: the first site's hexagon mark (yellow hexagon, dark inner hexagon, yellow cross, 32px) with the Jersey 10 name, in the nav, footer and docs. The favicon is main's again.
- Animations ported from main: the Bolt icon nudge in the process outcomes, the era connector entrance and the IRL status entrance. The level markers already entered in sequence; their delays now start at the second marker. All of it is off under reduced motion. Main's drifting clouds were tried and removed at the owner's request; its skyline and registration marks are not brought back.

## Dark theme: graphite, blue and teal (11 October 2026)

The warm charcoal dark theme felt flat next to the light one: one low-saturation brown family, a washed-out sand accent and boxes that barely left the page. The dark theme is now the first site's graphite and Bolt Yellow with a cool secondary:

| Token | Value |
|---|---|
| Page | #222627 |
| Boxes and docs panels | #2C3132 |
| Text / muted text | #E9EBE7 / #A7AEAB |
| Primary accent (buttons, logo, docs tab, markers, icons) | blue #5E9EF4 with #16191A text |
| Secondary accent (links, brackets, ruler marks, active contents item, selection) | teal #6FC2BB |
| Box outline | rgba(233, 235, 231, .22) |

The old pixel icons are no longer desaturated or edged in dark mode. Light mode is unchanged.

The yellow of the first draft of this palette (#E0BD55) was then changed to blue (#5E9EF4) at the owner's request, everywhere in dark mode: buttons, logo, docs tab, docs links, markers, stamp and footer wordmark. The old icons are turned from yellow to blue with a hue rotation in dark mode and stay yellow in light mode.
