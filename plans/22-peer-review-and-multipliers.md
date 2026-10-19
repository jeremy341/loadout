# Plan 22: Peer review and ship multipliers

**Status:** Review policy agreed on 2026-10-19. No participant review service is implemented. This plan adapts Stardance's peer-review and payout flow while preserving LOADOUT's four quality dimensions, Ore economy, and stated exceptions. Plan 02 owns the economy; this plan owns the review path and its connection to Ore. See the [current Stardance comparison](../docs/source-audit/reference-comparison.md) for source details and the feature-flag limitation.

## 1. Agreed review rules

- The team first checks LOADOUT fit, verifies the work and claimed hours, and checks submission requirements.
- Every ship, including Hardware, uses peer review. There is no flat Hardware payout exception.
- Peer builders score **Originality, Technical Depth, Execution, and Documentation** from **1 to 9**. Each review includes a written reason of at least ten words.
- A ship needs **12 countable peer reviews**. An automated queue assigns peers one at a time until it has 12; the team does not fill missing votes. The builder cannot review their own ship, and a reviewer cannot review a project they own or have already reviewed.
- Each builder must complete **eight valid reviews of other ships before their own payout**.
- The first 12 countable reviews, in creation order, are snapshotted. For each LOADOUT category, calculate the median. Average the four category medians, then use Stardance's midrank-percentile approach and payout curve.
- The normal payout range is **1×–20×**, with **10× as the mean**. The Great Virality tier can raise the maximum hourly rate to **30×**. The Good and Great Virality rewards are defined in Plan 02.
- Builder-facing review scores and written reasons are visible on the builder's own ship; reviewer identities stay anonymous. Moderators can inspect review details and quality.
- No separate appeal is available; the in-window review flag is the only participant challenge path.

## 2. Payout timing and flags

The award review cannot lock until **both** conditions hold:

1. Twelve countable peer reviews have been collected.
2. At least 24 hours have passed since the latest journal entry attached to that ship.

Once both conditions hold, the system snapshots the selected vote IDs, ratings, hours, percentile, and multiplier. A **24-hour flag window** then starts. Ore and Track XP are issued after it closes, unless a flag is pending moderation.

- A pending flag holds payout until moderation resolves it.
- An upheld flag discards that review, assigns another peer until the ship again has 12 countable reviews, then takes a new snapshot and starts a new 24-hour flag window.
- A rejected flag does not cause an immediate penalty. If a builder submits three rejected flags within ten hours, deduct **5% from that builder's next final Ore payout**.
- The 5% calculation uses the final payout after bonuses and other adjustments.
- The flag penalty is not an appeal route. LOADOUT has no separate appeal process.

The 24-hour journal-age check is separate from the post-lock flag window. Keep both visible in any future review status and payout preview.

## 3. How the percentile payout works

1. Take the first 12 countable reviews, ordered by creation time and ID.
2. Find the median for each of the four LOADOUT dimensions.
3. Average the four medians into the ship's overall score.
4. Compare the category medians and overall score with their respective populations using midrank percentiles. If all values are tied, use the midpoint percentile.
5. Map the overall percentile through Stardance's nonlinear percentile curve, adapted to LOADOUT's normal 1×–20× hourly payout range and 10× mean.
6. If a reviewer-approved Great-tier Signal claim applies, allow the curve's upper ceiling to reach 30×. A Great claim does not add 30× on top of the ordinary payout.

The percentile mapping reduces the influence of one unusually high or low rating. It does not remove genuine ratings as outliers. Exact tie handling, decimal precision, curve versioning, and historical recalculation behavior must be implemented in one payout configuration and ledger path.

## 4. Assignment and review quality

The future matchmaker should follow Stardance's assignment pattern, adapted for LOADOUT:

- Give each reviewer one active assignment at a time.
- Exclude the builder, project teammates, prior reviewers, and projects the reviewer skipped or reported.
- Keep assigning eligible peers until 12 countable reviews are present. If a review is invalidated or upheld as a flag, replace it with another peer review.
- Record assignment views and timestamps, time to submit, and whether the reviewer opened the repository or demo so moderators can assess review quality.
- Provide a moderator review view of a participant's ratings and written reasons. Reviewer identities remain hidden from builders.
- Do not substitute a staff score for a missing peer review.

Reviewers are expected to score the work against published 1–9 anchors for each LOADOUT category. The first example anchors and calibration projects can be written after initial program examples exist.

## 5. Decisions and boundaries

Agreed: 1–9 per category; four LOADOUT dimensions; 12 countable reviews; assign peers until full; eight reviews owed; category medians then mean; Stardance percentile payout approach; 24-hour journal-age check before lock; 24-hour post-lock flag window; anonymous reviewer names; written reasons; no appeals; Hardware included; repeated false-flag penalty; normal 1×–20× range with a Great-tier 30× ceiling.

The following remain separate decisions or implementation details:

- Exact XP award equation and any Research Mode XP bonus.
- How reviewer debt accrues or is restored after a corrected, skipped, or invalid review.
- Exact percentile sampling window and tie behavior across a small launch cohort.
- The final outcome when a builder violates open-source, tracker, journal, or project-evidence requirements.
- How Signal's 30× ceiling and 5,000 Ore project maximum interact with Era bonuses, flags, and later corrections.
- The actual review UI, database schema, verification integrations, and audit log.

These are policy or implementation decisions, not permission to change the agreed review rules silently. No participant account, review queue, or payout service exists yet.
