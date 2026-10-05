# LOADOUT Homepage: Clearer Flow, Progression, and Eras

**Status:** Approved by the user and implemented locally, 2026-10-05. The user approved the visual result; the later copy revision received bounded desktop/mobile browser review. No commit, push, or deployment in this pass.

The planning record below preserves the original proposal. The user subsequently authorized the full vertical-flow refinement; the optional tiny arrow patch is superseded. See the implementation record at the end for current scope and evidence.
**Section-sequence note, 2026-10-05:** [Plan 13](13_LOADOUT_HOMEPAGE_INFORMATION_ARCHITECTURE.md) supersedes §5's proposed page order and records the later implemented information architecture. Plan 12's visual/copy decisions remain historical context.
**Surface:** Public homepage in apps/landing.
**Design spec:** [.ulpi/design/loadout-homepage-clarity-flow-and-eras.md](../.ulpi/design/loadout-homepage-clarity-flow-and-eras.md).
**Policy owners:** Plans 01 and 02 for program/economy; Plan 11 for Eras. Those policies govern when screenshots or sample copy disagree.

## 1. Requested outcome and boundary

A visitor should understand what to build, why tracks matter, what happens after review, how levels help with equipment, what a Requisition actually does, and how Community Eras differ from personal progression.

The visual direction remains LOADOUT's grey graph paper, muted Bolt Yellow, graphite track plates, pixel headings, technical rules, and edge clouds. Adapt Pixl's containers and connector patterns to that identity.

This phase writes plans, a design spec, and proposed design-system amendments only. No homepage code, SVG assets, test files, test configuration, package/dependency files, CI, branch protections, or deployment settings change. No tests run in this phase. The unfinished PR-pipeline work remains a separate task.

The request mentions both a small arrow correction and a broader downward diagram. Treat them as separate scopes; do not silently turn the small patch into the redesign.

## 2. Reference and audit evidence

| Evidence | Meaning |
|---|---|
| [Process reference](../docs/design/references/2026-10-05/process-wrap-arrow-reference.png) | Desired connector in the existing desktop six-card grid: 01 → 02 → 03, then a square-corner return from 03 to 04, then 04 → 05 → 06. Image text is visual context, not policy. |
| [Current progression](../docs/design/references/2026-10-05/progression-current-before.png) | Current LV.1/5/10/15 strip. Its generic captions and smooth hex/star geometry need a stronger explanation and authored pixel art. |
| Current deployed homepage and local page/content components | A progression strip, field-pricing grid, Custom Orders panel, and Requisition FAQ already exist. The problem is insufficient explanation. There is no Era section. |
| apps/landing/app/site-content.ts | Generic phrases such as capability gap, working artifact, and grow your loadout repeat without explaining the result. Track choice is currently only a list of four names. |
| apps/landing/app/_components/HomepageSections.tsx | The process has only short card copy; Bolts and XP are mentioned together without explaining separate outcomes. Requisitions lack the key savings-cap explanation. |
| apps/landing/app/loadout.css | Process arrows use individual card pseudo-elements and omit the 03 → 04 transition. Desktop section padding is overridden to 24px. Footer body/link text is 11px/10px. |
| Page-width drift | The implemented page token is 1080px, while an older DESIGN.md scale says 1440px. Preserve the implemented 1080px outer content width in this refinement; do not silently widen the entire website. |
| apps/landing/app/_components/PaperScenery.tsx | Existing horizontal scroll range is ±72px desktop / ±36px mobile. Sixteen SVG clouds also have a small separate CSS drift. |
| apps/landing/public/loadout/bolt.svg and icons/LoadoutIcon.tsx | Bolt and star silhouettes contain diagonal paths; crispEdges does not turn diagonal vector geometry into deliberate stepped pixel art. |

## 3. Product truth to explain

| Topic | Required explanation | Owner |
|---|---|---|
| Project fit | Technical work in Tools, Systems, Compute, or Hardware that expands what a builder or other builders can do. Project examples are illustrative, not claimed participant work. | Plan 01 §§1, 3.1, 4 |
| Track choice | Propose the fields used by the project; this is not an exclusive character class. Reviewers allocate final XP according to meaningful technical work. | Plan 01 §§4.7–4.9 |
| Personal progression | Four separate, non-spendable lifetime XP records. Each track caps at LV.15; season changes do not reset them. | Plan 01 §4.8 |
| Bolts | One global spendable balance. No track wallets. Quality review informs the Bolt award; a higher track level is not an automatic Bolt multiplier. | Plan 02 §§9–11 |
| Field pricing | Relevant experience improves eligible pricing. Most gear remains available across tracks; cross-track prices can be higher. Ordinary savings on expensive items are capped. Rare Mastery gear has genuine level requirements. | Plan 02 §§26.3–26.7 |
| Field Requisitions | Five lifetime awards in each track: LV.3/6/9/12/15 give I/I/II/II/Master. They let builders use more of the field discount they have earned beyond the normal savings cap. They are not free gear or additional currency. | Plan 02 §§26.8–26.10 and fixed invariants |
| Redemption | One use, tied to its field, non-transferable, never expires, maximum one per eligible order. Minimum item values apply. It cannot bypass Mastery or Custom Order level gates. Exact savings/minimum values remain configurable. | Plan 02 §§26.8–26.10, 28.3 |
| Custom Orders | Request suitable technical gear outside the normal shop. Enough Bolts, relevant level, program fit, quote, and fulfillment approval are needed. An eligible Requisition can apply to the final approved quote. | Plan 02 §28 |
| Community Eras | Approved community work contributes separate, non-spendable Era Points. Advancement needs both the threshold and at least 14 days, checked at an eligible weekly reset; the earliest check is the second reset after start. | Plan 11 |
| Era participation | Objectives are optional and available across the four tracks. Normal eligible work stays eligible regardless of Era fit. Lifetime XP/Bolts/project history are not reset by an Era change. | Plan 11 |
| Era bonus | Approved design: separate binary reviewer decision; qualifying projects get +10% of the approved base Bolt award and no Track XP bonus. Exact stacking/operational rollout is unresolved. | Plan 11 |

Do not publish provisional discount percentages, exact XP thresholds, reward prices, stock, grant amounts, Custom Order budget limits, launch dates, or acceptance/eligibility promises. The illustrative STEAM → ELECTRIFICATION → COMPUTING → NETWORKS → ACCELERATION sequence is not a promised launch sequence.

## 4. Two process scopes

### A. Optional arrow-only patch

Keep the existing six cards, their order, copy, dimensions, spacing, colors, hover/reveal behavior, and all other sections unchanged. Add only the missing 03 → 04 desktop connector:

1. Leave 01 → 02, 02 → 03, 04 → 05, and 05 → 06 intact.
2. Start at the bottom centre of 03, drop into the gutter between rows, run left to the centre of 04, and finish with a downward black arrowhead at the top of 04.
3. Use square corners and the existing ink token. The route never crosses a card or its copy.
4. Preserve DOM order 01–06; connectors are decorative and hidden from assistive technology.
5. Apply the return only in the three-column desktop layout. Keep existing smaller-screen behavior in this tiny patch; do not invent connectors for the two-column arrangement.
6. No test, CI, package, content, or SVG-family edits in this patch.

This patch is optional if the larger flow below is approved immediately: the vertical redesign replaces the grid, so do not build two final process diagrams.

### B. Recommended final process: Pixl-style vertical diagram

Adapt the pinned Pixl FlowDiagram composition: a readable central column, generous straight downward connectors, and one meaningful fork after review. Show a real order of actions, with parallel outcomes displayed in parallel.

~~~text
Choose your project and its tracks
                ↓
Build it and keep a journal
                ↓
Ship a working version
                ↓
Review: fit, evidence, quality
                ↓
     ┌──────────┴──────────┐
Global Bolts         Lifetime Track XP
Spend on gear        Levels, field pricing,
                     Requisitions, eligible access
     └──────────┬──────────┘
Keep the project in your Digital Loadout
                ↓
Choose an eligible upgrade or Custom Order
                ↓
Use it on your next project
~~~

Use one brief sentence for the action, followed by a concrete explanation. Add links to progression, requisitions, and Eras instead of making the graph carry every rule. Community contribution is a secondary link/caption beside the approval step, not a fifth track or mandatory reward gate.

Keep a compact step number, recognizable icon, and flat framed LOADOUT panel. Do not import Pixl videos, locale wrappers, economy configuration, currency, chapter goals, services, or reward promises.

## 5. Proposed page sequence

1. Existing fullscreen hero with the selected BUILD YOUR OWN / TECHNICAL STACK. headline and confirmed RSVP destination.
2. About: a concrete program explanation and a compact definition of Digital Loadout, Track XP, and Bolts. Reduce repeated grow/equip slogans.
3. How it works: the vertical build/review/outcomes/upgrade diagram.
4. Project fit and the four tracks, with Research Mode separate. Each field needs a short example and a reason it matters.
5. Personal progression: levels persist; breadth and specialization both have benefits; explain pricing and rare access rules.
6. Community Eras: what builders advance together, how it moves, and why an optional objective may be interesting.
7. Equipment and pricing: cross-track buying, normal discount caps, Field Requisitions, and Custom Orders as related but different mechanics.
8. Planned reward categories, with no invented live products or prices. Remove redundant review/award explanation if the process already covers it.
9. FAQ: shorter answers that handle edge questions instead of carrying the whole program explanation.
10. Existing closing RSVP action and a larger footer with meaningful navigation.

This retains the homepage's projects → skills → progression → rewards story. Keep five primary nav entries; add Eras/Requisitions as section and footer links rather than adding every heading to the navigation bar.

Project-fit examples must judge the actual technical work, not promise approval for an entire product category. Replace vague real-world utility with a concrete CLI, runtime, renderer, synchronization, or device example. Explain that a thin model UI alone adds little technical work, while an original inference/runtime contribution may fit Compute; AI involvement is not an automatic exclusion. Keep fit examples separate from the four quality scores and Bolt reward promises.

## 6. Personal progression and pixel badges

Replace the vague LV.1/5/10/15 captions with a level rail that makes the approved milestones visible. Show the five Field Requisition milestones at 3/6/9/12/15, labeled I/I/II/II/Master; show the LV.15 cap and lifetime persistence nearby. Do not imply every builder begins at a configured level we have not verified.

Use authored 32×32 SVG geometry for Bolt, stars/emblems, and badge outlines. Build edges from integer grid coordinates and orthogonal stair steps. Keep a common pixel unit, ink edge weight, silhouette clarity, and palette across the family. Redraw the actual paths; shape-rendering or image-rendering alone cannot fix smooth geometry.

Preserve the existing steel/yellow/warm/mastery accent sequence as a small decorative distinction. Different emblems plus text carry meaning; color alone does not. Do not invent rank names such as Explorer or Expert, new bonuses, or milestone unlocks from a mockup.

The brand machine mark stays separate from the currency glyph. Synchronize the future inline Bolt icon and standalone bolt.svg so there are not two currency styles. No new raster or sprite-sheet production is required.

## 7. Requisition and Custom Order explanation

Use two adjacent explanations rather than treating both as one generic request mechanism:

- **Requisition:** a scarce, earned one-use allowance for additional eligible savings. Explain the ordinary cap first so the benefit makes sense.
- **Custom Order:** an approved request and Bolt quote for suitable gear outside the regular shop, subject to level, fit, budget, region, and fulfillment.

Show five named milestone tickets, then a simple conceptual example: normal field savings are capped; an eligible Requisition can allow more of the earned discount; it is consumed on the order. Use words or visibly labeled illustrative bars, with no fake numeric quote. State that Mastery and Custom Order level requirements still apply.

No live request form exists in this slice. Use an anchor to the explanation or the existing RSVP. Do not add a button that implies an order or grant application is currently open.

## 8. Community Eras section

Heading: **LOADOUT advances when builders do.**

Explain shared Era progress in two short paragraphs and an illustrative sequence. Clearly distinguish personal Track XP, global Bolts, and community Era Points. Show optional objectives such as measuring, controlling, automating, and optimizing as examples across tracks, not a guaranteed active objective list.

Describe the duration accurately: at least 14 days plus a reached community threshold, with advancement at an eligible weekly reset. A completed threshold is not an instant transition. No live progress percentage, target, current-era badge, countdown, or next-reset date without real configuration.

The proposed main section can explain a reviewed Era-build Bolt bonus without a number. Optional FAQ copy may state the approved planned +10% base-Bolt bonus, explicitly labeled as a planned rule with no XP bonus; approval to publish that numerical statement is separate from claiming the feature is live. Never import sample point formulas or pretend bonus stacking is resolved.

## 9. Spacing, footer, and clouds: proposed design-system amendment

Keep all active palette/type tokens. The following values are proposed for the later UI pass, not measurements of implementation:

| Area | Proposed rule |
|---|---|
| Major section padding | Desktop 64–80px; process/progression/Eras up to 96px where needed. Tablet 48–64px; mobile 40–48px. Replace the compact desktop 24px override in place. |
| Internal grouping | 24–32px between copy and panels; 40–48px between major subgroups. Use one spacing owner to avoid double gaps. |
| Explanatory text | Essential body copy 16px minimum with 1.55–1.7 line height; narrow reading measures rather than tiny type. |
| Process node width | Desktop central column 720–900px within the implemented 1080px outer content width; branch plates up to 1080px. Mobile full available width with 24px side gutters. No global page-width change. |
| Footer | Desktop 64–80px top/bottom padding, 32–48px column gaps, 16px introduction, 14–16px links and ≥44px touch targets. Five columns where they fit, then two, then one. Preserve real links and attribution. |
| Cloud size | Proposed desktop clamp(280px, 32vw, 560px), mobile about 260px. Compare against the current 420px maximum / 220px mobile. |
| Cloud scroll movement | X-only viewport-relative range up to ±112px desktop / ±48px mobile, with the current spring as starting point. Compare against current ±72 / ±36. No vertical parallax. |
| Optional inner drift | Slow separate X transform, about ±12px over 40–60s. Replace the conspicuous stepped drift with smooth motion if it reads better; pixel silhouettes need not move in jerky steps. |

Keep clouds pale and behind opaque text panels. No extra cloud-count increase: choose placement around section boundaries so a longer page does not become empty in one area and crowded in another. Do not let larger clouds obscure the hero or footer. Clip the decorative layer; do not cause horizontal page overflow or intercept pointer input.

Reduced motion makes clouds and connectors static and all content immediately visible. Smooth scrolling, nav reveal, card hover, section reveal, FAQ behavior, and anchor/focus rules remain the verified Pixl-derived baseline. Avoid adding another scroll listener or competing transform owner.

## 10. Exact source reuse map

Pixl is pinned at **8141b992e92e05583246fd914c63a101100f6fe4**. Its MIT notice is preserved. Paths below are relative to references/pixl:

| Source | Decision | LOADOUT adaptation |
|---|---|---|
| apps/landing/app/_components/Flow.tsx: Node, MiniCard | ADAPT | Container composition, readable inner padding, framed panels, responsive stacking, subtle hover lift. Use LOADOUT colors/type and product copy. |
| Flow.tsx: Down, Fork, ArrowHead, FlowDiagram | ADAPT | Straight connector topology and a genuine two-outcome fork. Crisp fixed line widths and mobile straight-line fallback. |
| Flow.tsx: LADDER and generated config imports | IGNORE | No Pixl payout rates, reward prices, currency, chapter milestones, or tier policy. |
| apps/landing/app/_components/Footer.tsx | ADAPT | Wider readable column rhythm and grouped links; preserve LOADOUT attribution and concept status. |
| apps/landing/app/_components/Description.tsx | REFERENCE ONLY | Numbering/card hierarchy as context; no copied videos or repeated small-card grid in the new final process. |
| apps/landing/app/_components/Story.tsx | REFERENCE ONLY | Explanatory section composition; no launch announcement, timer, chapter story, or game mechanics. |
| apps/landing/app/_components/SmoothScroll.tsx; Menu.tsx | REFERENCE ONLY | Preserve existing audited LOADOUT adapters; no new behavior without a specific need. |

Record any actual later source changes in docs/source-audit/PUBLIC_SITE_PORT.md and asset notices. Reference sources remain independent and unedited.

## 11. Skills used in this planning phase and required later

| Skill | Application |
|---|---|
| frontend-design-ui-ux | Existing identity lock, per-surface specification, responsive states and implementation handoff under .ulpi/design. No UI code from the spec skill. |
| frontend-design | Industrial field-manual design direction, hierarchy, readable containers, restrained consistent spacing. |
| design-taste-frontend | Audit current copy/CSS/screenshots before proposing refinement; retain the user's graph paper, pixel type, and existing identity. |
| impeccable | Context launcher and shape guidance for a planning-only brief. No craft-floor/detector run or UI edits in this phase. |
| copywriting | Concrete actions and benefits; define program terms once, remove repeated slogans, distinguish a planned mechanic from a live offer. |
| emilkowal-animations | One transform owner per layer, viewport-based horizontal movement, smooth scroll behavior, short interaction transitions, static reduced-motion fallback. |
| svg-design | Authored grid geometry, consistent visual weight, accessible decorative SVG use, named reusable asset family. |
| pixel-art-sprites | Deliberate stepped silhouettes, common pixel scale, limited palette, readability at intended size. |
| Pixel Art Animator | Consulted for static-vs-moving art and limited motion. Frame-based sprite tools are optional and currently unnecessary; no sprite animation/tool output claimed. |

Use catalog skill names on each contributor's machine, not Jeremy's absolute installation paths. Any future delegated implementation agent must follow the user's GPT-6 Luna / medium requirement unless changed by the user. This plan does not spawn an agent.

## 12. Later implementation boundaries and handoff

Potential scoped files: site-content.ts; HomepageSections.tsx; page.tsx; SiteFooter.tsx; PaperScenery.tsx; loadout.css; icons/LoadoutIcon.tsx; standalone Bolt/badge assets; design and source-audit docs. Prefer extracting only the requested process/progression/Era/order sections into small named components if it makes composition clearer. This is not a repository-wide CodeScene refactor and does not require changing Reveal.tsx.

Keep existing routes, RSVP URL, hero headline/desktop wrap, backend integrations, tests, test configs, package versions, CI, and branch settings outside the UI-change scope. Do not revive Pixl RSVP/service endpoints.

Suggested reviewable commit groups after implementation approval:

1. Optional: **Updated the desktop process connector** (arrow-only scope A).
2. **Updated homepage explanations and added Community Eras** (source-grounded copy and the final process/progression structure).
3. **Added pixel Bolt and progression artwork** (one consistent SVG family).
4. **Updated homepage spacing, footer and cloud motion** (the approved visual amendment).
5. **Documented the homepage design and source adaptations**.

The new vertical process supersedes the six-card diagram; implement only the chosen final composition. Avoid a throwaway intermediate arrow patch if it is not needed.

## 13. Acceptance criteria for a future UI review

- A reader can explain what choosing tracks changes, why levels matter, and why Bolts and XP are separate.
- Requisition benefits, milestone sequence, scarcity, eligible-use limits, and Custom Order differences are explained outside the FAQ.
- Eras are present and clearly separated from tracks, XP, Bolts, and Seasons; no fake live progress or dates.
- The graph is a semantic ordered flow; its fork is two parallel results of approved work. Connectors never cross cards or copy.
- Core copy uses concrete examples and terms, with no unsupported payouts, prices, promises, or invented ranks.
- Bolt and badge edges are deliberately pixel-stepped, readable at normal scale, and visually consistent.
- The page has more breathing room without excessive blank filler, repeated explanations, or tiny body/footer type.
- Clouds are larger and visibly move farther horizontally during normal scrolling; reduced motion is static, there is no horizontal page overflow, and scenery does not obscure interaction.
- Confirm desktop 1280/1440px, tablet 768px, mobile 390/320px and short-height layouts with one bounded visual pass. Check keyboard anchors, readable diagrams, and reduced motion. This specifies later manual review, not tests run or edited now.

## Planning review

Coverage: arrow geometry → §4A; Pixl vertical diagram/track benefits → §4B; progression → §6; Requisitions/Custom Orders → §7; Eras → §8; pixel art/footer/spacing/clouds → §§6,9; skills → §11. The draft preserves the implemented identity and approved product policy. Proposed sizes and copy are clearly distinguished from implemented behavior. Planning does not change the website or finish the separate CI pipeline.

## Local implementation record — 2026-10-05

Implemented the full vertical flow with central framed nodes and a genuine two-outcome fork, the I/I/II/II/Master Requisition milestones at LV.3/6/9/12/15, a static Community Eras explanation, and separate equipment pricing/Requisition/Custom Order sections. The redundant review/award reward table was removed. Essential copy is 16px and sections/footer are roomier. The hero and RSVP remain unchanged.

Code composition: HomepageSections.tsx uses HowItWorks.tsx, ProgressionSection.tsx, ErasSection.tsx, EquipmentSection.tsx, and shared SectionHeading.tsx. homepage-refinement.css supplies the new composition layer. PaperScenery keeps one spring-driven horizontal transform per outer cloud and slow CSS drift on the inner art. LevelBadge.tsx and the inline/standalone Bolt use authored stepped geometry.

All seven requested UI skills were consulted/applied. frontend-design-ui-ux supplied the locked spec and disjoint engineer handoff; two GPT-6 Luna medium agents implemented content and SVG assets. frontend-design/design-taste guided hierarchy and retained identity; emilkowal-animations guided bounded transform ownership and reduced motion; svg-design/pixel-art-sprites guided geometry and palette; Pixel Art Animator informed the static-art/continuous-transform choice, with no unnecessary sprite frames. Impeccable craft-floor and copywriting guidance also informed readability and plain copy.

ESLint, TypeScript, and the Next.js production build pass locally through the host runner. The sandbox could not start Bun child processes. Automated tests were not run or edited. Test files, CI, dependencies, branch protections, backend mechanics, and deployment configuration remain outside this UI pass. Browser visual review is pending because the old localhost error tab was rejected by browser URL policy; the local preview server is available at http://localhost:3000/ and the user has been asked to reopen it.


## Follow-up: clearer explanations

The user accepted the look and requested clearer copy. .ulpi/design/homepage-copy-clarity.md records the string-only brief and implementation. The copy now defines Bolts/XP/loadouts, explains multi-track review and equipment benefits, gives a word-only Compute/GPU Requisition example, and walks through Custom Orders and Community Eras in plain language. Layout and motion remain unchanged. The previous browser error-tab blocker is resolved through the user's reopened localhost tab. Desktop and 390/320px mobile copy wrapping and the Custom Order FAQ were inspected; no horizontal overflow was observed in those views. Automated tests, CI, publication, and the separate pipeline task remain outside this pass.
