# Logo: the miner's helmet mark

Status: implemented on this branch.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), section "Logo".

## Design read

A hard hat with its lamp lit: the first thing a miner puts on, and the German "Glück auf". It is a hand-drawn pixel sprite from the one-bit icon pack, so it looks drawn, not generated.

## Decision record

Four marks were compared (helmet, loaded cart, cart with pickaxe, crossed tools). The crossed tools turned into a blob when the two sprites overlapped. The owner chose the helmet. A separate mine-headframe direction from another session was dropped by the owner and is not part of this change.

## Scope

- In: the nav, footer and docs logo (`Logo.tsx`), the favicon, the Apple touch icon, the share image and its alt text, the lamp blink on hover.
- Out: the wordmark text in the site (it stays real text in Jersey 10) and any new interaction.

## Rules

- 24 by 24 pixels, shown at 24 pixels: one mark pixel is one site pixel. Never scale it by a fraction.
- Plate in the accent, outline in ink, helmet in the paper colour, per theme.
- The lamp is its own path. On hover, with a fine pointer and no reduced-motion request, it blinks once (0.9 s, stepped). Nothing else moves.
- The share image is a JPEG under 300 KB, 1200 by 630, with grain under the text so small type stays sharp.

## Acceptance

1. The nav, footer and docs show the helmet in both themes, at 24 pixels.
2. Hovering the logo blinks the lamp; reduced motion keeps it still.
3. The page head advertises `og:image`, `twitter:image` (large card), the favicon and the touch icon, and the image responds with a JPEG under 300 KB.
