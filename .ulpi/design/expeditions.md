# Expeditions, Events, Referrals and Orders (participant platform)

**Status:** Built on `feature/participant-platform-m1`, 6 Nov 2026. Fixture-driven and read-only; not reviewed by the owner yet. Plans 01, 02, 11 and 15 own the rules; this brief records the page decisions.

## Design direction

A field log: ruled sheets of rows, numbered checkpoints and hard-edged meters, in the platform's tokens (`--pf-*`, track colours from `data-track`). Lists are one bordered sheet divided by rules, never cards in cards. Stylesheet `app/_components/platform/expeditions.css`, prefix `ex-`. Nothing animates.

Every page carries one quiet line saying the content is proposed or sample (the shop's `pf-event-line`). Every action that would write data is a disabled button with a plain sentence. No page adds a server action, a Prisma model or storage.

## Expeditions (`/dashboard/expeditions`, `/dashboard/expeditions/[id]`)

- Source: Plan 11 "Missions" (guided missions with curated steps, prerequisites where useful, submissions and configured rewards; no map, NPCs, Restoration Energy or chance) and the Missions bullet in `plans/proposals/future-platform-ui.md`. Structure from Pixl's quest board, step and prerequisite ideas from Stardance's `Mission` (steps, prerequisites, difficulty, estimated time, submission guide).
- Board: filter chips for track and status (`?track=&status=`, plain links), a count, then missions in status groups. Group order is In progress, Available, Locked behind a prerequisite, Done (a builder wants their open work first); empty groups are left out. A row is the track tag, the name and one line, "3 of 5 steps" with a step meter, and the draft reward. A locked row names the expedition that opens it. The name is the only link and it covers the row.
- Status is derived, not stored: done when every step is done; locked while a prerequisite is unfinished (an unknown prerequisite id also locks); in progress once a step is done; else available. Progress is a small sample map (`SAMPLE_PROGRESS`).
- Page: header (status, name, one line, track, level, steps, suggested hours), then Steps (numbered checkpoints, next one flagged, none flagged while locked), and a side column with Prerequisites, Reward and Submission. Unknown id is a 404.
- Rewards: Ore figures are placeholders, since Plan 02 leaves mission values open (seasonal quests are a separate layer). Achievement names come from Plan 02 section 21. Every reward line is labelled "Draft reward" and the board notice says so. Era Objectives and seasonal quests are not shown here.
- Disabled: "Submit for review". Sentence: "Missions open with the Expeditions release. Nothing here is saved."

## Events (`/dashboard/community/events`)

Moved on 12 Nov 2026 from a top-bar tab to the seventh tab of the Community row (owner: the top bar stays at seven tabs). The page keeps its content; it now opens with the shared page head and the Community tab row.

- Source: Plan 15 and Plan 01. LOADOUT IRL // Düsseldorf is a concept. The page opens with "Nothing on this page is confirmed. There are no dates, no venue, no prices and no registration yet." and shows no date, venue name, price, count or capacity (the 60 to 100 planning range stays out, per Plan 11's "no sample event counts").
- Stated because the owner decided it: the working name and line, Friday to Sunday as a proposed shape (the three SHIFT names, no times, not a no-sleep marathon), the same four tracks, ordinary review, no event-only Ore, Track XP or level, no attendance needed to advance online. Düsseldorf is called the working city; Essen is not mentioned.
- "Still open" lists Dates, Venue, Funding, Travel support (not promised), Registration and Safeguarding and consent. Show and Tell is a second, unscheduled row (Plan 01 lists it as planned).
- Disabled: "RSVP". Sentence: "RSVPs are not open. Registration opens only once the dates, venue and funding are confirmed. Nothing here is saved."
- `events.test.ts` fails if a year, month, time, currency symbol or named venue enters the public strings.

## Referrals (`/dashboard/referrals`)

No top-bar tab since 12 Nov 2026. Reached by a plain link from the Settings page (a Referrals section) and from a Referrals box at the foot of the Community hub; the route is unchanged.

- Source: Plan 02 section 16. A referral counts real builders, not accounts. The page shows the five steps as a strip (Joins, Verifies, Tracks work, Journals, First approved ship) with the last one explained as the point where it counts. Reward amounts and the milestone ladder are open, so the page says "The reward for a qualifying referral has not been set." and states no figure.
- Invite link: a disabled field and a disabled "Copy link" button. Sentence: "Referral links open with the platform release."
- Referred builders: an empty state with no people. The table that will list them exists in the page and is driven by `REFERRED_BUILDERS` (empty), so real data needs no redesign.
- Helpers count only steps finished in order, so a ship without the work before it never qualifies.

## Orders (`/dashboard/orders`, `/dashboard/orders/[id]`)

- Pixl's dashboard has no builder orders page; designed from Plan 02 (personal wishlist that reserves no stock and locks no price; availability and delivery vary by region).
- Tabs Orders and Wishlist through `?tab=`, plain links (default is Orders; an unknown value shows Orders).
- Orders: three fixture rows with fictional numbers (LO-1042 delivered, LO-1057 shipped, LO-1063 packed) over real catalog ids. A row shows the first item's picture (`ShopPhoto`), the number, the items, a four-cell status meter with its word, and the Ore total. No dates, addresses or tracking numbers. Prices come from `priceFor` with `sampleApprovedHours()`, so they always match the shop. The order page has the Placed, Packed, Shipped, Delivered strip, a next-step sentence (no delivery time is promised) and an items table.
- Wishlist: five catalog ids (including the gated oscilloscope, which shows the shop's "Needs Hardware LV.8" note). Each row has the picture, kind, name, track tags, the price (struck-through base when discounted), the hours of work, and a Remove button.
- Disabled: "Add an item" and every "Remove" (its name carries the item). Sentence: "Ordering and wishlists open with the Shop release. Nothing here is saved." followed by "A wishlist does not reserve stock or lock a price."

## Accessibility and responsive

One visible h1 per page, with one lead sentence, from the shared `PageHead` (the same size and spacing on Expeditions, Orders, Referrals, Events, Settings and every Community page; the h1 is the shared `.pf-main h1`), headings in order, one tab stop per row, `aria-current` on active filters and tabs, step state spoken as well as drawn, disabled controls described by their sentence, targets 44 px for the main controls. Rows stack on phones and become aligned columns from 720 or 900 px.

## Not built

Submissions, progress writes, RSVP, invite links, referral rewards, real orders or a wishlist store, cancelling an order, Era Objectives, seasonal quests, Seasons, achievement shelves. Each needs data and an owner decision first.

## Formatting pass (12 Nov 2026)

- Orders tabs: the count sits in its own cell after a rule and a gap ("Orders | 3"), no longer touching the label.
- Page heads: Expeditions, Orders and Referrals gain the visible h1 and lead from `PageHead`. Shop, Explore, Projects and Overview keep their approved openings (the active top-bar tab names the page).
- Step flow (Referrals): rows no longer stretch, so the five labels line up on one baseline.
- Line tables (order items, referred builders): row headers use the same hairline as the cells and no rule under the last row; prices never wrap.
- Order rows on a phone: the status meter and total align with the text column, not under the thumbnail.
