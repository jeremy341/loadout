# Restore the Earlier LOADOUT Icons

Status: superseded on 2026-10-06 by [the final pixel icon integration](pixel-icon-sprite-integration.md). Its instructions to activate bolt.svg no longer apply; current icon sources and mappings are recorded in [SPRITE_SHEET_INDEX.md](../../docs/design/references/2026-10-05/pixel-assets/SPRITE_SHEET_INDEX.md).

Historical status: approved for implementation before the final icon set was supplied.

## Design read

This is a preserve-style restoration of LOADOUT's industrial, pixel-signage icon language. Reuse the inline icons from commit `5a5b6f0`; keep the current composition, palette, typography, cloud scenery, and motion.

## Source and scope

- Earlier icon source: `apps/landing/app/_components/icons/LoadoutIcon.tsx` at `5a5b6f0`.
- Earlier FAQ chevron and level-badge treatment: `apps/landing/app/_components/HomepageSections.tsx` and `apps/landing/app/loadout.css` at `5a5b6f0`.
- Preserve the user's Bolt asset at `apps/landing/public/loadout/bolt.svg` exactly. Use it for every Bolt icon in place of the earlier inline bolt drawing.
- Restore the earlier `LoadoutIcon` artwork for all other icon names. Restore the FAQ chevron path and star-in-hex level badge. Keep the current five milestone labels and layout.
- Remove sprite-pass icon files from `apps/landing/public/loadout/icons/` only after all code references are removed. Do not change background clouds (`cloud-1.svg`, `cloud-2.svg`, `cloud-3.svg`), `skyline.svg`, `scroll-down.svg`, `slashes.svg`, the LOADOUT brand mark, or `app/icon.svg`.

## Component brief

### `LoadoutIcon`

- Purpose: provide the established 32-by-32 inline icon family throughout the existing homepage.
- Variants: use the historical shapes/colors for each `IconName`; `bolt` displays the preserved `/loadout/bolt.svg` asset.
- State: decorative icons remain hidden from assistive technology; nearby text or control labels continue to provide meaning.
- Responsive behavior: keep the 32-by-32 viewBox; existing parent styles determine rendered size.
- Accessibility: retain `aria-hidden`, `focusable="false"`, and existing accessible labels on links/buttons.
- Motion: no new motion. Keep the existing FAQ disclosure transition and reduced-motion behavior.

### `LevelBadge` and FAQ chevron

- Restore the star inside the existing six-sided level badge style and the prior small chevron path.
- Preserve the five current milestone values, their labels, FAQ state behavior, and all responsive layout rules.
- Do not change section order, copy, navigation, cloud motion, or unrelated icon sizing.

## Design-system and accessibility constraints

- Bind to the existing `industrial / signage` direction and tokens in `.ulpi/design/DESIGN.md`.
- Do not introduce new colors, fonts, gradients, animation, or icon artwork.
- Keep every non-interactive icon decorative and every icon-only control named by its existing accessible label.
- Preserve the existing FAQ focus treatment and keyboard behavior.

## Acceptance criteria

1. All non-Bolt site icons match the earlier icon component at commit `5a5b6f0`.
2. Every Bolt uses the user's current `apps/landing/public/loadout/bolt.svg`; its SHA-256 remains `1AC76AE2033939AA05F451B30B093F619BD01718BE479ADC7C53A5C11C979667`.
3. The five level markers use the earlier star-and-hex treatment, and the FAQ uses the earlier chevron.
4. Sprite-pass icon files have no remaining references; cloud scenery, the LOADOUT mark, and favicon are unchanged.
5. No copy, page order, navigation, layout, or motion behavior changes.
6. Manually inspect the homepage at desktop and mobile widths for icon clarity, sizing, and clipping.

## Pre-flight

- Identity lock: pass; reuse the locked palette, type, spacing, and icon language.
- Anti-slop: pass; no new visual conventions or decoration are introduced.
- State and flow coverage: pass; FAQ disclosure and navigation behavior remain the same.
- Accessibility: pass when decorative icons remain hidden and functional controls retain their names and focus styles.
- Layout and cognitive load: not changed by this restoration.
- Self-critique (0–4): distinctiveness 4, hierarchy 4, consistency 4, accessibility 3, state coverage 4, copy 4, restraint 4, motion 4. Total: 31/32. Accessibility is 3 pending visual inspection of the custom Bolt asset at rendered sizes.

## Build handoff

Target: Next.js App Router implementation agent. Implement this spec on the existing short-lived branch and open PR #7. Preserve the custom Bolt asset byte-for-byte. Do not redesign the page or change content, layout, motion, brand mark, favicon, or cloud scenery.
