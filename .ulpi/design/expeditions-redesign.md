# Expeditions redesign (scoped brief, 17 Nov 2026)

Binds to `.ulpi/design/DESIGN.md` and `docs/design/system/design-system.md`. Review and decision: `plans/proposals/expeditions-redesign-review.md`. Replaces the list and detail parts of `.ulpi/design/expeditions.md`. Orders, Referrals and Events parts of that brief are unchanged.

Design read: guided mission board for builders aged 13 to 18, field manual look, a Stasis style search and card grid in our pixel language. Dials: variance 3, motion 1, density 5. No motion. No new fonts, colours, radii or icons. Skills loaded: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites, pixel-art-animator. The last four were consulted and gave no work: no motion, no new SVG, no new sprite.

## Flow

List: land, read one line, optionally search or pick a track, open a card. Page with Previous and Next. Detail: read what it is, read the next step, follow a link to the track or Docs. Submit is off until the release.

## States

- Default: six cards, in progress first.
- Search or track gives no match: EmptyState "No expeditions match." with a Clear link.
- Page past the end: shows the last page.
- Locked card: names the expedition to finish. Locked detail: next-step panel lists those as links, no step is marked current.
- Done: "Finished" in place of a next step, meter full.
- Unknown id: 404. Old `?status=`: redirect to the list.
- No script: the form is a GET with a Search button; the select applies on that button.

## Components

- `ExpeditionFilters` (client): one form, `role=search`, labelled input `q`, labelled select `track`, Search button. Select change calls `requestSubmit`. Full width at 320, select `min-width: 0`.
- `MissionCard`: `li` with the name as h2 link stretched over the card (one tab stop). Track tag, line, next-step line, meter and count, level and hours. Hard 1px border, `--pf-panel`, 4px hard shadow like other sheets, no radius.
- `ExpeditionPager`: nav "Expedition pages", Previous, "Page N of M", Next. Wraps at 320.
- Detail: `ex-next` panel (heading "Next step", step number, title, detail), steps list, side boxes.

## Accessibility

Visible h1 "Expeditions". Cards are h2. State is spoken, not colour only. Focus ring on the whole card. Contrast from platform tokens. No horizontal scroll at 320, 390, 720, 1440.

## Acceptance

List: one search, one select, no chip rows, one grid, paging by links, `?track` `?q` `?page` honoured, `?status` redirects. Detail: progress shown once, next-step panel present for in-progress, available, locked and done. Orders, Referrals, Wishlist and Events unchanged. axe clean in both themes.
