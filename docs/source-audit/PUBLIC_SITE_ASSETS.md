# Pixl Landing Asset Audit

Historical Stage A source: `references/pixl/apps/landing/public` at Pixl SHA `8141b992e92e05583246fd914c63a101100f6fe4`. No per-file asset license manifest was found. Stage A copied 69 existing public assets for local comparison; all 69 were removed in Stage B. `step-4.mp4` and `step-5.mp4` were absent from the source and were never copied. The Pixl MIT notice remains preserved.

## Current LOADOUT assets

- Current homepage icons: 38 independent transparent 32×32 SVGs from the 2026-10-05 sprite design sheet in `apps/landing/public/loadout/icons/`, wired through `LoadoutIcon.tsx` and `LevelBadge.tsx`. The nut logo, wordmark, lockup, and `app/icon.svg` favicon remain unchanged. The three moving scene-cloud SVGs remain unchanged. The old public URLs `loadout/bolt.svg`, `scroll-down.svg`, `skyline.svg`, and `slashes.svg` are kept and now use sheet-derived art.
- Fonts: `public/fonts/Jersey10-Regular.ttf`, `PixelifySans.ttf`, `IBMPlexMono-Regular.ttf`, and `IBMPlexMono-SemiBold.ttf`. They are self-hosted official Google Fonts files under SIL Open Font License 1.1; the family-specific OFL notices are included beside them. Sources: [Jersey 10](https://github.com/google/fonts/tree/main/ofl/jersey10), [Pixelify Sans](https://github.com/google/fonts/tree/main/ofl/pixelifysans), [IBM Plex Mono](https://github.com/google/fonts/tree/main/ofl/ibmplexmono).
- The shop uses labeled planned category icons. It contains no copied product photos, invented prices, stock, or fulfillment claims.
- Bolt and XP now use the Bolt and star cells from the sprite design sheet. The earlier user-supplied Bolt SVG remains in the user's Downloads folder and is not the active homepage icon.
- `public/loadout/scroll-down.svg` is preserved as a compatibility asset, redrawn from the sheet's downward-chevron cell. The site icon renderer uses its independent counterpart at `public/loadout/icons/down.svg`.
- The 2026-10-05 refinement uses muted yellow/grey SVG fills consistent with the active design tokens. Clouds size to `clamp(200px, 26vw, 420px)` on desktop and 220px on mobile; their movement is controlled by the component/CSS, not embedded SVG animation. Font files and license notices are unchanged.

## Historical baseline inventory

Paths referenced by the pinned landing route:
- `public/flow-explore.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/flow-join.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/hc-logo.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/hero-bg-poster.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/og-boot-splash-v4.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/pixel_currency_gold-removebg-preview.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/pixel_currency_red-removebg-preview.png` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/a1-mini.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/airpods-max.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/airpods-pro-3.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/api.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/apple-dev.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/art-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/aseprite.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/assets-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/bambu-a1-combo.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/bambu-a1.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/blahaj.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/centauri-carbon.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/cookie-cutter.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/cpu-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/domain-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ender3-v3.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/esp32.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/food-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/framework-13.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/framework-16.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/furycube.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/gamemaker.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/godot-plush.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/google-play.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/gpu-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hardware-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hc-stickers.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hoodie.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/hosting-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/indie-game.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ipad-air-m4.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ipad.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/keyboard-s75-pro.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/mac-mini.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/macbook-air.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/macbook-neo.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/meme-pack.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/monitor-4k.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/music-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/mystery-box.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/nintendo-switch-2.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/nothing-phone.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/pencil-pro.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/pico8.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/pixel-composer.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/poster.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/ram-grant.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/retro-handheld.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/rpi.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/samsung-s24.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/samsung-t7-ssd.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/screwdriver.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/signed-photo.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/soldering-iron.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/sony-ch720n.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/sony-headphones.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/sparkx-i7.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/steam-license.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/tamagotchi.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/shop/wacom.webp` — temporary Stage A reference; remove before final LOADOUT page.
- `public/step-3.mp4` — temporary Stage A reference; remove before final LOADOUT page.
- `public/step-4.mp4` — no file exists in the pinned source; source code marks this step as coming soon, so keep its fallback and do not invent a video.
- `public/step-5.mp4` — no file exists in the pinned source; source code marks this step as coming soon, so keep its fallback and do not invent a video.
- `public/world-map.webp` — temporary Stage A reference; remove before final LOADOUT page.

The hero and first two instructional videos are loaded from Hack Club CDN URLs in source components rather than copied files. They are temporary Stage A only and must not remain in the final page. Final LOADOUT imagery is limited to authored SVG markers/icons and approved real project or reward assets when those exist.

## Font file checksums

SHA-256 of the vendored files on 2026-10-04:

| File | SHA-256 |
|---|---|
| IBMPlexMono-Regular.ttf | 6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46 |
| IBMPlexMono-SemiBold.ttf | d3c38e55c78f5b0f28009fddba4834ec503278936a5986032424c9bd2d23aa46 |
| Jersey10-Regular.ttf | db9cbd091617048a145d249daa2b815fe7083be6ab66ac26626e21a4e01c3e82 |
| PixelifySans.ttf | 9ba86cd010a4de309d263ceff8e8044092c9db7efda869620cb9ff1c4389e8a5 |

Verified upstream Google Fonts commit: 
9710da1eacb3be272583c3224dcb70f9da6eadbb
. All four font files and three OFL notices match that immutable revision byte-for-byte.


## Superseded Plan 12 SVG-art experiment — 2026-10-05

The user later requested hand-drawn icons using the supplied raster reference and superseded that standalone-SVG draft. No icons from that 46-file attempt remain in the empty archive. The site uses the previous vector XP star and the user-supplied Bolt SVG.

Cloud source files are unchanged authored LOADOUT art. Display width increases to clamp(280px,32vw,560px) desktop/260px mobile. Movement stays in component/CSS: X-only ±112/±48px viewport parallax and separate smooth ±12px drift over 48s. Reduced motion disables both. No fonts, source photos, dependencies, or license notices changed.



## User-supplied Bolt and hand-design sprite atlas — 2026-10-05

This section records the intermediate asset state before the later sprite-sheet integration below.

`C:/Users/jerem/Downloads/Bolt_for_Loadout.svg` was copied byte-for-byte to `apps/landing/public/loadout/bolt.svg`; `LoadoutIcon` displays it for Bolts. The prior vector XP star is restored. Cropped PNG icon outputs and the raster favicon experiment were removed. The original `app/icon.svg` favicon is restored.

The user-provided visual reference is preserved at `docs/design/references/2026-10-05/pixel-assets/loadout-pixel-icon-sheet.png`. The AI-generated hand-drawing atlas at `docs/design/references/2026-10-05/loadout-32px-sprite-design-sheet.png` is a 224x192 transparent PNG made of 42 independent logical 32x32 cells in a 7-column, 6-row grid. Its exact cell order is recorded in `docs/design/references/2026-10-05/pixel-assets/SPRITE_SHEET_INDEX.md`. The atlas covers website UI icons, Requisition badges, brand/logo/favicon guides, slash art, and skyline tiles. The background clouds are excluded; the small Cloud utility symbol is present. The atlas is a design handoff, not website artwork, and there are no extracted PNG sprites wired into the app.

The previous 46-icon-SVG attempt folder was already empty when checked. No standalone-icons archive is in use.

## Sprite-sheet SVG integration — 2026-10-05

Following the later request to use the sprite sheet for the homepage, its 38 non-logo cells are now independent transparent SVGs. All current icon and level-badge image paths resolve to those vector files; FAQ chevron, slash motif, and skyline are also sheet-derived. The site keeps the existing LOADOUT logo mark and favicon plus all three background clouds. Pixel shapes use crisp-edge SVG geometry. `docs/design/references/2026-10-05/pixel-assets/SPRITE_SHEET_INDEX.md` records the cell order and exported files. The user-provided Bolt SVG was not deleted from Downloads; the Bolt shown on the site now follows the sheet's Bolt cell.

## Sprite background cleanup and bottom CTA removal — 2026-10-05

Removed the sheet's pale paper-colored pixels from each icon's art so the SVGs remain transparent when displayed over any surface. The skyline composition is regenerated from the cleaned cells. The redundant bottom RSVP callout is removed; the hero RSVP action and footer remain.
