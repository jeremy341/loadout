# LOADOUT Homepage Visual Clarity and Progressive Disclosure Plan

> **For agentic workers:** This is a planning proposal. Do not implement until the owner approves this plan. If approved, use the required UI skill workflow.

**Owner-approved limited slice, 2026-10-06:** Implement only the Era overview reduction described in Task 6. All other plan work remains unapproved. This slice may remove repeated Era copy from HowItWorks, Progression, IRL, and FAQ; preserve all unrelated content and internal policy.

**Owner-directed homepage update, 2026-10-06:** The owner has separately asked to publish the current working-tree simplification: remove the standalone About block, keep the project-fit comparison after How it works, carry Digital/Physical outcomes in the process flow, simplify the Progress & Prizes heading and Custom Order display, keep the scroll cue non-interactive, add a compact planned Era fact strip, and add a pull-up field-manual preview with a full `/docs` page. This explicit request supersedes conflicting composition constraints above only for those changes. The broader track-card turns and disclosure tasks remain unimplemented.


**Architecture:** Extend the existing landing app and design system. Keep the current page order and How it works diagram. Use semantic HTML/CSS and existing sprites for static flows, an isolated card-state component for track-example turns, and disclosures for optional rules. No new diagram framework or backend is needed.

**Tech stack:** Existing Next.js, React, Framer Motion, CSS/SVG assets, Playwright, and axe checks in apps/landing.

**Spec:** .ulpi/design/homepage-visual-clarity.md

## Global constraints

- Keep the current section order: Hero → About → Tracks & Project Fit → unchanged How it works → Progress & Prizes → Community Eras → future IRL concept → FAQ → Who’s Behind LOADOUT → footer.
- For the Era-only approved slice, remove only the redundant Era-objectives note from HowItWorks.tsx; preserve every other process step and its styling.
- Do not change existing .process-* or .flow-* rules.
- Keep all four tracks, current project-fit judgments, quality dimensions, Track XP/Bolt distinctions, Requisition rules, Custom Order gates, and event status. Era product rules remain unchanged internally; the public summary follows the brief scope in Task 6.
- Hidden track examples are supplemental only. Names and essential purpose remain visible; hidden details use explicit controls.
- Use existing sprite art and CSS/SVG connectors. Do not add a graph library, image assets, dependencies, live data, or user-authored project examples.
- Keep unconfirmed prices, hours gates, inventory, dates, venue, and live status absent.
- FAQ complements its main sections; it does not reproduce all section copy.
- This proposal does not authorize implementation, commit, push, PR, deployment, or branch-protection changes.

## Review focus

1. A track card’s hidden face can be undiscoverable or remain in the tab order while visually concealed.
2. A CSS flip can leave focus on an invisible or inert face.
3. A shortened fit summary can blur the distinction between product category and original technical work.
4. A progress diagram can look like a live meter or imply an unapproved Era transition.
5. Compact tiers or disclosures can clip or overflow at 320px, 200% zoom, or large text.

---

### Task 1: Build a fact and duplication inventory

**Read:** .ulpi/design/homepage-visual-clarity.md; Plans 01, 02, 06, 11, 13, 14, 15, and 16.

**Inspect:** site-content.ts, HomepageSections.tsx, HowItWorks.tsx, ProgressionSection.tsx, EquipmentSection.tsx, ErasSection.tsx, SiteFooter.tsx, loadout.css, homepage-refinement.css.

- [ ] Identify each displayed fact’s primary location.
- [ ] Find repeated explanations in About, How it works, Progress & Prizes, Eras, and FAQ.
- [ ] Inventory track/fit examples, anchors, and sprite names.
- [ ] Record HowItWorks.tsx hash and protected CSS selectors before editing.
- [ ] Capture the page at desktop, tablet, 390px, 375px, and 320px using real browser scrolling so reveal sections are visible.

**Check:** Every relevant rule is accounted for and no proposed deletion removes information users need.

### Task 2: Replace long track cards with accessible flip cards

**Create:** TrackExampleCards.tsx or another small leaf component.

**Modify:** HomepageSections.tsx, site-content.ts, scoped homepage styles.

**Test:** e2e/homepage.spec.ts.

Front face: existing sprite, track title, short purpose, and labeled See examples action. Back face: same track title and up to three concise example types.

- [ ] Keep each card independent so multiple tracks can stay open for comparison.
- [ ] Use a persistent named control with aria-expanded and aria-controls.
- [ ] Support mouse, touch, Enter, and Space. Do not rely on hover or an unlabeled clickable article.
- [ ] Hide the inactive face from the accessibility tree and keyboard order; keep focus on the stable control.
- [ ] Under reduced motion, switch content without rotation. Do not clip the active face.
- [ ] Add a no-JavaScript details fallback.
- [ ] Test collapsed and open states, closing, multiple cards, keyboard operation, and accessibility-tree visibility.

**Check:** Four track identities remain immediately scannable and examples are available after an explicit action.

### Task 3: Turn Project Fit into paired examples

**Modify:** HomepageSections.tsx, site-content.ts, scoped homepage styles.

**Test:** e2e/homepage.spec.ts.

- [ ] Group examples under Usually not enough by itself and May fit when the technical work is original.
- [ ] Preserve all four current examples: copied tutorial site, basic AI chat screen, workflow command-line tool, and inference runtime.
- [ ] Keep each title and fit outcome visible; place its fuller reason behind Why this fit?
- [ ] Keep the note that product labels do not determine fit and examples do not guarantee approval.
- [ ] Preserve #project-fit and its links from the track cards.
- [ ] Keep comparison meaning clear without relying on color.

**Check:** All four examples keep their current judgments and are shorter on first scan; text is readable at 320px.

### Task 4: Draw one Progress & Prizes relationship flow

**Modify:** EquipmentSection.tsx, ProgressionSection.tsx if required, and scoped homepage styles.

**Test:** e2e/homepage.spec.ts.

Use an ordered flow:

    Related Track level → earned field discount → normal savings cap → one eligible Requisition raises that cap once

- [ ] Keep the five milestone rail as the only location listing when Requisitions are earned.
- [ ] Keep global Bolts, personal Track XP, and remaining Bolt cost labeled.
- [ ] Use an example without invented prices or percentages.
- [ ] Put secondary usage rules in a titled native disclosure or accessible accordion.
- [ ] Keep the planned prize categories and no-order status visible.

**Check:** A first-time visitor can explain what a Requisition changes without opening the detailed rules.

### Task 5: Draw the Custom Order eligibility and quote flow

**Modify:** EquipmentSection.tsx, scoped homepage styles, concise Custom Order FAQ copy.

**Test:** e2e/homepage.spec.ts.

Use a static ordered flow: Reviewed ship → relevant Track tier → request equipment → final Bolt quote → accept or decline.

- [ ] Do not show the numbered tier ladder on the public homepage; the relevant-track-tier gate and requests-not-open status are enough. The numeric tier policy remains in Plan 02.
- [ ] Say reviewed shipped work earns Track XP toward the related tier; tracked hours alone do not unlock a request.
- [ ] Say requests are not open and the builder needs enough Bolts to accept the final quote.
- [ ] Put fit, budget, country, availability, safe/legal delivery, shipping/tax, fulfillment, and quote-specific Requisition eligibility in one titled disclosure.
- [ ] Do not invent a fixed lifetime-hours minimum.

**Check:** The request path, final quote, closed state, and remaining gate are clear without a long paragraph.

### Task 6: Simplify the public Community Era overview

**Current owner-approved slice:** Remove named Era themes and detailed Era rules from the public homepage. Explain the shared-theme concept in one short sentence. The full Plan 11 and economy mechanics remain unchanged internally.

- [x] Remove the illustrative named Era sequence from the website.
- [x] Keep one visible planned-concept label and concise definition: approved projects help the community move a shared technical theme forward.
- [x] A short, static Approved projects → Shared progress → Next theme rail is optional if it improves the scan; it must not imply live progress or immediate advancement.
- [x] Remove objective examples, target/duration/reset detail, Season comparisons, and planned bonus copy from the public Era section.
- [x] Remove duplicate Era detail from the How it works note, Progression sentence, IRL concept, and FAQ; preserve unrelated text.
- [x] Keep #eras and the existing design tokens; add no assets, animation, or dependencies.

**Check:** A visitor understands the Era concept quickly. No specific Era theme, live value, timing mechanic, or bonus appears in the website.
### Task 7: Reduce FAQ duplication without hiding program facts

**Modify:** site-content.ts and anchor links where required.

**Test:** e2e/homepage.spec.ts.

- [ ] Keep the current questions for edge cases.
- [ ] Replace repeated long answers with one concise answer and a link to the main section.
- [ ] Do not leave essential eligibility, review, request-status, or reward conditions only inside a collapsed answer.
- [ ] Preserve every current anchor, navigation destination, RSVP, IRL concept, organizer section, and footer destination.
- [ ] Keep the page and answers useful without JavaScript.

**Check:** The scan is shorter, all approved details remain discoverable, and answers do not repeat full sections.

### Task 8: Review the full visual and interaction experience

- [ ] Capture full pages at 1280×800, 768×1024, 390×844, 375×812, and 320px after scrolling through the page; check 200% zoom.
- [ ] Inspect track front/back, multiple-open, focus/keyboard/touch, no-JavaScript, and reduced-motion behavior.
- [ ] Run lint, typecheck, unit tests, production build, and browser tests.
- [ ] Confirm the only HowItWorks copy change removes the duplicate Era note; preserve its other steps and flow styling.
- [ ] Check anchors, overflow, icon labels, and that Era/Custom Order content is not presented as live.
- [ ] Review desktop/mobile copy together and make one focused correction pass.

**Check:** The four tracks and current facts remain accessible; visible content is compact; interactions are usable without motion.

## Source-use decisions

| Source | Pattern | Disposition |
|---|---|---|
| Pixl apps/landing/app/_components/Flow.tsx | Connected steps and one meaningful fork | **ADAPT** the idea; keep LOADOUT wording and current How it works component unchanged. |
| YSWS Template frontend/src/routes/+page.svelte | Project gallery and broad groupings | **REFERENCE ONLY**; no source code, text, or media. |
| Stardance _project_thumbnails.html.erb and _gain_stardust.html.erb | Connect projects with later reviewed progress | **REFERENCE ONLY**; independently reimplement a useful connector, copy no code/assets. |
| React Flow / @xyflow/react | Draggable pan/zoom graph editor | **IGNORE** for static homepage diagrams. |
| Native details and WAI-ARIA disclosure pattern | Optional examples and edge rules | **ADAPT** where details are secondary; keep essential facts visible. |

Exact pins and licenses are in docs/source-audit/SOURCE_BASES.md. The Template and Stardance have no identified reuse license in this checkout; do not copy their code or media.

Guidance: GOV.UK Details recommends disclosures for information only some users need; W3C documents keyboard/expanded-state behavior for accordions; React Flow targets interactive graph editors beyond these static explanations.

## Open review decisions

This proposal awaits owner review of the card-turn behavior and the visible-versus-expandable content map. It recommends press-to-turn track cards, paired Project Fit examples, and static flows for pricing, Custom Orders, and Eras. If a flip is hard to use with keyboard or screen reader, use an expanding detail area within the same card.
