# LOADOUT design system

**Status:** Current visual authority for LOADOUT-owned public web interfaces. Product facts remain owned by the canonical plans; the system defines presentation, not new mechanics.

The current reference-based typography and surface redesign is scoped to the homepage. Participant Docs keeps its existing type roles and pane behavior during this first pass.

The navigator's moon/sun control selects light stone paper or dark coal. Dark canvas is `#141210`, foreground is `#EFE6D4`, muted copy is `#B5AA98`, and action gold is `#DCC49C`. Gold-filled controls use coal text in dark mode. The choice is stored as `loadout-theme` when browser storage is available; light is the initial default. The homepage navigator stays visible while scrolling, uses the reference's five labels and 30px desktop gaps, and adapts to an accessible menu below 1000px.

## Identity

LOADOUT is an industrial field manual with pixel utility: warm stone paper, coal-ink rules, measured grid lines, subtle print grain, block display type, and readable technical mono. Use restrained Bolt Yellow and a small rust accent. The interface should feel like a practical build dossier from a working mine, not a game dashboard or generic SaaS template.

## Color tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#DDD3BF` | Warm stone paper page background. |
| Surface | `#E9E2D4` | Opaque cards, navigation, FAQ rows. |
| Surface muted | `#D6CCB7` | Homepage plates; deeper metal shading reaches `#CBBFA8`. |
| Grid | `#CBBFA8` | Low-contrast 40px homepage paper grid with a faint 200px guide. |
| Ink | `#1A1714` | Text, borders, and outlines. |
| Graphite | `#29241F` | Dark track and emphasis panels. |
| Graphite raised | `#383128` | Secondary dark-panel surface. |
| Steel | `#999184` | Dividers and subdued labels. |
| Muted text | `#5A5145` | Secondary copy with readable contrast on paper and muted plates. |
| Bolt Yellow | `#E3C26B` | Homepage primary actions and markers. |
| Yellow soft / highlight / edge | `#E9CD83` / `#EBD59A` / `#A88737` | Hover, highlight, and pixel-art edge details. |
| Rust | `#C4491F` | Small secondary accent for emphasis; never required to identify meaning. |
| Rust text / plate text | `#84301B` / `#514A40` | Darker text accents with readable contrast on metal plates. |
| Success / danger | `#65775D` / `#A94B3E` | Clearly labelled status only. |

Do not use blue/purple glow, gradients, or glass as decoration. Keep rust limited to small accent details; mockup colors do not override these tokens.

## Typography and layout

- Homepage display: self-hosted `Pixelify Sans` 700 for headings, card titles, and the wordmark.
- Homepage body and utility labels: self-hosted `Barlow Condensed` 500/600/700. Actions, ASCII, code, and technical values use self-hosted `JetBrains Mono` 400–800. Docs retains Jersey 10 and IBM Plex Mono in this homepage-only typography pass.
- Use the 40px homepage paper grid with a faint 200px guide and a subtle static print-grain overlay. Keep the central content width near 1080px unless a scoped design brief sets a different reading layout. The active visual handoff is [Redesign foundation](../../../.ulpi/design/redesign-foundation.md).
- Use a 4px spacing base. Keep section rhythm generous and consistent; cards should not collapse into dense text blocks.
- The hero is a centered, framed, near-fullscreen page entrance. Existing copy, section flow, and frame geometry are owned by [Plan 06](../../../plans/06-public-homepage.md).
- The homepage may use static, decorative ASCII mine-hoist/headframe details to frame the hero. Keep them outside the reading and action area, hide them when the viewport is too narrow, and mark them `aria-hidden`; do not use the prepared workshop PNGs as page backgrounds.
- The implemented homepage content width is 1080px. Major section padding is 72px desktop (88px for process/progression/Eras), 56/64px tablet, and 44px mobile. Essential body copy is 16px; footer links are 14px desktop and 16px mobile, with 44px minimum targets.

## Surfaces, borders, and controls

- Prefer square corners and thin 1px coal rules for homepage cards and controls. Use restrained inset depth instead of block shadows.
- Use warm paper reading surfaces and light metal track panels (`#D6CCB7` / `#CBBFA8`); keep their labels readable in coal ink.
- Use Bolt Yellow selectively to show action, selection, progress, or status. Do not add decorative bolts/rivets to every surface.
- Keep hover/focus feedback small and deliberate. Do not scale or rotate utility controls without a specific interaction need.
- Use visible `:focus-visible` states and minimum 44px touch targets for primary interactive controls.

## Pixel artwork and asset use

- Current homepage glyphs are the transparent 32×32 PNGs in `apps/landing/public/loadout/sprites/`. Source-to-runtime mappings live in [the asset catalog](../asset-catalog.md).
- The active Bolt glyph is `sprites/bolt.png`. Keep the owner-supplied custom `apps/landing/public/loadout/bolt.svg` intact as a separate original asset.
- Keep the LOADOUT logo/wordmark/favicon separate from currency and utility sprites.
- Render pixel artwork with nearest-neighbor or `image-rendering: pixelated`; preserve transparency and source pixels. Do not add smoothing, backgrounds, or filters to sprite files.
- Scenery vectors are kept under `apps/landing/public/loadout/hero/scenery/`, and the current homepage does not render them. The 31 `hero-workshop` PNGs are kept from the abandoned workshop hero background and are not rendered. Do not wire them into the hero without a new owner decision.
- New unapproved files belong in `assets/inbox/`. Keep editable sources under `assets/editable/`, distinct old variants under `assets/archive/`, and visual-only examples under `docs/design/references/`. Do not keep identical live exports in multiple folders.

## Motion and reduced motion

Motion supports orientation and feedback. Use 120ms fast, 180ms base, and 300ms emphasis transitions; hero entrance remains an 800–900ms sequence with the established ease. Respect the existing native page and bounded Docs scrolling; the Docs route must not introduce body scrolling or Lenis. Keep hero and section reveals restrained. Clouds use horizontal parallax of ±112px desktop/±48px mobile, with separate ±12px inner drift over 48 seconds; size them at `clamp(280px,32vw,560px)` desktop and 260px mobile. Under `prefers-reduced-motion`, disable transforms, smooth movement, and reveals while keeping all content visible and keyboard-operable.

Do not add ambient factory motion, autoplay, or background animations that compete with reading. Follow `docs/development/ui-skills.md` for every UI change; skill use does not authorize a product-scope change.

## Accessibility and responsive behavior

Use semantic headings, lists, buttons, links, and labelled groups. Decorative scenery must be `aria-hidden`, non-interactive, and unable to create horizontal overflow. Keep keyboard focus visible. At narrow widths, preserve readable copy, direct routes, and no clipped controls. Docs-specific widths and internal-pane scrolling are owned by the [internal Docs architecture guide](../../development/architecture.md).

## Future product interfaces

Dashboard, profile, project submission, project exploration, shop, ordering, missions, and leaderboard concepts remain unapproved proposals in [Future platform UI](../../../plans/proposals/future-platform-ui.md). This system does not authorize those services or their live data.
