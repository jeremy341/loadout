# Homepage mechanics clarity and LOADOUT IRL concept

**Status:** Approved for implementation by the user on 2026-10-06. The user explicitly selected a visible IRL future-concept section with no dates, venue promises, or registration.
**Design system:** Bespoke, bound to `DESIGN.md` and its existing grey grid paper, Jersey 10 display type, IBM Plex Mono body, graphite structure, muted Bolt Yellow, 1080px content width, and responsive spacing.
**Policy:** Plans 01/02/11 govern program, economy, and Eras. Plan 15 governs the event concept; Plan 16 governs this content refinement.

## Design read

An existing technical-program homepage for young builders, expressed as an industrial field manual with pixel utility. The refinement teaches practical choices through readable paragraphs, titled steps, and a single future-event plate. It keeps the current page identity and uses no new imagery, art, font, palette, or motion controller.

DFII: impact 4, fit 4, feasibility 4, performance 4, consistency risk 2 = 14. This is a planning rubric, not a measured product result. Taste dials: variance 4, motion 3 for this change, density 4. The existing hero, cloud motion, sprite family and process diagram are the signature, not additional decoration.

## Scope and page flow

Progress & Prizes retains its existing hierarchy. Community Eras follows it. Add the visible LOADOUT IRL concept immediately after Eras and before FAQ. Keep Who's Behind LOADOUT after FAQ and before the footer.

The HowItWorks source SHA256 is `8C19395FBBBD082A2DC37B1156009D64A0A50071ABD8686291E4F1D940A255F2`. Preserve that file and every existing `.process-*` / `.flow-*` style rule exactly. Keep the hero, navigation labels, RSVP, track cards, sprite art, clouds, and organizer content intact.

## Community Eras

Keep the existing section anchor, illustrative sequence, and optional objectives. Replace the broad intro with a short explanation that approved projects contribute shared Era Points. Distinguish them from personal Track XP and spendable Bolts in a compact labelled summary rather than another large section.

Use titled advancement steps within the existing rules area:

1. **Ship and contribute:** normal approved projects add to the community total; point weights/targets are not public live data.
2. **Reach the target:** an Era lasts at least 14 days and needs its shared target. Reaching the target early makes it ready, not an immediate transition.
3. **Advance at a weekly reset:** the first eligible check is the second reset after the Era begins. If the target is unmet, the Era continues until a later eligible reset. Personal XP, Bolts, and projects persist.

Explain optional objectives using the existing Measure / Control / Automate / Optimize examples. Normal eligible work can still be submitted without following them. Keep example Era names clearly illustrative.

Add one compact, opaque surface callout: **Planned Era build bonus**. Its text must state that a reviewer separately decides whether a project fits the active objectives; qualifying projects are planned to earn **+10% of approved base Bolts**, with **no extra Track XP**. This is explanatory copy, not a live award or a progress dashboard. Do not show points, thresholds, percentages of community completion, active Era badges, countdowns, dates, or fake readiness.

Use plain sentences. Prefer explaining what happens over slogans. Keep the main description under roughly 90 words; details belong in titled steps and the bonus note.

## Prize pricing and Field Requisitions

Correct price/access wording to distinguish most cross-track purchases from the small set of Mastery prizes that require relevant levels.

The Field Requisition explanation must make this chain obvious:

- Your relevant track level earns an ordinary discount.
- On expensive prizes, a cap limits how many Bolts that discount can save.
- A matching Field Requisition raises that cap on one eligible order, letting you apply more of the same earned discount.
- You still pay the remaining Bolt price. It neither adds Bolts nor creates a new discount rate.

Use a Compute/GPU example with words, not a made-up price or discount percentage. Say that the quote shows regular price, price with the Requisition, and extra savings before confirmation. Keep the existing two-column layout, milestone rail, and one-use / non-transferable / never-expiring / one-per-order / minimum-value / no-level-bypass rules. Refer back to the milestone rail rather than duplicating its level schedule. Do not call it a coupon code or display a redemption input.

## Custom Orders

Keep this within Progress & Prizes. Use the existing numbered three-step layout with short headings and clear supporting paragraphs:

1. **Ship and reach a track tier:** attributable tracked work, journals, evidence, a shipped project, and normal review lead to approved hours and reviewer-allocated XP. Enough relevant Track XP reaches the request tier; logging time alone does not unlock it.
2. **Request and get a quote:** identify technical equipment outside the catalog and why it helps. The team checks track/item fit, availability, budget, safety, country, shipping/tax, and fulfillment, then provides the final Bolt quote.
3. **Accept the approved quote:** have enough global Bolts, accept or decline, and optionally use one Requisition only when that final quote permits it. The Requisition cannot unlock eligibility.

Show the current planned tiers as one compact semantic definition list (not four new marketing cards): **Field LV.4, Power LV.8, Root LV.12, Bare Metal LV.15**. Label them **Planned request tiers** and note that requested items can carry further relevant-track requirements. Avoid presenting them as a launched ordering feature.

Keep a clear status line: **Planned feature. Custom Order requests are not open yet.** Do not invent a separate fixed hours threshold, request form, grant, fulfillment guarantee, or price. Explain how reviewed shipped hours feed XP instead. FAQ answers may give short reminders and should agree with the main explanation.

## LOADOUT IRL section

Create `IrlConceptSection.tsx`, anchor `#loadout-irl`, h2 ID `irl-title`, eyebrow **Future concept**, title **LOADOUT IRL // RUHR**, subline **Build the next Era.**

Use one framed, opaque field-manual plate with a wide story column and a narrower Friday/Saturday/Sunday itinerary. No nested card grid, fake venue photo, equipment giveaway, partner logo, countdown, registration button, or new asset is needed. Reuse the existing shared heading and Reveal wrapper. Existing icon glyphs may be reused decoratively only if they help reading; labels carry meaning.

Suggested factual copy:

> We're exploring a three-calendar-day build weekend in Germany's Ruhr region. Bring a technical idea, meet other builders, and spend the weekend building, documenting, and sharing your work.

> Projects would use the same four tracks and normal review as online LOADOUT. Approved event work would contribute to the same global Community Era. Attending would be optional; you can keep progressing online without coming to the weekend.

Itinerary: Friday **Start** (arrive, meet builders, choose a project and start); Saturday **Build** (main build time, mentors/workshops, proper rest); Sunday **Ship** (document, demonstrate, submit for normal review). These are proposed activities and must be labelled a proposed weekend format, not a confirmed schedule.

Status line: **Future concept. Dates, a venue, funding, and registration are not confirmed.** No specific proposed venue goes on this public block.

### Visibility contract

The owner approved showing the concept. Add optional boolean `showIrlConcept` to the current `PublicSiteInputs`; `createSiteConfig()` defaults it to `true`, preserves explicit `false`, and returns it. An unset `NEXT_PUBLIC_LOADOUT_IRL_CONCEPT` uses the approved default; when set, only the exact value `true` enables it. Compose the block only when `siteConfig.showIrlConcept` is true. Put a non-secret example flag in `apps/landing/.env.example` (locate the existing example, do not create a second root example). Keep the footer link conditional too if one is added. Do not introduce a live-event state or other optional event fields in this change.

## Responsive behavior, states, and accessibility

- Desktop: existing width; IRL story/itinerary roughly 1.4fr / 1fr with 32–40px separation. Custom Order list stays three titled columns; tier list is compact with four entries. Text measures stay comfortable.
- Tablet: stack IRL and the Custom Order steps below 900px; use two columns for the compact tier list below 700px. Requisition layout retains its existing stack.
- Narrow mobile at 390/320px: stack all long explanations and ordered steps, tiers two columns or one as needed; 16px essential body text; no truncation/overflow. Keep clear section and subsection headings.
- Static content, no network requests: no loading/error state is invented. Refresh/offline loaded-page/back behavior follows the current static page. When visibility is false, omit the IRL section and its anchor link completely.
- Semantics: one h2 per main section, h3 for groupings, h4 for step titles if needed; ol for sequences and dl for tier definitions. Decorative icons empty alt/aria-hidden. No live region or tab interaction needed.
- Reuse existing reveals with static reduced-motion and no-JavaScript fallback. Add no new animation loop, listener, dependency, or font.
- Contrast inherits the locked ratios: ink/canvas 13.45:1, muted/canvas 5.43:1, ink/yellow 8.39:1. Existing keyboard/focus styles apply to any normal anchors.

## Pre-flight and handoff

Spec gate: identity lock retained; no new off-system colors/fonts; page has existing distinct layout families; future section uses one framed plate; no new false data; no interactive ordering state; visibility true/false defined; requested seven UI skills consulted. Existing user-approved grid, centred hero, dark track plates, pixel glyphs, and semantic ordered steps are explicit exceptions to generic skill bans.

Self-critique: distinctiveness 3, hierarchy 3, consistency 4, accessibility 3, state coverage 3, copy 3, restraint 4, motion purpose 3 = 26/32. No axis is below 3. Improve the copy by replacing vague “enough real building” with the shipped/reviewed-work → XP → tier path and keeping every explanation directly tied to a user decision.

**Engineering target:** Next.js senior engineer, GPT-6 Luna at medium. Implement this spec using the existing locked components and tokens. Do not redesign unrelated sections.

**Owned files:** `ErasSection.tsx`, `EquipmentSection.tsx`, optional copy-only `ProgressionSection.tsx`, new `IrlConceptSection.tsx`, `HomepageSections.tsx` composition, `site-content.ts`, `site-config.ts`, the existing config test and landing env example, scoped `homepage-refinement.css`, and a conditional footer anchor if useful. Root agent owns `.ulpi/`, PLAN/docs status updates, integration, final review, commits, and publication decisions.

**Verification:** add one meaningful config test for default concept visibility and explicit false. Run lint/typecheck/config tests/build and existing browser checks once against final source; adjust an existing assertion only if changed legitimate copy/heading makes it stale. Verify rendered desktop/tablet/mobile, section order, planned labels, absence of live event claims/forms, reduced motion, and no-JavaScript content. Preserve the HowItWorks hash and all process/flow CSS.

## Implemented result

Implemented locally on 2026-10-06. The required concept-visibility test is added; five configuration tests and all 24 existing browser checks pass, as do lint, TypeScript, and the final production build. No existing browser assertions were changed. Live browser review covered 1440/768/390/320px; Custom Order steps were stacked at the tablet breakpoint to avoid narrow reading columns. The final browser suite/build were rerun after that refinement. HowItWorks and all 42 protected process/flow CSS rules match the baseline. See Plan 16's implementation record for scope and evidence. Publication is separate.
