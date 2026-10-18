# Prize belt: planned prizes move past on a slow belt

Status: restored on 2026-10-17 after the accessibility pass changed the prize strip to static scrolling. The belt pauses on pointer hover and keyboard focus; there is no global pause button.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Motion", "Cards and rivets" and "Depth markers and rulers".

## Design read

Reading this as: a landing section for teenage builders, in the locked industrial and signage language, leaning on the pixel sprites already in the page. The owner compared the site with Pixl and the YSWS template. Both show their prizes in a looping carousel on the homepage, with a picture and a name per item. LOADOUT showed eight icon cards in a static grid, which looks like a table of contents rather than a shop window.

Direction: a mine conveyor. The riveted cards travel left slowly, like ore through a shaft. Pause while a visitor reads with a pointer or keyboard. Under reduced motion, show a still row that can be scrolled by hand.

## Scope

- In: the "Planned prizes" section (`app/_components/home/PlannedPrizes.tsx`) and one stylesheet (`app/prize-belt.css`).
- Out: the prize list itself (still the eight planned categories), prices, and the docs. No price, item name or brand is invented: the docs say the catalog and its prices are unpublished. When real items and Ore prices exist, they replace the category names in the `PRIZES` list and the belt needs no other change.

## How it works

- Two copies of the same list sit side by side in one track. The track moves by exactly half its width, so the loop has no jump. Each copy carries its own trailing gap, so half the track is exactly one copy.
- The second copy is `aria-hidden`; assistive technology reads the eight prizes once, as a list.
- CSS only: one `transform` animation (70 s a lap), no JavaScript and no React state.
- The edges fade out with a mask so cards enter and leave softly.

## Control and states

| State | Behaviour |
|---|---|
| Default | The belt moves left slowly. |
| Pointer over the belt | It pauses while the pointer stays there. |
| Belt has keyboard focus | It pauses so a visitor can read. The labelled region takes focus and has a visible focus ring. There is no pause button. |
| Reduced motion | No animation. The visitor scrolls a single still list by hand. |
| Phone | The same belt with the same card width. |
| Dark and light | The cards use the page's own tokens. |

## Accessibility

- The visible list is a real `<ul>` with eight items; the second visual copy is hidden from assistive technology.
- Hover pauses the belt for pointer users; keyboard focus pauses it for keyboard users. Under reduced motion, the labelled scroll region has a visible focus ring and can be moved by keyboard.
- The section's sentence "These are plans. None are available to order yet." stays above the belt.

## Skills

Loaded earlier in this conversation for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. Motion rules applied: animate only `transform`, pause on hover and on focus, honour the user's motion setting, and give the motion a purpose (the conveyor). There is no new sprite work: the eight sprites already exist.

## Acceptance

1. The section shows eight planned prize cards twice visually and once for assistive technology.
2. The belt moves by exactly one copy per lap and pauses on hover or keyboard focus.
3. Reduced-motion users get no animation or duplicate and can scroll the still row by hand. There is no global pause button.
4. "None are available to order yet" is still on the section.
5. The whole browser suite, typecheck, lint and unit tests pass.
