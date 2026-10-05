# LOADOUT Public Landing Page

## Implementation amendment — 2026-10-04

The latest direct user request authorizes UI implementation and supplies the cloud/grid reference recorded in `DESIGN.md`. That amendment governs presentation where the earlier briefs below differ. The page now includes project-fit cards, a custom-order/requisition panel, canonical 15-level checkpoints, and SVG planned-category previews. These are concept explanations, not live inventory or invented commercial offers. Navigation uses actual section destinations when registration configuration is absent. The user-requested grid, pixel typography, repeated card layouts, and section labels are intentional exceptions to generic anti-pattern heuristics.

> **Design-spec handoff.** This file specifies the public landing page only. It does not authorize changing product plans or implementation code.

## Design Read and binding identity

Design Read: an industrial technical field manual with pixel utility, using a centered framed hero, broad graph-paper whitespace, and concise capability labels to make a technical builder program feel concrete.

**Direction:** industrial / signage, bound to [`DESIGN.md`](./DESIGN.md). Follow its palette, typography, scales, motion, icon style, and voice throughout. **Every screen must read as the same product if placed side by side.**

The screenshot is a composition and style reference only. Its sample RSVP, facts, tracks, reward names, figures, discount claims, and footer statements are not approved page content. The canonical four tracks are Tools, Systems, Compute, and Hardware. Research Mode is separate. Bolts are global, Track XP is per-track, shipped work grows the Digital Loadout, and rewards upgrade the Physical Loadout.

## Product goal, audience, and context

- **Goal:** explain LOADOUT's technical program and its build → ship → progression → equipment loop, then let a visitor choose a safe next step.
- **Audience:** prospective technical builders, including younger builders; use plain, direct language without assuming prior familiarity with YSWS terminology.
- **Context:** public, server-rendered English landing page with mobile-first reading and desktop presentation. Typical visit begins from a shared link; visitors may scroll, jump by anchor, or open a FAQ answer. There is no account, form, or purchase flow in this page spec.
- **Primary action:** when an approved `joinUrl` is configured, show a clearly labeled Join action. When it is absent, omit Join and use **Explore tracks** as the hero's primary action. Never use a guessed URL, a disabled dead link, or an RSVP promise.
- **Secondary action:** in-page exploration. A configured external community or rules link is secondary and only appears when its destination is confirmed.

## Information architecture and page rhythm

Use this order and distinct composition families so a long page has rhythm rather than one repeated card grid:

1. **Header and hero:** centered framed hero on the technical grid; the signature moment.
2. **About LOADOUT:** concise program explanation and Digital/Physical Loadout relationship, with a sparse two-column editorial treatment.
3. **How it works:** linear sequence that reads horizontally on wide screens and vertically on narrow screens.
4. **Four tracks:** two-by-two instrument-panel grid on desktop, single column on narrow mobile; include a separate Research Mode callout.
5. **Progression and field pricing:** a visual comparison of persistent per-track XP and global spendable Bolts, followed by a ruled field-pricing explanation. No formula or numeric examples.
6. **Rewards and shop:** verified live catalogue content if supplied; otherwise a simple text-led explanation and a neutral catalog-unavailable treatment, without empty product cards.
7. **FAQ:** single-column animated disclosures.
8. **Footer:** restrained multi-column link list and attribution only where verified.

The page's primary message is **Build your own technical stack.** Use the screenshot's “real projects / real rewards” energy as supporting framing, not as a factual claim about specific current rewards. Content must explain the program before progression mechanics.

### Section content and composition

#### Header and hero

- Put the brand mark and `LOADOUT` wordmark in a framed horizontal navigation bar centered within the page width.
- Desktop links: About, Tracks, Progression, Rewards, FAQ. Keep to these five top-level anchors. Place a verified Join action at the far edge only when configured. Login appears only when an owned login destination exists.
- Mobile: compact wordmark, one menu button, and a visible Join action only when configured. The menu contains the same five anchors; it closes after selection and restores focus predictably.
- Main heading: `BUILD YOUR OWN / TECHNICAL STACK.` in the display face, center aligned and broken into short lines. Place four corner marks around the heading area. Do not add a hero illustration or dashboard mockup.
- Place small capability labels at the sides on large screens: canonical track terms on one side and concise verbs such as Build, Learn, Ship, Upgrade on the other. Hide the side labels at tablet/mobile; never let them overlap or shrink into unreadable text.
- Supporting copy: state that LOADOUT is a technical YSWS for builders making tools, systems, compute, and hardware. Follow with the Digital/Physical Loadout distinction in a short second line.
- Actions: configured Join is the primary yellow button and `Explore tracks` is a secondary outlined anchor. If Join is missing, promote `Explore tracks` to primary and remove the secondary duplicate.
- Add the small `YSWS / TECHNICAL BUILDER PROGRAM` utility label only if product owners approve this exact wording; otherwise use the factual `TECHNICAL BUILDERS` label. Do not claim Hack Club acceptance or endorsement.
- No dates, countdown, application status, join facts, social proof, stats, logo wall, or remote video in the hero.

#### About LOADOUT

- Heading: `What is LOADOUT?`
- Explain that builders create technical capability, track and journal work, ship an artifact for review, then build a lasting Digital Loadout while rewards can improve the Physical Loadout.
- Use an open, ruled two-column composition: explanatory copy on one side, the two-part Digital/Physical relationship on the other as a simple labeled diagram. Do not use a nested card or pretend to show a real participant profile.
- Put links to full program/project rules only if the owned destination is verified.

#### How it works

Render the program path as five or six readable steps with explicit verbs and short plain-language descriptions: choose a technical track or request, build and track real work, journal progress, ship a working artifact, review, then earn progression and choose a reward path. Do not promise that every submission is accepted or imply a particular reward amount.

Use black square-corner connectors with simple arrowheads. Connectors are decorative; step order is also available in DOM reading order and text. On mobile, stack vertically and do not rely on connector direction to explain sequence.

#### Tracks and Research Mode

Exactly four primary track entries, in this order:

| Track | Short description |
|---|---|
| Tools | Build developer tools that help people create, test, debug, or ship technical work. |
| Systems | Build the software and infrastructure other technical work depends on. |
| Compute | Improve how computation is performed, accelerated, or understood. |
| Hardware | Build capability in physical and embedded systems. |

Each entry has a distinct authored SVG mark, track name, a short true description, and a few topic labels selected from canonical product material. Do not imply that the lists are exhaustive. Use consistent graphite panels with yellow details; differentiate by icon, name, and copy, never by assigning a separate accent color to each track. Keep the four panels visually coherent, with a slight stagger in label/mark alignment rather than four cloned icon-title-description blocks.

Below or beside the grid, present **Research Mode** in a smaller independent callout: it is a project mode for experiment, benchmark, reproduce, or investigate work. Explicitly state that it is not a fifth track. Do not style it as a fifth equal card.

#### Progression and field pricing

- Heading should explain the relationship: **Bolts are global. Tracks shape progression and field pricing.**
- Use a two-column comparison, not a pricing table: **Track XP** is persistent, per-track progression; **Bolts** are global spendable program currency. Include readable text, not color alone.
- Add a diagram showing approved shipped work can contribute to the Digital Loadout, Track XP, and Bolts. Keep branch labels and arrows textual/semantic.
- Field-pricing explanation: track specialization can improve eligible field pricing; most equipment can remain cross-track purchasable; some mastery equipment can require specialization; rare Requisitions can affect eligible purchases. Keep the wording high level.
- Do not show hours, Bolt amounts, level numbers, discount rates, savings, example prices, thresholds, or calculator-like UI here. Numeric level thresholds may be mentioned only if a separate product-owner-approved live source is explicitly included in a later scope.

#### Rewards and shop

- Frame rewards as ways to upgrade the Physical Loadout and support future technical work.
- Show current item cards only from a verified, approved catalogue. A card must receive its name, approved image, and availability from that source; price and regional/stock status appear only when all are present and current.
- If no verified catalogue exists, keep the section heading and explanation but render a compact neutral state: catalogue details will be shown here when configured. Do not create synthetic item art, silhouettes with fake metadata, prices, counts, or product availability.
- If the shop is configured but empty, show a concise empty state and an in-page/back-to-tracks link. If it fails to load, preserve the rest of the page and show a retry action only if a real retry exists; otherwise a plain status message.
- No fake prices or discount percentage cards. Field pricing belongs in the preceding explanation, not as promotional offer tiles.

#### FAQ

Begin with the highest-intent questions and use short answers grounded in current canonical rules. At minimum cover what LOADOUT is, what fits, the four tracks and multiple-track work, Research Mode, Bolts versus Track XP, how work is tracked/journaled/reviewed, rewards, teams, AI rules where approved public wording exists, eligibility only if confirmed, and joining only if a destination is configured. Link long policy answers to verified owned rules pages.

Never guess an eligibility answer or present draft policy as settled. If the source does not establish a public answer, omit that question until resolved or use a neutral link to the approved rules.

#### Footer

- Keep the footer visually quieter than the hero: a thin top rule, wordmark and one-sentence description, then compact link columns.
- Include only verified destinations: About/Tracks/FAQ anchors; owned rules/privacy/terms/contact links when they exist; repository URL only after confirmation; community and Hack Club links only when current and relevant.
- Attribute source engineering honestly where the repository attribution documents require it. Do not state `a Hack Club project`, imply endorsement/acceptance, or use Hack Club marks without approval.
- A missing destination means the footer link is omitted, not rendered as `#`, `javascript:void(0)`, or a fake route.

## User flows and states

### Flow: Understand the program and choose a next step

**Goal:** a new visitor learns LOADOUT's purpose, sees where their project could fit, and continues to a confirmed next step or internal section.

**Entry points:** direct root URL, shared link, browser refresh at any scroll position, header anchor, hero action.

**Journey:**

1. Load the server-rendered page with all essential content visible.
2. Read the hero and select `Explore tracks`, a section anchor, or configured `Join`.
3. Read the four track descriptions and separate Research Mode callout.
4. Review the high-level progression, pricing, and rewards explanation.
5. Expand any FAQ disclosure or follow an available verified policy/community link.
6. If Join is configured, activate it as a normal external/internal link. If not, continue using the page's anchor navigation.

**Outcomes:** an anchor scroll reaches the named section with its heading visible below the header; configured destinations open normally; no fabricated action is offered. The browser Back/Forward and direct hash URL remain usable.

### Flow: Browse FAQs

**Goal:** answer a program question without losing the visitor's place.

Use a disclosure button for each row. Click, Enter, or Space toggles its answer. `aria-expanded` and `aria-controls` always reflect the state. Prefer one item open at a time for a compact reading list; if implementing single-open behavior, closing the current item must never move focus. Escape may close the currently focused/open item, but must not be required. Deep-linking FAQ state is optional and must not break refresh/back navigation.

### Required page states

| State | Required behavior |
|---|---|
| Initial / loading | Server-render essential page copy and section structure. If catalogue data is asynchronous, reserve its region and show a short textual loading state without hiding the page. |
| Normal content | Anchors, configured links, mobile menu, and disclosures work with pointer, keyboard, and touch. |
| Join URL absent | Remove Join actions and login/community actions with missing configuration. Keep in-page exploration available and make no claim that applications are open. |
| Rewards data absent | Show the neutral catalogue-unconfigured state described above; omit item cards and all invented metadata. |
| Rewards list empty | Explain the empty state without implying stock or future timing; provide a valid internal route or back-to-tracks action. |
| Rewards request error | Keep all static content usable. Show a plain, non-alarming unavailable message; show Retry only if the actual data source supports it. |
| Project examples absent | Do not show a project-example section or fabricate examples/testimonials. The current required IA does not reserve a fake-data placeholder. |
| Font/image failure | Text remains legible in fallbacks. Meaningful SVGs have accessible names; decorative marks are hidden from assistive technology. |
| JavaScript disabled/failure | The core page and direct anchor links render; reveals fail open. FAQ uses native disclosure or works without animated JavaScript. |
| Offline / slow network | Static explanation remains available. Do not block page reading on remote video, images, shop API, or font loading. |

**Relevant edge cases:** refresh at a hash target; unknown fragment id; back/forward after anchor movement; narrow 320px viewport; very long FAQ answer; keyboard focus while scroll-aware nav would hide; touch menu dismissal; browser zoom; reduced motion; missing or stale external URL. Unknown anchors fall back to the top of the page without a broken layout. Links are never silently redirected to Pixl.

## Component briefs

All components use tokens from [`DESIGN.md`](./DESIGN.md). Shared interactive target size is at least `44×44px`; text and icon alignment must not shrink the target.

### `PublicHeader`

- **Purpose:** brand identity and access to the five primary page anchors.
- **Variants:** desktop horizontal bar; mobile compact bar with disclosure menu. Join/Login are conditional on verified destinations.
- **States:** at top, tucked during downward scroll, revealed on upward scroll, menu open/closed, focused, hovered, reduced-motion.
- **Behavior:** scroll-aware hiding is allowed only when no descendant owns focus, pointer is over the header, or menu is open. Those conditions pin it visible. Anchor navigation uses native hash links and scroll margin; smooth behavior is progressive enhancement. Close mobile menu after selecting a link and return focus to the triggering button if dismissed with Escape.
- **Responsive:** desktop at `≥1024px`; mobile menu below that. Avoid a second row of nav labels.
- **Accessibility:** semantic `<header>` and `<nav aria-label="Primary">`; actual anchors for navigation, button with `aria-expanded`/`aria-controls` for menu. `Escape` closes and restores focus; Tab follows document order. No focus trap for a simple menu. Skip link is first focusable element.
- **Failure:** anchors work without JS; if an external destination is absent, its control is not rendered.

### `HeroPlate`

- **Purpose:** state LOADOUT's core proposition and expose the safest next action.
- **Variants:** configured Join CTA; Join absent fallback.
- **States:** initial visible; entrance reveal; hover/pressed controls; reduced-motion; missing font.
- **Behavior:** one brief stagger for heading then actions. No content starts hidden in markup. Primary button has hard offset shadow and tactile press; anchor target remains the track section.
- **Responsive:** center the text; hide side labels and sparse markers before the headline risks clipping; keep title within viewport at 320px; stack actions when required. Corners are decorative, not a box with text overflow.
- **Accessibility:** one page `<h1>`; concise copy; action labels describe destination; decorative marks `aria-hidden="true"`; focus states from lock.
- **Failure:** with reduced motion, display immediately; with font/image failure, no layout dependency is lost.

### `SectionHeading` and `SectionAnchor`

- **Purpose:** provide consistent section hierarchy and in-page destinations.
- **States:** default, anchor-focused, active scroll destination.
- **Behavior:** stable IDs and `scroll-margin-top`; active section cue may use a small underline or marker, not a decorative status dot.
- **Accessibility:** one `<h2>` per major section in order; child headings use `<h3>`; anchor links retain visible focus. No repeated artificial 01/02 labels unless denoting true process order.

### `ProcessSequence`

- **Purpose:** explain the program path.
- **Variants:** wide horizontal/zigzag flow; narrow vertical list.
- **States:** default; restrained in-view reveal; reduced-motion.
- **Behavior:** DOM order is the actual sequence; black connectors add reinforcement only. No indefinite motion or delayed text.
- **Accessibility:** ordered list with meaningful step headings; connectors hidden from screen readers. Keyboard does not stop on noninteractive steps.
- **Failure:** all steps render in order without CSS/JS.

### `TrackGrid` / `TrackEntry`

- **Purpose:** explain the four canonical technical fields and their fit.
- **Variants:** four entries; each shares one visual system and receives track name, short copy, optional canonical topic labels, and authored icon.
- **States:** default, hover/focus if entries link to approved track details, reduced-motion.
- **Behavior:** no per-track color coding; do not make noninteractive panels appear clickable. Research Mode is a distinct callout below the grid.
- **Responsive:** 2×2 desktop/tablet; one column on narrow mobile. Avoid horizontal scrolling.
- **Accessibility:** list/grid semantics chosen to match actual interaction; track names stay in text; icons are decorative if they duplicate the name.
- **Failure:** missing optional topic list does not remove the track or its description.

### `ProgressionExplainer`

- **Purpose:** distinguish Track XP from global Bolts and explain field pricing at a high level.
- **Variants:** comparison and field-pricing continuation.
- **States:** static/default; gentle reveal; reduced-motion.
- **Behavior:** show labels and meanings in text; arrows/lines are decorative. No animated counters, formulas, exact values, example prices, or discounts.
- **Accessibility:** use headings and definition list or labeled sections, not a visual-only chart. Maintain AA contrast on graphite.

### `RewardCatalogue`

- **Purpose:** introduce rewards and, only with approved current data, preview shop items.
- **Data contract:** optional verified items `{ id, name, description?, image?, price?, stock?, region? }`; fields render only when explicitly supplied and current. Currency label is Bolts. Never infer availability or price. Exclude any unapproved item from public output.
- **States:** loading, populated, not configured, configured-empty, error. See required page-state table.
- **Responsive:** verified catalogue uses a varied, non-nested grid with enough room for real item proportions; use a single-column list when it improves reading on narrow screens. The data state must not create fake blank cards.
- **Accessibility:** item name is visible text; real image alt describes the item, decorative image alt is empty; status messages use a polite live region only for asynchronous updates. Avoid announcing every card in a noisy live region.
- **Failure:** no remote image blocks the page. On failed image, show item name and neutral image fallback with no stock claim.

### `FAQAccordion`

- **Purpose:** answer concise public questions.
- **Variants:** closed/open; optionally single-open accordion behavior.
- **States:** closed, open, keyboard focus, hover, reduced-motion.
- **Behavior:** animate content height and marker rotation using the base motion curve; answer text is present and accessible when expanded. Never use the source screenshot's red arrows; use ink/yellow graphic language.
- **Accessibility:** native `<button>` per question with `aria-expanded` and `aria-controls`; Tab moves between buttons, Enter/Space toggles, optional Escape closes; focus stays on the button after state change. Answers are in the accessibility tree only when open if using accordion semantics, or remain readable if using native `details/summary`.
- **Responsive:** one column, long answers wrap, no clipped overflow.
- **Failure:** immediate open/close with no animation under reduced motion; content remains reachable without JS.

### `PublicFooter`

- **Purpose:** finish the page and expose verified reference links.
- **States:** normal; optional links absent; narrow stacked layout.
- **Behavior:** omit unavailable destinations; no dead `#` links. `target="_blank"` links must use safe `rel` attributes and indicate externality if context is otherwise unclear.
- **Accessibility:** semantic `<footer>`, grouped lists with headings, sensible DOM order, visible keyboard focus.

## Responsive and layout rules

| Viewport | Behavior |
|---|---|
| 320–639px | Single column; compact header menu; hide hero side labels; 48–64px hero title capped to width; stacked actions; vertical process; one-column tracks, rewards and FAQ; 44px minimum targets. |
| 640–1023px | Compact header as space requires; hero remains centered; section copy may use two columns; tracks use two columns; process may form a two-row sequence with text order intact. |
| 1024–1439px | Full anchor nav; framed centered hero with side labels; open about composition; two-by-two track plates; process flow; separated progression/pricing. |
| ≥1440px | Content max-width 1440px, centered; section whitespace grows without stretching text measure; hero labels stay near the plate rather than page edges. |

Across all sizes: no horizontal overflow, no tiny text used to fit a composition, no essential content only in hover, and no sticky element that obscures headings or focus. Test browser zoom and long copy. Reflow according to content, not fixed screenshot heights.

## Accessibility contract

- Semantic landmarks, one `<h1>`, ordered heading hierarchy, skip link, descriptive link text, and native buttons/anchors.
- WCAG AA text contrast is recorded in `DESIGN.md`; muted body text must use the checked `#606161` or darker on light surfaces. Controls and focus indicators meet at least 3:1 against adjacent colors. Do not use the faint background grid as a border.
- Full keyboard route: skip link → header links/menu → hero actions → section links → FAQ controls → footer. Focus remains visible and is never under the tucked header.
- Minimum 44×44px pointer targets; sufficient spacing between adjacent controls.
- Track name, sequence, status, and action meaning are not communicated by color or animation alone.
- Motion contract in `DESIGN.md` applies to all motion. Honor OS setting without requiring a page setting.
- Use reduced, purposeful announcements for data loading/error only; do not add assertive live regions for routine reveals.
- Respect browser text zoom and forced colors; add a solid outline fallback if box-shadow focus is unavailable.

## Motion contract

Keep these user-requested effects in a single coherent, restrained system:

| Effect | Trigger and purpose | Timing / behavior |
|---|---|---|
| Smooth scroll | User follows an in-page anchor; provides a continuous sense of section position | User-controlled, cancellable, no scroll hijack; reduced-motion/native fallback and correct focus/hash behavior |
| Scroll-aware nav reveal | Reveal navigation when the visitor scrolls upward; reclaim a small amount of reading space on downward scroll | Short transform using base timing; never hide focused/hovered/open-menu content; no jitter near top or during programmatic anchor focus |
| Hero reveal | First page presentation | One restrained opacity/short translate sequence, under 500ms total; fail-open visible content |
| Section reveal | Orient the visitor as a section enters view | One-time opacity/short translate only; no stagger per paragraph; fail-open visible content |
| Hover/press | Show control affordance and tactile response | 120–180ms; translate only 1–2px, reduce hard shadow on press; no bounce |
| FAQ | Communicate expand/collapse | Height and marker state, 180–300ms; immediate state in reduced motion |

Do not add Pixl-only story/map loops, a continuous marquee, or autoplay video. Treat these as removable even in the baseline port; they are not part of the LOADOUT visual identity. No parallax, looping decoration, or animation that delays reading. Disable Lenis or equivalent when reduced motion applies; avoid simultaneous smooth-scroll libraries and CSS smooth scrolling.

## Copy and factual boundaries

The spec must not invent or imply:

- event dates, schedules, deadlines, applications-open state, eligibility, participant counts, testimonials, sponsors, or Hack Club endorsement;
- reward prices, Bolt payouts, stock, shipping/region availability, discounts, or percentage savings;
- a join, login, Slack, docs, GitHub, terms, or shop destination that has not been verified;
- specific examples/projects or item photography presented as actual LOADOUT data.

Use only approved factual wording and safe in-page links when no destination exists. Research Mode is not a track. Bolts are not track-bound. Keep internal reviewer formulas and implementation mechanics out of this marketing page.

## Design Pre-Flight

### Identity lock

- [x] Palette, typography, spacing, radius, and motion are bound to `DESIGN.md`; no off-system values are specified.
- [x] One accent (Bolt Yellow), one radius scale, one SVG language, one display/body pairing.
- [x] Identity sentence included and all sections bind to it.
- [x] `DESIGN.md` was established before the page specification.

### Anti-slop

- [x] No banned default font, purple/blue glow, cream-default token, gradient text, or glassmorphism.
- [x] No three-card feature row, nested cards, fake hero/dashboard, gratuitous numbering, rainbow tracks, or fake industrial decoration.
- [x] No buzzwords, fictional names, fake numbers, fake stats, or dead links in proposed copy.
- [x] Counterfactual test passes for LOADOUT's signature and product loop.
- [x] Signature is the framed, whitespace-led hero plate.
- [x] Screenshot composition is used as reference; screenshot content is not copied as fact.

### States, responsive behavior, and accessibility

- [x] Loading, populated, absent-config, empty, error, missing-asset, and JS-failure states are defined where data or interaction exists.
- [x] Refresh/hash, back/forward, offline/slow network, focus while nav hides, narrow viewport, long content, and external destination failures are covered.
- [x] AA text pairs and contrast results are recorded in `DESIGN.md`; controls have focus and target requirements.
- [x] Keyboard behavior, ARIA/native control semantics, screen-reader states, and reduced-motion behavior are specified.
- [x] Three or more layout families: framed hero, open editorial split, ordered process, track instrument grid, comparison/ruled section, list accordion.
- [x] Five top-level nav items; one primary action per state; FAQ is progressively disclosed.

### Scored self-critique

| Axis | Score / 4 | Reason |
|---|---:|---|
| Distinctiveness | 4 | A specific technical field-manual identity, bound to LOADOUT's four fields and dual loadout loop. |
| Hierarchy and focus | 3 | Clear hero and section sequence; long page remains a tradeoff, managed with anchor navigation. |
| Consistency with `DESIGN.md` | 4 | Tokens and motion are explicitly locked and reused. |
| Accessibility | 4 | States, keyboard, semantic controls, contrast, target size, and reduced motion are specified. |
| State and edge coverage | 4 | Static page and optional reward/destination states are covered. |
| Copy quality | 3 | Plain and factual; final exact microcopy remains subject to canonical product-owner wording. |
| Restraint | 4 | One hero signature; data-gated products; decoration has an orientation role. |
| Motion motivation | 4 | Each motion has a user-facing purpose, reduced-motion fallback, and fail-open behavior. |
| **Total** | **30 / 32** | No axis is 2 or below. |

**Preflight revisions:** removed the screenshot's unsupported reward/pricing claims from the content contract; made Join, rewards, policy, and footer destinations data-gated; separated Research Mode from the four-track grid. These changes preserve the visual direction while grounding all factual content.

## Build handoff

- **Target agent:** `nextjs-senior-engineer` because Plan09 specifies a Next.js landing app and the public page benefits from server-rendered content and SEO plumbing.
- **Framework:** Next.js App Router, React, TypeScript, Tailwind CSS. Follow the landing package versions and constraints in Plan09. This artifact specifies design only; audit the actual application state before choosing exact files or dependencies.
- **Design system:** bespoke brand landing page. Use semantic HTML and accessible native controls; do not add a component library for the marketing composition.
- **Setup note:** map the locked CSS values to semantic project tokens; use only approved, locally available/licensed Jersey 10 and IBM Plex Mono font files with stable fallbacks. Use authored SVG marks. Configure public links and live shop content through a small owned configuration/data source. Keep unknown values absent.
- **Scope boundary:** public landing page only. Keep Pixl-specific map/story loops, marquee, video, services, lore, URLs, and game content out of the LOADOUT design.
- **Acceptance criteria:**
  - [ ] The page follows this order: framed hero, About, How it works, four tracks plus separate Research Mode, progression/field pricing, Rewards/shop, FAQ, footer.
  - [ ] Canonical copy distinguishes global Bolts, per-track XP, Digital Loadout, and Physical Loadout.
  - [ ] No invented facts, dates, numerical reward/pricing/discount values, stock, stats, endorsement, or URLs appear.
  - [ ] Missing Join/config/catalogue data produces the specified safe states and no dead links.
  - [ ] Desktop/tablet/mobile compositions follow the responsive table without horizontal overflow or inaccessible hidden navigation.
  - [ ] Motion matches the contract, remains fail-open, and becomes native/immediate with reduced motion.
  - [ ] FAQ is keyboard-operable, exposes expanded state, and preserves focus.
  - [ ] Contrast, touch targets, semantic structure, link destinations, and focus visibility meet this spec.
  - [ ] Pixl-only loops, marquee, and video are absent.

**Implement exactly this spec. Theme the design with the locked tokens; do not redesign or re-implement a component system.**
