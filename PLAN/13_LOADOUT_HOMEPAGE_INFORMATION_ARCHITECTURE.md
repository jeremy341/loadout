# LOADOUT Homepage Information Architecture

**Status:** Approved and implemented locally on 2026-10-05 on `feature/homepage-clarity-flow-eras`. The final local checks pass. No commit, push, or deployment in this pass.

**Hierarchy follow-up:** [Plan 14](14_LOADOUT_PROGRESS_AND_PRIZES_HIERARCHY.md) implements the later terminology preference and nests pricing, discounts, Requisitions, prizes, and Custom Orders beneath one Progress & Prizes section. It supersedes the separate Progression and Gear & Rewards sections below.

**Implementation spec:** [.ulpi/design/homepage-information-architecture.md](../.ulpi/design/homepage-information-architecture.md).

**Scope:** Public homepage in `apps/landing`.
**Policy owners:** `PLAN/01_LOADOUT_PRODUCT_AND_PROGRAM.md`, `PLAN/02_LOADOUT_ECONOMY_AND_REWARDS.md`, and `PLAN/11_LOADOUT_ERAS_AND_COMMUNITY_PROGRESSION.md` remain authoritative.
**Design base:** `PLAN/03_LOADOUT_UI_DESIGN_SYSTEM.md` and `.ulpi/design/DESIGN.md`.
**Supersedes:** The section order proposed in §5 of Plan 12. Plan 12's implementation record and approved visual decisions remain historical context.

## 1. Goal

Help a first-time visitor understand, in page order:

1. What LOADOUT is and what kind of work belongs here.
2. Which technical tracks a project may use.
3. What happens from choosing a project through review.
4. How accepted work grows a portfolio, permanent Track XP, and spendable Bolts.
5. How levels connect to equipment, prices, Requisitions, and Custom Orders.
6. How shared Community Eras differ from personal progression.

The first read should use plain language. The FAQ should answer edge questions, not carry the main explanation.

## 2. User-approved constraints

- Keep the existing hero and its RSVP destination.
- Keep the **How it works** section exactly as it is: same content, design, steps, diagram, accessibility, and behavior. It may move as one intact section in the page sequence. Preserve its `#process` anchor.
- Do not add broad product features or alter program/economy rules.
- Preserve LOADOUT's current visual identity and responsive behavior.
- The original planning pass changed no homepage code. The later user instruction explicitly authorizes implementing this plan.

## 3. Current-order and overlap audit

The current order is Hero → About overview cards → Digital/Physical glossary → How it works → Project fit → Tracks → Progression → Eras → Equipment/pricing/Requisitions/Custom Orders → Rewards & shop → FAQ → Footer.

### Repetition to remove or reduce

- The four About cards restate the same choose/build/earn/equip sequence shown in **How it works**.
- The separate four-term Digital/Physical glossary repeats outcomes already explained in the process diagram and later reward sections.
- Project-fit examples appear before visitors have seen the four tracks, even though the fit examples are easier to understand in that context.
- `EquipmentSection`'s four broad category cards and the separate eight-card shop grid describe overlapping planned reward categories.
- The progression rail names Requisition milestones, then later content repeats the milestone schedule. Show when they are earned once; explain how to use them once.
- The progression benefits and field-pricing copy both explain that track levels can change gear prices/access. Keep the level effect in progression and the purchase mechanics in rewards.

### Content that must stay distinct

- Project fit is an eligibility gate; it is not one of the four quality scores or a promise of approval.
- Bolts are global and spendable. Track XP is separate, cannot be spent, and raises a level in each lifetime track.
- Research Mode is an optional modifier, not a fifth track.
- Community Eras use separate, non-spendable shared progress. They are not personal Track XP, Bolts, Seasons, or project-eligibility requirements.
- Field Requisitions, Custom Orders, and ordinary shop purchases are related but different mechanisms.

## 4. Implemented page order

1. **Hero** — retain the approved headline, supporting copy, RSVP link, and scroll cue.
2. **What is LOADOUT?** — give one direct definition of the technical builder program. Fold the Digital/Physical distinction into this introduction as a compact two-part explanation. Remove the four overview cards so the opening does not preview How it works step-for-step.
3. **Tracks & project fit** — one parent section with ordered subsections:
   - Four lifetime tracks first: Tools, Systems, Compute, Hardware.
   - Research Mode as a clearly optional modifier.
   - Project-fit examples after the track descriptions, with copy that judges the technical work rather than the product label.
   Preserve the `#tracks`, `#research`, and `#project-fit` destinations, even if they become subsection anchors.
4. **How it works** — move the existing component intact after visitors know the tracks and what kinds of work may fit. Do not edit `HowItWorks.tsx` or its styles.
5. **Progress that stays with you** — explain permanent Track XP and levels, breadth versus specialization, and show the five Field Requisition milestones at LV.3 / 6 / 9 / 12 / 15. Keep the milestone schedule here; do not repeat it in full later.
6. **Gear & rewards** — consolidate the current equipment, shop, pricing, and order material into one major section with this order:
   1. Explain that Bolts buy gear globally while track levels can affect price/access.
   2. Explain Field Requisition use and limits, referring back to the milestone rail rather than repeating its schedule.
   3. Show one planned reward-category grid. Prefer the more specific `shopCategories` list as the sole card grid; use short introductory copy for broad equipment types instead of retaining the separate four-card `fieldCategories` grid.
   4. Explain Custom Orders for equipment outside the regular shop.
   Keep categories labeled as planned; do not imply live stock, prices, or open requests.
7. **Community Eras** — keep as a separate optional community-progression section after the core personal build/progression/reward story. Explicitly distinguish shared Era Points from Track XP and Bolts, and state that Era objectives are not required for review.
8. **FAQ** — answer remaining practical questions without reprinting entire sections.
9. **Footer** — retain current links and attribution.

The primary story becomes: **what LOADOUT is → choose a field and check fit → how the unchanged process works → personal progression → equipment and rewards → optional community progression**.

## 5. Navigation plan

Use a compact navigation that follows the main visitor journey: **About · Tracks · How it works · Progression · FAQ**, with RSVP as the primary action. Keep Rewards, Requisitions, Custom Orders, Research Mode, and Eras accessible by in-page links and footer links rather than adding every subsection to the top bar. Verify every navigation destination still points to a unique, visible heading.

## 6. Copy and accuracy rules

- Define LOADOUT before introducing program-specific terms. Avoid assuming visitors know “YSWS.”
- Distinguish an accepted project, the quality assessment, Bolts, Track XP, levels, and Era Points using consistent terms.
- Keep fit examples illustrative, not guarantees. Explain that LOADOUT Fit is a gate and the four quality dimensions remain Originality, Technical Depth, Execution, and Documentation.
- Never present mock prices, percentages, inventory, dates, or Era themes as live facts.
- Explain planned mechanics as planned. RSVP is interest, not enrollment or confirmed eligibility.
- Use one first explanation for each rule; later sections may link back or give a short reminder.

## 7. Implementation map

- `apps/landing/app/_components/HomepageSections.tsx` — compose the new section order and group the existing tracks/project-fit subsections.
- `apps/landing/app/_components/DigitalPhysicalLoadout.tsx` — fold the compact Digital/Physical explanation into the About section; remove the standalone interruption.
- `apps/landing/app/_components/HowItWorks.tsx` — **must remain unchanged**; only its call position in the page composition may move.
- `apps/landing/app/_components/ProgressionSection.tsx` — retain the milestone rail and avoid duplicating the complete Requisition schedule elsewhere.
- `apps/landing/app/_components/EquipmentSection.tsx` and `apps/landing/app/site-content.ts` — compose the unified gear/rewards content and one category grid; preserve factual labels and links.
- `apps/landing/app/_components/ErasSection.tsx` — relocate after the core rewards section without changing Era policy.
- `apps/landing/app/_components/SiteNav.tsx` — align the compact navigation with the new order and preserve valid anchors.
- `apps/landing/app/loadout.css` and `apps/landing/app/homepage-refinement.css` — update only the layout rules needed for the new grouping and responsive order.

Do not change policy plans `01`, `02`, or `11`, backend behavior, the hero, page-wide motion, cloud scenery, footer content, or the How it works component in this pass unless separately requested.

## 8. Later review criteria

- A new visitor can explain what LOADOUT is after reading the hero and opening section.
- Tracks appear before project-fit examples, and project fit is not confused with quality scoring.
- The How it works component is unchanged internally and appears after the tracks/fit context.
- Bolts, Track XP, levels, Requisitions, and Era Points remain visibly distinct.
- Only one planned reward-category card grid remains; normal shop and Custom Orders are clearly distinguished.
- No unexplained program acronym or duplicated full explanation is needed to follow the page.
- At desktop, tablet, and narrow mobile widths, headings, section groups, and anchors remain clear with no overlap or horizontal overflow.
- Reduced-motion, keyboard/focus behavior, and the existing scroll interactions remain usable.

The user explicitly authorized the UI implementation after reviewing this plan.

## 9. Local implementation and verification record

The opening now combines the program definition and two compact Digital/Physical Loadout explanations. The four repeated overview cards and standalone four-term glossary are removed. The track cards, Research modifier, and project-fit comparison form one section before the intact process diagram. Personal progression leads to one Gear & Rewards section with pricing, Requisition use, one eight-category grid, and a separate Custom Order explanation. Community Eras follow that core pathway. Five navigation links match the planned order, and all existing anchors remain valid; Custom Orders now has its own correct heading and destination.

New layout rules are scoped to the changed groups. The reward grid uses four/two/one columns, Requisition explanations stack on tablet, and Custom Order steps stack on mobile. The How it works component SHA256 remains `8C19395FBBBD082A2DC37B1156009D64A0A50071ABD8686291E4F1D940A255F2`. All protected process/flow/shared heading rules and 50 protected component/SVG files match the pre-task baseline.

All seven requested skills were consulted. The frontend-design-ui-ux brief was handed to a GPT-6 Luna medium engineering agent; the existing identity, transparent sprite art, and motion were retained. No sprite frames or new illustrations were needed.

Final checks: lint, explicit typecheck, four existing unit tests, production build, and all 24 existing browser tests pass. The browser suite was run with one worker after concurrent build/browser processes hit a local memory failure and two page-load timeouts; the separate build and serial browser run passed. Three outdated browser assertions were updated to reflect the already-removed bottom CTA, current multi-track FAQ question, and the actual anchor destination instead of an obsolete fixed scroll distance. No new tests were added.

The changed sections were inspected in the live browser at 1440px, 768px, 390px, and 320px. No horizontal overflow, duplicate IDs, broken anchors, or fit-label collisions were observed. Existing checks cover keyboard FAQ/navigation, reduced motion, native touch scrolling, no-JavaScript content, and serious/critical automated accessibility findings. `git diff --check` is clean.
