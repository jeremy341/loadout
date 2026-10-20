# Gear tabs: sources and open questions

Covers `shop`, `wishlist`, `orders`, `collectibles`, `referrals` and `ore-calculator`. Everything runs on sample data in this browser's localStorage (`gear.*` keys through `lib/preview-store.ts`), and Ore moves only through the shared append-only ledger (`lib/ore-ledger.ts`).

## Reference files read and adapted

Reuse is permitted by the owner (evidence pending, see `docs/source-audit/DECISIONS.md`). Pixl is MIT, Copyright (c) 2026 Pixl; the notice is kept in `docs/source-audit/ATTRIBUTION.md`. No Pixl source text, markup, CSS, copy or art was pasted. The behaviour below was read and rewritten from scratch in React and TypeScript against LOADOUT's own rules and tokens.

| Reference (read only) | What was taken | Licence |
|---|---|---|
| Pixl `apps/game/web/shop/index.html` | Behaviour only: search box, sort menu, "affordable now" and price filters, category chips, a saved/starred toggle on cards, locked-item display with the requirement shown, a price-with-discount display, and the "afford" indicator. Removed: Pixels, regions and region switch, trophies and XP unlocks, limited drops, Beacon locks, marquee, all art. | MIT, Pixl |
| Pixl `apps/game/web/collectibles/index.html` | Behaviour only: a grid of collectibles with a progress bar toward the unlock number and an owned state, earned items kept. Removed: upvote currency, store and purchase, all art. | MIT, Pixl |
| Pixl `apps/game/web/refers/index.html` | Behaviour only: a code card with copy buttons, referral stat tiles, and a "got a code" form. Removed: Pixel payout tiers, hour marks, milestone bonus, referral boost, application window, the link format. | MIT, Pixl |
| Pixl `apps/game/web/calc/index.html` | Behaviour only: an hours input beside a result card. Not used: the Pixels per hour formula, tiers, Restoration Energy. | MIT, Pixl |
| Stardance (signal thresholds, percentile approach) | Numbers and structure only, as already recorded in Plan 02 section 17 and Plan 22. No Stardance source or media. | Owner-stated permission |
| Stasis | Nothing used. | Owner-stated permission |
| `apps/landing/public/loadout/sprites/*.png` | LOADOUT's own 32 by 32 icons, copied to `apps/platform/public/loadout/sprites/` and shown pixelated with the design system's dark-mode hue rotation. | LOADOUT |

## Plans the rules come from

- `plans/02-economy-and-rewards.md`: sections 9 to 11 (multiplier and Ore formula), 16 (referrals), 17 and 18 (Signal), 19 (Usage Milestones), 20 (external contributor), 25 and 26 (shop, wishlist, track discount, Requisitions, 40% ceiling, one per order, 400 Ore minimum), 28 (Custom Orders), 66 and 67 (pricing and the eight working-example prices).
- `plans/22-peer-review-and-multipliers.md`: sections 1 to 3 (1 to 9 scores, 12 reviews, medians, mean, 1x to 20x, Great 30x, journal-age gate, flag window).
- `plans/proposals/economy-calibration.md` section 3.1: the discount curve (a candidate, see below).
- `plans/proposals/future-platform-ui.md`: no suggestions or voting, uniform Ore prices, Usage Milestones separate from Signal.

## Settled rules implemented exactly (`PLAN_RULES` in `data.ts`, tested)

Permanent discount reaches 20% at level 15 and uses the best related track, never a sum. Field Requisitions: five per track at levels 3, 6, 9, 12 and 15, 20% of the base price, base price at least 400 Ore, matching track, one per order, no expiry, combined reduction at most 40%, never bypasses a level requirement. Ore prices do not vary by region. Wishlist reserves nothing. Referral qualifies only after verification, tracked and journaled work and a first approved ship. Normal multiplier 1x to 20x; Great Signal lifts the hourly cap to 30x (never an extra 30x on top); Good Signal +50 Ore; total Signal bonus capped at 5,000 Ore per project including the Great uplift; Era bonus 10% of base Ore. The eight working-example prices in Plan 02 section 67 are used as written (ESP32 kit 50, soldering kit 60, Raspberry Pi 5 200, T7 SSD 160, domain 24, A1 Mini 500, enclosed printer 1,000, Framework 16 5,000).

## Draft preview rules (`DRAFT_RULES` and the sample data in `data.ts`)

These are working choices so the flows can run. The UI labels them "Draft preview rule" or "Sample item".

- The discount curve between level 1 and 15: `round(20% x ((level - 1) / 14) ^ 1.2)` from the calibration proposal. Plan 02 says the curve is open.
- General Requisition values (I, II, Master: 1,000 / 2,000 / 4,000 Ore minimum, 10% / 15% / 15%, 300 / 600 / 1,000 Ore largest saving). Plan 02 section 26.11 lists them as "working defaults".
- Cross-track buying: no markup. Plan 02 says a +10% surcharge is only a candidate, so an item outside your tracks simply has no discount.
- A Requisition applies to one unit when quantity is above 1 (the plan allows one per order but does not say how it meets a quantity).
- A cancelled order refunds its Ore and gives its Requisition back. Real buyer-cancellation terms are open (the plan restores a ticket only for program cancellation).
- The score-to-multiplier curve: `1 + (cap - 1) x place ^ (10/9)`, where a score's place between 1 and 9 stands in for its percentile. The plans do not publish the curve or the population. The four score sliders stand in for the four category medians.
- Maximum quantity per order (5), maximum hours field (10,000), note lengths, and the default sample levels (Tools 6, Hardware 3, Systems 1, Compute 1).
- Era bonus is computed on the standard-rate base Ore only, because stacking with Signal is open.
- The 16 catalog items, their categories, descriptions, access classes and the draft level requirements for the FPGA board (5) and GPU grant (9). The eight plan prices above are real working examples; the other eight prices are made up and marked "Sample price".
- The collectible catalog, rarities and unlock conditions; the "Claim (preview)" button for conditions the preview cannot check.
- Referral codes (`LO-` plus six characters from a hash of the handle), the invite nickname rules and the 50-invite limit.
- Custom Orders: request fields, the status flow (Requested, In review, Quote ready, Ordered, Declined, Withdrawn) and the hand-typed sample quote that stands in for the team's review.

## Unsettled by the plans (not invented; shown as open or "to be announced")

- Referral reward amounts and any milestone ladder. The page says "Reward set by the program" and grants nothing.
- Usage Milestone thresholds, rewards, repeat-use rules, evidence and what counts as an active user. Shown as "To be announced"; the user count is a self-entered note.
- General Requisition triggers and award values (Preview tools adds a sample one).
- Custom Order level tiers and limits, quote validity, the sourcing and landed-cost formula, tax and delivery treatment, and buyer refund terms. No level gate runs on Custom Orders.
- Intermediate discount curve, cross-track markup, rounding convention (nearest whole Ore is used), Era stacking with Signal, Era Points.
- Stock, delivery dates, shipping costs, regional availability and tax. None are shown as real; the copy says they are confirmed once ordering opens.
- Catalog contents and prices beyond the eight working examples, requisition eligibility per item, and which items are Specialist or Mastery.
- A collectible catalog (no plan defines one) and achievements. Achievements, including the external-contributor +50 Ore, belong to the Hub; nothing here grants Ore for them.
- Final Ore rounding and curve versioning for payouts.

## Tests

`bun test components/pages/gear` covers the pure logic (pricing and discounts, affordability, orders and the ledger hand-off, refund-once, overdraft refusal, status flow, wishlist, referral funnel and self-referral block, CSV escaping, multiplier and Signal tiers with the 30x cap and no stacking, scenario compare, catalog filtering, collectibles, Custom Orders), the store functions against the real shared ledger and notification inbox with an in-memory localStorage, and a server render of every page. Nothing was checked in a browser.
