# Reviewer site: Content pages (Shop, Ideas, Show & Tell, Events, Community goals, Referrals, Expeditions, Forms)

**Status:** round 4, 7 Nov 2026. Level with Pixl's internal dashboard of 5 Nov 2026. Read only, sample data; the builder-side fixtures are imported, not copied.

## Parity table

| Pixl page | Action |
| --- | --- |
| `shop`: add item, bulk CSV, personal items, per-item toggle, delete, edit, stock, region tabs, trophies | match for add, bulk CSV (disabled), Hide or Show and Delete on each row, edit form on the item page, stock note ("Not tracked yet"). Personal items become Custom Order items (none exist). Regions, regional price audit, trophies, Trial gating: drop (prices are the same everywhere; no trophies) |
| `shop-detail` (regional pricing) | drop |
| `ideas`: search by title, live or removed, remove with reason, restore | match |
| `show-n-tell`: rounds (create, open, close), add a project by search or by name, entries with votes, remove | match, without votes (the plans do not say builders vote) |
| `events`: start form, type, window, live or upcoming or ended or stopped, stop, delete | match; no event has a date, venue or price, so the window says "No dates set". Bounty, mystery merchant and review blitz types: drop |
| `community-goals` (vault levels) | match: level, title, hours, blurb, rewards, position, show or hide, close, delete. Chapter bonus for top contributors: drop |
| `referrals`: stats, top referrers, all referrals | match; nobody has joined by a link, so tables are empty. Pixel payouts: drop |
| `sidequests` (Trials and NPCs) | adapt as Expeditions: add form, row actions. NPCs tab: drop |
| `forms`: settings editor per form, new form, submissions (kept, pending, accepted, rejected) | match for the three forms the plans name; every submission group is empty |
| `news` | Pixl removed its news page on 12 Oct and no plan needs a staff news page: deleted |
| `story`, `pixels` | drop (game, economy) |

## Disabled and why
"Opens with the review service. Nothing here is saved." in the page lock note or the block.

## Left out
Shop regions, trophies, vault chapter bonuses, NPCs, votes, bounties, news.
