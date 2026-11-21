# Redesign: the Shop

Binds to `.ulpi/design/DESIGN.md` and `docs/design/system/design-system.md`. Plan: `plans/proposals/participant-redesign-plan.md` (Shop parts) and `plans/proposals/participant-redesign-decisions.md`. Comparison: `plans/proposals/shop-redesign-comparison.md`. Written 16 Nov 2026, before code.

**Design read.** A parts counter for teenage builders: scan many items fast, see what each costs in Ore and in hours, and see at once what is locked. LOADOUT's look stays: graphite and stone, Pixelify headings, IBM Plex Mono body, DotGothic16 labels, square corners, 1px outlines, hard offset shadow, no blur or glow, track colours. Dials: variance 2, motion 1, density 4. Only layout is taken from Pixl and Stardance. No new asset, no new icon.

Skills loaded for this change: frontend-design-ui-ux, frontend-design, design-taste-frontend, mobile-responsiveness, accessibility.

## Layout

| Width | Grid | Notes |
|---|---|---|
| 1280px and up | 4 columns, 16px gap | Inside the normal 1080px column (about 1032px of content), each card is about 246px. At 1280 it is about 236px. |
| 700 to 1279px | 3 columns | At 900 the sidebar is back, so cards are about 190px. |
| under 700px | 2 columns, 12px gap | Compact padding. A 320px screen fits two cards of about 140px. |

Owner change, 16 Nov 2026: the shop keeps the same fixed 1080px column as the other platform pages. It is not stretched to the window width. Four cards fit inside it with readable text.

## Card anatomy (one height)

```
+---------------------+
| photo 4:3  [badge]  |   Limited, or Needs Tools LV.5
+---------------------+
| KIND                |
| NAME (2 lines)      |
| (o) Tools  +1       |   one line of tags
| [ore] 420  -15%     |   price row
| 28 H of work        |   hours row
+---------------------+
```

The whole card is one link. Equal heights come from reserved lines (name two lines, tags one line) and a grid that stretches. A locked card shows the lock badge on the photo; the price stays visible.

## Hub

1. Search: one field, one button, works without script.
2. Tag chips: All items, Tools, Systems, Compute, Hardware, General. Always visible, just under the search. Same links and URL params as before (`?tag=`, `q`, `sort` and `afford` are kept). On desktop the row is sticky under the top bar so it stays in view while the grid scrolls. On a phone it scrolls sideways inside its own row, never the page.
3. Track discount strip: four links, each "Track, N% off".
4. One closed line: "Ordering opens in a later release. These are proposed items at draft prices."
5. Recently added rail and Within reach rail (hidden when empty, and when a filter is on they still show only on the plain hub). Rail cards match the grid card width.
6. All items: heading, sort links and Affordable only, count line, grid, Show more.

Owner change, 16 Nov 2026: the big category tiles (Tools, Systems, Compute, Hardware, General with item counts) are removed. The chips replace them.

Empty states use `EmptyState`: no items match (Clear the filters), nothing affordable (Show everything), empty catalog.

## Item page

Desktop (900px and up): breadcrumbs, then two columns. Left: the photo, credit, About, Related rail. Right: the price box, sticky. Phone: one column, photo then the price box then About.

Price box order: kind, name, Ore price, hours of work, lock reason (if any), the price workings (base, level discount, you pay), Field Requisition note, closed order button with its reason.

## States and copy

- Closed order button: "Order opens later", `aria-disabled`, described by the closed note.
- Lock: "Needs Tools LV.5. 40 more approved hours in Tools to unlock it."
- No wishlist star and no Ore panel anywhere in the shop.
- Plain English, short sentences, no dashes as punctuation.

## Accessibility

Targets 44px or more for links and buttons. Focus outline in `--pf-focus`. Colour is never the only sign: locks and discounts are words. Price has an sr-only "Was ... now ...". The count line is a polite status. No horizontal scroll from 320px up.

## Tests

Unit: `shopGridColumns(width)` helper in `lib/platform/shop.ts` (4 from 1280, 3 from 700, else 2). Playwright: four cards on one row at 1440, three at 900, no side scroll at 320, 390, 471, 700, 900, 1440, and screenshots at 1440 and 390 in dark and light.
