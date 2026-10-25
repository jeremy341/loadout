# Brand and type record

Merged on 25 Oct 2026 from 6 design briefs. Each section keeps its original text. Only the design system and the code are current; a brief records what was decided and built.

## Logo: the miner's helmet mark

_Merged from `logo-helmet-mark.md`._

Status: implemented on this branch.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), section "Logo".

### Design read

A hard hat with its lamp lit: the first thing a miner puts on, and the German "Glück auf". It is a hand-drawn pixel sprite from the one-bit icon pack, so it looks drawn, not generated.

### Decision record

Four marks were compared (helmet, loaded cart, cart with pickaxe, crossed tools). The crossed tools turned into a blob when the two sprites overlapped. The owner chose the helmet. A separate mine-headframe direction from another session was dropped by the owner and is not part of this change.

### Scope

- In: the nav, footer and docs logo (`Logo.tsx`), the favicon, the Apple touch icon, the share image and its alt text, the lamp blink on hover.
- Out: the wordmark text in the site (it stays real text in Jersey 10) and any new interaction.

### Rules

- 24 by 24 pixels, shown at 24 pixels: one mark pixel is one site pixel. Never scale it by a fraction.
- Plate in the accent, outline in ink, helmet in the paper colour, per theme.
- The lamp is its own path. On hover, with a fine pointer and no reduced-motion request, it blinks once (0.9 s, stepped). Nothing else moves.
- The share image is a JPEG under 300 KB, 1200 by 630, with grain under the text so small type stays sharp.

### Acceptance

1. The nav, footer and docs show the helmet in both themes, at 24 pixels.
2. Hovering the logo blinks the lamp; reduced motion keeps it still.
3. The page head advertises `og:image`, `twitter:image` (large card), the favicon and the touch icon, and the image responds with a JPEG under 300 KB.


## LOADOUT link-share preview

_Merged from `share-preview.md`._

**Status:** Implemented locally on 2026-10-19. The owner asked to keep the main share-image background and details, remove the helmet emblem, enlarge the new wordmark, and center the supporting text below it. This is an image-only scope.

### Final composition

- Original 1200×630 main background and details: grain/grid, corner marks, rulers and depth strip. Recenter main's existing blue “GLÜCK AUF · TECHNICAL BUILDERS” label above the wordmark.
- Remove the helmet emblem from the image. Center the bottom half of the owner's `New logo.png`, saved as `wordmark-flat-bottom.png`; its small dirt-colored details are part of the wordmark. Enlarge it six times.
- Center the original supporting copy beneath it in Jersey 10: “Build your own technical stack.” and “Tools, systems, compute and hardware.”
- Keep the original depth strip but soften its contrast so the oversized wordmark stays first in the hierarchy.
- No Orry, invented copy or depth labels beyond the ones already in main.
- Matching Open Graph and Twitter JPEGs under 300 KB, with matching alternative text.

`assets/editable/logo/build-share-preview.ps1` regenerates the crops and images from the saved main base, owner-supplied logo and local Jersey 10 font. It repairs the old helmet and text regions while retaining main's original layout and surrounding copy.

### Main source

`assets/editable/logo/share-preview-main-base.jpg` is the exact image from main commit `22f3fb901e43a2f9f1c0c92a204a4c6cbe65d3a0`, image blob `f0bb82abfe4f49dd6481faf9bc2c4daa38c14fdf`, retrieved on 2026-10-19. The earlier imagegen and centered-layout concepts are discarded directions and must not be reapplied.


## Custom cursor: a pixel arrow and hand in LOADOUT's colours

_Merged from `custom-cursor.md`._

Status: implemented on the feature/custom-cursor branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Icons" and "Motion". Plan: Plan 19 (removed 25 Oct 2026), workstream A.

### Design read

Reading this as: a landing page for teenage builders in the locked industrial and signage language, with a pixel-sprite identity. The owner wants a cursor that still looks like a mouse pointer, is pixelated, and resembles the one on Pixl, only fitted to LOADOUT. A first attempt, a pickaxe, was rejected because it no longer read as a mouse. The classic arrow stays; what makes it LOADOUT's is the ink outline and the theme colours, the same pairing as the buttons and the sprites.

### Choice

Compared across the four downloaded packs (Kenney, Gabl, Megabyte Games, KabGames). KabGames' 8 by 8 set is silhouettes only. Megabyte's pointers and Gabl's are good, but their licences are confirmed only by listings (Megabyte) or carry a request about AI training (Gabl). Kenney's Cursor Pixel Pack is CC0 by a licence file, and has the classic notched arrow Pixl uses plus bold hands in the same style. Used: **tile 0168 (arrow)** and **tile 0157 (index-finger hand)**.

### Scope

- In: the cursor over the homepage (`.home`): one stylesheet (`app/cursor.css`) and eight PNGs in `public/loadout/cursors/`.
- Out: the Docs and the 404 page (system cursor), the miner's lamp that follows the pointer (a separate decision, below), touch screens, and any text, colour or layout change.

### The art

- Kenney draws both cursors white with a black outline on a 16 by 16 grid. They are recoloured to LOADOUT's ink outline `#0E1215` and the theme's fill, shown at 2x like the sprites: hard edges, no smoothing.
- Fill: blue `#5E9EF4` in the dark theme, matching its icons and buttons; yellow `#FDCF03` in the light theme.
- 32 px for normal screens, 64 px for screens with a pixel ratio of 2.
- Hotspots, the point that clicks, in CSS pixels at 1x: arrow tip `3 1`, hand fingertip `15 3`.
- Made by `assets/editable/cursors/make-cursors.js` from the two source tiles in `assets/editable/cursors/source/`. It reproduces the PNGs exactly.

### States

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

### Accessibility

- The cursor never carries meaning and is never the only focus indicator; keyboard focus styles are untouched.
- The ink outline keeps it visible on the dark page and on the light paper. On a button of the same colour (blue on blue, yellow on yellow) the outline still separates it.
- Browsers limit cursor images to 128 px; 64 px is well inside that.

### Open: the miner's lamp

An optional soft light around the pointer that reveals the faint depth numerals was part of the earlier cursor plan. It needs a small client script (pointer tracking), so it is not built here. It is only worth doing if the owner asks, at 6 to 8 percent strength, fine pointers only, and off with reduced motion.

### Skills

All seven UI skills were loaded for this change: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The cursor is a still image, so the animator, SVG and motion skills added no work. Sprite rules applied: two colours, hard edges, integer scaling, a readable silhouette at the real 32 px size.

### Acceptance

1. Over the homepage the cursor is the blue arrow in the dark theme and the yellow one in the light theme.
2. Links, buttons and labels get the matching pointing hand.
3. The eight PNGs are 32 px and 64 px, and served.
4. The Docs and the 404 page do not use them, and a touch screen does not either.
5. The whole browser suite, typecheck, lint and unit tests pass.

### Colour-vision modes

Each colour-vision mode gets its own set of cursors, in both themes, so the cursor follows the mode instead of staying blue or yellow. The fill is the mode's own accent in the dark theme and its highlight in the light theme, taken from `apps/landing/app/color-vision.css`:

| Mode | Dark theme fill | Light theme fill |
|---|---|---|
| Standard | blue `#5E9EF4` | yellow `#FDCF03` |
| Protanopia | `#56B4E9` | `#6B4700` |
| Deuteranopia | `#56B4E9` | `#7A4600` |
| Tritanopia | `#E69F00` | `#1A1714` |
| Achromatopsia | `#E9EBE7` | `#4F4739` |

The ink outline stays `#0E1215` in every mode. `make-cursors.js` writes the images (`<name>-<mode>-<theme>.png`, standard keeps `<name>-<theme>.png`) and `app/cursor-palettes.css`, which sets the `--cursor-*` variables that `cursor.css` reads. Regenerate both together whenever a colour-vision token changes.


## Pixel font: an open C

_Merged from `pixel-font-open-c.md`._

Status: implemented on the fix/pixelify-open-c branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), section "Typography".

### Design read

The pixel headings are the site's signage. Signage has to be read at a glance, and in Pixelify Sans the letter C reads as an O: the only thing that tells them apart is a one-pixel notch on the C's right side, and in the bold weights (the ones the site uses for the hero title, the section headings, the buttons and the card titles) that notch is a hairline slit. "ROCK" reads "ROOK", "BACK" reads "BAOK". The owner noticed it on the 404 page and asked for it fixed everywhere.

The fix keeps the typeface, the sizes, the weights and every layout. It changes two glyphs.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: a generic fix would switch the headings to another font. That would change the identity of the whole site, so it is not done here.

### Measured cause

Pixelify Sans is a variable font (weight 400 to 700, 1000 units per em). The capital C is one contour. Its right-side opening is the gap between two stubs:

| Weight | Gap between the stubs | Share of the letter's height |
|---|---|---|
| 400 | 80 units (one pixel row) | about 12% |
| 700 | 34 units | about 5% |

The stubs are two pixel rows tall each, so at 700 the C is an O with a scratch. The lowercase c has the same collapse (81 units at 400, 35 units at 700).

### Scope

- In: the glyphs `C` and `c` in `apps/landing/public/fonts/PixelifySans.ttf`. The accented forms (Ç, Ć, Ĉ, Č, Ċ and the lowercase ones) reuse them and follow.
- Out: every other glyph, the font's advance widths and metrics, the font family and file name, any size or weight in the CSS, the 404 page's Jersey 10 text (it stays; reverting it is a separate choice), and the E, Z and 0 of the small tag (they read fine in the pixel font at 15 px and up on the homepage).

### The change

A standard pixel C (the classic 5 by 7 bitmap letter) keeps one pixel row of stub at the top and at the bottom of the right side and leaves the rest open.

| Glyph | Master | Old gap (y) | New gap (y) |
|---|---|---|---|
| C | 400 | 270 to 350 | 172 to 448 (three pixel rows) |
| C | 700 | 297 to 331 | 175 to 452 |
| c | 400 | 179 to 260 | 173 to 265 (one pixel row, on the grid) |
| c | 700 | 211 to 246 | 180 to 276 |

For the capital C the stubs shrink from two pixel rows to one and the opening grows from one row to three. For the lowercase c the stubs and the gap are already one row each at 400, which is the classic 5 by 5 c, so only the bold weight changes: its gap is brought back to one full row instead of collapsing. Weights between the two masters interpolate from these points.

The advance width and the outer bounds of both glyphs do not change, so no text reflows.

### States

| State | Behaviour |
|---|---|
| Weights 400 to 700 | The opening stays open at every weight, including the 500 and 600 used by the Docs. |
| Sizes | Checked from the 12 px tag to the 122 px hero title. |
| Themes | Colour is untouched. |
| Fallback | A browser that cannot load the font shows the system font, as before. |

### Source and licence

Pixelify Sans is licensed under the SIL Open Font License 1.1 and has no reserved font name, so a modified copy may be used and shared under the same licence. The unmodified font and the script that produces the patched one live in `assets/editable/fonts/`. The licence text stays next to the font in `apps/landing/public/fonts/`.

### Accessibility

- A C and an O no longer depend on a one-pixel feature, which helps readers with low vision, dyslexia and small screens. No colour or contrast changes.
- Text stays real text, so selection, search, translation and screen readers are unaffected.

### Skills

Loaded for this change: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The glyph work is pixel-art work (silhouettes checked at the real display sizes, hard edges kept on the pixel grid). There is no motion and no vector illustration in this change, so the animation and SVG skills had nothing to act on.

### Acceptance

1. In the font as the browser renders it, the capital C has an opening on its right side of at least 30% of its height at weights 400 and 700, and the O has none.
2. The lowercase c has an opening of at least 15% of its height at weights 400 and 700, and the o has none.
3. The advance widths of C and c at both masters equal the original's, so the line breaks and widths of the homepage and docs do not change (checked in the patch script).
4. The patch script, run on the unmodified font, reproduces the committed font byte for byte.
5. The whole browser suite passes unchanged.


## Final pixel icon integration

_Merged from `pixel-icon-sprite-integration.md`._

**Status:** Implemented. The runtime sprite mappings and preserved source artwork are cataloged in [`docs/design/asset-catalog.md`](../../docs/design/asset-catalog.md); this brief explains the export decision and is not a second asset list.

**Design read:** Keep LOADOUT’s industrial field-manual identity and replace the active homepage glyphs with the owner's final icon artwork from finnally/.

### Source and export

- The full owner-supplied PNG set is archived in docs/design/references/2026-10-06/final-pixel-icons/source/.
- Active app sprites are transparent 32×32 PNGs in apps/landing/public/loadout/sprites/.
- Each exported sprite is cropped to its nontransparent artwork, then fit proportionally inside a 28×28 area on the 32×32 canvas using nearest-neighbor sampling. This preserves the source pixel art and leaves a transparent 2px margin.
- LoadoutIcon uses the new sprites for every active icon glyph, including currency Bolt, FAQ chevron, and Requisition milestones. See the complete [asset catalog](../../docs/design/asset-catalog.md) for current source/runtime mappings.
- The LOADOUT brand mark, wordmark, lockup, favicon, and scene/cloud SVGs stay separate. The previous Bolt SVG stays on disk as an unused source file.

### Homepage treatment

- Keep existing call sites, labels, spacing, layout, colors, motion, and destinations.
- Sprites remain decorative with empty alt text and aria-hidden=true.
- Render through the existing pixelated image styling and preserve the current image sizing rules.

### Scope and acceptance

- No new UI flow, product copy, palette, typography, or page layout.
- Every active icon asset is exactly 32×32 RGBA, with transparent pixels around the artwork.
- Every active LoadoutIcon call resolves to a sprite from the final source set, except the LOADOUT brand mark, which keeps its current mark.
- Original source PNGs stay in the repository for contributor access and review.

### Handoff

The original row/name-to-output mapping has been consolidated into the [asset catalog](../../docs/design/asset-catalog.md).


## Ore: the global currency's name and icon

_Merged from `ore-currency.md`._

Status: implemented on the feature/ore-currency branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md) and [Plan 02](../../plans/02-economy-and-rewards.md), which owns the currency.

### Decision record

The owner renamed the global spendable currency from Bolts to **Ore** on 2026-10-13 and chose the gem as its icon. Taler (coins) was the other candidate and was dropped. Reasons for Ore: the site is a mine (depth markers, Sohle, the helmet and the lamp), you dig ore and then spend it; English-speaking teens read it at once; it does not clash with the currency names of other Hack Club programs we found (pixels, stardust, gold, doubloons). The program is pre-launch, nothing was published with a price or formula, so the rename costs words only.

### Design read

The currency is the one thing a builder collects, so its name and its mark carry the identity of the program. A bolt belonged to the old "slot and bolt" logo. A gem of ore belongs to the mine.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: a generic game currency (coins, gems, credits) could belong to any shop. Ore, named in German mining terms elsewhere on the page, and drawn as the pack's pixel gem, belongs to this one.

### Wording rules

- The name is **Ore**, always capitalised when it means the currency (the mineral stays lowercase). It is a mass noun, like Gold: "earn 25 Ore", "Ore is global", "enough Ore", "the Ore you earn", "an Ore quote", "the Ore multiplier". There is no plural "Ores".
- Verbs agree with a singular subject: "Ore is spendable currency", "Ore does not split into track wallets".
- Titles and labels keep their shape: "Ore, XP & levels", "Ore to spend", "Ore bonus", "ORE" in upper-case labels.
- The FAQ question "What are Bolts and Track XP?" becomes "What is Ore, and what is Track XP?".
- "Bolt Yellow", the old name of the accent colour in the plans, becomes "Ore Yellow".

### Scope

- In: the homepage copy and the FAQ, the public Docs (`content/docs/`), the tests, the plans (Plan 02 owns the currency; Plans 00, 01, 05, 06, 08, 11, 15, 17 and the proposal follow), `PRODUCT.md`, `DESIGN.md`, the design system and the asset catalog, and the contributor docs that name the currency.
- The icon: `apps/landing/public/loadout/sprites/ore.png` replaces `bolt.png`. It is the gem from the one-bit icon pack (the owner confirmed it can be used), 16 by 16 with each pixel doubled to 32 by 32, in the same two colours as every other sprite (outline `#0E1215`, fill `#FDCF03`), so the existing theme filter recolours it like the rest. The `bolt-nudge` animation is renamed `ore-nudge` and is otherwise unchanged.
- Out: the owner's custom `bolt.svg` artwork (kept byte for byte; it is not shown anywhere), the `ϟ` glyph in the hero facts (a lightning mark, not the currency), the old logo comment in `home.css`, and every record: design briefs written before 2026-10-13, the source audits, the restructure manifest and the superpowers plans. They keep saying Bolts because they describe what was true when they were written. Plan 02 and the briefs index say so.

### States

| State | Behaviour |
|---|---|
| Rewards card "Ore" | The gem sits where the bolt did, titled Ore, labelled CURRENCY. |
| How it works outcome "Ore to spend" | The gem nudges up and tilts 2 degrees on a 2.4 s ease-in-out loop (unchanged behaviour, new name). |
| Dark and light | The two-colour sprite is recoloured by the existing filter in both themes. |
| Reduced motion | The nudge stops, as before. |
| Docs | The page that explained Bolts, XP and levels is titled "Ore, XP & levels". Its address (`/docs/progress`) does not change. |

### Accessibility

- The icon is decorative (`aria-hidden`), as the bolt was. The name Ore is real text beside it.
- No colour, contrast or size change. The gem is 32 pixels square like the other card icons.

### Skills

Loaded this session for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The sprite is the pack's own gem, checked at its display size next to the gear, chip, wrench and cart sprites; the nudge is the existing CSS animation under a new name, so the animation skills had nothing to change.

### Acceptance

1. No visitor can read "Bolt" or "Bolts" on the homepage (including closed FAQ answers) or in any public docs page, and "Ore" is there.
2. Both places that show the currency icon use `#i-ore`; `#i-bolt` is gone; `/loadout/sprites/ore.png` is a 32 by 32 PNG; `/loadout/sprites/bolt.png` is gone.
3. The docs navigation lists "Ore, XP & levels", and the page's `h1` matches.
4. The nudge animation is `ore-nudge`, and it still stops for reduced motion.
5. The whole browser suite, typecheck, lint and unit tests pass.
