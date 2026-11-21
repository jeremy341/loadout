"use client";

import { useActionState, useEffect, useId, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { PfModal } from "./PfModal";
import "./toolbelt.css";

const idle: FormState = { status: "idle" };

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

type Props = {
  open: boolean;
  // Native Escape, Cancel and a finished action all end here. The caller then decides where focus goes.
  onClose: () => void;
  onDone: () => void;
  title: string;
  // Body text. A fragment is fine; it is what aria-describedby points at.
  body: React.ReactNode;
  confirmLabel: string;
  action: Action;
  fields: Record<string, string>;
};

function ConfirmForm({ body, confirmLabel, action, fields, onClose, onDone, bodyId, onBusy }: Omit<Props, "open" | "title"> & { bodyId: string; onBusy: (busy: boolean) => void }) {
  const [state, run, pending] = useActionState(action, idle);
  // The modal around this form blocks Escape, the backdrop and Close while the action runs.
  useEffect(() => {
    onBusy(pending);
    return () => onBusy(false);
  }, [pending, onBusy]);
  useEffect(() => {
    if (state.status === "saved") onDone();
  }, [state, onDone]);
  return (
    <form action={run} className="pf-confirm-form">
      {Object.entries(fields).map(([name, value]) => (
        <input type="hidden" name={name} value={value} key={name} />
      ))}
      <div className="pf-confirm-body" id={bodyId}>{body}</div>
      <div aria-live="polite">{state.status === "error" ? <p className="pf-error" role="alert">{state.message}</p> : null}</div>
      <div className="pf-confirm-actions">
        <button type="button" className="pf-btn" data-cancel onClick={onClose} disabled={pending}>Cancel</button>
        <button type="submit" className="pf-btn pf-btn-danger" disabled={pending}>
          {pending ? "Saving" : confirmLabel}
        </button>
      </div>
    </form>
  );
}

// The confirmation modal (design spec 3.17): the title and the body text, Cancel focused first, Escape cancels (not while the action runs, when Cancel is disabled too), the confirm button
// reads "Saving" while the action runs. The form exists only while open, so it is fresh every time. There is no Close button; Cancel is the close. Used for Remove and Block.
export function ConfirmDialog(props: Readonly<Props>) {
  const { open, onClose, title } = props;
  const bodyId = useId();
  const [busy, setBusy] = useState(false);

  return (
    <PfModal open={open} onClose={onClose} title={title} size="confirm" variant="danger" closeButton={false} initialFocus="button[data-cancel]" describedBy={bodyId} busy={busy}>
      {open ? <ConfirmForm {...props} bodyId={bodyId} onBusy={setBusy} /> : null}
    </PfModal>
  );
}
