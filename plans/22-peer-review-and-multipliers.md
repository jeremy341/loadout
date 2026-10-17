# Plan 22: Peer review and ship multipliers

**Status:** Agreed rating inputs with candidate operational details, reconciled 2026-10-15. Plan 02 records the 0–20 peer scale, accepted-ship payout floor of 5, baseline 10, maximum 20, team check and separate repeat ships. Reviewer count, review duty, scoring aggregation/rounding, deadlines, appeals, the XP equation and a 25% Research XP bonus remain candidates. No review platform is built. [Plan 02](02-economy-and-rewards.md#rule-status-and-remaining-decisions) is the rule-status authority.
**Owner:** Plan 02 owns the economy. This plan owns how a ship gets its multiplier, and how that multiplier feeds Ore and XP.

## 1. What it has to do

1. A bad project that is genuinely tried pays about **5×** an hour. A solid one pays **10×**. A great one **15×**. An exceptional one can reach **20×**.
2. Nobody can buy a good score, swap scores, or farm a lenient pool.
3. It works with a small community, because LOADOUT starts with tens of builders, not thousands.
4. It reads as fair to a 13-year-old: they can see why they got their number.
5. It adjusts over time without changing prices.

## 2. The scale

Peers score four categories from 0 to 20: Originality, Technical Depth, Execution, Documentation. The multiplier is the mean of the four category medians.

| Multiplier | Who gets it | Share of ships we expect |
|---:|---|---:|
| 5 | Weak but real work. The floor for any ship the team approves | about 20% (5 to 7) |
| 8 to 11 | Solid work, the middle of the program | about 40% |
| 12 to 14 | Strong work | about 25% |
| 15 to 17 | Great work | about 12% |
| 18 to 20 | Exceptional. 20 needs every category median at 20 | about 3% |

The shares are a **target, not a quota**. They are how the team checks that the scale is calibrated: the average should sit near 10. If it drifts, the anchors change, never the prices and never an individual score.

**Why a floor of 5.** A team-approved ship that peers dislike should still pay for the hours, just badly: ten hours is 50 Ore, half of a solid ship. A ship below the team's minimum bar is rejected, pays nothing and can be improved and sent again (Plan 21, shipping again).

## 3. The flow

The counts, deadlines, aggregation and allocation thresholds in this flow are a candidate design. Do not publish them as settled requirements until the owner selects them.

1. **Ship.** The builder submits a project, evidence, the journal and the hours since the last ship.
2. **Team check (day 1 to 3).** A team member confirms it is real, runnable or shown, the evidence matches the journal and the hours are plausible. Rejected ships get a reason and a way to fix them. This is the first gate and the main fraud check.
3. **Peer round.** Seven reviewers are drawn at random, never the builder, a teammate or someone from the same household or classroom the builder named, and preferring people with some level in a track the project uses. Each has 7 days.
4. **Scores.** Each reviewer gives four scores from 0 to 20 against the written anchors, a one-line reason for any score of 4 or lower or 16 or higher, and a proposed split across tracks.
5. **Result.** For each category, the median. The multiplier is the mean of the four medians, rounded to one decimal, never below 5. The track split is the median share per track with the 10% minimum.
6. **Fraud window (24 hours).** The team can stop a payout over flags (collusion, copied work, fake evidence). Otherwise Ore and XP are issued.
7. **The builder sees:** their four medians, the multiplier, the Ore and XP it paid, and the reviewers' reasons, without reviewer names.

If fewer than five of the seven finish in 7 days, the team assigns more reviewers. If it is still short, a team member scores it as one of the reviewers, and it is noted on the ship.

## 4. Keeping it honest

- **Anchors.** Each score level has a written description and a real example project per track. Reviewers calibrate against them, not against the other projects they see. The examples are built from the first ships and refreshed each Season.
- **Review to ship.** Each ship needs three completed reviews from the builder first. Reviews must be made in good faith: a review that gives every project the same score, or is finished in seconds, does not count.
- **Reviewer weight.** A reviewer who is often far from the medians counts for less (down to half) and can be paused. One who is clearly careless or colluding is removed. Reviewer accuracy is visible to the team, never to builders.
- **Median, not mean.** One friend or one rival cannot move a category.
- **Conflicts.** Reviewers declare conflicts. Scoring your own project, a teammate's, or trading scores is fraud.
- **Fraud is a full ban.** Fabricated or inflated hours, copied work, fake evidence and collusion end in a permanent ban and take back all Ore, XP and Requisitions earned or bought. There is no second chance.
- **Appeals.** A builder can ask for one human re-check of a multiplier within 7 days, with a reason. The team can raise or confirm a score, never lower it, so appeals are safe to use. Fraud findings are not appealable except by the team's own review.

## 5. How the multiplier feeds the rest

The base Ore equation is agreed. The precise XP equation and 25% Research bonus below are candidates. Publishing a qualitative XP explanation does not approve these coefficients.

- **Ore** = approved hours × multiplier, plus the Era bonus (+10% of the base).
- **XP** = approved hours × (10 + multiplier) ÷ 2. At 10× it is 10 XP an hour, matching Ore. At 5× it is 7.5 and at 20× it is 15, so quality moves levels half as much as it moves Ore.
- **Shipping again.** Each ship is scored on its own window. A first ship at 9× and a second at 14× is fine. Earlier ships are never changed.
- **Research Mode** adds 25% to XP only, after the multiplier.
- **Requisitions and discounts** depend on levels, so quality reaches them only through XP, which is damped on purpose.

## 6. Tuning knobs

Tuned with data from the first Season, by the owner. None is secret, but changes are announced.

| Knob | Starts at | Moves when |
|---|---:|---|
| Reviewers per ship | 7 | Too few finish in time, or scores vary too much between pools |
| Review debt | 3 per ship | Ships wait too long for reviewers, or reviews get rushed |
| Floor | 5× | Weak ships are over- or under-paid |
| Anchor examples | first ships | The average drifts above or below 10 |
| Fraud window | 24 hours | Flags arrive later than that |

## 7. What can go wrong, and what we do

| Risk | Response |
|---|---|
| Friends rating friends | Random draw, conflict declarations, medians, accuracy weighting, and fraud ban for collusion |
| Scores inflate over time | Fixed anchors, monitor the average, retune anchors only |
| Reviewers do not show up | Review debt, longer window, team scores as a fallback |
| Hard to understand | Show the builder the medians and reasons, and one page in the Docs explaining 5, 10, 15 and 20 with examples |
| Builders feel a low score was unfair | One appeal that can only help them |

## 8. Phases

1. **Agree the numbers** (Plan 21 step 1 and 2): the owner answers the questions in section 9 and the proposal moves into Plan 02.
2. **Publish the simple version** (Plan 21 steps 3 and 4): the rate, the 0 to 20 scale with 10 as the default, "peers decide, the team checks", and shipping again. Reviewer weights, fraud windows and knobs stay in the Docs or internal.
3. **Write the anchors:** the five anchor descriptions and the first example projects, after the first ships exist.
4. **Platform:** the review queue, the scoring form, the median calculation, the fraud window and the ledger. Platform design is Plan 04's job. This plan only says what it must do.

## 9. What the owner decides

1. Seven reviewers and three reviews owed per ship, or other numbers?
2. How category aggregation and rounding should enforce the already-agreed floor of 5 and ceiling of 20.
3. One appeal that can only raise a score?
4. A 7-day window per round, and a 24-hour fraud window?
5. Whether reviewers see only the builder's evidence, or can also run the project.

## 10. Not decided here

Region-based prices, the prize shop fulfilment, how the first examples are chosen, and the platform's database design.
