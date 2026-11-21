"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useMemo, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { checkChangeNote } from "@/lib/platform/review-rules";
import { requestUpdate, submitShip, unsubmitShip } from "@/lib/platform/ship-actions";
import type { ShipItem } from "@/lib/platform/ship-gate";
import { FormStatus } from "./forms";
import { PfModal } from "./PfModal";
import "./ship.css";

const idle: FormState = { status: "idle" };
const REASON_TEXT: Record<string, string> = {
  track: "Does not fit the track",
  readme: "README missing steps",
  hours: "Hours do not match the work",
  ai: "Too much AI",
  other: "Other",
};

// One plain next step per reason, restating what the reviewer chose. Reasons without a specific step use the generic one.
const REASON_STEP: Record<string, string> = {
  track: "Pick the track again in the project settings. It is open for you now.",
  readme: "Add the missing steps to your README.",
  hours: "Check the hours in your journal entries against the work you did.",
};

const TICK = "M1 6h2v2h2v2H3V8H1zM5 8h2V6h2V4h2v2H9v2H7v2H5z";
const WAIT_SR: Record<ShipItem["state"], string> = { pass: ", done", fail: ", not done", waiting: ", waiting" };

// One line per check, drawn from the same list the server uses to refuse a submit. Done is a tick, not done is an empty square in the
// text colour (a to do, not an error), waiting is a dashed square and never blocks.
export function ShipChecklist({ items, id }: Readonly<{ items: readonly ShipItem[]; id?: string }>) {
  return (
    <ul className="pf-checks pf-ship-checks" id={id}>
      {items.map((item) => (
        <li key={item.code} data-state={item.state} data-code={item.code}>
          <span className="pf-check-box" aria-hidden="true">
            {item.state === "pass" ? (
              <svg viewBox="0 0 12 12" width="12" height="12" shapeRendering="crispEdges" focusable="false">
                <path d={TICK} />
              </svg>
            ) : null}
          </span>
          <span>
            {item.label}
            <span className="pf-sr">{WAIT_SR[item.state]}</span>
            {item.state !== "pass" && item.message ? <span className="pf-column-reason pf-ship-reason">{item.message}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SubmitDialog({
  projectId,
  items,
  needsNote,
  onClose,
  onDone,
}: Readonly<{ projectId: string; items: readonly ShipItem[]; needsNote: boolean; onClose: () => void; onDone: () => void }>) {
  const [state, action, pending] = useActionState(submitShip, idle);
  const [attested, setAttested] = useState(false);
  const [note, setNote] = useState("");
  const tickId = useId();
  const noteId = useId();
  const noteHintId = useId();
  const noteError = state.status === "error" && state.field === "changeNote" ? state.message : undefined;
  const tickError = state.status === "error" && state.field === "attested" ? state.message : undefined;

  useEffect(() => {
    if (state.status === "saved") onDone();
  }, [state, onDone]);

  // The two lines only this dialog can clear follow what is typed and ticked.
  const live = useMemo(
    () =>
      items.map((item) => {
        if (item.code === "attestation_required") return { ...item, state: attested ? ("pass" as const) : ("fail" as const) };
        if (item.code === "change_note_required") {
          const ok = checkChangeNote(note).ok;
          return { ...item, state: ok ? ("pass" as const) : ("fail" as const) };
        }
        return item;
      }),
    [items, attested, note],
  );
  const stuck = live.filter((item) => item.state === "fail");
  const first = stuck[0];

  return (
    <form action={action} className="pf-modal-form pf-ship-form" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <ShipChecklist items={live} />
      {needsNote ? (
        <div className="pf-field">
          <label htmlFor={noteId}>What changed?</label>
          <textarea
            id={noteId}
            name="changeNote"
            className="pf-textarea"
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-describedby={[noteHintId, noteError ? `${noteId}-error` : null].filter(Boolean).join(" ")}
            aria-invalid={noteError ? true : undefined}
          />
          <p className="pf-hint" id={noteHintId}>At least 100 characters. {note.trim().length} so far. Say what you fixed or added since the last ship.</p>
          {noteError ? <p className="pf-error" id={`${noteId}-error`}>{noteError}</p> : null}
        </div>
      ) : null}
      <div className="pf-field pf-ship-tick">
        <label className="pf-ship-tick-label pf-pick pf-pick-plain" htmlFor={tickId}>
          <input id={tickId} name="attested" type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} />
          <span>I confirm this is not school work and not paid Hack Club work.</span>
        </label>
        {tickError ? <p className="pf-error">{tickError}</p> : null}
      </div>
      <div aria-live="polite">{state.status === "error" && !state.field ? <FormStatus state={state} /> : null}</div>
      <div className="pf-modal-actions">
        <button type="button" className="pf-btn" onClick={onClose}>Cancel</button>
        <button type="submit" className="pf-btn pri pf-wide" disabled={pending || Boolean(first)} aria-describedby={first ? `${tickId}-why` : undefined}>
          {pending ? "Submitting" : "Submit for review"}
        </button>
      </div>
      {first ? <p className="pf-sr" id={`${tickId}-why`}>{first.message}</p> : null}
    </form>
  );
}

function ActionButton({
  action,
  projectId,
  label,
  pendingLabel,
  className = "pf-btn",
}: Readonly<{ action: (prev: FormState, data: FormData) => Promise<FormState>; projectId: string; label: string; pendingLabel: string; className?: string }>) {
  const [state, run, pending] = useActionState(action, idle);
  const router = useRouter();
  useEffect(() => {
    if (state.status === "saved") router.refresh();
  }, [state, router]);
  return (
    <form action={run} className="pf-ship-action">
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" className={className} disabled={pending}>{pending ? pendingLabel : label}</button>
      <div aria-live="polite">{state.status === "error" ? <FormStatus state={state} /> : null}</div>
    </form>
  );
}

// The ship section of the project page. What it offers depends on the status: submit (with the checklist dialog), take back while
// plain submitted, nothing while a reviewer has it, request an update once approved. The server checks every one of these again.
export function ShipPanel({
  projectId,
  status,
  items,
  triggerReason,
  needsNote,
  reviewNote,
  reviewReason = null,
  approvedMinutes = 0,
  isUpdate,
}: Readonly<{
  projectId: string;
  status: string;
  items: readonly ShipItem[];
  triggerReason: string | null;
  needsNote: boolean;
  reviewNote: string | null;
  // The code of the last "request changes" (track, readme, hours, ai, other) and the minutes a reviewer has approved so far.
  reviewReason?: string | null;
  approvedMinutes?: number;
  isUpdate: boolean;
}>) {
  const reasonId = useId();
  const returnedId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const closeModal = useCallback(() => setIsOpen(false), []);
  const done = useCallback(() => {
    setIsOpen(false);
    router.refresh();
  }, [router]);

  if (status === "submitted") {
    return (
      <>
        <p className="pf-ship-state" data-ship="submitted">Submitted. Nobody has picked it up yet, so you can still take it back to edit it.</p>
        <ActionButton action={unsubmitShip} projectId={projectId} label="Take it back" pendingLabel="Taking it back" />
      </>
    );
  }
  if (status === "in-review" || status === "second-pass") {
    return <p className="pf-ship-state" data-ship={status}>{status === "second-pass" ? "Second pass: a reviewer is checking it." : "A reviewer is looking at your ship. It can't change until they decide."}</p>;
  }
  if (status === "banned") return <p className="pf-ship-state" data-ship="banned">This project was banned. Ask support.</p>;
  if (status === "approved") {
    return (
      <>
        {reviewNote ? (
          <div className="pf-ship-note" role="note">
            <p className="pf-ship-note-title">Reviewer note</p>
            <p>{reviewNote}</p>
          </div>
        ) : null}
        {approvedMinutes > 0 ? <p className="pf-hint">{`Credited ${Math.round(approvedMinutes / 6) / 10} approved hours.`}</p> : null}
        <p className="pf-ship-state" data-ship="approved">Approved. Made changes since? Open an update, then ship again with a note on what changed. Only new hours pay.</p>
        <ActionButton action={requestUpdate} projectId={projectId} label="Request an update" pendingLabel="Opening" />
      </>
    );
  }

  return (
    <>
      {status === "needs-changes" ? (
        <section className="pf-ship-returned" aria-labelledby={returnedId} data-testid="ship-returned">
          <h3 id={returnedId}>Changes requested</h3>
          {reviewReason && REASON_TEXT[reviewReason] ? <p className="pf-ship-returned-reason">{`Reason: ${REASON_TEXT[reviewReason]}`}</p> : null}
          {reviewNote ? (
            <div className="pf-ship-note" role="note">
              <p className="pf-ship-note-title">Reviewer note</p>
              <p>{reviewNote}</p>
            </div>
          ) : (
            <p className="pf-hint">The reviewer did not leave a written note.</p>
          )}
          <ol className="pf-ship-returned-steps">
            <li>{reviewReason && REASON_STEP[reviewReason] ? REASON_STEP[reviewReason] : "Fix what the note describes in your project and journal."}</li>
            <li>Check the list below. Anything not done yet is still open.</li>
            <li>Submit for review again and say what changed in the change note.</li>
          </ol>
        </section>
      ) : null}
      {isUpdate ? <p className="pf-hint">This is an update ship. Add a note on what changed. Only new hours pay.</p> : null}
      <ShipChecklist items={items} id="ship-checklist" />
      <button
        type="button"
        className="pf-btn pri pf-wide"
        disabled={Boolean(triggerReason)}
        aria-describedby={triggerReason ? reasonId : undefined}
        onClick={() => setIsOpen(true)}
      >
        Submit for review
      </button>
      {triggerReason ? <p className="pf-hint pf-box-note" id={reasonId}>{triggerReason}</p> : null}
      <PfModal open={isOpen} onClose={closeModal} title="Submit for review" size="wide">
        {isOpen ? <SubmitDialog projectId={projectId} items={items} needsNote={needsNote} onClose={closeModal} onDone={done} /> : null}
      </PfModal>
    </>
  );
}
