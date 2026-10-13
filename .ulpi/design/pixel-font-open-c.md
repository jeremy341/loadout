# Pixel font: an open C

Status: implemented on the fix/pixelify-open-c branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), section "Typography".

## Design read

The pixel headings are the site's signage. Signage has to be read at a glance, and in Pixelify Sans the letter C reads as an O: the only thing that tells them apart is a one-pixel notch on the C's right side, and in the bold weights (the ones the site uses for the hero title, the section headings, the buttons and the card titles) that notch is a hairline slit. "ROCK" reads "ROOK", "BACK" reads "BAOK". The owner noticed it on the 404 page and asked for it fixed everywhere.

The fix keeps the typeface, the sizes, the weights and every layout. It changes two glyphs.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: a generic fix would switch the headings to another font. That would change the identity of the whole site, so it is not done here.

## Measured cause

Pixelify Sans is a variable font (weight 400 to 700, 1000 units per em). The capital C is one contour. Its right-side opening is the gap between two stubs:

| Weight | Gap between the stubs | Share of the letter's height |
|---|---|---|
| 400 | 80 units (one pixel row) | about 12% |
| 700 | 34 units | about 5% |

The stubs are two pixel rows tall each, so at 700 the C is an O with a scratch. The lowercase c has the same collapse (81 units at 400, 35 units at 700).

## Scope

- In: the glyphs `C` and `c` in `apps/landing/public/fonts/PixelifySans.ttf`. The accented forms (Ç, Ć, Ĉ, Č, Ċ and the lowercase ones) reuse them and follow.
- Out: every other glyph, the font's advance widths and metrics, the font family and file name, any size or weight in the CSS, the 404 page's Jersey 10 text (it stays; reverting it is a separate choice), and the E, Z and 0 of the small tag (they read fine in the pixel font at 15 px and up on the homepage).

## The change

A standard pixel C (the classic 5 by 7 bitmap letter) keeps one pixel row of stub at the top and at the bottom of the right side and leaves the rest open.

| Glyph | Master | Old gap (y) | New gap (y) |
|---|---|---|---|
| C | 400 | 270 to 350 | 172 to 448 (three pixel rows) |
| C | 700 | 297 to 331 | 175 to 452 |
| c | 400 | 179 to 260 | 173 to 265 (one pixel row, on the grid) |
| c | 700 | 211 to 246 | 180 to 276 |

For the capital C the stubs shrink from two pixel rows to one and the opening grows from one row to three. For the lowercase c the stubs and the gap are already one row each at 400, which is the classic 5 by 5 c, so only the bold weight changes: its gap is brought back to one full row instead of collapsing. Weights between the two masters interpolate from these points.

The advance width and the outer bounds of both glyphs do not change, so no text reflows.

## States

| State | Behaviour |
|---|---|
| Weights 400 to 700 | The opening stays open at every weight, including the 500 and 600 used by the Docs. |
| Sizes | Checked from the 12 px tag to the 122 px hero title. |
| Themes | Colour is untouched. |
| Fallback | A browser that cannot load the font shows the system font, as before. |

## Source and licence

Pixelify Sans is licensed under the SIL Open Font License 1.1 and has no reserved font name, so a modified copy may be used and shared under the same licence. The unmodified font and the script that produces the patched one live in `assets/editable/fonts/`. The licence text stays next to the font in `apps/landing/public/fonts/`.

## Accessibility

- A C and an O no longer depend on a one-pixel feature, which helps readers with low vision, dyslexia and small screens. No colour or contrast changes.
- Text stays real text, so selection, search, translation and screen readers are unaffected.

## Skills

Loaded for this change: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The glyph work is pixel-art work (silhouettes checked at the real display sizes, hard edges kept on the pixel grid). There is no motion and no vector illustration in this change, so the animation and SVG skills had nothing to act on.

## Acceptance

1. In the font as the browser renders it, the capital C has an opening on its right side of at least 30% of its height at weights 400 and 700, and the O has none.
2. The lowercase c has an opening of at least 15% of its height at weights 400 and 700, and the o has none.
3. The advance widths of C and c at both masters equal the original's, so the line breaks and widths of the homepage and docs do not change (checked in the patch script).
4. The patch script, run on the unmodified font, reproduces the committed font byte for byte.
5. The whole browser suite passes unchanged.
