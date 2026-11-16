"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import type { FormState } from "@/lib/platform/actions";
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

function ConfirmForm({ body, confirmLabel, action, fields, onClose, onDone, bodyId }: Omit<Props, "open" | "title"> & { bodyId: string }) {
  const [state, run, pending] = useActionState(action, idle);
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
        <button type="button" className="pf-btn" data-cancel onClick={onClose}>Cancel</button>
        <button type="submit" className="pf-btn pf-btn-danger" disabled={pending}>
          {pending ? "Saving" : confirmLabel}
        </button>
      </div>
    </form>
  );
}

// A native confirmation dialog (design spec 3.17): the title and the body text, Cancel focused first, Escape cancels, the confirm button
// reads "Saving" while the action runs. The form exists only while open, so it is fresh every time. There is no Close button; Cancel is the close. Used for Remove and Block.
export function ConfirmDialog(props: Readonly<Props>) {
  const { open, onClose, title } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const bodyId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLButtonElement>("button[data-cancel]")?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog ref={dialog} className="pf-dialog pf-confirm" aria-labelledby={headingId} aria-describedby={bodyId} onClose={onClose}>
      <div className="pf-dialog-head">
        <h2 id={headingId}>{title}</h2>
      </div>
      {open ? <ConfirmForm {...props} bodyId={bodyId} /> : null}
    </dialog>
  );
}
