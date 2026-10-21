> **Archived 2026-10-20:** completed or superseded design brief, kept for provenance. Current visual authority: [design system](../../../docs/design/system/design-system.md).

# Progress and prizes: implementation brief

**Status:** Implemented and consolidated. Plan 02 owns economy rules and Plan 06 owns homepage presentation; this brief records the hierarchy change and is historical, not a duplicate source of policy.
**Identity lock:** Existing `DESIGN.md` governs the grey paper, muted yellow, pixel typography, rules, art, and motion. This is a content-hierarchy refinement for new technical builders. Preserve the industrial field-manual direction, bespoke components, and current design/motion/density values 7/4/4.

## Component and reading-order contract

- `ProgressionSection` owns one `section.site-section#progression` and one h2, **Progress & prizes**. It contains lifetime levels, the existing five Requisition milestones, and the prize details.
- Give lifetime levels an h3. Describe Track XP persistence once. Keep the LV.3/6/9/12/15 rail and existing badges; keep the breadth/specialization note about choosing fields, without repeating the pricing explanation.
- Render `EquipmentSection` inside this parent. Its wrapper becomes a nested content group, without its own h2, site-section width/padding, or the former Put progress to work heading. Keep `#gear` as a legacy alias if convenient.
- Nested subsection order: `#field-pricing` (h3 for level-based price/access and normal savings caps), `#requisitions` (h3 for raising a cap, existing example and usage rules), `#shop` (h3 **Planned prizes**, eight cards once), then `#custom-orders` (h3 for requesting specific technical equipment outside the shop).
- Explain normal caps only in the pricing paragraph. Explain Requisition use directly after it; do not repeat the milestone list.
- Remove the separate EquipmentSection import/call from HomepageSections. Other section order remains About → grouped Tracks/fit → How it works → Progress & prizes → Eras → FAQ.
- Use **prizes** for Bolt-shop items in these headings/copy and relevant FAQ/catalog labels. Keep **equipment** as a useful description of technical objects. Update nav/footer progression label to **Progress & Prizes** and footer shop label to **Prizes**. Preserve anchor destinations.
- The existing HowItWorks component and process/flow/shared heading CSS are immutable for this task, including its existing generic nouns. Preserve its exact SHA256 `8C19395FBBBD082A2DC37B1156009D64A0A50071ABD8686291E4F1D940A255F2`.

## Layout and interactions

One clear h2 introduces the complete progression-to-prizes story. Subsections use smaller h3 headings and modest vertical spacing/rules within the parent, rather than repeated major-section headings. Keep the 1080px maximum width and 16px essential copy. Intro and key statements stay readable at about 70ch. The prize grid stays four/two/one columns and Custom Order steps three/one; Requisition copy/rules use two columns on desktop and one under 900px. Scope styling to this parent and prize details; do not alter global site-section/section-heading or process styles.

Keep unique heading/anchor IDs, sticky-header scroll margins, and existing focus styles. Navigation remains five entries plus RSVP. FAQ retains its button/expanded/inert/no-JavaScript states. The page is static and makes no new loading, purchase, stock, or quote controls. Planned prizes and unavailable requests retain their clear status. Deep links to the retained subsections continue to work.

## Skill application and handoff

All seven requested skills are loaded. frontend-design-ui-ux supplies this design/handoff; frontend-design and design-taste guide the shared hierarchy and restrained existing identity; emilkowal-animations preserves existing transform/opacity and reduced-motion behavior; svg-design/pixel-art-sprites/Pixel Art Animator preserve transparent, labelled static art without creating unnecessary frames or assets. The user's approved pixel art, scroll cue, dark track cards, and preserved process override generic stylistic suggestions.

Historical implementation handoff: the changes described here were consolidated into Plan 06, while Plan 02 remains the economy authority. Use those current owners and the asset catalog; do not treat this completed brief as current authorization.

Design preflight: existing signature/identity retained; distinct intro, track cards, process diagram, milestone rail, nested explanations/catalog, Era sequence, FAQ layouts preserved. Static/unavailable/FAQ states are covered. No new external action is introduced. Review score 25/32: distinctiveness 3, hierarchy 3, consistency 4, accessibility 3, state coverage 3, clarity 3, restraint 3, motion purpose 3. Validate the implemented result in desktop/mobile views.

## Verification contract

- Main page has six h2 sections: About, Tracks, How it works, Progress & prizes, Eras, FAQ.
- Pricing, Requisitions, shop, and Custom Orders all sit beneath `#progression`; eight prize cards appear once and no Put progress to work/Gear & rewards main heading remains.
- HowItWorks and protected style/art hashes match the baseline.
- Desktop/tablet/mobile layout and all anchor destinations are inspected; required existing lint, typecheck, unit, build and browser checks are run without resource-heavy concurrency.

## Completed review

Implemented on 2026-10-05 and consolidated into [Plan 06](../../../plans/06-public-homepage.md); [Plan 02](../../../plans/02-economy-and-rewards.md) owns mechanics. The combined section has one h2 and nests the pricing, Requisition, planned-prize, and Custom Order material. The historical test and visual evidence above is not a substitute for checking the current UI.
