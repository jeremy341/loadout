# Homepage information architecture: implementation brief

**Authorization:** The user explicitly requested implementation of Plan 13 on 2026-10-05.
**Identity:** Bind to `DESIGN.md`: industrial field manual, muted grey graph paper, Bolt Yellow, Jersey 10 and IBM Plex Mono, transparent 32px pixel assets. Bespoke existing Next.js components remain the design system.

## Design read

A public guide for technical builders: explain the program, let visitors identify their work, then show the build/review/progression/equipment journey. Preserve the existing visual vocabulary and make the section hierarchy carry the explanation.

The design variance/motion/density values remain 7/4/4. The fullscreen framed hero, dark track plates, pixel imagery, technical rules, and sparse paper scenery retain LOADOUT's signature. Do not introduce new colors, gradients, decorative labels, or artwork. DFII: impact 4 + fit 5 + feasibility 5 + performance 5 - consistency risk 4 = 15.

## Page composition and exact boundaries

1. Existing hero, untouched.
2. About (`#about`): one plain-language program definition. Replace the four overview cards with a paired Digital/Physical Loadout explanation integrated in this section. The two definitions describe portfolio and equipment, rather than repeating all process steps. Explain the program is still in development without inventing eligibility or dates.
3. One Tracks & Project Fit section: four existing dark track cards (`#tracks`), the Research Mode modifier (`#research`), then the project-fit comparison (`#project-fit`). Give the comparison an h3 and brief intro rather than another standalone h2 section. Preserve clear higher/lower fit labels and a short distinction between the fit gate and four quality criteria.
4. Existing `HowItWorks` moved intact here. File SHA256 must remain `8C19395FBBBD082A2DC37B1156009D64A0A50071ABD8686291E4F1D940A255F2`. Preserve all `.process-*` and `.flow-*` styles and shared styles that affect this section.
5. Personal progression (`#progression`): retain the LV.3/6/9/12/15 milestone rail and lifetime Track XP explanation. Keep the full milestone schedule here only. A short link leads to how Requisitions are used.
6. Unified Gear & Rewards: pricing (`#field-pricing`) → Requisition use (`#requisitions`) → eight planned categories (`#shop`) → Custom Orders (`#custom-orders`). Remove the duplicate four-category field grid. All subsections have distinct heading IDs; `#custom-orders` must identify the Custom Order explanation, not its Requisition sibling.
7. Community Eras (`#eras`) after the primary reward pathway, preserving policy. It remains a separate optional community concept.
8. FAQ, then unchanged footer.

## Layout contract

- Keep the existing 1080px outer width and section padding rhythm. Scope new styles to the introduction, grouped tracks/fit, and gear section, avoiding process/global heading changes.
- Introduction: two horizontal definition columns on desktop, stacked on mobile; use a shared ruled area with existing pixel icons and ample reading space, not nested cards.
- Tracks: retain the four/two/one-column dark grid, existing hover/reveal behavior, and Research strip. Fit examples follow under a divider with a strong h3 and a four/two/one-column comparison grid.
- Gear: use editorial subsections separated by space and a small rule. Requisition explanation may use a two-column copy/rules layout on desktop, stacked below 900px. Render the single category grid four/two/one columns at desktop/tablet/mobile. Custom Orders follow as three numbered text steps in three columns at desktop and one column below 700px.
- Preserve 16px essential body copy at 1.6–1.65 line height. Keep long copy measures near 70ch, allow card text to wrap naturally, and use min-width:0 on grid children.
- Every subsection anchor has sufficient scroll margin for the header. Five top navigation links: About, Tracks, How it works, Progression, FAQ. Retain RSVP.

## States and accessibility

This content is static; it has no data-fetch loading or error state. Planned gear has honest category status, no fake inventory or disabled purchase UI. Custom Orders describe the future process without an inactive submission control. FAQ retains its expanded/collapsed states, button semantics, keyboard behavior, and no-JavaScript fallback. Anchor destinations retain visible headings and focus behavior; refresh/deep linking must land correctly. Preserve empty decorative alt text, labelled fit statuses, explicit SVG/image sizing, focus outlines, 44px link targets, and reduced-motion behavior.

## Motion and pixel art

Reuse existing Reveal/Lenis/hover behavior to orient visitors as sections move into view. Do not create new loops, sprite frames, paths, or cloud motion. Emil Kowalski guidance applies to existing transform/opacity reveals and reduced-motion fallbacks; SVG/pixel/animator guidance applies to keeping clean transparent assets, readable silhouettes, and the static sprite/continuous UI-motion distinction. User-approved dark track cards, scroll cue, and bespoke pixel SVGs take precedence over generic anti-slop prohibitions.

## Preflight and engineering handoff

Seven requested skills loaded: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites, Pixel Art Animator. The frontend-design-ui-ux skill supplies this brief; a GPT-6 Luna medium engineering agent implements it. Theme existing components with locked tokens; do not redesign the hero or How it works.

Design review scores (0–4): distinctiveness 3, hierarchy 3, consistency 4, accessibility 3, state coverage 3, copy clarity 3, restraint 3, motion motivation 3 = 25/32. The main revision is a single planned-reward grid and subsection-specific Custom Order anchor, resolving repetition and ambiguous navigation. These are design judgments; runtime validation is still required.

## Acceptance and verification

- Visible section order matches the composition above; only one reward grid and no four-card About process summary remain.
- Digital/Physical terms, four tracks, Research modifier, fit gate/quality criteria, Track XP/Bolts, Requisitions, Custom Orders, and Era Points remain accurate.
- HowItWorks hash and process/flow styles are unchanged; all preexisting hero/logo/cloud/footer behavior remains.
- Lint, typecheck, applicable existing unit/e2e checks, and build pass or limitations are reported.
- Review desktop 1440px, tablet 768px, mobile 390px and 320px: no overflow/overlap, clear headings, working anchors and FAQ, usable keyboard focus/reduced motion.

## Completed local review

Implemented on 2026-10-05; see [Plan 13's execution record](../../PLAN/13_LOADOUT_HOMEPAGE_INFORMATION_ARCHITECTURE.md) for checks and limitations. Desktop/tablet/mobile views were inspected, the original process component/styles and protected artwork match their baseline, and the final one-worker browser suite passes all 24 checks. The production build passes when run separately from browser testing. The Research Mode arrow now leads to the existing shipment process, while program-fit copy explains eligibility in plain words.
