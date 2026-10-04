---
project: LOADOUT public website
register: brand
aesthetic_direction: industrial / signage
color_strategy: restrained
design_system: bespoke
design_variance: 7
motion_intensity: 4
visual_density: 4
---

# LOADOUT Design Language

## Latest reference amendment — 2026-10-04

The user selected direct code implementation and supplied `codex-clipboard-6ecd3256-5ec8-4580-a85b-8105eafacdd8.png` as the current composition target. Preserve its paper grid, edge clouds, skyline, framed hero, overview cards, six-step flow, project-fit comparison, four dark track cards, separate Research Mode, progression, field-pricing cards, custom-order strip, reward rows, category grid, FAQ, and footer. Pale stepped SVG clouds drift gently, with a static reduced-motion fallback. Small progression badges follow the screenshot's steel/yellow/warm/red sequence; the rest of the page retains yellow/graphite.

Canonical facts own content. Planned category illustrations fill shop containers with honest category labels. Checkpoints within LV.1–15 use action captions rather than invented rank names or reward thresholds. Prices, percentages, dates, live stock, and external joining destinations remain data-gated.

## Design Read

An industrial field manual for young technical builders, expressed through clean graph paper, pixel utility, and one memorable framed hero.

## Direction and counterfactual test

**Committed direction: industrial / signage.** LOADOUT is about building technical capability and equipment. Its engineering-paper canvas, precise black rules, technical labels, and Bolt Yellow cue make that subject legible without borrowing a game world or generic SaaS style. Pixel display type gives the identity its builder culture.

The counterfactual test passes: this identity depends on LOADOUT's field-manual concept, pixel typography, physical Bolt token, and Digital/Physical Loadout loop. It is not a reusable generic tech-program template.

## Signature

The hero is a fullscreen centered technical plate: large block lettering held inside four sparse corner marks, with small left/right labels and clear actions below. Keep the graph-paper whitespace and diagonal markers in the upper-left/lower-right corners. The 2026-10-04 hero reference is `codex-clipboard-15beff91-84dd-439c-8541-1ac5add39397.png`. The brand uses its compact machine mark; currency uses the newly requested yellow lightning Bolt SVG.

## Register and design system

- **Register:** brand. This is the public entry experience and its visual identity is part of the product.
- **Design system:** bespoke. The landing page needs a specific composition and typography identity; use semantic HTML and accessible native controls rather than importing a component system.
- **Product truth:** four lifetime tracks are Tools, Systems, Compute, and Hardware. Research Mode is a modifier. Bolts are global spendable currency. Track XP is separate. Shipped work grows the Digital Loadout; rewards upgrade the Physical Loadout.
- **Identity lock:** Every screen must read as the same product if placed side by side.

## Color (locked)

The supplied LOADOUT design system is the source of these colors. OKLCH values below are perceptual conversions of its sRGB hex values; retain the hex values at implementation boundaries. The neutrals carry a slight warm tint. Target surface distribution: roughly 70% canvas/surface, 20% ink/graphite, 8% Bolt Yellow, up to 2% semantic state colors.

| Role | OKLCH | Hex | Use |
|---|---|---|---|
| Canvas | `oklch(0.952 0.007 89)` | `#F1EFEA` | Main page background |
| Surface | `oklch(0.970 0.007 89)` | `#F7F5F0` | Navigation, content plates, FAQ rows |
| Surface muted | `oklch(0.916 0.007 89)` | `#E5E3DE` | Quiet secondary panels and hover fill |
| Grid / border muted | `oklch(0.876 0.007 89)` | `#D8D6D1` | Low-contrast background grid only |
| Ink | `oklch(0.209 0.004 264)` | `#17181A` | Main text, rules, outlines |
| Graphite | `oklch(0.251 0.006 258)` | `#202225` | Dark track/progression panels |
| Graphite raised | `oklch(0.296 0.006 258)` | `#2B2D30` | Hover/secondary dark-panel surface |
| Muted text | `oklch(0.492 0.001 197)` | `#606161` | Secondary text on light surfaces |
| Accent: Bolt Yellow | `oklch(0.855 0.161 88)` | `#FBC834` | Primary action, Bolt symbol, small markers |
| Accent pressed | `oklch(0.764 0.145 88)` | `#D8AC29` | Pressed border / Bolt edge; not a second accent |
| Accent light | `oklch(0.870 0.149 90)` | `#FBCF50` | Primary-action hover fill |
| Success | `oklch(0.640 0.110 146)` | `#5D9E63` | Status icon/border only, never large area |
| Warning | `oklch(0.855 0.161 88)` | `#FBC834` | Status icon/border; same accent |
| Danger | `oklch(0.581 0.163 27)` | `#C94A42` | Status icon/border only; do not use for FAQ arrows |
| Info | `oklch(0.722 0.000 90)` | `#A5A5A5` | Non-text status boundary or divider only |

Contrast checks, WCAG relative luminance on the listed hex values:

| Foreground / background | Ratio | Result |
|---|---:|---|
| Ink on canvas | 15.46:1 | AAA |
| Ink on surface | 16.31:1 | AAA |
| Muted text on canvas | 5.41:1 | AA |
| Muted text on surface | 5.70:1 | AA |
| Ink on Bolt Yellow | 11.35:1 | AAA |
| White on graphite | 15.95:1 | AAA |
| White on raised graphite | 13.81:1 | AAA |
| Ink on muted surface | 13.85:1 | AAA |

Do not use white text on Bolt Yellow. Semantic colors are decorative icon details paired with a visible ink outline and an adjacent ink label; the status never relies on color alone. Grid lines are decorative and must not be used as control boundaries. Links and controls use ink outlines and visible focus treatment so affordances do not rely on yellow alone.

## Type (locked)

| Role | Family | Use | Notes |
|---|---|---|---|
| Display | Jersey 10 | Hero and section headlines, short labels | Uppercase only where it aids signage; line-height 0.9–1.0; tight tracking; wrap deliberately; no glow or arcade outline |
| Body | IBM Plex Mono | Paragraphs, FAQ answers, explanatory copy | Use 16px minimum on mobile and target 65–75ch measure; use sentence case; line-height 1.55–1.7 |
| Utility | IBM Plex Mono | Nav, captions, track descriptors, metadata | 12–14px; reserve uppercase for short labels; never shrink essential details to fit |

The block display face contrasts with the quiet technical mono. Load only licensed, self-hosted font files where available; metric-match the monospace fallback. Fallback stacks are `monospace` and must retain good wrapping if custom fonts fail.

## Scales (locked)

- **Spacing:** 4px base; allowed values `0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128px`. Main sections use generous desktop padding and tighten by breakpoint. Content max width `1440px`; reading measure stays narrower.
- **Radius:** `2px, 4px, 6px`. Default panels are square or nearly square; no pill cards.
- **Borders:** `1.5px` ink for standard panels, `2px` for the hero frame and key containers. Rules stay straight and deliberate.
- **Shadow:** hard offset only: `2px 2px 0 ink` and `4px 4px 0 ink`. Buttons may compress the offset when pressed. No blurred elevation.
- **Grid:** clean CSS graph grid at `24px` with a faint `120px` guide. Keep it low contrast; no paper stains, noise, or texture images.
- **Motion:** fast `120ms`, base `180ms`, emphasis `300ms`, rare entrance/reveal ceiling `500ms`; easing `cubic-bezier(0.16, 1, 0.3, 1)`. Exits are shorter than entrances. No bounce/elastic. Honor `prefers-reduced-motion` and keep content visible without JavaScript.
- **Responsive breakpoints:** `640px`, `768px`, `1024px`, `1280px`. Design from mobile upward and prevent horizontal overflow.
- **Focus:** 3px Bolt Yellow outline with 2px ink offset on light surfaces; on yellow surfaces use a 3px ink outline. Focus is never removed.

## Graphic and icon language

Use authored, flat SVGs on a 24px or 32px grid, with ink outlines, no more than three colors, square geometry, and no gradient or gloss. The logo mark is a compact machine mark; Bolts use a custom yellow lightning silhouette. Track marks vary by silhouette and label. The slash motif frames the fullscreen hero. Pale clouds are about 40% larger than the initial page and use bounded spring-smoothed scroll parallax, with their discrete drift on a separate inner layer. Reduced motion disables both transforms and drift.

## Motion principles

Motion supports orientation and feedback. Smooth scrolling stays user-controlled and preserves anchor/focus behavior. A scroll-aware header may tuck while scrolling down and reveal on upward movement; focus, hover, pointer interaction, or an open menu pins it visible. The hero receives one short entrance sequence. Sections reveal gently when entering view; reveal code must fail open with all content visible. Buttons show tactile press/hover feedback. FAQ rows animate height and icon state. No looping decoration or autoplay media.

At `prefers-reduced-motion: reduce`, disable smooth scrolling, entrance and scroll reveals, transforms, and animated disclosure; use native scrolling and immediate expanded/collapsed state. The complete page and every answer remain usable.

## Voice

- **Register:** plain, confident, technical, welcoming to builders.
- **Action vocabulary:** Explore, Read, Join, Ship, Review, Earn, Upgrade. Keep labels consistent between nav, CTA, and destination.
- Write from the builder's point of view. Explain program terms when first used. Avoid claims that imply dates, eligibility, current inventory, endorsements, participant totals, or pricing unless supplied by an approved live configuration.
- Keep sentences short. Avoid fake stats, testimonials, invented project examples, buzzwords, and decorative em dashes.

## Named anti-slop bans

The direction fails if it uses any of these without a brief-backed reason: purple/blue glow or gradient, default beige/cream tokens, gradient text, glassmorphism, oversized soft-radius SaaS panels, generic stock/AI industrial art, fake dashboard imagery, repeated equal-card grids, cards nested inside cards, unrelated eyebrow numbering, fake screws/rivets, scratch/grunge, a game-world backdrop, rainbow tracks, fake precision, dead CTA destinations, or scattered infinite animation. The graph paper, Bolt Yellow, block type, and sparse technical markers must explain the product or orient the reader; remove any mark that does neither.
