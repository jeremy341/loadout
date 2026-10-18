# Transparent depth labels

Status: implemented locally and visually checked on the homepage, 2026-10-17.

## Scope

The homepage's right-hand depth labels should sit directly over the hatched band, like the meter numerals on the left. Remove the page-colored plate behind `.home .pit > span`.

## Design

Use the existing two text-clipped background layers: faint ink at rest and the pointer-positioned glow. Remove the third, box-clipped page-color layer. Keep the label's font, padding, dimensions, alignment and text unchanged.

The same transparent treatment applies in dark and light themes and at existing responsive breakpoints. Touch and reduced-motion behavior stay as implemented. Preserve the system-color fallback used for both labels and numerals in forced-colors mode.

## Acceptance

- Hatching continues behind the right-hand label without a rectangular interruption.
- Both label layers are clipped to text, matching the numeral treatment.
- The existing faint-at-rest and pointer glow remain intact.
- No layout, copy, interaction or asset changes are introduced.

Current styling owner: `apps/landing/app/home.css`; presentation rules: `docs/design/system/design-system.md`.

## Owner follow-up: larger labels

Requested 2026-10-17: enlarge the right-hand text while keeping its transparent treatment. Increase the responsive font size from `clamp(20px, 2.2vw, 32px)` to `clamp(28px, 3vw, 44px)`, and from 16px to 20px on phones. Preserve the meter numeral size, faint/glow colors, alignment and existing wrapping. Check the first marker and a longer label in the local preview.
