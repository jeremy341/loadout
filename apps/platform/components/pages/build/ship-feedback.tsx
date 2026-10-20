"use client";

import Link from "next/link";
import { useState } from "react";
import { uid } from "../../../lib/preview-store";
import { EmptyState, Field, Meter, Panel, Status, Tag } from "../../ui/ui";
import { useBuildClock } from "./clock";
import { dispatchShip } from "./engine";
import { SHIP_STATE_LABEL, shipTone } from "./labels";
import { fmtDateTime, useLiveMessage } from "./parts";
import { ShipTools } from "./ship-tools";
import { useJournals, usePenalty, useShips } from "./store";
import { latestEntryAt } from "./logic/cadence";
import { DRAFT_NOTE, RULES } from "./logic/constants";
import { CATEGORIES, countableReviews, scoreBreakdown, snapshotReviews } from "./logic/scoring";
import { flagWindowOpen, lockReadiness } from "./logic/ship";
import type { Flag, ReceivedReview, Ship } from "./logic/types";

/** "My ship feedback": anonymous scores and reasons on your own ships, the aggregation, and the flag window. */
export function ShipFeedback() {
  const [ships] = useShips();
  const [selectedId, setSelectedId] = useState<string>("");
  const reviewable = ships.filter((s) => s.state !== "rejected");
  const ship = ships.find((s) => s.id === selectedId) ?? reviewable[reviewable.length - 1] ?? ships[ships.length - 1];

  if (ships.length === 0 || !ship) {
    return (
      <EmptyState
        title="No ships to read feedback on yet"
        action={
          <Link href="/projects" className="btn">
            Go to Projects
          </Link>
        }
      >
        When you submit a ship and the team approves it, peers review it and their anonymous scores and reasons appear here.
      </EmptyState>
    );
  }

  return (
    <div className="pg-stack">
      {ships.length > 1 ? (
        <Panel title="Choose a ship">
          <Field label="Ship">
            <select value={ship.id} onChange={(e) => setSelectedId(e.target.value)}>
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.projectName} {s.version} ({SHIP_STATE_LABEL[s.state]})
                </option>
              ))}
            </select>
          </Field>
        </Panel>
      ) : null}
      <FeedbackFor key={ship.id} ship={ship} />
    </div>
  );
}

function FeedbackFor({ ship }: { ship: Ship }) {
  const clock = useBuildClock();
  const [journals] = useJournals();
  const [penalty] = usePenalty();
  const [message, say] = useLiveMessage();
  const [flagging, setFlagging] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [flagError, setFlagError] = useState<string | null>(null);

  const latest = latestEntryAt(journals.filter((e) => e.projectId === ship.projectId));
  const readiness = clock.ready ? lockReadiness(ship, { now: clock.now, latestJournalAt: latest }) : null;
  const breakdown = scoreBreakdown(ship.reviews, ship.great);
  const locked = ship.snapshot;
  const inSnapshot = new Set(locked?.reviewIds ?? snapshotReviews(ship.reviews).map((r) => r.id));
  const medians = locked?.medians ?? breakdown.medians;
  const overall = locked?.overall ?? breakdown.overall;
  const countable = countableReviews(ship.reviews).length;
  const windowOpen = clock.ready && flagWindowOpen(ship, clock.now);
  const ordered = [...ship.reviews].sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1));

  function flagStatus(review: ReceivedReview): Flag | undefined {
    return ship.flags.find((f) => f.reviewId === review.id);
  }

  function submitFlag(reviewId: string) {
    const error = dispatchShip(ship.id, { type: "flag", flagId: uid("flag"), reviewId, reason });
    if (error) {
      setFlagError(error);
      return;
    }
    setFlagging(null);
    setReason("");
    setFlagError(null);
    say("Flag sent. A pending flag holds your payout until a moderator decides.");
  }

  return (
    <div className="pg-stack">
      <Panel title={`${ship.projectName} ${ship.version}`} actions={<Tag tone={shipTone(ship.state)}>{SHIP_STATE_LABEL[ship.state]}</Tag>}>
        <div className="pg-stack">
          {penalty.pending ? (
            <p className="bd-sticky-note" role="note">
              <strong>Penalty pending.</strong> Three of your flags were rejected within {RULES.penaltyWindowHours} hours, so your next final Ore payout loses {RULES.penaltyPercent}%. There is no appeal.
            </p>
          ) : null}
          <div>
            <p className="bd-sub">Countable peer reviews</p>
            <Meter value={Math.min(countable, RULES.reviewsPerShip)} max={RULES.reviewsPerShip} label={`${Math.min(countable, RULES.reviewsPerShip)} of ${RULES.reviewsPerShip} countable reviews`} />
            <p aria-live="polite">
              {Math.min(countable, RULES.reviewsPerShip)} of {RULES.reviewsPerShip} countable reviews.{" "}
              {locked ? "The first 12 are locked in a snapshot." : countable >= RULES.reviewsPerShip ? "Enough reviews; the award locks when the journal gate is met too." : "The first 12 in creation order will be locked."}
            </p>
          </div>

          {readiness ? (
            <dl className="bd-kv">
              <div>
                <dt>{RULES.reviewsPerShip} countable reviews</dt>
                <dd>{readiness.enoughReviews ? "Met" : `${readiness.countable} of ${readiness.needed}`}</dd>
              </div>
              <div>
                <dt>24 h since latest journal</dt>
                <dd>{readiness.journal.met ? "Met" : readiness.journal.hasEntry ? `${readiness.journal.hoursLeft} h to go` : "No entry"}</dd>
              </div>
              <div>
                <dt>24-hour flag window</dt>
                <dd>{!locked ? "Not started" : windowOpen ? `Open, ${Math.max(0, Math.round(((locked.windowEndsAt - clock.now) / 3_600_000) * 10) / 10)} h left` : "Closed"}</dd>
              </div>
            </dl>
          ) : null}
          <p className="bd-sub">The award locks only when both the review count and the journal gate are met. Then a separate 24-hour flag window opens; payout comes after it closes, unless a flag is pending.</p>
        </div>
      </Panel>

      <Panel title="Category medians" actions={<Tag tone={locked ? "ok" : "warn"}>{locked ? "Locked snapshot" : countable === 0 ? "No reviews yet" : "Provisional"}</Tag>}>
        {!medians || overall === null ? (
          <p className="mut">{ship.state === "submitted" || ship.state === "team_check" ? "Peer review starts after the team approves the ship." : "No countable reviews yet."}</p>
        ) : (
          <div className="pg-stack">
            <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
              <table className="tbl">
                <caption className="sr-only">Median score in each category</caption>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col" className="num">Median (1 to 9)</th>
                    {locked ? <th scope="col" className="num">Percentile (draft cohort)</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((c) => (
                    <tr key={c.key}>
                      <th scope="row">{c.label}</th>
                      <td className="num">{medians[c.key]}</td>
                      {locked ? <td className="num">{locked.categoryPercentiles[c.key]}</td> : null}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Mean of the four medians</th>
                    <td className="num">{overall.toFixed(2)}</td>
                    {locked ? <td className="num">{locked.overallPercentile}</td> : null}
                  </tr>
                </tfoot>
              </table>
            </div>
            {locked ? (
              <p>
                Multiplier from the draft curve: <strong>{locked.multiplier}x</strong> on {locked.hours} approved hours{locked.great ? " (Great Signal ceiling)" : ""}. <Tag>Draft preview rule</Tag>
              </p>
            ) : null}
            <p className="bd-sub">{DRAFT_NOTE} Medians use the first 12 countable reviews. Scores are never trimmed as outliers.</p>
          </div>
        )}
      </Panel>

      <Panel title="Scores and reasons">
        <div className="pg-stack">
          <p className="mut">Each review is anonymous. You see the scores and the written reason, never who wrote them.</p>
          <Status message={message} />
          {ordered.length === 0 ? (
            <EmptyState title="No reviews yet">{ship.state === "peer_review" ? "Peers are assigned one at a time. Use Preview tools below to add sample reviews." : "Reviews arrive after the team check."}</EmptyState>
          ) : (
            <ul className="bd-feed">
              {ordered.map((review, index) => {
                const flag = flagStatus(review);
                const counted = !review.discarded && inSnapshot.has(review.id);
                const canFlag = windowOpen && !flag && !review.discarded && Boolean(locked?.reviewIds.includes(review.id));
                return (
                  <li key={review.id}>
                    <article className="bd-entry" aria-label={`Review ${index + 1}, anonymous`}>
                      <div className="bd-card-head">
                        <h3>Review {index + 1}</h3>
                        <div className="bd-meta">
                          {review.discarded ? <Tag tone="bad">Removed after an upheld flag</Tag> : counted ? <Tag tone="ok">Counted</Tag> : <Tag>Not in the first 12</Tag>}
                          {flag ? <Tag tone={flag.status === "pending" ? "warn" : flag.status === "upheld" ? "ok" : "bad"}>Flag {flag.status}</Tag> : null}
                        </div>
                      </div>
                      <p className="bd-sub">Anonymous reviewer, {fmtDateTime(review.createdAt)}</p>
                      <dl className="bd-kv">
                        {CATEGORIES.map((c) => (
                          <div key={c.key}>
                            <dt>{c.label}</dt>
                            <dd>{review.scores[c.key]}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="bd-quote">{review.reason}</p>
                      {flag ? <p className="bd-sub">Your flag: {flag.reason}</p> : null}
                      {canFlag ? (
                        flagging === review.id ? (
                          <div className="pg-stack">
                            <Field label="Why is this review unfair or invalid?" error={flagError}>
                              <textarea rows={3} value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} aria-invalid={flagError ? true : undefined} />
                            </Field>
                            <p className="bd-sub">Flagging is the only way to challenge a review. There is no appeal. Three rejected flags within {RULES.penaltyWindowHours} hours cost {RULES.penaltyPercent}% of your next payout.</p>
                            <div className="bd-actions">
                              <button type="button" className="btn btn-sm" onClick={() => submitFlag(review.id)}>
                                Send flag
                              </button>
                              <button type="button" className="btn btn-sm btn-quiet" onClick={() => { setFlagging(null); setFlagError(null); }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bd-actions">
                            <button type="button" className="btn btn-sm btn-quiet" onClick={() => { setFlagging(review.id); setReason(""); setFlagError(null); }}>
                              Flag this review
                            </button>
                          </div>
                        )
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      {ship.state !== "paid" && ship.state !== "rejected" ? <ShipTools ship={ship} /> : null}
      {ship.payout ? (
        <Panel title="Payout">
          <p>
            {ship.payout.net} Ore credited{ship.payout.penalty > 0 ? `, after a ${ship.payout.penalty} Ore deduction from ${ship.payout.gross}` : ""}. <Tag>Draft preview rule</Tag>
          </p>
        </Panel>
      ) : null}
    </div>
  );
}
