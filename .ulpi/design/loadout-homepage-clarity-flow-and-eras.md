---
surface: public homepage
mode: persuade
status: approved; implemented locally; visual review in progress
date: 2026-10-05
design_system: bespoke
binds_to: DESIGN.md
plan: ../../PLAN/12_LOADOUT_HOMEPAGE_CLARITY_FLOW_AND_ERAS.md
---

# LOADOUT Homepage Clarity and Flow Spec

## Design read

A readable field manual for young technical builders: grey graph paper, crisp ink connectors, muted yellow equipment marks, and authored pixel artwork. The page should explain a builder's choices and their consequences. Preserve the existing industrial/signage identity and fullscreen hero.

Every screen must read as the same product if placed side by side.

The user's two images define the small desktop connector geometry and show the current progression's weaknesses. Pixl's pinned Flow.tsx supplies the later vertical container/connector pattern. Approved LOADOUT plans supply product truth.

## Visitor journey and hierarchy

The visitor decides whether their project fits, understands the four tracks, sees how reviewed work earns progress and equipment, and can RSVP for the program being prepared. The confirmed RSVP remains https://rsvp.soon.it/loadout; it records interest, not enrollment.

Primary page action remains RSVP now. Section links provide explanation; do not invent live login, shop, requisition redemption, or Custom Order destinations. Five top-level nav items remain sufficient; Eras and Requisitions receive section/footer anchors.

Recommended order: hero → concrete About/definitions → vertical process → project fit/four tracks/Research Mode → lifetime progression → Community Eras → field pricing/Requisitions/Custom Orders → planned reward categories → FAQ → RSVP → footer.

## Proposed copy deck

All copy below is a draft for a public program still in preparation. Keep a clear concept-status statement near About and the RSVP rather than repeating vague qualifiers in every card. No launch/acceptance promise.

### About

**What is LOADOUT?**

LOADOUT is a YSWS we're building for technical projects. Make a tool, improve a system, speed up a program, or build a device. Approved projects earn Bolts for gear and XP in the tracks they use.

**Your projects stay with you.** Your Digital Loadout is the work you've shipped. Your Physical Loadout is the equipment you use to build what comes next.

### Four tracks and Research Mode

These are project-type examples, not participant work or guaranteed approvals:

| Track | Proposed description |
|---|---|
| Tools | Build a CLI, debugger, SDK, or automation tool that other builders can use. |
| Systems | Work on runtimes, databases, networking, protocols, or a synchronization engine. |
| Compute | Build a renderer, GPU backend, inference runtime, or a measured performance improvement. |
| Hardware | Build devices, embedded controllers, robotics, or electronics and document how they work. |

**Research Mode:** investigate a technical question in any track and share reproducible results. It changes the evidence/review expectations; it does not create a fifth XP track.

### How it works

**Choose something worth building.** Start with a tool you wish existed, a slow program you want to improve, or a device you want to make. Pick the tracks that match the work.

**Build it and keep a journal.** Record what changed, why you made those decisions, and how you checked the result. Coding time is planned to use Hackatime; eligible hardware and non-code work use Lapse.

**Ship a working version.** Share the project, repository, demo or evidence, and documentation. Explain your contribution, AI assistance, and known limitations. Research submissions need reproducible technical outputs.

**Get your work reviewed.** Reviewers check project fit and evidence, then rate Originality, Technical Depth, Execution, and Documentation. They assign Track XP to the fields your work actually used.

Show these outcomes in a two-column fork, stacked on mobile:

- **Bolts to spend.** Approved work earns one global balance for eligible rewards across the shop.
- **Track XP to keep.** Build experience in Tools, Systems, Compute, and Hardware. Progress stays with you between seasons and changes eligible pricing and access.

**Choose your next upgrade.** Most gear stays buyable across tracks. Relevant track experience can improve its price; rare Mastery gear has level requirements. Requisitions and approved Custom Orders provide routes to suitable specialist upgrades.

**Build again.** Keep the shipped project in your Digital Loadout and use the new equipment on your next build.

### Progression

**Your track progress stays with you.**

Each track has 15 lifetime levels. You can build depth in one field or work across several; reviewers allocate XP according to the work you ship. Track XP cannot be spent. Bolts can.

**Why level up?** Relevant experience can improve field pricing, earn rare Requisitions, and qualify you for suitable Custom Orders or Mastery equipment. Ordinary discounts stay modest and are capped on expensive items. Most gear remains available across tracks, so you can try a new field.

Use a LV.15 rail with highlighted Requisition milestones: **LV.3 — I; LV.6 — I; LV.9 — II; LV.12 — II; LV.15 — Master.** These are the five lifetime Field Requisitions in a track, not five repeatable payouts. Exact XP thresholds remain unpublished.

### Requisitions

**Save a Requisition for a bigger upgrade.**

Ordinary track discounts have savings caps on expensive gear. A Field Requisition lets you use more of the discount you've earned on an eligible order. It is a one-use benefit, tied to its field, and it never expires.

Only one can apply to an order. Minimum item values apply, and a Requisition cannot bypass Mastery or Custom Order level requirements. It is not free gear or another currency.

### Custom Orders

**Need gear outside the shop?**

The planned Custom Order route lets experienced builders request suitable technical equipment. You need enough Bolts and the relevant level, then an approved quote and fulfillment decision. Budget, region, and program fit affect what can be supplied.

An eligible Requisition may apply to the final approved quote. The public homepage explains this route; it does not offer a working order form yet.

### Eras

**LOADOUT advances when builders do.**

Alongside your own track levels, approved projects contribute Era Points to shared community progress. Each Era offers optional technical objectives across the four tracks. You can follow an objective or keep working on another eligible project.

An Era advances after the community reaches its target and at least 14 days have passed, at an eligible weekly reset. Era Points are shared progress, not currency. An Era change does not reset your Track XP, Bolts, or shipped projects.

If a sequence is shown, label it **Illustrative Era sequence**: Steam → Electrification → Computing → Networks → Acceleration. Do not mark any sample stage current or display an invented completion bar.

Proposed optional FAQ: The current Era design gives a reviewer-approved, qualifying project an additional 10% of its approved base Bolt award. It adds no Track XP. This is a planned rule; bonus stacking and launch configuration are still being finalized. Keep this numerical statement out of the main summary until public copy approval.

### Footer introduction

LOADOUT is a technical YSWS concept in development. Build tools, systems, compute, and hardware. Keep what you ship, earn progress in the tracks you use, and work toward equipment for your next project.

Keep source attribution and the concept-status line readable. Hack Club links are resources, not a claim of program acceptance.

## Component and interaction contract

| Component | Purpose and rules |
|---|---|
| Existing six-card process, optional tiny patch | Only add the square-corner 03 → 04 return connector shown in the supplied reference; preserve cards and all other UI. Desktop three columns only; smaller-screen rules unchanged. |
| Proposed HowItWorks section | Semantic ordered steps with one central reading axis. Use Pixl Node/Down/Fork composition adapted to LOADOUT. Single essential action per node; parallel award results in a genuine fork. Decorative connectors aria-hidden, noninteractive, static. |
| Proposed Progression section | Lifetime levels and benefits, with real Field Requisition milestones. No fabricated rank names, participant XP, or arbitrary milestone benefits. Rail stacks/scrolls only if labels remain fully usable; prefer vertical stacking on mobile. |
| Proposed Era section | Static explanatory section without live counters. Optional objective examples; one link to relevant FAQ. No Era eligibility lock, fake current stage, timer, or dashboard interaction. |
| Requisition/Custom Order explanations | Define savings caps and quotes plainly. Label the limits in readable text. No active buy/redeem/request actions unless a real configured destination is approved. |
| Footer | Larger body/link text and spacing. Add process/progression/Eras/order anchors; existing external links and attribution stay valid. Responsive five/two/one-column structure. |
| Bolt/badge SVG family | 32×32 grid, integer orthogonal stepped paths, consistent ink weight and ≤3 colors per asset. Same Bolt silhouette inline and standalone. Decorative SVGs hidden from assistive technology; meaningful labels provided as adjacent text. |
| PaperScenery | Proposed size up to 560px desktop, 260px mobile; X-only scroll range up to ±112/±48. Viewport-relative mapping, separate slow inner drift, same transform owner discipline. Max 2–3 clouds near a reading region, pale behind opaque surfaces. |

Use the active palette/type/border/focus tokens in DESIGN.md. The approved local spacing, geometry, and cloud values are recorded in its 2026-10-05 amendment; publication and visual review remain separate.

The current CSS outer page width is 1080px. Preserve that width during this refinement; the older 1440px design-doc value is a recorded documentation mismatch, not permission to widen every section.

## Responsive, motion, and state coverage

- At desktop widths, main nodes use a narrow central reading column; the award fork can be wider. At tablet/mobile, branches stack in the same reading order with a straight downward connector.
- Do not shrink essential text below 16px to fit diagrams. Use 24px mobile gutters and ≥44px targets. A short viewport may scroll naturally.
- Keep muted yellow accents with ink text, graphite track plates with surface text, visible focus, and labeled milestone distinctions. Current principal palette contrast remains the starting evidence; all new rendered pairings need a later manual check.
- Retain existing Lenis scrolling, header focus/menu pinning, card feedback, fail-open reveals, FAQ keyboard state, and normal anchor/history behavior. No new motion library.
- Static page content has no data-loading spinner. Unconfigured live Era/catalogue/order destinations are omitted; offline content remains readable. Image failures leave text and semantic flow intact.
- Reduced motion disables clouds/reveals/scroll smoothing. Decorative connectors never animate essential order. Content stays visible without JavaScript; FAQ fallback remains available.

## Planning preflight

Provisional design assessment: aesthetic impact 4, context fit 5, feasibility 4, performance safety 4, consistency risk 3; DFII 14. This judges the proposal's suitability, not a built page. The strongest risks are the longer process's reading load and large-cloud overlap; the narrow node measure, reduced repetition, bounded scenery, and responsive stacking address them in the contract.

Identity: preserved grey/yellow/pixel field manual. Planned layout families: central flow/fork, track grid, milestone rail, pricing/order explanations, Era sequence, FAQ, footer. Product truth is mapped to Plans 01/02/11 in Plan 12. No fabricated live values or destinations. State/accessibility behavior is specified, but rendered contrast, visual fidelity, and responsive geometry are not yet verified because UI implementation is outside this phase.

The tiny arrow scope and full process replacement are alternatives, not two required final diagrams. No automated tests, test-file edits, backend features, or CI changes occur in this planning phase.

## Build handoff

Implementation uses the existing Next.js components and locked tokens. The content/SVG handoff was carried out by GPT-6 Luna medium agents per the user's instruction; shared stylesheet, scenery, and footer integration were handled sequentially.

Read this spec, DESIGN.md, and Plan 12 together. Implement the approved scope and use the existing motion/container infrastructure. Preserve the selected hero, public RSVP, product-policy boundaries, and reference licenses. The user subsequently approved the UI build. Backend mechanics, publishing, automated tests, and pipeline work remain separate scopes.

## Approved build record

The user approved the full vertical composition. It is implemented locally in the components listed in Plan 12, using the locked grey/pixel identity. The draft copy deck remains a design record; rendered source is authoritative for current wording. The optional tiny-arrow alternative was superseded. Lint, typecheck, and build pass; automated tests and CI were not changed or run. Manual visual review is pending the browser preview reopening.
