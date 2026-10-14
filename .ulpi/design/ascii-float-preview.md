# ASCII floating motion preview

Status: local experiment requested by the owner; no publication requested.

## Design read

Keep LOADOUT's industrial field-manual identity and make the existing margin ASCII float more visibly. Use the current art, typography, colours, placement and cursor spotlight.

## Motion

- Move the shared ASCII container from `translate3d(-4px, 12px, 0)` to `translate3d(5px, -24px, 0)`: 36px of vertical travel, with the existing horizontal range.
- Use ease-in-out and infinite alternate playback, with a distinct period and negative phase offset for every drawing. Negative offsets start the drawings at different points immediately; varied periods prevent repeated synchronized movement.

| Drawing | Seconds per direction | Phase offset |
|---|---|---|
| Hero left | 8 | -1.3s |
| Hero right | 9.7 | -5.2s |
| Tracks | 8.9 | -3.7s |
| Process | 10.3 | -7.1s |
| Progression | 9.4 | -11.4s |
| Field pricing | 8.4 | -2.6s |
| Eras | 10.7 | -9.8s |
| Behind LOADOUT | 9.1 | -15.7s |
- Both the base and spotlight layers move together. Keep the existing pointer-mask behavior.
- Reverse the initial direction for the hero-right and Tracks drawings using alternate-reverse. Together with the existing phase offsets, four drawings start downward and four upward; every drawing still reverses smoothly at each end.
- Retain current visibility breakpoints and static artwork under reduced motion. Decorative art remains hidden from assistive technology and ignores pointer hits.

## Scope and acceptance

Only adjust the existing ar-drift keyframes and scoped timings in home.css. Configure period and phase through CSS variables on the drawing selectors. No new assets, component logic, layout or copy.

The local homepage must render without horizontal overflow at desktop and narrow widths. Browser inspection must confirm the wider motion range and animation:none under reduced motion. No new tests are needed for this reversible CSS experiment.

## Implementation handoff

A GPT-6 Luna engineering agent at medium reasoning implements this scoped CSS change against the existing design system. The parent agent checks the rendered local preview.

Required UI skills consulted: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites and Pixel Art Animator. No SVG or sprite assets are edited.
