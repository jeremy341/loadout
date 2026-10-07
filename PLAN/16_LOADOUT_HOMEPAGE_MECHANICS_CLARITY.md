# LOADOUT Homepage Mechanics Clarity — Eras, Requisitions, and Custom Orders

**Status:** Implemented locally on `feature/homepage-mechanics-clarity`, 2026-10-06, after the user authorized the homepage scope and selected a visible, clearly labelled IRL future concept with no dates, venue promises, or registration. Event operations and economy/backend implementation remain separate scopes.

**Owner:** Plan 06 owns the public homepage. Plan 14 owns the current Progress & Prizes section hierarchy. Plan 01 owns product meaning, Plan 02 owns economy/eligibility rules, and Plan 11 owns Community Era mechanics. Those policy plans govern if sample copy here disagrees.

## 1. Goal and boundaries

Help a new visitor answer three practical questions without reading internal policy documents:

1. What is a Community Era, and how does it advance?
2. What does a Field Requisition actually do, and when can it be used?
3. What must a builder do before requesting a Custom Order, and what happens after the request?

Keep the explanation direct and compact. The page should teach the decision path, not reproduce the complete economy specification. Do not alter the four tracks, four quality dimensions, reward math, Era rules, Requisition rules, or Custom Order policy. Do not make up a separate hours threshold, progress counter, price, stock, fulfillment promise, or live request path.

The current architecture remains Hero → About → Tracks & Project Fit → unchanged How it works → **Progress & Prizes** → **Community Eras** → FAQ → Who's Behind LOADOUT → footer. Keep Eras separate from personal levels and prizes. The optional future IRL section is described in Plan 15 and §5 below; it appears only after an event is approved for public description.

## 2. Community Eras: what to explain

Explain three different records in plain language:

- **Track XP and levels:** personal, lifetime progress in Tools, Systems, Compute, or Hardware.
- **Bolts:** one global spendable reward balance.
- **Era Points:** a separate, non-spendable contribution to the community's shared technical Era.

Visitors should learn that approved projects contribute to the shared Era. Era Objectives are optional technical themes across the four tracks; they are not a fifth track, a project-fit gate, or a requirement for a normal eligible project.

State the transition rule without making an Era sound like a timer or game season: it lasts at least 14 days; the shared contribution target must also be reached; a ready Era advances only at the next eligible weekly reset. Track XP, Bolts, and project history do not reset when the community Era changes.

The planned Era-build bonus is a separate decision from personal progression: a reviewer must separately mark a project eligible; the approved design is +10% of that project's approved base Bolt award and **no Track XP bonus**. Until the feature is configured and live, label the number as a planned rule or omit it from public-facing copy. Do not describe every project as qualifying.

Suggested homepage-length copy (subject to final product truth and public-launch approval):

> **Build the next Era together.** Approved projects move LOADOUT's shared technical Era forward. Era Points are community progress—not Bolts or personal Track XP. Each Era lasts at least two weeks and changes only at an eligible weekly reset after its target is reached. Optional Era objectives can guide a build, but they do not replace the four tracks or determine whether ordinary work fits LOADOUT.

If a compact bonus note is useful, keep it separate and label it planned:

> A project may also qualify for the planned Era build bonus after a separate review: +10% of its approved base Bolt award, with no extra Track XP.

Do not show mock Era names, point totals, target values, percentages, countdowns, dates, or “ADVANCEMENT READY” as live state. Illustrative data in Plans 11, 12, or 15 is not production configuration.

## 3. Field Requisitions: clarify the “coupon” confusion

Keep the canonical name **Field Requisition**. Do not rename it a coupon, promo code, Bolt grant, or free prize. Make the relationship to ordinary pricing explicit before describing the Requisition:

1. A builder's relevant track level can earn a normal track discount on eligible prizes.
2. On some higher-priced prizes, the amount of normal discount that can be applied is capped.
3. A Field Requisition is a scarce, one-use item that can let the builder realize more of the track discount already earned on one eligible order.

It does not create an arbitrary sale or a second currency balance. Its actual benefit is calculated from the final eligible order and is limited by the Requisition's approved allowance and the earned discount. A preview should show the normal price, price with the Requisition, and additional saving before the user confirms consumption.

Keep the short explanation focused on the visitor-relevant rules:

- earned from the track milestones already shown in the progression rail;
- tied to its field, one use, non-transferable, and never expires;
- at most one Requisition per order and only above the configured minimum item value;
- cannot bypass a Mastery or Custom Order level requirement;
- consumed only after the existing confirmation/reservation flow succeeds.

Show the milestone schedule once in the progression rail, not again in the Requisition subsection. Use an example without invented prices: “The normal discount on this eligible prize reaches its cap. Your matching Requisition lets you use more of the discount you earned. The preview shows the extra saving before you confirm.”

## 4. Custom Orders: make qualification and steps clear

Describe Custom Orders as a **request for technical equipment outside the planned regular prize catalog**, followed by a program review and a quoted Bolt cost. They are not open-ended requests, a guaranteed grant, an order form that auto-approves, or another name for Requisitions.

### Builder's path

```text
Build and document technical work
        ↓
Ship it for normal LOADOUT review
        ↓
Receive approved hours and reviewer-allocated Track XP
        ↓
Reach the relevant planned Custom Order level/tier
        ↓
Request a suitable item outside the regular shop
        ↓
Organizers check fit, eligibility, budget, region, and fulfillment
        ↓
Receive the final Bolt quote and accept or decline it
```

Explain the gates in this order:

1. **Reviewed shipped work:** logging time alone is not enough. Work must be attributable to an eligible shipped project with journals/evidence, and the normal review must approve the relevant time/work.
2. **Relevant track progress:** approved work earns Track XP under the normal formula and reviewer allocation. The builder must reach the planned tier in a track that fits the requested equipment. The current Plan 02 tier ladder is Field LV.4, Power LV.8, Root LV.12, and Bare Metal LV.15; treat the table as planned policy and do not present an unconfirmed shop/request feature as live.
3. **Enough Bolts:** a request is not approved by a large time total. After checking the item and fulfillment, the program provides a final Bolt quote; the builder needs enough global Bolts to accept/purchase that quote.
4. **Program and fulfillment fit:** the request must be technical, safe/legal, regionally fulfillable, and within the available program/sponsor budget. Inventory, shipping, tax, and availability can affect the final decision and quote.
5. **Quote and confirmation:** organizers review first. The builder can accept or decline the quote. A Requisition may apply only if that final approved quote is marked eligible and the builder already meets all normal gates.

**Hours rule:** LOADOUT awards XP from reviewed, approved work under Plan 02; a track tier therefore requires enough accepted work to earn the required XP. The current canonical plans do **not** define an additional fixed lifetime-hours minimum for Custom Orders. Keep that as an owner decision before launch; do not invent a number or imply that raw tracker hours automatically unlock a request.

Suggested concise homepage copy:

> **Need a technical item that is not in the planned prize catalog?** After reviewed ships build your relevant track to an eligible level, you can request a Custom Order. Organizers check the project fit, final Bolt quote, budget, region, and whether the item can be fulfilled. A request is not approved until that review is complete.

The separate Field Requisition explanation should say that it may reduce an eligible final quote, not open or qualify the Custom Order itself.

## 5. Future LOADOUT IRL homepage section

Add **LOADOUT IRL // RUHR — Build the next Era** after Community Eras and before the FAQ as a clearly labelled future concept. The user approved that concept wording on 2026-10-06. Visibility is configurable; the approved concept is visible by default and an explicit false setting omits the section. This approval is limited to describing the idea and does not confirm that an event will run.

Before a public event is approved, do not display a date, venue, capacity, ticket/registration, price, sponsor, partner, or claim that the event is confirmed. Once organizers authorize an announcement, show only verified fields and accurately label the state (concept, planned, or open registration). Do not imply an event-specific progression system or that attendance is required to participate online.

## 6. Information architecture and copy safeguards

- Keep the progression/discount/prize/Field Requisition/Custom Order explanations grouped beneath Plan 14's single **Progress & Prizes** parent section.
- Keep Community Eras as the next distinct section. An eventual IRL block is adjacent to the Era section but remains its own optional section.
- Preserve the How it works diagram exactly as it is; do not use this copy pass to alter its content or presentation.
- Explain each mechanic once in the main page; use FAQ links for edge cases instead of duplicating the full answer.
- Use “prizes” for the planned Bolt catalog and “equipment” for what a builder uses or requests.
- Do not call Field Requisitions “coupon requisitions” in navigation or headings. If a visitor compares them to a coupon, explain the difference in the body copy.
- Do not describe planned mechanics as live, a request as a guarantee, or an example as an actual participant project.

## 7. Implementation review criteria

For the authorized homepage implementation, confirm:

- the Era section distinguishes personal XP, spendable Bolts, and shared Era Points and states the minimum-duration/weekly-reset rule correctly;
- any +10% note is labeled planned until configured/live and explicitly says no Track XP bonus;
- a first-time visitor can explain what a Field Requisition unlocks and how it differs from Bolts, a coupon code, and a Custom Order;
- Custom Order eligibility is explained through shipped/reviewed work, relevant Track XP/level, enough Bolts for the final quote, and fit/fulfillment review;
- any separate fixed approved-hours gate has an explicit owner decision before it is shown;
- milestone levels appear once, no example economics are shown as live, and no request/RSVP path implies registration is open;
- the How it works section remains untouched;
- LOADOUT IRL is labelled a future concept, contains only approved concept facts, and is completely omitted when its visibility setting is false.

The later user instruction authorizes this homepage content and concept section. Plans 02, 11, and 15 remain the policy/operations owners; the UI must not implement their live mechanics or organize an event.

## 8. Local implementation and verification — 2026-10-06

The homepage now explains the ordinary discount cap before Field Requisition use, gives a word-only eligible GPU example, and describes the quote preview. Custom Orders show the reviewed-work → Track XP → relevant tier → request → final quote path, with the planned LV.4/8/12/15 tiers and a clear requests-not-open status. There is no invented fixed approved-hours gate. Eras distinguish shared Era Points from personal XP and Bolts, show titled advancement steps, and label the separate +10% base-Bolt/no-XP bonus as planned.

The new `IrlConceptSection` appears after Eras and before FAQ. It is explicitly a future concept with a proposed Friday-to-Sunday format and no venue, date, funding, registration, or prize promise. `showIrlConcept` defaults to visible per the user's answer; explicit false omits it. An unset environment value uses the approved default, while a defined value enables it only when it is exactly `true`.

The existing organizer feature was preserved through a local merge into the temporary branch. HowItWorks retains SHA256 `8C19395FBBBD082A2DC37B1156009D64A0A50071ABD8686291E4F1D940A255F2`; all 42 protected process/flow rules in `homepage-refinement.css` match the pre-refinement baseline. Hero, sprites, tracks, scenery, and motion controllers were preserved.

Verification: root lint, explicit TypeScript check, all five configuration tests, production build, and all 24 existing browser checks pass. No existing browser assertions were changed. The browser checks cover keyboard navigation, reduced motion, native touch scroll, no-JavaScript content, responsive overflow, and serious/critical automated accessibility findings. A tablet visual review prompted a scoped change to stack Custom Order steps below 900px; the final build and browser suite were rerun after it. The sandbox-only Bun EPERM did not recur in host-backed checks.

The changed surfaces were inspected through the local browser at 1440px, 768px, 390px, and 320px. No overflowing text was observed in the changed headings, steps, tier list, or IRL panel; the viewport override was reset afterward. A review screenshot is saved outside Git in the workspace's temporary capture folder. `git diff --check` passes.

The requested project-frontend/project-code-quality skills and all seven repository UI skills were consulted. The spec is `.ulpi/design/homepage-mechanics-clarity.md`; a GPT-6 Luna medium engineer implemented its bounded app scope. No asset creation or sprite animation was needed. Changes are local; promotion and Vercel publication follow the staged lane workflow separately.

## Next proposed pass: whole-page visual clarity

The owner later asked for a full homepage plan that lowers visible copy through diagrams and interactive cards while keeping information available. [Plan 17](17_LOADOUT_HOMEPAGE_VISUAL_CLARITY_AND_DISCLOSURE.md) is that planning proposal. It does not authorize replacing this implemented content or changing its underlying product rules.

## Era homepage overview follow-up — 2026-10-06

The owner approved a focused copy reduction: the website should explain only that a Community Era is a shared technical theme advanced by approved projects. Do not list illustrative Era names or publish detailed timing, objectives, Season comparisons, or bonus mechanics on the homepage. Full product rules remain here and in Plan 11; see .ulpi/design/community-era-overview.md for the visual specification.

### Era overview implementation update — 2026-10-06

The public Era section now contains one short planned-concept definition and a generic three-part overview. Named Era examples, detailed timing/target/reset rules, objectives, Season comparisons, and the bonus were removed from the website. Repeated Era explanations were removed from How it works, Progression, and the IRL copy; the FAQ gives only the short definition. The policy remains in Plan 11 and Plan 02.

Verification: lint, typecheck, five unit tests, all 25 landing browser tests, and the production build pass. Desktop and mobile previews were visually checked. This change is local only.

### Compact Era facts follow-up — 2026-10-06

The owner added a compact fact strip to the homepage: shared Era Points, a planned +10% base-Bolt award, and zero Track XP from that bonus. Keep the bonus explicitly planned and state that final launch configuration is still being finalized. Named Era themes and timing/reset rules remain off the homepage.

## Custom Order tier display follow-up — 2026-10-06

The owner requested removal of the public Planned request tiers panel. Keep only a generic relevant-tier requirement on the homepage; the Field/Power/Root/Bare Metal numeric ladder remains in Plan 02 and is not deleted from policy.

Custom Order display follow-up — 2026-10-06: the public homepage no longer shows the numeric planned-tier ladder. Keep the generic related-tier requirement and not-open status; the numeric policy remains in Plan 02.

The hero's “Continue scrolling” cue remains visible and animated but is a static, non-interactive hint. Visitors use navigation links or normal page scrolling to move through the homepage.
