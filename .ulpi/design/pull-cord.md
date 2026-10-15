# Pull cord: a hidden level at the bottom of the page

Status: implemented on the feature/pull-cord branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md), [pull-tab.md](pull-tab.md) (the same gesture) and [rock-bottom-404.md](rock-bottom-404.md) (the colours and fonts). Plan: [Plan 20](../../plans/20-pull-interactions.md), phase 2.

## Design read

Reading this as: a landing page for teenage builders in the locked industrial and pixel language, and a small reward for people who go all the way down. The page is a descent from −000 M to −1000 M at the footer. A ring sits on the floor below it. Pull it up like a rubber band, the way the Docs tab is pulled, and a hidden level opens: **−1404 M, Sohle**, the depth of the 404 page. The line "The only way back is up" ties it to the 404 and to the pull itself.

Counterfactual test: a generic easter egg could sit on any site; a ring tied to the floor of the mine with a band that thins, opening the 404's own near-black rock, belongs to this one.

## Scope

- In: `PullCord.tsx` (the ring and the panel, placed at the end of the footer), `app/cord.css`, the shared gesture in `usePull.ts` (the Docs tab now uses it too), and the cursor selectors for the ring.
- Out: page scrolling, the 404 page itself, anything stored or tracked (nothing is saved: no "found it" state), a second secret.

## What it looks like

- **The floor:** a 210 px strip at the very end of the footer, with a faint diagonal hatch, a dashed top edge and two quiet labels, "Sohle" and "−1404 M", like the depth numerals. It gives the ring room to be pulled.
- **The ring:** a 16 by 15 pixel ring, drawn like the sprites, in the tab's colour (blue in dark, yellow in light) with an ink outline. It rests on the floor in the middle.
- **The band:** as the ring is pulled up, a band in the same colour fills the gap down to the floor, narrowing toward the floor, exactly as on the Docs tab.
- **The level:** a panel under the footer in the 404's near black (`#0e1112`) in both themes, because it is rock. A blue "SOHLE · −1404 M" tag, the title **"You found the bottom."** in Jersey 10 (the face the 404 uses), the line **"The only way back is up."**, and a button, **Back to the surface**, that scrolls to the top.

## Behaviour

| State | What happens |
|---|---|
| Closed (default) | The ring on the floor. The panel is not in the page (`hidden`). |
| Hover | The open hand cursor. While pulling, the fist. |
| Pulling up | The same rubber band as the Docs tab: stiffens up to 130 px, band thins. |
| Let go below 110 px | The ring snaps back. The panel stays closed. |
| Let go at 110 px or more | The ring snaps back first. Then the panel opens, scrolls into view and takes focus on its heading. |
| Click, Enter or Space on the ring | Opens the panel. The same again closes it. No dragging needed. |
| Panel open | Back to the surface scrolls to the top. The panel stays open until the ring is clicked again. |
| Touch | The same drag with a finger; `touch-action: none` applies to the ring only. |
| Reduced motion | The ring doesn't stretch or spring, the panel has no opening animation and scrolling is instant. A long pull still opens it. |
| Light and dark | The ring and band take the theme's colour. The panel stays near black. |

## Accessibility

- The ring is a real `<button>` named "Dig deeper, minus 1404 meters", with `aria-expanded` and `aria-controls`. A screen reader user or a keyboard user never needs to drag.
- The panel is a labelled `<section>`. When it opens, focus moves to its heading so the change is announced.
- The panel's text is light on near black: 15.8:1 for the title, 8.4:1 for the line, 6.9:1 for the blue tag.
- The ground labels are decorative and hidden from assistive technology.
- No wheel or scroll listeners; the gesture starts on the ring only.

## Skills

All seven UI skills were loaded for this change: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations` (transform and height only, a strong ease-out, a spring only on release, reduced motion), `svg-design` (the ring is drawn from squares on a pixel grid with `crispEdges`), `pixel-art-sprites` (the ring on a grid, two colours, hard edges) and `pixel-art-animator`. The ring and panel are still images and CSS motion, so the animator skill added no work.

## Acceptance

1. A ring sits on the floor at the end of the footer and the level is closed.
2. A click, Enter or Space opens and closes the level, and focus moves to its heading.
3. A short pull snaps back and the level stays closed; a long pull snaps back first and then opens it.
4. The band thins as the ring stretches, never past 130 px.
5. Back to the surface scrolls to the top.
6. Touch works; reduced motion removes the stretch and the opening animation.
7. The open level has no serious accessibility findings, and the whole browser suite, typecheck, lint and unit tests pass.
