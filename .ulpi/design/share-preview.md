# LOADOUT link-share preview

**Status:** Implemented locally on 2026-10-19. The owner asked to keep the main share-image background and details, remove the helmet emblem, enlarge the new wordmark, and center the supporting text below it. This is an image-only scope.

## Final composition

- Original 1200×630 main background and details: grain/grid, corner marks, rulers and depth strip. Recenter main's existing blue “GLÜCK AUF · TECHNICAL BUILDERS” label above the wordmark.
- Remove the helmet emblem from the image. Center the bottom half of the owner's `New logo.png`, saved as `wordmark-flat-bottom.png`; its small dirt-colored details are part of the wordmark. Enlarge it six times.
- Center the original supporting copy beneath it in Jersey 10: “Build your own technical stack.” and “Tools, systems, compute and hardware.”
- Keep the original depth strip but soften its contrast so the oversized wordmark stays first in the hierarchy.
- No Orry, invented copy or depth labels beyond the ones already in main.
- Matching Open Graph and Twitter JPEGs under 300 KB, with matching alternative text.

`assets/editable/logo/build-share-preview.ps1` regenerates the crops and images from the saved main base, owner-supplied logo and local Jersey 10 font. It repairs the old helmet and text regions while retaining main's original layout and surrounding copy.

## Main source

`assets/editable/logo/share-preview-main-base.jpg` is the exact image from main commit `22f3fb901e43a2f9f1c0c92a204a4c6cbe65d3a0`, image blob `f0bb82abfe4f49dd6481faf9bc2c4daa38c14fdf`, retrieved on 2026-10-19. The earlier imagegen and centered-layout concepts are discarded directions and must not be reapplied.
