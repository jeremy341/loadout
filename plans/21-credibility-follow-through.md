# Plan 21: Credibility follow-through

**Status:** Public details and voice changes implemented locally on `feature/real-details`; rule reconciliation updated through 2026-10-18. The participant platform is not built. Further decoration changes and personal organizer copy are not authorized by this record. It follows [Plan 19](19-credibility-prizes-economy-cursor.md). Commit, promotion and deployment remain separate actions.

**Policy supersession (2026-10-19):** The review numbers and operations recorded here are historical snapshots. Current policy is in [Plan 02](02-economy-and-rewards.md) and [Plan 22](22-peer-review-and-multipliers.md): four 1–9 peer-scored categories, 1×–20× normal rates, 12 reviews, and a Great-tier Signal cap of 30×.
**Owner:** Plan 02 stays the single authority for the economy, Plan 06 for the homepage. This plan sequences the work.

## 1. Where we are

The reviewer's complaint was that the site feels vibed and has few real details. Since then the wording was made plainer (PRs 91 and 92), the prizes got real photos (90), and the economy proposal ([`proposals/economy-calibration.md`](proposals/economy-calibration.md)) was recalibrated. What is still missing is the settled numbers on the site, the people behind it, and a page that looks less templated.

## 2. What the owner has settled

| Topic | Decision |
|---|---|
| Who it is for | High-school students aged 13 to 18. Public homepage and Docs age wording is aligned by PR #130; Hack Club teen verification is required. |
| Rate | 10 Ore per approved hour at solid quality, worth about $5 of prizes (1 Ore is about $0.50, internal only). |
| Savings | 20% permanent discount at level 15, plus a 20% Requisition. No limits in Ore. A Requisition needs an item of at least 400 Ore. |
| Special prizes | The enclosed printer (1,000 Ore) and the Framework 16 (5,000 Ore) are priced at $3 an hour, with no level requirement. |
| Catalog | The prices in section 3.7 of the proposal are the working catalog. |
| Seasons | Ore and XP carry across seasons. |
| Specialization | Focus pays a little. Level 15 is about 350 hours in one track, and a builder in two areas reaches level 15 in both after about 700 hours. |
| Hours | No limit per season, week or project. Legitimate hours are all rewarded. |
| Fraud | A full, permanent ban, and the Ore, XP and Requisitions are taken back. |
| Quality | Peers decide a 0 to 20 quality rating used as the multiplier. Accepted ships pay from 5× to 20×, with 10× as the solid baseline. Ore is approved hours times the multiplier, so 10 hours at 9× is 90 Ore and at 20× is 200. |
| Shipping again | A project can be shipped again and again, each ship paying only for the new hours since the last one. |
| Money | Treated as not limiting for now; the rules are about fairness and abuse, and the budget is settled later. |

## 3. Remaining decisions

Plan 02's status matrix is authoritative. The entries below are candidates or superseded suggestions, not fallback rules. No response never means approval. In particular, Requisitions remain at 3/6/9/12/15, the accepted-ship rating floor is 5 with a maximum of 20, and five new approved hours are required for a repeat ship. Do not replace those decisions with the alternative schedule or quality range below.

| # | Topic | Earlier candidate or suggestion |
|---|---|---|
| 1 | Discount curve, 0% at level 1 to 20% at level 15 | The gently bent curve (exponent 1.2) in the proposal |
| 2 | XP and levels: XP equals base Ore, 3,500 XP at level 15 | The proposal's table |
| 3 | Requisition levels | 5, 8, 10, 12 and 15 (about 45 to 350 hours), not 3, 6, 9, 12 and 15 |
| 4 | Quality scale | 5 to 15 Ore per hour, not 2 to 18, so one reviewer's mood moves a reward less |
| 5 | Hour rules | None. Reviewers approve hours with evidence and fraud is a full ban |
| 6 | Custom Order tiers and refund rules | The proposal's rules |
| 7 | Whether General Requisitions stay | Dropped from the first program |
| 8 | Peer review: seven reviewers, four categories 0 to 20 against written anchors, median per category, multiplier is the mean, three reviews owed per ship | The proposal's section 3.5 |
| 9 | XP formula: hours × (10 + multiplier) ÷ 2, so quality counts half as much as in Ore | The proposal's section 3.4 |
| 10 | Shipping again: 5 new hours minimum, reviewed on its own window | The proposal's section 3.9 |

If the owner changes 3, 4 or 5, the proposal's tables are regenerated first (step 1).

## 4. Steps, in order

| Step | Work | Depends on | Pull request |
|---|---|---|---|
| 1 | **Apply decisions 3 to 5** to the proposal and regenerate the tables | Section 3 | One |
| 2 | **Move the numbers into Plan 02** as Agreed, and remove the conflicting old text (the 15% discount curve, the I, II and Master tickets, the old caps and the unit "B") | Step 1 | One |
| 3 | **Homepage numbers:** the rate, an age line, one real worked example from the proposal (labelled as an example), the 20% and 40% savings, and the two special prizes. The "How rewards work" copy says it in two or three sentences, not definitions | Step 2 | One |
| 4 | **Docs numbers:** `prizes`, `requisitions`, `progress`, `review`, `eligibility`, `pricing` and `custom-orders` get the agreed figures. Anything not agreed stays out | Step 2 | One |
| 5 | **Less templated hero:** remove the invented drawing metadata (coordinates, "Blatt 001", "Rev A", "Anno 1900") unless it is a real place, drop the two stacked word columns, and replace the three-icon facts line with one concrete fact | Owner's yes on what to cut | One |
| 6 | **People:** a short "who made this" paragraph in the owner's words, with a name and, if the owner wants, a photo, in place of the role list | The owner's paragraph | One |
| 7 | **Voice pass:** once the owner gives a voice sample, one more pass over the FAQ and step copy, so sentences vary and sound like a person | The voice sample | One |
| 8 | **Real dates:** launch, deadline and the IRL weekend, or an honest "decided and not decided" list | The owner | One |
| 9 | **Consistency pass** across Plans 02, 06, the Docs and the homepage, so no number disagrees | Steps 2 to 4 | One |

Steps 3 and 4 can run in parallel after step 2. Steps 5 to 8 only wait for the owner's input and can happen at any point.

## 5. Rules for every step

- Only agreed numbers are published. Prices and thresholds not settled by the owner stay out of public Docs (AGENTS.md).
- The site shows Ore, never a dollar value for one. The $0.50 figure is internal.
- One commit per change, no AI co-author lines, and UI changes carry a design brief in `.ulpi/design/` and all seven UI skills.
- Pull requests go feature, development, testing, then main, through the lanes with `scripts/ship.ps1`. Nothing goes to main until the owner says so.

## 6. What the owner provides

1. Answers to decisions 3 to 7 in section 3, or "take the defaults".
2. The "who made this" paragraph, with a name.
3. A voice sample for step 7.
4. Dates, or the decided and not decided list.
5. Which hero decoration to cut (step 5).
6. The Pixl owner's name and Slack link for `ATTRIBUTION.md`, still outstanding from Plan 19.

## 7. Not in this plan

The mole (Jeff) lives on its own local branch, `feature/mole`, and has no PR yet. Pull interactions stay with [Plan 20](20-pull-interactions.md).
