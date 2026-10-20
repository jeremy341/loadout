"use client";

import Link from "next/link";
import { useState } from "react";
import { Status } from "../../ui/ui";
import { useBuildClock } from "./clock";
import { addSampleReviews, applyDutyShortcut, dispatchShip, reviewsDoneCount } from "./engine";
import { fmtDateTime, NumberField, useLiveMessage } from "./parts";
import { useJournals, useReviewsState } from "./store";
import { journalGate, latestEntryAt } from "./logic/cadence";
import { RULES } from "./logic/constants";
import { countableReviews } from "./logic/scoring";
import { lockReadiness, pendingFlags } from "./logic/ship";
import type { Ship } from "./logic/types";

/**
 * "Preview tools": stand-ins for the team, the other reviewers and the moderators, none of which exist yet.
 * They change only this browser's saved preview data. Used on Projects (Ship tab) and Reviews (My ship feedback).
 */
export function ShipTools({ ship }: { ship: Ship }) {
  const clock = useBuildClock();
  const [journals] = useJournals();
  const [reviews] = useReviewsState();
  const [message, say] = useLiveMessage();
  const [approveHours, setApproveHours] = useState(ship.submittedHours);
  const [note, setNote] = useState("");
  const [typical, setTypical] = useState(7);

  const entries = journals.filter((entry) => entry.projectId === ship.projectId);
  const latest = latestEntryAt(entries);
  const gate = journalGate(latest, clock.now);
  const readiness = clock.ready ? lockReadiness(ship, { now: clock.now, latestJournalAt: latest }) : null;
  const pending = pendingFlags(ship);
  const done = reviewsDoneCount(reviews);
  const countable = countableReviews(ship.reviews).length;

  function run(action: Parameters<typeof dispatchShip>[1], success: string) {
    const error = dispatchShip(ship.id, action);
    say(error ?? success);
  }

  function addReviews(count: number) {
    const result = addSampleReviews(ship.id, count, typical);
    say(result.error ?? `${result.added} sample review${result.added === 1 ? "" : "s"} added.`);
  }

  return (
    <details className="bd-tools">
      <summary>Preview tools: simulate the next step</summary>
      <div className="bd-tools-body">
        <p className="mut">
          These controls stand in for the team, other builders and moderators, who do not exist in the preview yet. They only change the data saved in this browser.
        </p>

        <div className="bd-tool-group">
          <h4>Time</h4>
          <p className="bd-sub">
            Preview time is {clock.offsetHours === 0 ? "the same as real time" : `${clock.offsetHours} h ahead of real time`}.
            {clock.ready && gate.hasEntry
              ? gate.met
                ? ` Your latest journal entry is ${gate.hoursSince} h old, so the 24-hour journal gate is met.`
                : ` Your latest journal entry is ${gate.hoursSince} h old, ${gate.hoursLeft} h short of the 24-hour journal gate.`
              : clock.ready
                ? " This project has no journal entry yet, so the journal gate cannot be met."
                : ""}
          </p>
          <div className="bd-actions">
            <button type="button" className="btn btn-sm btn-quiet" onClick={() => { clock.advance(1); say("Moved preview time forward 1 hour."); }}>
              Skip 1 hour
            </button>
            <button type="button" className="btn btn-sm btn-quiet" onClick={() => { clock.advance(8); say("Moved preview time forward 8 hours."); }}>
              Skip 8 hours
            </button>
            <button type="button" className="btn btn-sm btn-quiet" onClick={() => { clock.advance(24); say("Moved preview time forward 24 hours."); }}>
              Skip 24 hours
            </button>
            <button type="button" className="btn btn-sm btn-quiet" disabled={clock.offsetHours === 0} onClick={() => { clock.reset(); say("Preview time is back to real time."); }}>
              Back to real time
            </button>
          </div>
        </div>

        {ship.state === "submitted" ? (
          <div className="bd-tool-group">
            <h4>Team</h4>
            <button type="button" className="btn btn-sm" onClick={() => run({ type: "pickup" }, "The team picked the ship up for its fit and validity check.")}>
              Team picks up the ship
            </button>
          </div>
        ) : null}

        {ship.state === "team_check" ? (
          <div className="bd-tool-group">
            <h4>Team fit and validity check</h4>
            <label className="fld">
              <span className="fld-label">Hours the team approves</span>
              <NumberField value={approveHours} min={0.5} max={ship.submittedHours} step={0.5} onCommit={setApproveHours} />
              <span className="fld-hint">Up to the {ship.submittedHours} h submitted. The team can approve part of the time.</span>
            </label>
            <label className="fld">
              <span className="fld-label">Team note (optional)</span>
              <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} autoComplete="off" />
            </label>
            <div className="bd-actions">
              <button type="button" className="btn btn-sm" onClick={() => run({ type: "approve", approvedHours: approveHours }, `The team approved ${approveHours} h. Peer review starts.`)}>
                Approve
              </button>
              <button type="button" className="btn btn-sm btn-quiet" onClick={() => run({ type: "requestChanges", note: note || "Please add more detail to your journal and resubmit." }, "The team requested changes.")}>
                Request changes
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => run({ type: "reject", note: note || "Not a fit for LOADOUT." }, "The team rejected the ship. There is no payout.")}>
                Reject
              </button>
            </div>
          </div>
        ) : null}

        {ship.state === "changes_requested" ? (
          <p className="bd-sub">The team asked for changes. Fix them, then resubmit from the Ship tab of the project.</p>
        ) : null}

        {ship.state === "peer_review" || ship.state === "flag_window" ? (
          <div className="bd-tool-group">
            <h4>Peer reviews</h4>
            <label className="fld">
              <span className="fld-label">Typical score for the sample reviews (1 to 9)</span>
              <select value={typical} onChange={(e) => setTypical(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="bd-actions">
              <button type="button" className="btn btn-sm" onClick={() => addReviews(1)}>
                Add 1 sample review
              </button>
              <button type="button" className="btn btn-sm btn-quiet" disabled={countable >= RULES.reviewsPerShip} onClick={() => addReviews(Math.max(1, RULES.reviewsPerShip - countable))}>
                Fill to {RULES.reviewsPerShip} reviews
              </button>
            </div>
            {readiness && ship.state === "peer_review" ? (
              <p className="bd-sub">
                {readiness.countable} of {readiness.needed} countable reviews.{" "}
                {readiness.enoughReviews && !readiness.journal.met
                  ? `Enough reviews, but the award waits for the 24-hour journal gate${gate.hasEntry ? ` (${gate.hoursLeft} h to go)` : ": write a journal entry"}.`
                  : readiness.ready
                    ? "Both gates are met."
                    : ""}
              </p>
            ) : null}
            {ship.state === "peer_review" ? (
              <label className="check">
                <input type="checkbox" checked={ship.great} onChange={(e) => run({ type: "setGreat", value: e.target.checked }, e.target.checked ? "A reviewer-approved Great Signal claim now lifts the ceiling to 30x." : "Great Signal claim removed.")} />
                Reviewer approved a Great Signal claim (ceiling 30x instead of 20x)
              </label>
            ) : null}
            <p className="bd-sub">
              <Link href="/journals">Open Journals</Link> to write the entry that the 24-hour gate counts from.
            </p>
          </div>
        ) : null}

        {ship.state === "flag_window" ? (
          <div className="bd-tool-group">
            <h4>Moderator</h4>
            {pending.length === 0 ? (
              <p className="bd-sub">No pending flags. Flag a review on the My ship feedback tab to see a moderator decision here.</p>
            ) : (
              <ul className="row-list">
                {pending.map((flag) => (
                  <li key={flag.id} className="row-item">
                    <span className="bd-wrap">Flag on a review: {flag.reason}</span>
                    <span className="bd-actions">
                      <button type="button" className="btn btn-sm" onClick={() => run({ type: "resolveFlag", flagId: flag.id, outcome: "upheld" }, "Flag upheld. The review is discarded and another peer review is needed.")}>
                        Uphold flag
                      </button>
                      <button type="button" className="btn btn-sm btn-quiet" onClick={() => run({ type: "resolveFlag", flagId: flag.id, outcome: "rejected" }, "Flag rejected. Payout is no longer held by it.")}>
                        Reject flag
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {ship.state !== "paid" && ship.state !== "rejected" ? (
          <div className="bd-tool-group">
            <h4>Review duty</h4>
            <p className="bd-sub">
              You have done {done} of {RULES.reviewsOwed} reviews of other ships. Do them for real on the <Link href="/reviews">Reviews</Link> tab, or count the rest here to test payout.
            </p>
            <div className="bd-actions">
              <button type="button" className="btn btn-sm btn-quiet" disabled={done >= RULES.reviewsOwed} onClick={() => { applyDutyShortcut(); say("Counted the remaining reviews as done (preview shortcut)."); }}>
                Count my {RULES.reviewsOwed} reviews as done
              </button>
            </div>
          </div>
        ) : null}

        {ship.state === "paid" ? <p className="bd-sub">This ship is paid. Its award was credited once and cannot change. Submitted {fmtDateTime(ship.submittedAt)}.</p> : null}
        <Status message={message} />
      </div>
    </details>
  );
}
