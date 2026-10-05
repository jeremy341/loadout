# LOADOUT homepage refinement — design proposal

Status: planning proposal, 2026-10-04. These are proposed values and copy, not a replacement for the active design lock until implementation is authorized. Implements the seven-item scope summarized in chat and the source audit at `docs/source-audit/PIXL_MOTION_PARITY.md`.

## Direction

Keep the pixel technical field manual, fullscreen framed hero, paper grid, dark track plates, technical SVGs, and ordinary document scrolling. Make the paper cooler/greyer and the accent less saturated. Add Pixl's actual entrance sequence and a useful downward cue. Keep the existing landing app/containers.

## Slogan candidates

| Candidate | Tradeoff |
|---|---|
| **Build your own technical stack.** — recommended | Existing canonical identity; specific to tools/systems/compute/hardware. Hero breaks **BUILD YOUR OWN / TECHNICAL STACK.** |
| Build capability. Unlock what's next. | Strong progression tone, but needs supporting copy to explain technical project fit. |
| Build your stack. Equip your next build. | Links digital work to physical equipment; “stack” is broader without technical supporting copy. |

The user selected **Build your own technical stack.** on 2026-10-04. It is the active copy decision for this proposal; the other candidates are recorded alternatives. Update centralized headline/tagline/metadata together and measure typography rather than forcing it into the old font size.

Recommended support: “Ship tools, systems, compute, and hardware. Grow your Digital Loadout. Equip your next harder build.” Badge stays **TECHNICAL BUILDERS**. The RSVP service describes a draft YSWS; avoid unsupported launch/eligibility statements.

## Proposed palette

| Role | Current | Proposed |
|---|---|---|
| Canvas | #F1EFEA | **#E8E9E6** |
| Surface | #F7F5F0 | **#F0F1ED** |
| Muted surface | #E5E3DE | **#DDE0DC** |
| Ink | #17181A | **#1D2021** |
| Graphite | #202225 | **#292C2D** |
| Raised graphite | #2B2D30 | **#34383A** |
| Muted text | #565B5E | **#575E60** |
| Rule | #979D9F | **#9DA5A4** |
| Bolt yellow | #FBC834 | **#D9B64C** |
| Yellow hover/highlight | #FBCF50 / #FBE079 | **#E1C56D / #EAD599** |
| Yellow edge | #D8AC29 | **#B3913B** |
| Success badge | current green | **#718C79** |
| Danger/FAQ arrow | #C94A42 | **#A96F6C** |
| Progression steel / warm / mastery | existing status hues | **#B8BEBD / #B89C7A / #A77C78** |

Calculated sRGB contrast: ink/canvas13.45:1; muted/canvas5.43:1; ink/yellow8.39:1; surface/graphite12.40:1. These cover the principal text pairs, not every icon/state. Verify status colors, focus, and links in-browser during execution.

Grid remains24px and faint, using RGB(76,83,85) at.04 opacity; avoid dirty/noisy textures. Centralize theme variables and migrate literal SVG/status/hover colors touched by this task. Planned cards use opaque surfaces where enlarged scenery passes underneath. Status symbols retain ink outlines and adjacent text labels, so the muted fills never carry meaning alone.

## Motion and layout contract

- Fullscreen hero stays min-height100svh, normal flow. No pin, scroll zoom, scroll snap, video, or scroll lock.
- Match Pixl's title/badge/support-action entrance order from the audit. One transform owner per moving layer; remove overlapping old title-span animations. CSS entrances must finish even without JS; reduced motion shows all content immediately.
- `ScrollCue` is a ≥44px anchor to `#about`, labeled **Continue scrolling**, with an authored double downward chevron. Fade after1.4s, arrow moves0→7→0 over1.4s. Animate only the SVG, keeping its hit area stable. Focus the destination heading on activation without fighting Lenis.
- Reserve at least104px bottom hero padding for the cue. On short/landscape screens allow the hero to grow; never clip the RSVP buttons or facts. Side labels/fragments collapse before content becomes cramped.
- Clouds grow from `clamp(150px,21vw,330px)` to **`clamp(200px,26vw,420px)`**, mobile180→**220px**. Opacity approximately.55 desktop/.4 mobile; adjust only if contrast/occlusion review finds a defect.
- Scroll progress drives **X only**: left −72→72px, right72→−72px; mobile range ±36px. Remove targetY/displayY/subscriptions. Document placement still scrolls naturally with the page; animated Y displacement stays zero.
- Keep zero-initialized displayX spring (stiffness90/damping26/mass.4), preference activation after hydration and cleanup. Inner36s drift remains horizontal and mild; reduced motion stops both. Scenery is decorative, clipped and pointer-events:none.
- Preserve nav focus/Escape behavior, native keyboard/touch scroll, source-inspired grid stagger, hover/press feedback and FAQ transitions. No essential information becomes hover-only.

## Content additions / states

Small Digital/Physical explanation under About; clearer capability-fit examples; tracking, AI, multi-track and RSVP FAQs; canonical Requisition milestone line; closing RSVP block. Existing track/shop layouts stay recognizable.

RSVP active: real link and **RSVP now**; secondary **Explore tracks**. Explicit empty/invalid override: existing working section fallback. Login/dates/catalogue/social-proof/policy pages remain data-gated. No synthetic live inventory or participant stats. Privacy/rules/contact destinations are owner setup items, not invented pages.

## Skills and preflight

Use frontend-design + design-taste-frontend for the retained world and anti-template check; frontend-design-ui-ux for this flow/state/component contract; both requested Impeccable manifests as guidance (primary .agents installation, one context load per session, code build path already chosen); emilkowal-animations for ownership, timing, interruption and reduced motion; svg-design for arrow/currency/scenery assets; pixel-art-sprites for crisp silhouettes/palette; Pixel Art Animator for disciplined repeat/timing and static fallback, not an unnecessary Aseprite pipeline.

Draft preflight: specific product identity, one visual language, readable contrasts, verified RSVP destination, semantic controls, canonical content, clear states, and scoped motion. Implementation review must validate actual rendering in one batched desktop/mobile round, one correction batch and at most one confirmation round. No numeric preflight score is proof of a shipped UI.

## Build handoff

Use the existing Next/React/Bun/Framer Motion/Lenis stack. Implement `PLAN/10_LOADOUT_HOMEPAGE_RSVP_MOTION_AND_CONTENT_REFINEMENT.md` after review, retaining the current branch/dirty work. If delegated, agents run GPT-6 Luna at medium as the user's AGENTS instruction requires. The designer owns the proposal; the implementer owns code and verification. No additional comp/imagegen or broad product migration.

## Execution result — 2026-10-04

Approved and implemented. The active design lock is DESIGN.md. The RSVP default and safe overrides, selected two-line headline, fullscreen source-grounded choreography, continue cue, larger horizontal clouds, muted palette, static content additions and no-JS FAQ fallback are present. The final evidence is recorded in docs/source-audit/PUBLIC_SITE_PORT.md.

The 2026-10-05 desktop amendment widens the frame to 900px above 1100px and holds each title span to one line. All four tested desktop widths show exactly two rows. Four unit tests and 24 production-browser cases pass, alongside lint, typecheck and build.
