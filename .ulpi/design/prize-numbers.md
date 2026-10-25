# Prize numbers

Status: in progress on the main checkout (fix/mole-mood-timing), uncommitted.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Typography" (type roles), "Icons" and "Prizes" (planned prize cards).

## Design read

Reading this as: a landing page for teenage builders, in the locked industrial signage language, where the numbers are the message. A reader has to see "500 Ore" at a glance. Pixelify Sans at 12 to 24px made the 5, 0 and 8 hard to tell apart, so the numbers moved to Jersey 10.

## Scope

- In: the number readout in the How it works calculation (`.we-calc b`), the Ore figure on each planned prize card, one new prize card (flight grant, 20 Ore, shown with the ticket sprite), and the prizes table in `content/docs/prizes.md`.
- Out: headings, buttons, body copy, the belt's motion and controls.
- Visitors see Ore only. The base rate (10 Ore = $4.25) is internal, so no USD figure appears on the homepage or in the docs. The flight card's "$10" is the grant's value, which is what the item is.
- Owner price change, 25 Oct 2026: the two 3D printers go up 20%. Bambu Lab A1 Mini 525 to 630 Ore, enclosed 3D printer 870 to 1,045 Ore (rounded to the nearest 5). The other values are unchanged, and the price basis for them is still open.

## Decisions

1. **Numerals use Jersey 10 (`--font-display`).** It is the wordmark face the design system already locks, and its digits stay distinct at small sizes. Only one pixel font per readout.
2. **Prize cards show the Ore figure only.** The Ore figure sits in Jersey 10 at 32px under the example name.
3. **The flight grant uses `ticket.png`**, one of the saved 32 by 32 sprites. It is shown at 128px, an exact 4x, with `image-rendering: pixelated`, centred on the white plate. In dark mode it takes the same hue rotation as the other icons.

## States

| State | Behaviour |
|---|---|
| Desktop | Calculation numerals in Jersey at their set sizes; prize cards show the Ore figure in Jersey. |
| Phone | Same numerals at the phone sizes; the sprite stays at 128px inside the plate. |
| Dark and light | Numerals use the existing `--fg` and `--ac` tokens; the sprite takes the icon hue rotation in dark mode only. |
| Reduced motion | No change; there is no motion in this brief. |
| Belt paused | Nothing moves; the figures stay readable. |

## Accessibility

- Numerals stay real text, so screen readers read "500 Ore".
- The calculation keeps its `role="img"` aria-label, so the font change does not change what assistive technology hears.
- The flight card's sprite is decorative (`alt=""`), since its name sits beside it.
- Contrast is unchanged: the numerals keep their existing colour tokens.

## Skills

Loaded for this change: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`. Applied: type and layout craft, and the Icons rules in the design system (the site's own 32 by 32 sprites, pixelated, never smoothed). Not applicable: motion (no animation changes), SVG (no new marks), sprite creation (an existing sprite is reused unchanged), animator (no frames).

## Acceptance

1. In the calculation boxes, "50", "10", "500" and the "$" glyphs are distinct at 1x, checked by screenshot.
2. Every prize card shows its Ore figure only. No "About" or USD text appears anywhere on the homepage or in `content/docs/prizes.md`.
3. The flight card shows `ticket.png` at 128px with pixelated edges, inside its white plate, with the name "$10 flight grant" and "20 Ore".
4. The belt holds nine cards, and `e2e/prize-photos.spec.ts` expects nine.
5. The prizes table has a row for the flight grant, 20 Ore, about 2 approved hours.
6. Typecheck passes and the docs tests pass 7/7.
