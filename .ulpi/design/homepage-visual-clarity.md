# Homepage Visual Clarity and Progressive Detail

**Status:** Proposed design for review, 2026-10-06. No implementation is authorized by this plan request.
**Surface:** Public LOADOUT homepage, desktop, tablet, and mobile.
**Audience:** A first-time builder deciding whether LOADOUT fits their work and what happens after they ship.
**Visual authority:** DESIGN.md remains the source for palette, typography, layout tokens, and motion.

## Design read

LOADOUT already has a clear visual identity. Its reading density comes from explanatory paragraphs repeating a build story across About, Tracks, Project Fit, How it works, rewards, Eras, and the FAQ. Keep the details available while giving the page one clear story and concise visual steps.

**Direction:** The existing industrial field manual + pixel utility. Keep the graph-paper canvas, pixel icons, restrained yellow and graphite, and straight technical connectors. Do not add a new style, icon family, or UI library.

## Visitor outcome

On a quick scan, a visitor can explain:

1. LOADOUT is for technical projects across Tools, Systems, Compute, and Hardware.
2. Reviewers consider original technical work, evidence, and four quality dimensions.
3. Approved work can earn personal Track XP and global spendable Bolts.
4. Track XP and Bolts are separate and support different outcomes.
5. A Community Era is a shared technical theme that approved projects help move forward.

Detailed examples and mechanics remain available when requested. The visual pass reduces repeated explanation. Era timing, objectives, and bonuses remain in the internal policy plans rather than the public homepage.

## Homepage hierarchy

- Hero: value proposition and RSVP.
- How it works: one connected overview, from what LOADOUT is and selecting tracks through review outcomes and the next build.
- Progress & Prizes: lifetime milestones, discounts, Requisitions, the planned prize list, and Custom Orders.
- Community Eras: a brief definition of a planned shared technical theme; no theme list or detailed mechanics.
- LOADOUT IRL: compact weekend idea with future-concept status.
- FAQ, Who’s Behind LOADOUT, footer.

## Integrated How it works flow

Use one ordered, semantic flow:

    What is LOADOUT? → choose project and track(s) → build/document → ship → review → XP + Bolts → upgrade → build again

The opening definition is one sentence. Explain Digital Loadout as the accepted-work portfolio and Physical Loadout as equipment for future builds in short labels, not a separate explanatory block.

The project-choice stage branches to four compact track labels with an existing pixel icon and one short purpose. Keep Research Mode as an optional modifier, not a fifth track.

Keep a visible fit rule near project choice/review: product label alone does not determine fit; assess original technical work. Show two short contrasting examples and put the other approved examples and longer reasons in a native See more examples disclosure. Do not imply approval is guaranteed.

The review stage keeps the canonical dimensions by name: Originality, Technical Depth, Execution, Documentation. State that the quality assessment informs the Bolt multiplier without inventing a score or percentage. Reviewers assign Track XP according to the technical fields used. The outcomes then distinguish personal, non-spendable Track XP from global, spendable Bolts.

Accepted projects add to the Digital Loadout. Bolts and related field levels support prizes and the builder’s Physical Loadout. Link to detailed prize mechanics rather than repeating them here.

## Progress & Prizes

Compact Requisition path:

    related level → earned discount → normal savings cap → eligible matching Requisition raises cap once → remaining Bolt price

Keep the five level milestones once. A small disclosure carries one-use, non-transferable, non-expiring, one-per-order, minimum-value, and level-gate rules. The quote preview and Bolt balance remain understandable. No invented prices or percentages.

Compact Custom Order path:

    reviewed ship → relevant Track tier → request equipment → final Bolt quote → accept/decline

Keep the relevant-tier requirement, enough Bolts to accept, and the closed status visible. Omit the numbered tier ladder from the homepage. Tracked hours alone are not a separate gate; the tier values remain internal. Fit, budget, location, safety/legal delivery, availability, shipping/tax, fulfillment, and quote-specific Requisition rules can be disclosed as secondary review detail.

Keep the eight current planned prize categories as a static icon list or mosaic, with one planned/not-open status. Do not carousel category labels: there are no approved item listings, imagery, prices, or stock to browse.

## Community Eras

**Current first slice only:** Keep the homepage section brief. Label it as a planned community concept and define it in one sentence: approved projects help the community move a shared technical theme forward. Do not show the named Era sequence, objectives, target, minimum duration, reset behavior, Season comparison, or +10% bonus on the website. The complete rules remain in the canonical product plans.

A static Approved projects → Shared progress → Next theme rail may help if it reads as a concept rather than a live timeline. No counters, dates, schedules, or readiness indicators.
## LOADOUT IRL

A compact future-concept plate says an optional Ruhr build weekend would use the online tracks, review, and shared Era. A three-part Friday Start → Saturday Build → Sunday Ship line communicates its format. The dates/venue/funding/registration status stays visible. No event promise or RSVP is added.

## FAQ and progressive disclosure

Short FAQ answers point back to primary sections. Preserve unique facts: per-person team contributions, planned Hackatime/Lapse split, AI use, levels not multiplying Bolts, Requisition limits, closed Custom Orders, and RSVP not enrolling anyone. Essential facts remain visible or reachable with keyboard and no JavaScript.

## Responsive and accessibility behavior

- Use semantic ordered lists and groups; connectors and decorative sprites are aria-hidden.
- Preserve current anchors: about, tracks, research, project-fit, process, progression, field-pricing, requisitions, shop, custom-orders, eras, loadout-irl, faq, behind-loadout.
- Use the straight existing connector style. Flow columns stack in reading order when width or zoom requires it; no horizontal overflow.
- Native details/summary disclosures provide keyboard focus and expanded state. Do not hide the definition, track labels, fit rule, four score dimensions, XP/Bolt distinction, or planned/closed state.
- Honor existing 44px targets, 16px body text, reduced motion, scroll behavior, and Reveal fail-open handling.
- No-JavaScript fallback retains essential copy and reveals full disclosure content.

## Source use

- Pixl Flow.tsx and Story.tsx: ADAPT connected-step and purposeful-fork grammar only.
- Pixl Shop.tsx / Marquee.tsx: REFERENCE ONLY for future actual prize listings; current planned category list remains static.
- YSWS Template +page.svelte: REFERENCE ONLY for groupings and galleries; copy no text/code/media.
- Stardance _what_is_this.html.erb, _project_thumbnails.html.erb, _gain_stardust.html.erb: REFERENCE ONLY; independently draw generic project-to-review connections.
- React Flow / @xyflow/react: IGNORE; a static homepage needs no interactive graph editor.
- Native details controls: ADAPT for optional examples and policy edge rules.

Pins and rights are recorded in docs/source-audit/SOURCE_BASES.md. Pixl is MIT; the YSWS Template and Stardance have no identified reuse license here. Do not copy their assets, source, or product policies.

## Review criteria

- One integrated build story replaces repeated About/Tracks/Fit/process descriptions.
- Track names, fit rule, four dimensions, XP/Bolt distinction, and planned states are clear on a first scan.
- All approved examples and detailed rules remain accessible.
- Requisition, Custom Order, Era, and IRL diagrams do not imply live values or events.
- Section anchors, keyboard access, no-JavaScript behavior, responsive reflow, and reduced motion remain usable.