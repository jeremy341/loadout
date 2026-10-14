# Plan 19: Credibility, prizes, economy and cursor

**Status:** Approved direction, 2026-10-14. Nothing in this plan is built yet. Each workstream becomes its own pull request after the owner says go.
**Owner:** Plan 02 stays the single authority for the economy, Plan 06 for the homepage, Plans 11 and 15 for Eras and IRL. This plan sequences work across them and does not replace them.

## 1. Why

A reviewer looked at the site and said it is a nice idea and looks great, but "feels very vibed", "all of the content feels AI", and has too few actual details. Another contact declined to sponsor for now. The fix is not more design. It is concrete numbers and examples, a human voice, real prize photos, and answers to the questions a teenager asks before joining.

Compared with Pixl, Stardance and Stasis, LOADOUT explains its mechanism (Ore, Track XP, Requisitions, Eras) but never shows the arithmetic, has almost no numbers, and shows few people. Pixl and Stardance each give one exchange rate and one worked example. The site needs the same.

## 2. Decisions made so far

| Decision | Detail |
|---|---|
| Prizes stay a carousel | The belt from PR #86 stays: hover to pause, no pause button, still row with reduced motion. The earlier line "no automatic carousel" in the owner's draft is dropped. |
| Real prize photos from Pixl | The Pixl owner gave the LOADOUT owner full permission in Slack on 2026-10-14 and said everything in Pixl is under MIT. It is recorded in `ATTRIBUTION.md`; see section 9. |
| Label | The collection is labelled "Proposed prizes" once. It stays honest: none are orderable. |
| Cursor | Custom cursor, built from a pickaxe drawn in LOADOUT's own style, with the downloaded packs as references. Workstream A. |
| Economy | The assistant drafts proposals with worked examples for the owner to edit. Nothing is published as decided until the owner approves it. |
| Order | Friendlier writing, Build and ship guidance, then Eras and IRL, before the economy. |
| Left out | The owner's item 5 (one connected rewards example inside "How rewards work") is not part of this plan. |

## 3. Workstreams and order

| | Workstream | Depends on | Pull request |
|---|---|---|---|
| A | Custom cursor | Nothing | One PR |
| B | Prize carousel with real photos | Permission note (section 9), prize list | One PR |
| C | Friendlier writing: homepage and participant Docs | Voice reference, owner facts (section 8) | One PR for the homepage, one for Docs |
| D | Docs: Build and ship guidance | Nothing | One PR |
| E | Docs: Eras and IRL | Nothing | One PR |
| F | Economy proposals and Plan 02 | Owner decisions (section 7) | One PR for the proposal, one for each settled change |
| G | Consistency pass | A to F | One PR |

Order: **A and D first** (independent, visible), **C and E next**, **B when the prize list is approved**, **F as soon as the owner starts answering**, **G last**. Workstreams stay in separate PRs so each can be checked and shipped on its own through the lanes.

## 4. Workstream A: Custom cursor

**Design read.** A landing page for teenage builders in the locked industrial and signage language. The cursor should feel like a miner's tool and still read as a mouse pointer. The earlier approved direction stands: a pickaxe by default, the system hand on links and the system text cursor on text, and an optional miner's lamp near the faint depth numerals.

**Art.**
- Draw the main pointer in the project's two-colour 32x32 pixel style (dark and yellow, recoloured per theme like the existing sprites). The 404 page already has a pickaxe to use as a starting point.
- Hotspot at the pick's tip. Add a one-pixel outline so it stays visible on dark and light backgrounds.
- Kenney's pack ([`assets/inbox/cursors/`](../assets/inbox/cursors/README.md)) is the main reference: it is CC0 and includes tool, hand and busy shapes, drawn in white with a black outline, which maps straight onto the palette. Gabl's pack is the second reference. Megabyte's and KabGames' licences are only confirmed by their listings.
- Small states (hand, text, busy, not allowed): keep the system cursors for hand and text, and only draw a busy state if a loading state exists to need it.

**Build.**
- CSS `cursor: url(...) x y, auto` on the homepage, with the system cursor as the fallback, for fine pointers only (`@media (pointer: fine)`).
- Docs and the 404 keep their own look and the system cursor, unless the owner asks otherwise.
- No JavaScript for the pointer itself. The optional lamp is a separate decision: a soft light that follows the pointer needs a small client script, so it is only built if the owner wants it, at 6 to 8 percent strength, with no motion under reduced motion.

**Accessibility.** The cursor never replaces focus indicators, keeps a clear outline, and is not used to carry meaning. Touch devices and `pointer: coarse` keep the default.

**Records.** Add the chosen sources to `docs/source-audit/ATTRIBUTION.md` and `docs/design/asset-catalog.md`; move only approved files out of the inbox. Gabl asks that its art not be used to feed AI models. Looking at it for reference and recolouring it for a cursor is not that, and the condition is recorded so it is not forgotten.

**Acceptance.** The pickaxe shows over the homepage on a fine pointer in both themes, the system cursor shows on links, text fields and the docs, nothing changes on touch or with a missing image, an e2e test covers the CSS and the fallback, and the whole suite passes.

## 5. Workstream B: Prize carousel with real photos

- Replace the eight icon cards on the belt with product photos and short names, keeping LOADOUT's cards, colours, typography and borders.
- The carousel stays: the same belt, the same hover pause, the same reduced-motion row. On a phone it keeps working as a belt; the horizontal-scroll row is only the reduced-motion form.
- The list is chosen from items LOADOUT might really offer: technical equipment first (boards, tools, 3D printing, storage), not novelty items. The owner approves the list. Each card has a short name and one useful line. Prices are added only when the owner sets them (workstream F).
- Photos: copy from Pixl under the permission in section 9, resize and convert to WebP (about 600 px on the long side), serve from `apps/landing/public/loadout/prizes/`, give each a real `alt`, and record the source in `ATTRIBUTION.md`.
- Label the collection "Proposed prizes" once, and keep "None are available to order yet".

**Acceptance.** Every card has a photo, a name and alt text; the belt still loops without a jump; the photos total under 1.5 MB; Lighthouse and axe stay clean; and the e2e suite covers the new cards.

## 6. Workstreams C to E: Writing and Docs

### C. Friendlier writing

- Rewrite the homepage and the participant Docs (19 pages, about 5,300 words) with shorter sentences, concrete examples and a relaxed voice. The owner named Macondo as the voice reference; the assistant needs two or three sample paragraphs from it, or a link, before drafting.
- Mine language only occasionally. Explain every unfamiliar term in plain words once. Cut repeated explanations and keep the rules a visitor needs.
- A checklist of AI-sounding habits to remove: sentence pairs and triplets, "not X but Y" and long em-dash sentences, vague claims with no number, theme words used as filler, repeated "not confirmed yet" with nothing around it.
- Every "not decided yet" is paired with what is decided and when it will be known.
- Plan 06 is updated first for any homepage wording change, then the page.

### D. Build and ship guidance (`content/docs/shipping.md`)

Add: separate software and hardware checklists; a sample submission outline; an annotated example (a sensor board with firmware); what to include (source and design files, parts list, demonstrations, tests); a sample journal entry; attribution and AI disclosure; and a short note on what reviewers look at. The example is labelled as a sample, not as an approved project. The detail stays in the Docs.

### E. Eras and IRL

- Eras: keep the compact homepage explanation. In the Docs, explain qualification, the designed +10% Ore build bonus, how the community advances, and how it differs from lifetime XP, following Plan 11.
- IRL: explain the planned three-day hackathon in Germany's Ruhr area (Friday to Sunday, Plan 15) and how it connects to online LOADOUT. One short note holds what is still pending: venue, dates, funding and registration.

## 7. Workstream F: Economy

Plan 02 is the single authority (1,697 lines, with older proposals mixed in). The first step is a short reconciliation: list every rule in Plan 02 that conflicts with the agreed values below, and mark each as agreed, proposed or open.

**Agreed:**
- Relevant track progress gives a permanent discount that reaches 20% at level 15.
- Five identical Field Requisitions per track, at levels 3, 6, 9, 12 and 15. Each gives an extra 20% of the item's base Ore price, stacks with the permanent discount, one per order, one use, no expiry, not transferable, track must match, level requirements still apply, restored if the program cancels. The I, II and Master names are removed.
- Example, where caps allow: 1,000 Ore, minus 20% permanent, minus 20% Requisition, is 600 Ore.

**The assistant drafts proposals, with worked examples, for the owner to edit:**

| Topic | What the proposal covers |
|---|---|
| Discount curve | Exact discount at each of the 15 levels, expensive-item savings limits, multi-track items, cross-track pricing |
| Shared Requisition cap | One maximum extra saving in Ore, chosen against the sample catalog |
| XP and levels | Effort to reach early, middle and mastery levels; XP per project; all 15 cumulative thresholds; quality's effect; multi-track split without duplicates; Research Mode bonus; persistence |
| Ore payouts | Approved-work calculation; the four review dimensions and the quality multiplier; typical payouts; rounding, revisions and partial approvals; Era bonus and stacking; which extra bonuses belong in the first program |
| Custom Orders | Tier path (Field 4, Power 8, Root 12, Bare Metal 15); request limits, tracks, item rules, quote calculation, discount and Requisition use, cancellation and refunds |
| Sample catalog | Starter, middle and major prizes with sourcing and delivery estimates; hours of effort per tier; prices by level with and without a Requisition; worst-case fulfilment cost; balance across tracks |

**Method.** A spreadsheet-style table in the proposal, every number traceable to an input. A proposal is marked **Proposed** until the owner approves it, then moves into Plan 02 as **Agreed**. The homepage and Docs publish only agreed numbers. The shared exchange rate (Ore per approved hour) is the first number to settle, because prices and examples depend on it.

## 8. What the owner needs to provide

These come from the earlier audit of the site. The assistant will not invent them.

1. Who the program is for: age range, location, skill level.
2. One real example project from start to payout, with hours and Ore.
3. The Ore per approved hour, and any starting numbers.
4. Five to ten real prizes, even if prices are rough.
5. Dates, or an honest "decided / not decided" list.
6. Two or three sentences about who made LOADOUT and why, in the owner's words, and a photo if the owner is comfortable.
7. A voice reference for "like Macondo".
8. The Pixl owner's name and the Slack message link, to complete the permission record (section 9).

## 9. Records and licensing

- **Pixl photos.** The Pixl owner gave permission in Slack on 2026-10-14 and said everything is under MIT. `docs/source-audit/ATTRIBUTION.md` records it. The LOADOUT owner adds the Pixl owner's name and the message link there. Every photo that is added is listed in the same file with its Pixl path, and Pixl's MIT notice stays in `LICENSE`.
- **Cursor packs.** Recorded in [`assets/inbox/cursors/README.md`](../assets/inbox/cursors/README.md). Kenney and Gabl have licence files; Megabyte and KabGames are confirmed only by their listings.
- **Stardance, Stasis, ysws-template.** Still reference only; no text, code or images are copied from them.

## 10. Not in this plan

- The connected rewards example inside "How rewards work" (owner's item 5).
- Any price, stock, brand or delivery promise before the owner approves it.
- Claims about sponsors, partners or Hack Club acceptance that are not confirmed.
- Changes to the lanes, the design system or the 404 page.

## 11. Risks

- **Numbers drive everything.** Writing, prizes and the Docs all improve most when the exchange rate and a few real prices exist. Without them the site stays thin, so the owner's answers in section 8 are the critical path.
- **Voice drift.** A softer voice must not lose the rules. Each rewritten page is checked against Plans 01 and 02 so no rule is created or changed by wording alone.
- **Photo weight.** Real photos can slow the page; the size budget and lazy loading in workstream B keep the belt light.
- **Public repository.** Anything committed is public. Unverified assets stay in the inbox until their licence is confirmed.
