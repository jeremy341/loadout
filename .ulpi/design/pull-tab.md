# Pull tab: the Docs tab as a rubber band

Status: implemented on the feature/pull-tab branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md), [custom-cursor.md](custom-cursor.md). Plan: [Plan 20](../../plans/20-pull-interactions.md), phase 1.

## Design read

Reading this as: a landing page for teenage builders in the locked industrial and pixel language. The floating "LOADOUT DOCS" tab sits flush on the bottom edge of the screen, so it can be pulled up like a rubber band tied to the floor. The owner wants the band to stretch in the tab's blue, get thinner as it stretches, push back harder the further it goes, and, on a long pull, to snap back first and only then open the Docs. This echoes the 404's "The only way back is up".

Counterfactual test: a draggable button could sit on any site; a tab that stretches a thinning band tied to the floor, with a hand cursor in the page's own pixel set, belongs to this one.

## Scope

- In: the Docs tab (`DocsTab.tsx`, now a client component that keeps its `<Link>`), its styles (`app/pull.css`), and two more cursor pairs (open hand and fist) in `app/cursor.css` and `public/loadout/cursors/`.
- Out: page scrolling (untouched), any other element, the Docs pages, copy. The pull cord in the footer is phase 2 ([pull-cord.md](pull-cord.md) when built).

## Behaviour

| State | What happens |
|---|---|
| Resting | The tab sits on the bottom edge as before. |
| Hover | The open hand cursor (`grab`). |
| Press and move less than 6 px | A click: the link opens the Docs, exactly as before. |
| Pulling up | The tab lifts and a blue band fills the gap down to the floor. The band is as wide as the tab where they meet and narrows toward the floor. The cursor is the fist (`grabbing`). The further you pull, the stiffer it gets: the tab shows `130 × (1 − e^(−pull ÷ 170))` px, so early pull gives a little and the last stretch barely moves, up to 130 px. |
| Let go below 110 px of pull | The band snaps back with one small overshoot (about 380 ms). Nothing opens. |
| Let go at 110 px or more | The band snaps back first. About 400 ms later, once it has settled, the Docs open. |
| Pulling down or sideways | The pull counts only upward; the band doesn't stretch downward. |
| Touch | The same, with a finger. `touch-action: none` applies to the tab only. |
| Keyboard | Enter on the focused tab opens the Docs. No drag is added. |
| First visit | After 4 seconds, one small wiggle (once per visit) shows the tab can move. Off with reduced motion. |
| Reduced motion | The tab doesn't lift or stretch, the band is hidden, and there is no spring. A pull of 110 px or more still opens the Docs straight away. |
| Light and dark | The band takes the tab's own colour: blue in dark, yellow in light, with an ink outline. |

## How it works

- Pointer events with pointer capture on the link. The pull and the waist width are CSS variables (`--pull`, `--waist`), set once per animation frame. React never re-renders during a pull.
- The band is two pseudo-elements: an ink outline and a fill, each clipped to a taper with `clip-path`. Only `transform` and the band's height change.
- `draggable="false"` on the link, so the browser's own link dragging doesn't start. The click that follows a pull is cancelled.
- Cursors: Kenney's open hand (tile 0138) and fist (tile 0139), recoloured the same way as the arrow and hand, 32 px and 64 px. Hotspot at the middle of the palm (17, 17 and 17, 19).

## Accessibility

- A link first: the tab is still a link with the same name, focus ring and keyboard behaviour. The pull is an extra, never the only way.
- Reduced motion removes the stretch, the spring and the wiggle.
- The hit area stays tall enough, and a press that moves under 6 px stays a click, so unsteady hands don't trigger a pull.
- No wheel or scroll listeners, so scrolling is never affected.

## Skills

All seven UI skills were loaded for this change: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations` (strong ease-out, a spring only on release, transform only, reduced motion), `svg-design`, `pixel-art-sprites` (cursor recolouring, two colours, hard edges) and `pixel-art-animator`. The cursor art is still images and the motion is CSS, so the animator and SVG skills added no work.

## Acceptance

1. Pulling up stretches a blue band that thins and stiffens, never past 130 px.
2. Letting go before 110 px snaps back and does not open the Docs.
3. Letting go at 110 px or more snaps back first and then opens the Docs.
4. A click and the Enter key open the Docs as before.
5. The cursor is the open hand over the tab and the fist while pulling, in both themes.
6. Touch works, page scrolling elsewhere still works, and reduced motion removes the stretch.
7. The whole browser suite, typecheck, lint and unit tests pass.
