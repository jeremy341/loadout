"use client";

import { uid } from "../../../lib/preview-store";
import { pushNotification } from "../../../lib/notifications";
import { EmptyState, Meter, Panel, Status, Tag } from "../../ui/ui";
import { previewNow } from "./clock";
import { REVIEW_SHIPS, type ReviewShip } from "./content";
import { reviewsDoneCount, settleShips } from "./engine";
import { ConfirmButton, fmtDateTime, useLiveMessage } from "./parts";
import { ReviewForm } from "./review-form";
import { useReviewsState } from "./store";
import { RULES } from "./logic/constants";
import { CATEGORIES } from "./logic/scoring";
import { licenseLabel } from "./logic/validate";
import type { ReviewDraft, ReviewsState } from "./logic/types";

const EMPTY_DRAFT: ReviewDraft = { scores: {}, reason: "" };

function nextShip(state: ReviewsState): ReviewShip | undefined {
  const taken = new Set([...state.done.map((d) => d.shipId), ...state.skipped, ...state.reported]);
  return REVIEW_SHIPS.find((ship) => !taken.has(ship.id));
}

function remainingCount(state: ReviewsState): number {
  const taken = new Set([...state.done.map((d) => d.shipId), ...state.skipped, ...state.reported]);
  return REVIEW_SHIPS.filter((ship) => !taken.has(ship.id)).length;
}

export function ReviewQueue() {
  const [state, setState] = useReviewsState();
  const [message, say] = useLiveMessage();
  const done = reviewsDoneCount(state);
  const queue = REVIEW_SHIPS.filter((ship) => !state.done.some((d) => d.shipId === ship.id) && !state.skipped.includes(ship.id) && !state.reported.includes(ship.id) && ship.id !== state.active?.shipId);
  const activeShip = state.active ? REVIEW_SHIPS.find((s) => s.id === state.active?.shipId) : undefined;

  function claim() {
    const ship = nextShip(state);
    if (!ship) {
      say("The sample queue is empty.");
      return;
    }
    setState((prev) => ({ ...prev, active: { shipId: ship.id, claimedAt: previewNow(), repoViewed: false, draft: EMPTY_DRAFT } }));
    say(`Claimed ${ship.codename}. You can hold one assignment at a time.`);
  }

  function release(kind: "skip" | "report") {
    if (!state.active) return;
    const id = state.active.shipId;
    setState((prev) => ({
      ...prev,
      active: null,
      skipped: kind === "skip" ? [...prev.skipped, id] : prev.skipped,
      reported: kind === "report" ? [...prev.reported, id] : prev.reported,
    }));
    say(kind === "skip" ? "Skipped. You will not be assigned that ship again, and it does not count toward your duty." : "Reported. A moderator would look at it, and it does not count toward your duty.");
  }

  function submit(draft: ReviewDraft) {
    const active = state.active;
    if (!active) return;
    const before = reviewsDoneCount(state);
    const scores = draft.scores as Record<string, number>;
    setState((prev) => ({
      ...prev,
      active: null,
      done: [
        ...prev.done,
        {
          id: uid("given"),
          shipId: active.shipId,
          scores: {
            originality: scores.originality,
            technicalDepth: scores.technicalDepth,
            execution: scores.execution,
            documentation: scores.documentation,
          },
          reason: draft.reason.trim(),
          claimedAt: active.claimedAt,
          submittedAt: previewNow(),
          repoViewed: active.repoViewed,
        },
      ],
    }));
    const after = before + 1;
    if (before < RULES.reviewsOwed && after >= RULES.reviewsOwed) {
      pushNotification({ kind: "review", title: "Review duty complete", body: `You have done ${RULES.reviewsOwed} reviews of other ships. Your own payout is no longer held for reviews.`, href: "/reviews" });
    }
    say(`Review submitted. ${Math.min(after, RULES.reviewsOwed)} of ${RULES.reviewsOwed} reviews done.`);
    settleShips();
  }

  return (
    <div className="pg-stack">
      <Panel title="Your review duty" actions={<Tag tone={done >= RULES.reviewsOwed ? "ok" : "warn"}>{done >= RULES.reviewsOwed ? "Duty complete" : `${RULES.reviewsOwed - done} owed`}</Tag>}>
        <div className="pg-stack">
          <p className="mut">
            You owe {RULES.reviewsOwed} valid reviews of other ships before your own ship is paid. A review counts only when it has all four scores and a reason of at least {RULES.minReasonWords} words.
          </p>
          <Meter value={Math.min(done, RULES.reviewsOwed)} max={RULES.reviewsOwed} label={`${Math.min(done, RULES.reviewsOwed)} of ${RULES.reviewsOwed} reviews done`} />
          <p aria-live="polite">
            {Math.min(done, RULES.reviewsOwed)} of {RULES.reviewsOwed} reviews done
            {state.dutyShortcut > 0 ? ` (${state.dutyShortcut} counted by a preview shortcut)` : ""}.
          </p>
        </div>
      </Panel>
      <Status message={message} />

      {activeShip && state.active ? (
        <Panel title={`Your assignment: ${activeShip.codename}`} actions={<Tag tone="accent">One at a time</Tag>}>
          <div className="pg-stack">
            <AssignmentSummary ship={activeShip} />
            <div className="bd-actions">
              <button
                type="button"
                className="btn btn-sm btn-quiet"
                aria-pressed={state.active.repoViewed}
                onClick={() => setState((prev) => (prev.active ? { ...prev, active: { ...prev.active, repoViewed: !prev.active.repoViewed } } : prev))}
              >
                {state.active.repoViewed ? "Repository opened (recorded)" : "I opened the repository or demo"}
              </button>
              <ConfirmButton label="Skip this ship" question="Skip this ship? You will not get it again and it will not count." confirmLabel="Yes, skip" onConfirm={() => release("skip")} />
              <ConfirmButton label="Report this ship" question="Report this ship to the moderators? It will not count either." confirmLabel="Yes, report" onConfirm={() => release("report")} />
            </div>
            <p className="bd-sub">The preview records when you claimed this ship, how long you took, and whether you opened the repository, so moderators could judge review quality. The builder never sees who you are.</p>
          </div>
        </Panel>
      ) : (
        <Panel title="Claim a ship">
          <div className="pg-stack">
            <p className="mut">
              A queue assigns reviewers one ship at a time. You cannot review your own ship, a project you are on, or one you have already reviewed.
            </p>
            {remainingCount(state) === 0 ? (
              <EmptyState title="The sample queue is empty">You reviewed, skipped or reported every sample ship. Reset the preview data in your account to start again.</EmptyState>
            ) : (
              <div className="bd-actions">
                <button type="button" className="btn" onClick={claim}>
                  Claim the next ship
                </button>
                <span className="bd-sub">{remainingCount(state)} sample ships waiting</span>
              </div>
            )}
          </div>
        </Panel>
      )}

      {state.active && activeShip ? (
        <Panel title="Score this ship">
          <ReviewForm
            key={state.active.shipId}
            draft={state.active.draft}
            onDraft={(draft) => setState((prev) => (prev.active ? { ...prev, active: { ...prev.active, draft } } : prev))}
            onSubmit={submit}
          />
        </Panel>
      ) : null}

      {queue.length > 0 && !state.active ? (
        <Panel title="Waiting in the queue">
          <p className="mut" style={{ marginBottom: 10 }}>
            Sample ships from other builders, shown by code name. Assignments are handed out in order.
          </p>
          <ul className="row-list">
            {queue.slice(0, 6).map((ship) => (
              <li key={ship.id} className="row-item">
                <span>
                  <strong>{ship.codename}</strong> <Tag>{ship.track}</Tag>
                </span>
                <span className="bd-sub">{ship.hours} h claimed (sample)</span>
              </li>
            ))}
          </ul>
          {queue.length > 6 ? <p className="bd-sub">And {queue.length - 6} more.</p> : null}
        </Panel>
      ) : null}

      <Panel title="Reviews you have done">
        {state.done.length === 0 ? (
          <p className="mut">None yet.</p>
        ) : (
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Reviews you submitted</caption>
              <thead>
                <tr>
                  <th scope="col">Ship</th>
                  {CATEGORIES.map((c) => (
                    <th key={c.key} scope="col" className="num">
                      {c.label}
                    </th>
                  ))}
                  <th scope="col">Reason</th>
                  <th scope="col">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {state.done.map((review) => (
                  <tr key={review.id}>
                    <th scope="row">{REVIEW_SHIPS.find((s) => s.id === review.shipId)?.codename ?? review.shipId}</th>
                    {CATEGORIES.map((c) => (
                      <td key={c.key} className="num">
                        {review.scores[c.key]}
                      </td>
                    ))}
                    <td className="bd-wrap" style={{ minWidth: 220 }}>
                      {review.reason}
                    </td>
                    <td>{fmtDateTime(review.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function AssignmentSummary({ ship }: { ship: ReviewShip }) {
  const hardware = ship.track === "Hardware";
  return (
    <div className="pg-stack">
      <div className="bd-meta">
        <Tag>{ship.track}</Tag>
        <Tag>{hardware ? "Hardware" : "Software"}</Tag>
        {ship.researchMode ? <Tag>Research Mode</Tag> : null}
        <Tag tone="ok">Open source: {licenseLabel(ship.license) || ship.license}</Tag>
      </div>
      <p className="bd-wrap">{ship.summary}</p>
      <div>
        <h3>Capability statement</h3>
        <p className="bd-wrap">{ship.capability}</p>
      </div>
      <dl className="bd-kv">
        <div>
          <dt>Hours claimed (sample)</dt>
          <dd>{ship.hours} h</dd>
        </div>
        <div>
          <dt>Journal entries</dt>
          <dd>{ship.journals}</dd>
        </div>
        <div>
          <dt>Repository</dt>
          <dd>{ship.repoLabel}</dd>
        </div>
      </dl>
      {hardware ? <p className="bd-sub">A Lapse recording and a bill of materials come with Hardware ships. Recordings are visible to reviewers only; the preview has none to play.</p> : null}
      <p className="bd-sub">This is a made-up ship. The repository above is a label, not a link.</p>
    </div>
  );
}
