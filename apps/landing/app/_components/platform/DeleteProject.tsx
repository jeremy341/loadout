"use client";

import { useActionState, useId, useState } from "react";
import { deleteProject, type FormState } from "@/lib/platform/actions";
import { deleteConfirmed } from "@/lib/platform/projects";
import { FormStatus } from "./forms";

const idle: FormState = { status: "idle" };

// The Stasis delete block: a button that reveals a field where the project name is typed back before the delete button
// works. The server checks the name and the owner again, so this form is a convenience and not the guard.
export function DeleteProject({ id, title }: Readonly<{ id: string; title: string }>) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, action, pending] = useActionState(deleteProject, idle);
  const fieldId = useId();
  const errorId = useId();
  const confirmError = state.status === "error" && state.field === "confirm" ? state.message : undefined;

  return (
    <section className="pf-box pf-danger" aria-labelledby="delete-heading">
      <h2 id="delete-heading">Delete project</h2>
      <p className="pf-panel-lead">Deleting removes the project for good. This cannot be undone.</p>
      {open ? (
        <form action={action} className="pf-delete-form">
          <input type="hidden" name="id" value={id} />
          <div className="pf-field">
            <label htmlFor={fieldId}>
              Type <strong>{title}</strong> to confirm
            </label>
            <input
              id={fieldId}
              name="confirm"
              className="pf-input"
              type="text"
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              aria-describedby={confirmError ? errorId : undefined}
              aria-invalid={confirmError ? true : undefined}
            />
            {confirmError ? <p className="pf-error" id={errorId}>{confirmError}</p> : null}
          </div>
          <div aria-live="polite">{state.status === "error" && !state.field ? <FormStatus state={state} /> : null}</div>
          <div className="pf-delete-actions">
            <button
              type="button"
              className="pf-btn"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="pf-btn pf-btn-danger" disabled={!deleteConfirmed(typed, title) || pending}>
              {pending ? "Deleting" : "Permanently delete project"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="pf-btn pf-btn-danger" aria-expanded={false} onClick={() => setOpen(true)}>
          Delete project...
        </button>
      )}
    </section>
  );
}
