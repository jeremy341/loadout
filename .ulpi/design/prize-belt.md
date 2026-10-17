# Prize strip: planned prizes stay still and scroll by hand

Status: the original animated belt was replaced at the owner's request on 2026-10-17. The eight examples remain a static, manually scrollable strip.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Motion", "Cards and rivets" and "Depth markers and rulers".

## Design read

Reading this as: a landing section for teenage builders, in the locked industrial and signage language, leaning on the pixel sprites already in the page. The owner compared the site with Pixl and the YSWS template. Both show their prizes in a looping carousel on the homepage, with a picture and a name per item. LOADOUT showed eight icon cards in a static grid, which looks like a table of contents rather than a shop window.

Direction: keep the prize examples visible as a horizontal strip of riveted cards. The visitor can scroll it with a pointer or keyboard; it does not move on its own.

## Scope

- In: the "Planned prizes" section (`app/_components/home/PlannedPrizes.tsx`) and one stylesheet (`app/prize-belt.css`).
- Out: the prize list itself (still the eight planned categories), prices, and the docs. No price, item name or brand is invented: the docs say the catalog and its prices are unpublished. When real items and Ore prices exist, they replace the category names in the `PRIZES` list and the belt needs no other change.

## How it works

- One semantic list of eight examples sits inside a horizontally scrollable region.
- There is no automatic animation and no pause control.

## Control and states

| State | Behaviour |
|---|---|
| Default | Cards stay still. |
| Pointer or touch | Visitors scroll horizontally. |
| Keyboard | The labelled region accepts focus and can be scrolled by keyboard. |
| Reduced motion | Same static strip; no additional handling needed. |
| Phone | Visitors swipe the strip horizontally. |
| Dark and light | The cards use the page's own tokens. |

## Accessibility

- The prize examples are one real `<ul>` with eight items.
- The labelled scroll region has a visible focus ring and can be moved by keyboard.
- The section's sentence "These are plans. None are available to order yet." stays above the belt.

## Skills

Loaded earlier in this conversation for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. Motion rules applied: animate only `transform`, pause on hover and on focus, honour the user's motion setting, and give the motion a purpose (the conveyor). There is no new sprite work: the eight sprites already exist.

## Acceptance

1. The section shows one list of eight planned prize cards.
2. The strip is static and manually scrollable.
3. There is no animation, pause button or duplicate list in any motion-preference state.
4. "None are available to order yet" is still on the section.
5. The whole browser suite, typecheck, lint and unit tests pass.
