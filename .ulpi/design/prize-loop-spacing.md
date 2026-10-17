# Prize loop spacing

Status: the two-list loop was removed at the owner's request on 2026-10-17. The 230px card width and 16px inter-card gap remain in the static scroll strip; loop-specific measurements below are historical.

## Evidence and design read

The supplied screenshot shows a larger gap between the final Framework card and the next ESP32 card. Current settled browser measurements at 1280px and 638px show 230px cards and 16px gaps, including that seam; the photographed transient is not reproduced in those settled views. The two duplicated flex lists currently rely on automatic intrinsic sizing and shrink behavior.

Keep the industrial design, all eight prizes, order, 230px cards, 16px spacing and 70-second translation. Stabilize each list's sizing with fixed 230px grid columns and a nonshrinking list. Retain exactly one trailing 16px gap per list so translating by half the track width remains exact. This removes intrinsic list sizing as a source of a blank loop interval without introducing a timer or new carousel engine.

## Implementation and acceptance

Only `apps/landing/app/prize-belt.css`: use grid-auto-flow column and grid-auto-columns 230px within `.pb-half`, flex:none for each list, and min-width:0 for its grid-item li wrappers. Keep the existing gap/padding, cards, track animation, mask, hover/focus pause and reduced-motion manual scrolling. No content, image, motion-timing or other section changes.

Verify all 15 gaps across the two lists, their equal widths and half-track loop distance, at desktop and narrow widths. Capture the actual last-to-first seam if possible. No test suite requested. The seven UI skills have already been consulted; this fix creates no assets or new motion.

Engineering handoff: GPT-6 Luna medium. Implement exactly this focused CSS change, preserving all existing work. Parent handles browser measurements and diff review.

## Local verification

Implemented the two CSS declaration changes only. At 638px and 375px, all 15 inter-card gaps across both lists measure 16px, each list is 1968px, and the track is 3936px. The half-track translation therefore equals one complete repeated list including its trailing gap. Existing hover/keyboard pause, 70-second animation and reduced-motion rules were preserved. `git diff --check` passes. The original oversized screenshot gap was not reproduced in the settled pre-change preview; the fix constrains sizing explicitly rather than claiming a reproduced runtime cause. No test suites, commit, push, deployment or messages.
