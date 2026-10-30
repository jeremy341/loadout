"use client";

import { useActionState, useId } from "react";
import { setFlagState, updateAccess, type FormState } from "@/lib/platform/actions";

const idle: FormState = { status: "idle" };

export function FormStatus({ state }: { state: FormState }) {
  if (state.status === "error") return <p className="pf-error" role="alert">{state.message}</p>;
  if (state.status === "saved") return <p className="pf-saved" role="status">{state.message}</p>;
  return null;
}

function errorFor(state: FormState, field: string) {
  return state.status === "error" && state.field === field ? state.message : undefined;
}

export function AccessForm({
  personId,
  staff,
  banned,
  isSelf,
}: {
  personId: string;
  staff: boolean;
  banned: boolean;
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(updateAccess, idle);
  const staffId = useId();
  const bannedId = useId();
  const reasonId = useId();
  const hintId = useId();
  const reasonError = errorFor(state, "reason");
  const errorId = useId();
  return (
    <form action={action} className="pf-panel" aria-label="Change access">
      <input type="hidden" name="personId" value={personId} />
      <div className="pf-field">
        <label className="pf-check" htmlFor={staffId}>
          <input id={staffId} name="staff" type="checkbox" defaultChecked={staff} disabled={isSelf} />
          Staff role
        </label>
        <label className="pf-check" htmlFor={bannedId}>
          <input id={bannedId} name="banned" type="checkbox" defaultChecked={banned} disabled={isSelf} />
          Banned from the platform
        </label>
        {isSelf ? <span className="pf-hint">You cannot change your own access.</span> : null}
      </div>
      <div className="pf-field">
        <label htmlFor={reasonId}>Reason for this change</label>
        <span className="pf-hint" id={hintId}>Required. Between 10 and 500 characters. The reason is kept in the audit log.</span>
        <textarea
          id={reasonId}
          name="reason"
          className="pf-textarea"
          required
          minLength={10}
          maxLength={500}
          aria-describedby={reasonError ? `${hintId} ${errorId}` : hintId}
          aria-invalid={reasonError ? true : undefined}
        />
        {reasonError ? <p className="pf-error" id={errorId}>{reasonError}</p> : null}
      </div>
      <button className="pf-btn pri" type="submit" disabled={pending || isSelf}>
        {pending ? "Saving" : "Save changes"}
      </button>
      <div aria-live="polite"><FormStatus state={state} /></div>
    </form>
  );
}

export function FlagForm({ name, enabled }: { name: string; enabled: boolean }) {
  const [state, action, pending] = useActionState(setFlagState, idle);
  const reasonId = useId();
  const hintId = useId();
  const errorId = useId();
  const reasonError = errorFor(state, "reason");
  return (
    <form action={action} className="pf-panel" aria-label={`Change ${name}`}>
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="target" value={enabled ? "off" : "on"} />
      <div className="pf-field">
        <label htmlFor={reasonId}>Reason for {enabled ? "turning off" : "turning on"}</label>
        <span className="pf-hint" id={hintId}>Required. Between 10 and 500 characters.</span>
        <textarea
          id={reasonId}
          name="reason"
          className="pf-textarea"
          required
          minLength={10}
          maxLength={500}
          aria-describedby={reasonError ? `${hintId} ${errorId}` : hintId}
          aria-invalid={reasonError ? true : undefined}
        />
        {reasonError ? <p className="pf-error" id={errorId}>{reasonError}</p> : null}
      </div>
      <button className="pf-btn pri" type="submit" disabled={pending}>
        {pending ? "Saving" : enabled ? "Turn off" : "Turn on"}
      </button>
      <div aria-live="polite"><FormStatus state={state} /></div>
    </form>
  );
}
