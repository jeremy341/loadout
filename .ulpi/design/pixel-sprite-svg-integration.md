# Pixel sprite SVG integration

> Superseded for homepage UI icons by the approved [pre-sprite icon restoration](pre-sprite-icon-restoration.md). The sprite replacement is no longer the active source for UI icons; preserve the custom `/loadout/bolt.svg` asset for Bolt icons. Keep scenery and standalone non-icon assets that the restoration explicitly preserves.

## Design read

This is a pixel-asset replacement for the LOADOUT industrial field-manual homepage. Use the 7×6 sprite sheet as the pixel source and keep its discrete 32×32 grid, transparent paper backdrop, opaque sprite pixels, and crisp edges.

## Scope and states

- Export each non-logo sprite as its own standalone SVG with `viewBox="0 0 32 32"` and a transparent background.
- Use these files for matching homepage icons, FAQ disclosure, level badges, slash ornaments, and the three skyline tiles.
- Keep the current LOADOUT brand mark, wordmark, lockup, favicon, and three moving scene clouds unchanged.
- The Bolt displayed by the site follows the newly approved sheet sprite; retain the earlier user-provided Bolt SVG outside the active UI if it is still needed as source history.
- Keep icon dimensions, hover states, parallax, cloud motion, and reduced-motion behavior unchanged. A later user request removes the redundant bottom CTA; the follow-up is recorded in `transparent-sprite-backgrounds-and-remove-bottom-cta.md`.

## Accessibility and responsive behavior

Icons remain decorative where the surrounding text names their meaning. Give standalone files no embedded text, scripts, external references, or background fill. Preserve the FAQ control's button semantics and its existing focus and expanded states. SVGs use crisp integer geometry and render at the existing CSS dimensions on all viewport sizes.

## Acceptance criteria

- Every non-logo cell is exported as a separate transparent 32×32 SVG.
- Website icon references resolve to those assets; all logo artwork and moving-cloud files are unchanged.
- Sprite sheet and asset index explain source-cell mapping and exceptions.
- Existing layout and interaction behavior is unchanged.
- `git diff --check` is clean.

## Handoff

Implement the static exports and replace only the currently equivalent inline/UI SVG artwork and scene utility assets. Do not add animation frames or alter product copy, layout, or motion.
