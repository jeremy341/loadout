# Transparent sprite backgrounds and bottom CTA removal

## Design read

This is a cleanup of the industrial field-manual homepage. Pixel icons must sit directly on graph paper and cards with no paper-colored tile; the full-width hero remains the page's primary RSVP action.

## Scope

- Remove opaque paper-colored pixels left around and inside the sprite artwork while preserving yellow, ink, and intentional shaded sprite pixels.
- Preserve transparent SVG canvases, the LOADOUT logo/favicon, and moving clouds.
- Remove the redundant bottom `Equip your next build` RSVP panel. Keep the hero RSVP button and normal footer.
- Do not change copy or styling elsewhere.

## Behavior, responsiveness, accessibility

Icons remain decorative images with empty alt text and `aria-hidden`. Removing the final CTA leaves the main landmarks as navigation, main page content, and footer; the hero remains the clear join action. The change applies at every viewport size and adds no motion.

## Acceptance criteria

- No opaque paper-colored backdrop pixels remain in sprite SVGs or the derived skyline.
- Hero RSVP remains; bottom RSVP panel and its unused styles/component are removed.
- Logo and background cloud assets are unchanged.
- TypeScript and `git diff --check` pass.
