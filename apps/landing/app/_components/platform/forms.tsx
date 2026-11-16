"use client";

import { useActionState, useId } from "react";
import { setFlagState, type FormState } from "@/lib/platform/actions";

const idle: FormState = { status: "idle" };

export function FormStatus({ state }: { state: FormState }) {
  if (state.status === "error") return <p className="pf-error" role="alert">{state.message}</p>;
  if (state.status === "saved") return <p className="pf-saved" role="status">{state.message}</p>;
  return null;
}

function errorFor(state: FormState, field: string) {
  return state.status === "error" && state.field === field ? state.message : undefined;
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
