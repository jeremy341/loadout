# Pixel icon sprite integration

**Design read:** Keep LOADOUT’s industrial field-manual identity and replace the existing vector glyphs with the pixel sprites shown in the owner’s new grid guide.

## Source and extraction

- Use `docs/design/references/2026-10-06/pixel-assets/loadout-32px-sprite-grid-guide.png` as the source image for this change.
- The guide is a 7-column by 6-row atlas. Each 32×32 logical sprite was enlarged 8× into a 256×256 tile; the visible grid lies on the first row/column of each logical pixel block.
- Recover each logical pixel from the center of its 8×8 block, then convert the exact flat guide-paper color (`#EDEFEE`) to transparency. Do not crop the older atlas or sample guide edges.
- Export the 38 non-brand sprite cells as standalone 32×32 transparent PNGs. Keep the four brand cells out of the sprite set.

## Homepage treatment

- Replace matching `LoadoutIcon` glyphs with the extracted PNG sprites, preserving existing component names, call sites, semantic labels, spacing, layout, colors, motion, and destinations.
- Keep the custom `bolt.svg`, LOADOUT mark/wordmark/favicon, and scene/cloud SVGs unchanged. The sheet’s Bolt is retained as a reference sprite but is not wired over the owner’s custom Bolt.
- Render sprites with the existing icon sizing rules and `image-rendering: pixelated`; never bake grid lines or a background into an exported asset.
- Decorative icons remain hidden from assistive technology (`alt=""`, `aria-hidden="true"`). Interactive controls retain their existing labels and focus behavior.

## Scope and acceptance

- No new UI flow, animation, palette, typography, layout, or product copy.
- Every exported sprite is exactly 32×32, has alpha transparency outside its artwork, and contains no guide grid pixels.
- The existing homepage icon calls continue to render, with only the custom Bolt and brand mark kept in their current non-sprite formats.
- The guide stays as a documented reference alongside the extracted sprites and index.

## Handoff

Implement in the existing Next.js landing app. Keep the extraction tied to this checked-in guide and document the row/column-to-filename mapping in `SPRITE_SHEET_INDEX.md`.
