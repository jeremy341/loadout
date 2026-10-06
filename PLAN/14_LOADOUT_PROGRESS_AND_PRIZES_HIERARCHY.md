# LOADOUT Progress and Prizes Hierarchy

**Status:** Approved and implemented locally on 2026-10-05 on `feature/homepage-clarity-flow-eras`. Final local checks pass. No commit, push, or deployment in this pass.
**Implementation brief:** [.ulpi/design/progress-and-prizes.md](../.ulpi/design/progress-and-prizes.md).
**Scope:** Rename the gear-facing section to prizes and nest pricing, discounts, and prize choices within the existing personal-progression section.
**Policy owners:** Plans 01, 02, and 11 remain authoritative for program, economy, and Era rules.
**Previous IA:** Plan 13's consolidated introduction, tracks/project-fit grouping, and process placement remain in force. This plan supersedes its separate top-level Progression and Gear & Rewards sections.

## 1. User intent and constraints

The user wants Bolt-purchased items called **prizes** in the homepage hierarchy. Pricing and discounts explain what progression does, so they should sit with levels instead of being presented as another major destination. Requisitions are the bridge between the two and belong beside both the milestone rail and prize pricing rules.

- Keep the already-approved hero, About, Tracks & Project Fit, and separate Community Eras order from Plan 13.
- Keep the **How it works** component exactly as it is, including its existing copy, layout, illustrations, behavior, and styling.
- Keep top-level page sections to the visitor's main journey; make this Progress & Prizes one top-level section with clear subsections.
- Do not introduce new economy, discount, Requisition, inventory, or ordering rules.
- The original document was planning-only; the user subsequently requested implementation explicitly.

## 2. Terminology

- Use **prizes** for items bought with Bolts and for the planned shop catalog.
- Use **equipment** when it describes the kind of technical object a builder uses or requests, especially Custom Orders.
- Remove the standalone top-level **Gear & Rewards / Put progress to work** heading.
- Use one navigation label, **Progress & Prizes**, pointing to the existing `#progression` parent anchor. Keep its position after **How it works**.
- Preserve **Field Requisition** as the mechanic name. A Requisition raises the savings cap on an eligible order; it is earned from track progression and does not replace the normal level requirement.

## 3. Implemented page order

1. Hero.
2. What is LOADOUT? with the compact Digital/Physical Loadout explanation.
3. Tracks & Project Fit, including Research Mode.
4. The unchanged How it works section.
5. **Progress & Prizes**: levels, the level-to-price connection, Requisitions, the planned prize catalog, and Custom Orders.
6. Community Eras, clearly separate from personal levels and prizes.
7. FAQ and footer.

## 4. Progress & Prizes section hierarchy

Use one `section.site-section` with `id="progression"` and a single level-two heading, **Progress & prizes**. Organize its content as these level-three subsections in reading order:

### A. Track XP and levels

Explain that each lifetime track has its own unspendable Track XP and level, up to LV.15. Keep the existing LV.3 / 6 / 9 / 12 / 15 Requisition milestone rail here; it is the one place that shows when Requisitions are earned. Explain the breadth-versus-specialization benefit once.

### B. How levels affect prize prices and access

Describe cross-track purchasing, the related-track price benefit, and level requirements for specialist prizes. Explain normal discount caps here so the need for a matching Requisition is clear. Do not repeat the broad Track XP definition or duplicate the progression benefits paragraph.

### C. Field Requisitions

Immediately follow the normal-pricing explanation with the existing Requisition example and usage rules: one use, non-transferable, never expires, at most one per order, eligible minimum value, and no removal of level requirements. Refer visitors back to the rail for milestones instead of reprinting the LV.3 / 6 / 9 / 12 / 15 schedule.

### D. Planned prizes

Keep the existing eight specific `shopCategories` cards as the single catalog. Remove the separate four-card `fieldCategories` grid. Mark the list as planned and unavailable to order; show no current inventory or prices. Keep one concise sentence that prizes may include developer hardware, boards, compute, tools, storage, fabrication, domains, and custom items.

### E. Custom Orders

Keep this as the final subsection in the same parent section. Explain requests for specific technical equipment outside the regular shop, the project/level/balance/budget/region review, the quote, and that requests are not open yet. Preserve the dedicated `#custom-orders` anchor.

## 5. Duplication and anchor rules

- There is one prize catalog grid.
- Level-based price/access effects appear once in the Progress & Prizes section.
- The milestone schedule appears once in the progress rail; the Requisition subsection contains usage rules only.
- Keep `#progression` as the parent, with `#field-pricing`, `#requisitions`, `#shop`, and `#custom-orders` as unique subsection anchors. Add scroll margin for the sticky header and use visible headings for all destinations.
- Preserve the Research Mode, Project Fit, How it works, and FAQ anchors.
- The FAQ may link to these explanations and retain key edge cases; it should not paste each subsection in full.

## 6. Accessibility and responsive behavior

- Keep one h2 for the parent and h3 headings for its subsections; subordinate rule labels use h4 only within the Requisition subsection.
- Use the existing pixel icons decoratively with empty alt text and `aria-hidden`; labels carry meaning. Existing levels and prize cards remain text-labeled.
- Desktop: Requisition copy and its usage rules may sit in two columns. Progression benefits, pricing, prize grid, and Custom Orders share the parent section width.
- Tablet: Requisition content stacks; prize catalog uses two columns.
- Mobile: all subsections stack; prize cards use one column where text needs it; long Custom Order instructions wrap with no overflow. Keep body type at 16px minimum, anchor focus visible, and reduced-motion behavior unchanged.
- Do not modify How it works or its `.process-*` / `.flow-*` style rules.

## 7. Implementation map

- `ProgressionSection.tsx` becomes the single parent section and renders the existing level rail followed by nested prize subsections.
- `EquipmentSection.tsx` becomes a nested subsection renderer without its own top-level page section or duplicate field-category cards.
- `site-content.ts` retains the eight specific prize categories and removes `fieldCategories` if no longer used.
- `SiteNav.tsx` and the footer label point to `#progression` as **Progress & Prizes**; preserve the top-level navigation limit and RSVP action.
- Scoped `homepage-refinement.css` adds the unified subsection hierarchy and responsive stacking. Keep current theme tokens, pixel art, hero, clouds, reveal behavior, and reduced motion.
- Preserve Plan 13's tracks/project-fit grouping and the exact `HowItWorks.tsx` file contents and process styles.

## 8. Acceptance criteria

- A visitor can read the page as one sequence: project fit → process → personal progression → prize prices and use → available prize categories → special requests.
- **Gear & Rewards** is no longer a top-level label; the Bolt catalog is consistently called prizes.
- Levels, discounts, and Requisitions are explained together without repeating milestone lists or price claims.
- The four-card field-category grid is removed and the eight-card planned prize catalog appears once.
- Custom Orders are a subsection of Progress & Prizes and still state that requests are not open.
- The How it works component/styles and Community Eras policy are unchanged.
- Anchors, keyboard focus, reduced motion, and 320px/390px mobile through desktop layouts remain usable and non-overlapping.

The user explicitly authorized implementing this plan after the planning pass.

## 9. Local implementation record

`ProgressionSection` now owns one top-level Progress & prizes section. It contains the lifetime-level explanation, five Requisition milestones and their visible earning caption, followed by nested prize pricing, Requisition usage, the single eight-card planned prize catalog, and Custom Orders. The former Put progress to work heading and separate EquipmentSection call are removed. Pricing carries the normal savings-cap explanation; Requisition copy describes raising it. Navigation, footer links, catalog status and relevant FAQ copy use the requested prize terminology. Equipment remains a descriptive term for technical objects and special requests.

The `#progression`, `#field-pricing`, `#requisitions`, `#shop`, and `#custom-orders` anchors are unique; the legacy `#gear` wrapper is retained. The four prize subsection destinations are children of the progression section. The page now has six main h2 headings, and the catalog renders once. Styling is scoped to the combined hierarchy and retains desktop/tablet/mobile grid behavior.

The HowItWorks file retains SHA256 `8C19395FBBBD082A2DC37B1156009D64A0A50071ABD8686291E4F1D940A255F2`. All 52 protected component/art files and all protected process/flow/shared heading style rules match the pre-task baseline. All seven requested UI skills were consulted; the frontend-design-ui-ux brief was implemented by the existing GPT-6 Luna medium engineer using the locked UI system and existing static pixel assets.

Validation: lint, explicit TypeScript check, four existing unit tests, production build, and all 24 existing browser tests pass. Build and browser tests were run separately; the browser suite used one worker. No tests or dependencies were added or modified in this pass. The live browser was inspected at 1440px, 768px, 390px and 320px: no horizontal overflow, duplicate IDs or missing anchor destinations were found, and prize/Requisition layouts reflowed as planned. `git diff --check` passes.

## 10. Follow-up content planning — 2026-10-06

The user requested clearer, moderately detailed explanations for Community Eras, Field Requisitions, and Custom Orders. [Plan 16](16_LOADOUT_HOMEPAGE_MECHANICS_CLARITY.md) owns that future copy brief. It preserves this section hierarchy and the economy rules in Plan 02. No homepage code was changed during planning. In particular, Plan 02 does not currently define a separate lifetime-hours minimum for Custom Orders; Plan 16 records that as an explicit pre-launch decision instead of inventing a threshold.
