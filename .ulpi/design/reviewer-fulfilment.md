# Reviewer site: Fulfilment group (staff only, sample data)

**Status:** rebuilt on `feature/participant-platform-m1`, 7 Nov 2026 (round 4), against Pixl's internal dashboard at commit 330ac8a2 (`apps/internal-dashboard/app/{fulfillment,fulfillers,tickets}`, `lib/fulfillment*.ts`, `lib/tickets.ts`, `docs/fulfillment-eligibility.md`). Round 3 was built against the older `apps/dashboard`. Read only, not reviewed by the owner yet. Pixl's look is not used.

## Parity table (Pixl feature, ours before, action)

| Pixl | Ours before | Action |
|---|---|---|
| Fulfillment pipeline: counts per stage (New, Ordered, Credited, Shipped, Done, Cancelled), spread bar, Over budget link | Status filter chips with counts | **Match, adapt stages**: New, Claimed, Packed, Shipped, Delivered, Cancelled; Over budget is a flag, not a stage. Segments differ by fill and pattern, not only colour |
| Request list with toolbar: search, Filters (funding, Ships verification, sort), My queue, paging | Flat list, status chips only | **Match**: search (`?q=`), Filters disclosure with claim state (any, unclaimed, mine, others), funding, sort; My queue; pager. Ships verification filter dropped (no Ships/Airtable) |
| Request rows: thumbnail, item, buyer and age, USD budget and px, stage, funding verdict, Over budget flag, selected state | Order number, items, country, Ore, age, fulfiller, status | **Match**: whole row is a link, `aria-current` plus a left bar when selected; USD budget and Ore |
| Selected-request pane beside the list, shipping first; narrow screens show the selected order first | Order opened a separate label page | **Match**: `/fulfilment?order=` pane (two columns from 1180 px, sticky), shipping info, items, actions, who has it, funding |
| Stepper, over-budget callout, funding-needs-attention callout, buyer note, previous source | none | **Match**: five-step strip, callouts, buyer note, last supplier from an earlier order |
| Buyer details only for the claiming fulfiller or an owner, country otherwise (`canSeeBuyerDetails`, `isOwnOrder`) | Country only everywhere | **Match**: `lib/reviewer/access.ts` rule with the viewer's person id from `requireAccess`; label page 404s for anyone else |
| Action bar: claim and place order, mark credited (HCB link, cost, source), mark shipped (tracking), flag over budget with a note, clear flag (owner), reassign (owner), cancel and refund (owner), mark done (owner), edit info (owner), contact buyer on Slack | Buy label, assign | **Adapt**: Claim order, Mark packed (actual cost, bought from), Mark shipped (carrier, tracking), Flag over budget with a reason, Clear flag, Reassign to me, Cancel and refund, Mark delivered, Edit record. Same visibility rules as `visibleOrderActions`. HCB link and Slack contact dropped. All disabled |
| Funding disclosure, collapsed by default (verdict, balance, order, after, meter, evidence of projects, Ships, Airtable, reviewer payouts) | none | **Adapt**: LOADOUT Ore. Earned = approved hours x 10, minus Ore already spent; hours in review never count. Verdicts Covered, Short, Unverified, Review required. Evidence: hours by track, earlier orders. No Ships, Airtable, payout ledger, pixels |
| Budget rules popover ($ per pixel), Shop economy popover (owner) | none | **Adapt**: $4.25 per 10 Ore, redeemed Ore and value against spent, net (owner only) |
| Printable label, A6, only for the claiming fulfiller or an owner | Label with order rail and disabled Buy label and Assign | **Match**: print button, the label, contents. Rail controls removed (not in Pixl). Cancelled orders have no label |
| Fulfillers panel (owner): add by Slack id, remove; leaderboard by pixels | Roster and disabled assign | **Adapt**: roster with in queue, shipped and last active, disabled add. Leaderboard **dropped** (ranked by pixel payouts) |
| Fulfiller page: stats (claimed, shipped, closed, in queue, average claim to ship, pixels), order history, remove | Facts, open and shipped lists, assign form | **Match**: five stats (no pixels), history table, disabled remove. The assign form is **dropped** (Pixl reassigns from the order) |
| Tickets: totals, 30-day created vs resolved chart, Open/All/Resolved with search, expandable thread, Resolve from here, reply, top resolvers, helper manager (owner), Pixo banner | Status and category chips, thread page | **Match**: totals, chart (server SVG), tabs with counts, search, list, thread page, disabled reply and resolve, top resolvers, helpers (owner). "Waiting" status and categories removed (not in Pixl). Open in Slack and Pixo banner dropped |
| Airbridge preview page, Ships sync menu and refresh, Beacon badge, Robux link | none | **Dropped** (Airtable/Airbridge, Beacon, game) |

## Pages (as seen on the review host, group `(fulfilment)`, tabs Orders, Fulfillers, Tickets)

- **`/fulfilment`**: h1 Fulfilment (My queue when `?status=active&claim=mine`). Tools row (My queue, Budget rules, Shop economy for owners), the overview, then Orders (list with toolbar) beside the selected order. State is in the address: `status` (new default, claimed, packed, shipped, delivered, cancelled, flagged, active, all), `claim`, `q`, `funding`, `sort`, `order`, `page`. Ten per page, newest first.
- **`/fulfilment/label/[id]`**: claiming fulfiller or owner only (404 otherwise, and for cancelled orders). Placeholder label with the real country, marked Sample label and Not valid for postage; Print label works.
- **`/fulfillers`**, **`/fulfillers/[id]`**: owner only.
- **`/tickets`**, **`/tickets/[id]`**: helper (owners pass).

`requireAccess` equals Pixl's `requirePage`: fulfiller for orders and label, owner for fulfillers, helper for tickets.

## Privacy and the sample fulfiller

Fixture orders carry a fixture fulfiller id, not a person id (person ids are generated per database). `fixturePersonFor(email)` maps the seeded local test fulfiller (`fulfiller@loadout.test`) onto the fixture fulfiller `examplepack`; `ownershipFor` swaps the viewer's real person id in for that fixture person, and the shared `canSeeBuyerDetails` and `isOwnOrder` in `access.ts` decide. Result: the test fulfiller holds one open order (LO-1062, packed) and sees its details; every other order shows the country. LO-1073 is their own order, so the claim button is replaced by the own-order sentence. Owners see everything. A unit test checks the email against `local-accounts.ts`.

## Disabled, and the sentence

Every control above is laid out in a disabled fieldset, with "Opens with the review service. Nothing here is saved." once per actions block, add and remove form, and reply box. Searching, filtering, choosing a row and printing work because they save nothing. One quiet sample line per page.

## Not shown, on purpose

Real names, street addresses, emails, Slack ids, real carrier tracking, HCB links. Pixl's pixel payouts, leaderboard, Ships verification, Airtable and Airbridge, Beacon, Robux link and Pixo are not ported.

## Checks

Unit tests in `lib/reviewer/fulfilment.test.ts` (60 tests). E2E in `e2e/reviewer-fulfilment.spec.ts`: axe at 375 and 1440 px in both themes on 15 addresses, no sideways scroll, owner and test-fulfiller behaviour. Not run by the author.
