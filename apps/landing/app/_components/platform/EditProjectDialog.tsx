"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { updateProject, type FormState } from "@/lib/platform/actions";
import { PROJECT_DESCRIPTION_MAX, PROJECT_TITLE_MAX } from "@/lib/platform/projects";
import { FormStatus } from "./forms";
import { TrackChoices } from "./TrackChoices";

type EditableProject = { id: string; title: string; description: string | null; track: string | null };

const idle: FormState = { status: "idle" };

function EditForm({ project, onSaved, onCancel }: { project: EditableProject; onSaved: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(updateProject, idle);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  useEffect(() => {
    if (state.status === "saved") onSaved();
  }, [state, onSaved]);

  const titleError = state.status === "error" && state.field === "title" ? state.message : undefined;
  const descriptionError = state.status === "error" && state.field === "description" ? state.message : undefined;
  const trackError = state.status === "error" && state.field === "track" ? state.message : undefined;

  return (
    <form action={action} className="pf-dialog-form">
      <input type="hidden" name="id" value={project.id} />
      <div className="pf-field">
        <label htmlFor={titleId}>Project name</label>
        <input
          id={titleId}
          name="title"
          className="pf-input"
          type="text"
          required
          maxLength={PROJECT_TITLE_MAX}
          defaultValue={project.title}
          aria-describedby={titleError ? errorId : undefined}
          aria-invalid={titleError ? true : undefined}
        />
        {titleError ? <p className="pf-error" id={errorId}>{titleError}</p> : null}
      </div>
      <div className="pf-field">
        <label htmlFor={descriptionId}>
          Description <span className="pf-hint">(optional)</span>
        </label>
        <textarea
          id={descriptionId}
          name="description"
          className="pf-textarea"
          maxLength={PROJECT_DESCRIPTION_MAX}
          defaultValue={project.description ?? ""}
          aria-describedby={descriptionError ? errorId : undefined}
        />
        {descriptionError ? <p className="pf-error" id={errorId}>{descriptionError}</p> : null}
      </div>
      <fieldset className="pf-field pf-choices" aria-describedby={trackError ? errorId : undefined}>
        <legend>Track</legend>
        <TrackChoices defaultValue={project.track ?? ""} />
        {trackError ? <p className="pf-error" id={errorId}>{trackError}</p> : null}
      </fieldset>
      <div aria-live="polite">{state.status === "error" && !state.field ? <FormStatus state={state} /> : null}</div>
      <div className="pf-dialog-actions">
        <button type="button" className="pf-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="pf-btn pri pf-wide" disabled={pending}>
          {pending ? "Saving" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// The Edit project button and its dialog, as Stasis's edit modal: name, description and track in one step. The form is
// remounted each time the dialog closes, so it always opens on the saved values with no stale message.
export function EditProjectDialog({ project }: Readonly<{ project: EditableProject }>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [openCount, setOpenCount] = useState(0);

  const open = () => {
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
  };
  const close = useCallback(() => dialog.current?.close(), []);

  return (
    <>
      <button type="button" className="pf-btn" onClick={open}>Edit project</button>
      <dialog ref={dialog} className="pf-dialog" aria-labelledby={headingId} onClose={() => setOpenCount((count) => count + 1)}>
        <div className="pf-dialog-head">
          <h2 id={headingId}>Edit project</h2>
          <button type="button" className="pf-btn" onClick={close}>Close</button>
        </div>
        <EditForm
          key={openCount}
          project={project}
          onSaved={close}
          onCancel={close}
        />
      </dialog>
    </>
  );
}
