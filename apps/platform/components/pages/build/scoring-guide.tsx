"use client";

import { useState } from "react";
import { Field, Panel, Tag } from "../../ui/ui";
import { useShips } from "./store";
import { DRAFT, DRAFT_COHORT_ROWS, DRAFT_NOTE, RULES } from "./logic/constants";
import { sampleReview } from "./logic/sample-review";
import { CATEGORIES, oreFor, percentileToMultiplier, scoreBreakdown } from "./logic/scoring";
import type { ReceivedReview } from "./logic/types";

const EXAMPLE_ID = "example";
const EXAMPLE_REVIEWS: ReceivedReview[] = Array.from({ length: RULES.reviewsPerShip }, (_, i) => sampleReview({ shipId: "example", index: i, base: 7, createdAt: i + 1 }));

/** "How scoring works": the Plan 22 aggregation, with a live worked example you can point at your own ship. */
export function ScoringGuide() {
  const [ships] = useShips();
  const withReviews = ships.filter((s) => s.reviews.length > 0);
  const [sourceId, setSourceId] = useState(EXAMPLE_ID);
  const [great, setGreat] = useState(false);
  const [hoursText, setHoursText] = useState("20");

  const source = withReviews.find((s) => s.id === sourceId);
  const reviews = source ? source.reviews : EXAMPLE_REVIEWS;
  const breakdown = scoreBreakdown(reviews, great);
  const hours = Math.max(0, Number(hoursText) || 0);
  const used = breakdown.used;

  return (
    <div className="pg-stack">
      <Panel title="The rules">
        <ol className="bd-rule-list">
          <li>
            The team first checks fit and validity. Then peers score <strong>Originality, Technical Depth, Execution and Documentation</strong> from 1 to 9, each with a written reason of at least {RULES.minReasonWords} words. <Tag>Settled: Plan 22</Tag>
          </li>
          <li>
            A ship needs <strong>{RULES.reviewsPerShip} countable peer reviews</strong>. Peers are assigned one at a time until it has them; the team never fills missing votes. <Tag>Settled: Plan 22</Tag>
          </li>
          <li>
            The first {RULES.reviewsPerShip} countable reviews, in the order they were created, are the ones that count. For each category take the <strong>median</strong>, then average the four medians. Nothing is trimmed as an outlier. <Tag>Settled: Plan 22</Tag>
          </li>
          <li>
            The award cannot lock until you have {RULES.reviewsPerShip} countable reviews <strong>and</strong> at least {RULES.journalAgeHours} hours have passed since your latest journal entry. <Tag>Settled: Plan 22</Tag>
          </li>
          <li>
            At the lock the system saves a snapshot. A separate <strong>{RULES.flagWindowHours}-hour flag window</strong> then opens. Ore is issued after it closes, unless a flag is pending. <Tag>Settled: Plan 22</Tag>
          </li>
          <li>
            An upheld flag discards that review, another peer review is assigned, and a new snapshot and window follow. Three rejected flags within {RULES.penaltyWindowHours} hours deduct {RULES.penaltyPercent}% from your next final payout. There is no appeal. <Tag>Settled: Plan 22</Tag>
          </li>
          <li>
            You owe <strong>{RULES.reviewsOwed} valid reviews</strong> of other ships before your own payout. <Tag>Settled: Plan 22</Tag>
          </li>
          <li>
            The overall score is compared with other ships using midrank percentiles and mapped to an hourly rate between {RULES.multiplierMin}x and {RULES.multiplierMax}x, with a {RULES.multiplierMean}x mean. A reviewer-approved Great Signal claim lifts the ceiling to {RULES.multiplierMaxGreat}x. <Tag>Range settled: Plan 22 and 02</Tag> <Tag>Curve: draft preview rule</Tag>
          </li>
          <li>
            Ore = approved hours x the hourly rate, before separate bonuses or deductions. <Tag>Settled: Plan 02</Tag>
          </li>
        </ol>
      </Panel>

      <Panel title="Worked example">
        <div className="pg-stack">
          <div className="form-grid">
            <Field label="Use these reviews">
              <select value={source ? source.id : EXAMPLE_ID} onChange={(e) => setSourceId(e.target.value)}>
                <option value={EXAMPLE_ID}>Built-in example: 12 sample reviews</option>
                {withReviews.map((s) => (
                  <option key={s.id} value={s.id}>
                    Your ship: {s.projectName} {s.version} ({s.reviews.length} reviews)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Approved hours">
              <input type="number" inputMode="decimal" min={0} step={0.5} value={hoursText} onChange={(e) => setHoursText(e.target.value)} />
            </Field>
          </div>
          <label className="check">
            <input type="checkbox" checked={great} onChange={(e) => setGreat(e.target.checked)} />
            Pretend a reviewer approved a Great Signal claim (ceiling {RULES.multiplierMaxGreat}x)
          </label>

          {used.length === 0 ? (
            <p className="mut">That ship has no countable reviews yet.</p>
          ) : (
            <div className="pg-stack">
              <h3>Step 1 and 2: the first {RULES.reviewsPerShip} reviews and their medians</h3>
              <p className="bd-sub">
                {used.length} of {RULES.reviewsPerShip} reviews used{breakdown.complete ? "." : ". This is provisional: a ship needs 12 before the award can lock."}
              </p>
              <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
                <table className="tbl">
                  <caption className="sr-only">Scores from each counted review, with the median of each category</caption>
                  <thead>
                    <tr>
                      <th scope="col">Review</th>
                      {CATEGORIES.map((c) => (
                        <th key={c.key} scope="col" className="num">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {used.map((review, index) => (
                      <tr key={review.id}>
                        <th scope="row">{index + 1}</th>
                        {CATEGORIES.map((c) => (
                          <td key={c.key} className="num">
                            {review.scores[c.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Median</th>
                      {CATEGORIES.map((c) => (
                        <td key={c.key} className="num">
                          {breakdown.medians?.[c.key]}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>

              <h3>Step 3: mean of the four medians</h3>
              <p>
                {CATEGORIES.map((c) => breakdown.medians?.[c.key]).join(" + ")} divided by 4 = <strong>{breakdown.overall?.toFixed(2)}</strong>
              </p>

              <h3>Step 4: percentile</h3>
              <p>
                Ranked against an invented cohort of {DRAFT_COHORT_ROWS.length} earlier ships with the midrank method (ships below, plus half the ties). Percentile: <strong>{breakdown.overallPercentile}</strong> <Tag>Draft preview rule</Tag>
              </p>

              <h3>Step 5: hourly rate</h3>
              <p>
                {RULES.multiplierMin} + ({great ? RULES.multiplierMaxGreat : RULES.multiplierMax} - {RULES.multiplierMin}) x ({breakdown.overallPercentile} / 100) ^ {DRAFT.curveExponent.toFixed(3)} = <strong>{breakdown.multiplier}x</strong> <Tag>Draft preview rule</Tag>
              </p>

              <h3>Step 6: Ore</h3>
              <p>
                {hours} h x {breakdown.multiplier} = <strong>{breakdown.multiplier === null ? 0 : oreFor(hours, breakdown.multiplier)} Ore</strong> before any bonus or deduction <Tag>Draft preview rule</Tag>
              </p>
              <p className="bd-sub">Era bonuses, Signal bonuses and the flag penalty are applied separately; the plans leave how they stack open.</p>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="The draft curve">
        <div className="pg-stack">
          <p className="mut">{DRAFT_NOTE} The exponent is picked so that evenly spread percentiles average {RULES.multiplierMean}x.</p>
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Hourly rate at five percentiles</caption>
              <thead>
                <tr>
                  <th scope="col">Percentile</th>
                  <th scope="col" className="num">Normal rate</th>
                  <th scope="col" className="num">With Great Signal</th>
                </tr>
              </thead>
              <tbody>
                {[0, 25, 50, 75, 100].map((p) => (
                  <tr key={p}>
                    <th scope="row">{p}</th>
                    <td className="num">{percentileToMultiplier(p)}x</td>
                    <td className="num">{percentileToMultiplier(p, true)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>
    </div>
  );
}
