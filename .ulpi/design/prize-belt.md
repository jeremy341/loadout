# Prize belt: the planned prizes move past on a slow belt

Status: implemented on the feature/prize-belt branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Motion", "Cards and rivets" and "Depth markers and rulers".

## Design read

Reading this as: a landing section for teenage builders, in the locked industrial and signage language, leaning on the pixel sprites already in the page. The owner compared the site with Pixl and the YSWS template. Both show their prizes in a looping carousel on the homepage, with a picture and a name per item. LOADOUT showed eight icon cards in a static grid, which looks like a table of contents rather than a shop window.

Direction: a mine conveyor. The cards are the same riveted cards as the rest of the page and travel left on one slow belt, as ore does through a shaft. Counterfactual test: a generic logo marquee could sit on any site; riveted cards on a belt, with the mine's own sprites, belong to this one.

## Scope

- In: the "Planned prizes" section (`app/_components/home/PlannedPrizes.tsx`) and one stylesheet (`app/prize-belt.css`).
- Out: the prize list itself (still the eight planned categories), prices, and the docs. No price, item name or brand is invented: the docs say the catalog and its prices are unpublished. When real items and Ore prices exist, they replace the category names in the `PRIZES` list and the belt needs no other change.

## How it works

- Two copies of the same list sit side by side in one track. The track moves by exactly half its width, so the loop has no jump. Each copy carries its own trailing gap, so half the track is exactly one copy.
- The second copy is `aria-hidden`: assistive technology reads the eight prizes once, as a list.
- CSS only: one `transform` animation (70 s a lap), no JavaScript and no React state.
- The edges fade out with a mask so cards enter and leave softly.

## Control and states

| State | Behaviour |
|---|---|
| Default | The belt moves left slowly. |
| Pointer over the belt | It pauses. |
| Pause button | A real checkbox with a label. It pauses and resumes the belt for keyboard, touch and screen reader users. The label reads "Pause" while moving and "Play" while paused. WCAG 2.2.2 asks for this on anything that moves for more than five seconds. |
| Reduced motion | No animation. The belt is a plain row the visitor scrolls by hand, the copy is hidden and the button is not shown. |
| Phone | The same belt with the same card width. |
| Dark and light | The cards use the page's own tokens. |

## Accessibility

- The visible list is a real `<ul>` with eight items; the moving copy is hidden from assistive technology.
- The pause control is a native checkbox with a visible label and a visible focus ring.
- The belt is a labelled region that takes keyboard focus, so a visitor can scroll it with the arrow keys when it is a still row (reduced motion).
- The section's sentence "These are plans. None are available to order yet." stays above the belt.

## Skills

Loaded earlier in this conversation for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. Motion rules applied: animate only `transform`, pause on hover and on request, honour the user's motion setting, and give the motion a purpose (the conveyor). There is no new sprite work: the eight sprites already exist.

## Acceptance

1. The section shows the eight planned prize cards once for assistive technology and twice visually.
2. The track moves by exactly one copy per lap (half the track width) and the belt animates in the default state.
3. Hovering the belt, or checking the pause control, pauses it.
4. With reduced motion there is no animation, no copy and no pause button, and the row scrolls by hand.
5. "None are available to order yet" is still on the section.
6. The whole browser suite, typecheck, lint and unit tests pass.
