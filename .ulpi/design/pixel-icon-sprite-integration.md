# Final pixel icon integration

**Design read:** Keep LOADOUT’s industrial field-manual identity and replace the active homepage glyphs with the owner's final icon artwork from finnally/.

## Source and export

- The full owner-supplied PNG set is archived in docs/design/references/2026-10-06/final-pixel-icons/source/.
- Active app sprites are transparent 32×32 PNGs in apps/landing/public/loadout/sprites/.
- Each exported sprite is cropped to its nontransparent artwork, then fit proportionally inside a 28×28 area on the 32×32 canvas using nearest-neighbor sampling. This preserves the source pixel art and leaves a transparent 2px margin.
- LoadoutIcon uses the new sprites for every active icon glyph, including currency Bolt, FAQ chevron, and Requisition milestones.
- The LOADOUT brand mark, wordmark, lockup, favicon, and scene/cloud SVGs stay separate. The previous Bolt SVG stays on disk as an unused source file.

## Homepage treatment

- Keep existing call sites, labels, spacing, layout, colors, motion, and destinations.
- Sprites remain decorative with empty alt text and aria-hidden=true.
- Render through the existing pixelated image styling and preserve the current image sizing rules.

## Scope and acceptance

- No new UI flow, product copy, palette, typography, or page layout.
- Every active icon asset is exactly 32×32 RGBA, with transparent pixels around the artwork.
- Every active LoadoutIcon call resolves to a sprite from the final source set, except the LOADOUT brand mark, which keeps its current mark.
- Original source PNGs stay in the repository for contributor access and review.

## Handoff

Implement in the existing Next.js landing app. The row/name-to-output mapping is recorded in docs/design/references/2026-10-05/pixel-assets/SPRITE_SHEET_INDEX.md.
