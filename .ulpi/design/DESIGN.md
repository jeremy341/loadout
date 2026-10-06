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

## Current homepage order — 2026-10-05

[Plan 13](../../PLAN/13_LOADOUT_HOMEPAGE_INFORMATION_ARCHITECTURE.md) with the implemented [Plan 14 hierarchy](../../PLAN/14_LOADOUT_PROGRESS_AND_PRIZES_HIERARCHY.md) now govern the page composition: hero → concise About/Digital/Physical explanation → grouped tracks/Research/project fit → unchanged How it works → one Progress & prizes section containing lifetime levels, pricing/discounts, Requisitions, planned prizes and Custom Orders → Community Eras → FAQ → footer. The duplicate About step cards and broad equipment-category grid are removed. The underlying palette, type, icons, hero, process design, and motion remain the established identity. See [the Progress & prizes brief](progress-and-prizes.md) for its nested heading and anchor contract.

## Active homepage refinement — 2026-10-05

The user approved implementation of [the clarity spec](loadout-homepage-clarity-flow-and-eras.md) and [Plan 12](../../PLAN/12_LOADOUT_HOMEPAGE_CLARITY_FLOW_AND_ERAS.md). The homepage now uses a central downward process and parallel Bolt/XP outcomes, five real Requisition milestones, explanatory Community Eras, separate pricing/Requisition/Custom Order copy, stepped SVG artwork, and a larger footer. The vertical process replaces the former six-card diagram; the optional small wrap-arrow patch is superseded.

Active sizes: 72px major section padding on desktop, 88px for process/progression/Eras; 56/64px on tablet; 44px on mobile. Essential body copy is 16px at 1.65 line height. Footer links are 14px desktop/16px mobile with 44px minimum targets; columns reflow five/two/one. Outer content width remains 1080px. Cloud width is clamp(280px,32vw,560px), or 260px mobile; horizontal scroll range is ±112px/±48px with a separate ±12px inner drift over 48 seconds. Reduced motion keeps scenery static.

The palette, typography, fullscreen two-line desktop hero, RSVP link, Lenis scrolling, navigation, and FAQ infrastructure remain the established baseline. New section styling lives in homepage-refinement.css after loadout.css. Retired six-card process, smooth level-badge, and reward-table styles have been removed.

## Latest reference amendment — 2026-10-04

The user selected direct code implementation and supplied `codex-clipboard-6ecd3256-5ec8-4580-a85b-8105eafacdd8.png` as the current composition target. Preserve its paper grid, edge clouds, skyline, framed hero, overview cards, six-step flow, project-fit comparison, four dark track cards, separate Research Mode, progression, field-pricing cards, custom-order strip, reward rows, category grid, FAQ, and footer. Pale stepped SVG clouds drift gently, with a static reduced-motion fallback. Small progression badges follow the screenshot's steel/yellow/warm/red sequence; the rest of the page retains yellow/graphite.

Canonical facts own content. Planned category illustrations fill shop containers with honest category labels. Checkpoints within LV.1–15 use action captions rather than invented rank names or reward thresholds. Prices, percentages, dates, live stock, and external joining destinations remain data-gated.

## Design Read

An industrial field manual for young technical builders, expressed through clean graph paper, pixel utility, and one memorable framed hero.

## Direction and counterfactual test

**Committed direction: industrial / signage.** LOADOUT is about building technical capability and equipment. Its engineering-paper canvas, precise black rules, technical labels, and Bolt Yellow cue make that subject legible without borrowing a game world or generic SaaS style. Pixel display type gives the identity its builder culture.

The counterfactual test passes: this identity depends on LOADOUT's field-manual concept, pixel typography, physical Bolt token, and Digital/Physical Loadout loop. It is not a reusable generic tech-program template.

## Signature

The hero is a fullscreen centered technical plate: large block lettering held inside four sparse corner marks, with small left/right labels and clear actions below. Keep the graph-paper whitespace and diagonal markers in the upper-left/lower-right corners. The 2026-10-04 hero reference is `codex-clipboard-15beff91-84dd-439c-8541-1ac5add39397.png`. The brand uses its compact machine mark; currency uses the yellow lightning Bolt sprite from the approved 32×32 sheet.

## Register and design system

- **Register:** brand. This is the public entry experience and its visual identity is part of the product.
- **Design system:** bespoke. The landing page needs a specific composition and typography identity; use semantic HTML and accessible native controls rather than importing a component system.
- **Product truth:** four lifetime tracks are Tools, Systems, Compute, and Hardware. Research Mode is a modifier. Bolts are global spendable currency. Track XP is separate. Shipped work grows the Digital Loadout; rewards upgrade the Physical Loadout.
- **Identity lock:** Every screen must read as the same product if placed side by side.

## Color (locked)

Active muted-grey palette, approved and implemented 2026-10-04. Hex values are authoritative. Paper remains neutral; yellow is an accent, with ink carrying structure and readable text.

| Role | Hex | Use |
|---|---|---|
| Canvas | #E8E9E6 | Paper/grid background |
| Surface | #F0F1ED | Opaque cards, nav, FAQ |
| Muted surface | #DDE0DC | Secondary plates |
| Ink | #1D2021 | Text, rules, outlines |
| Graphite / raised | #292C2D / #34383A | Track plates |
| Muted text | #575E60 | Secondary copy |
| Rule | #9DA5A4 | Panel boundaries |
| Bolt yellow | #D9B64C | RSVP, lightning currency, markers |
| Yellow light / highlight / edge | #E1C56D / #EAD599 / #B3913B | Feedback and SVG detail |
| Success / danger | #718C79 / #A96F6C | Labelled status shapes |
| Historical checkpoint accents | #B8BEBD / #B89C7A / #A77C78 | Earlier illustrative badges; new Requisition glyphs use ink/yellow/highlight |

Calculated principal sRGB contrast ratios: ink/canvas 13.45:1; muted/canvas 5.43:1; ink/yellow 8.39:1; surface/graphite 12.40:1. Automated desktop/mobile checks find no serious or critical accessibility violations; this is bounded evidence, not full certification. Status symbols keep ink outlines and adjacent labels. Focus uses ink plus the accent; white text is not used on yellow.

## Type (locked)

| Role | Family | Use | Notes |
|---|---|---|---|
| Display | Jersey 10 | Hero and section headlines, short labels | Uppercase only where it aids signage; line-height 0.9–1.0; tight tracking; wrap deliberately; no glow or arcade outline |
| Body | IBM Plex Mono | Paragraphs, FAQ answers, explanatory copy | Use 16px minimum on mobile and target 65–75ch measure; use sentence case; line-height 1.55–1.7 |
| Utility | IBM Plex Mono | Nav, captions, track descriptors, metadata | 12–14px; reserve uppercase for short labels; never shrink essential details to fit |

The block display face contrasts with the quiet technical mono. Load only licensed, self-hosted font files where available; metric-match the monospace fallback. Fallback stacks are `monospace` and must retain good wrapping if custom fonts fail.

## Scales (locked)

- **Spacing:** 4px base; allowed values `0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128px`. Main sections use generous desktop padding and tighten by breakpoint. Content max width `1080px`; reading measure stays narrower.
- **Radius:** `2px, 4px, 6px`. Default panels are square or nearly square; no pill cards.
- **Borders:** `1.5px` ink for standard panels, `2px` for the hero frame and key containers. Rules stay straight and deliberate.
- **Shadow:** hard offset only: `2px 2px 0 ink` and `4px 4px 0 ink`. Buttons may compress the offset when pressed. No blurred elevation.
- **Grid:** clean CSS graph grid at `24px` with a faint `120px` guide. Keep it low contrast; no paper stains, noise, or texture images.
- **Motion:** fast `120ms`, base `180ms`, emphasis `300ms`; Pixl-derived hero entrances use `800–900ms` with easing `cubic-bezier(0.22, 1, 0.36, 1)`. Card reveals use `600ms` and `100ms` child stagger; FAQ disclosure uses `350ms`. No bounce/elastic. Honor `prefers-reduced-motion` and keep content visible without JavaScript.
- **Responsive breakpoints:** `640px`, `768px`, `1024px`, `1280px`. Design from mobile upward and prevent horizontal overflow.
- **Focus:** 3px Bolt Yellow outline with 2px ink offset on light surfaces; on yellow surfaces use a 3px ink outline. Focus is never removed.

## Graphic and icon language

Use independent transparent 32×32 pixel PNGs for homepage icon glyphs, with ink outlines, a restrained ink-and-yellow palette, square geometry, and no gradient or gloss. Their final source files and app mapping live in `docs/design/references/2026-10-06/final-pixel-icons/` and `docs/design/references/2026-10-05/pixel-assets/SPRITE_SHEET_INDEX.md`. Currency uses the final pixel Bolt sprite. Keep the LOADOUT brand mark, wordmark, lockup, favicon, and scenery assets separate. The slash motif frames the fullscreen hero. Pale clouds size to `clamp(280px, 32vw, 560px)` on desktop and `260px` on mobile, with bounded horizontal scroll parallax of ±112px/±48px and horizontal drift on a separate inner layer. Reduced motion disables transforms and drift.

## Motion principles

Motion supports orientation and feedback. Smooth scrolling stays user-controlled and preserves anchor/focus behavior. A scroll-aware header may tuck while scrolling down and reveal on upward movement; focus, hover, pointer interaction, or an open menu pins it visible. The hero receives one entrance sequence. Sections reveal gently when entering view; reveal code must fail open with all content visible. Buttons show tactile press/hover feedback. FAQ rows animate height and icon state. User-requested cloud drift and the continue cue are the bounded decorative loops; no autoplay media.

On desktop above 1100px, the hero frame is 900px wide and the selected headline uses two explicit lines: BUILD YOUR OWN / TECHNICAL STACK. Hide side labels at 1101–1300px to keep them clear of the widened frame. Smaller viewports retain responsive wrapping and may grow beyond one screen rather than clip content.

At `prefers-reduced-motion: reduce`, disable smooth scrolling, entrance and scroll reveals, transforms, and animated disclosure; use native scrolling and immediate expanded/collapsed state. The complete page and every answer remain usable.

## Voice

- **Register:** plain, confident, technical, welcoming to builders.
- **Action vocabulary:** Explore, Read, Join, Ship, Review, Earn, Upgrade. Keep labels consistent between nav, CTA, and destination.
- Write from the builder's point of view. Explain program terms when first used. Avoid claims that imply dates, eligibility, current inventory, endorsements, participant totals, or pricing unless supplied by an approved live configuration.
- Keep sentences short. Avoid fake stats, testimonials, invented project examples, buzzwords, and decorative em dashes.

## Who's Behind LOADOUT? (2026-10-06)

The final content section sits after FAQ and before the footer. It uses a vertical organizer directory beside a graphite Hack Club context panel, bound to the existing tokens and typography. Public names and responsibilities are user-supplied; no portraits, invented profile links, statistics, partner claims, or new sprite assets are needed. It is static and remains visible without JavaScript. The exact component and content contract is in `whos-behind-loadout.md`.

## Named anti-slop bans

The direction fails if it uses any of these without a brief-backed reason: purple/blue glow or gradient, default beige/cream tokens, gradient text, glassmorphism, oversized soft-radius SaaS panels, generic stock/AI industrial art, fake dashboard imagery, repeated equal-card grids, cards nested inside cards, unrelated eyebrow numbering, fake screws/rivets, scratch/grunge, a game-world backdrop, rainbow tracks, fake precision, dead CTA destinations, or scattered infinite animation. The graph paper, Bolt Yellow, block type, and sparse technical markers must explain the product or orient the reader; remove any mark that does neither.
