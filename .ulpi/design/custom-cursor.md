# Custom cursor: a pixel arrow and hand in LOADOUT's colours

Status: implemented on the feature/custom-cursor branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Icons" and "Motion". Plan: [Plan 19](../../plans/19-credibility-prizes-economy-cursor.md), workstream A.

## Design read

Reading this as: a landing page for teenage builders in the locked industrial and signage language, with a pixel-sprite identity. The owner wants a cursor that still looks like a mouse pointer, is pixelated, and resembles the one on Pixl, only fitted to LOADOUT. A first attempt, a pickaxe, was rejected because it no longer read as a mouse. The classic arrow stays; what makes it LOADOUT's is the ink outline and the theme colours, the same pairing as the buttons and the sprites.

## Choice

Compared across the four downloaded packs (Kenney, Gabl, Megabyte Games, KabGames). KabGames' 8 by 8 set is silhouettes only. Megabyte's pointers and Gabl's are good, but their licences are confirmed only by listings (Megabyte) or carry a request about AI training (Gabl). Kenney's Cursor Pixel Pack is CC0 by a licence file, and has the classic notched arrow Pixl uses plus bold hands in the same style. Used: **tile 0168 (arrow)** and **tile 0157 (index-finger hand)**.

## Scope

- In: the cursor over the homepage (`.home`): one stylesheet (`app/cursor.css`) and eight PNGs in `public/loadout/cursors/`.
- Out: the Docs and the 404 page (system cursor), the miner's lamp that follows the pointer (a separate decision, below), touch screens, and any text, colour or layout change.

## The art

- Kenney draws both cursors white with a black outline on a 16 by 16 grid. They are recoloured to LOADOUT's ink outline `#0E1215` and the theme's fill, shown at 2x like the sprites: hard edges, no smoothing.
- Fill: blue `#5E9EF4` in the dark theme, matching its icons and buttons; yellow `#FDCF03` in the light theme.
- 32 px for normal screens, 64 px for screens with a pixel ratio of 2.
- Hotspots, the point that clicks, in CSS pixels at 1x: arrow tip `3 1`, hand fingertip `15 3`.
- Made by `assets/editable/cursors/make-cursors.js` from the two source tiles in `assets/editable/cursors/source/`. It reproduces the PNGs exactly.

## States

| State | Behaviour |
|---|---|
| Over the page | The arrow. |
| Over a link, button, label or summary | The hand. |
| Light and dark theme | Each has its own colour; switching the theme changes it at once. |
| Touch screen (`pointer: coarse`) | No custom cursor. |
| Docs and 404 | System cursor. |
| Image fails to load or the browser lacks the feature | The system arrow and hand (the `auto` and `pointer` fallbacks). |
| Reduced motion | No effect: the cursor does not move or animate by itself. |

Text selection works as usual. Over body text the arrow stays, not the text bar, because the homepage is mostly text.

## Accessibility

- The cursor never carries meaning and is never the only focus indicator; keyboard focus styles are untouched.
- The ink outline keeps it visible on the dark page and on the light paper. On a button of the same colour (blue on blue, yellow on yellow) the outline still separates it.
- Browsers limit cursor images to 128 px; 64 px is well inside that.

## Open: the miner's lamp

An optional soft light around the pointer that reveals the faint depth numerals was part of the earlier cursor plan. It needs a small client script (pointer tracking), so it is not built here. It is only worth doing if the owner asks, at 6 to 8 percent strength, fine pointers only, and off with reduced motion.

## Skills

All seven UI skills were loaded for this change: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The cursor is a still image, so the animator, SVG and motion skills added no work. Sprite rules applied: two colours, hard edges, integer scaling, a readable silhouette at the real 32 px size.

## Acceptance

1. Over the homepage the cursor is the blue arrow in the dark theme and the yellow one in the light theme.
2. Links, buttons and labels get the matching pointing hand.
3. The eight PNGs are 32 px and 64 px, and served.
4. The Docs and the 404 page do not use them, and a touch screen does not either.
5. The whole browser suite, typecheck, lint and unit tests pass.
