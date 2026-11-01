"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createProject, type FormState } from "@/lib/platform/actions";
import { PROJECT_DESCRIPTION_MAX, PROJECT_TITLE_MAX } from "@/lib/platform/projects";
import { FormStatus } from "./forms";
import { TrackChoices } from "./TrackChoices";

const STEPS = ["Details", "Track"] as const;
const idle: FormState = { status: "idle" };

// The header button and the grid card both open the one dialog through this event.
export const OPEN_NEW_PROJECT_EVENT = "loadout:open-new-project";

export function OpenNewProjectButton() {
  return (
    <button type="button" className="pf-btn pri" onClick={() => window.dispatchEvent(new Event(OPEN_NEW_PROJECT_EVENT))}>
      New project →
    </button>
  );
}

// The New Project card and its two-step dialog, as Stasis does it: Details, then the track. Native dialog, so Escape
// closes it and focus stays inside while it is open. Every field stays mounted while the steps change, so the form
// posts all of them at once.
export function NewProjectDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const headingId = useId();
  const titleHint = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const trackStep = useRef<HTMLFieldSetElement>(null);
  const titleField = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(createProject, idle);

  // A saved project closes the dialog. Closing clears it (see reset), so the next project starts empty.
  useEffect(() => {
    if (state.status === "saved") dialog.current?.close();
  }, [state]);

  // Moving between steps moves focus with it, so keyboard users are not left on a hidden control.
  useEffect(() => {
    if (step === 0) titleField.current?.focus();
    else trackStep.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
  }, [step]);

  const titleError = state.status === "error" && state.field === "title" ? state.message : undefined;
  const descriptionError = state.status === "error" && state.field === "description" ? state.message : undefined;
  const trackError = state.status === "error" && state.field === "track" ? state.message : undefined;
  const hasTitle = title.trim().length > 0;

  const openDialog = useCallback(() => {
    setStep(0);
    dialog.current?.showModal();
    titleField.current?.focus();
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_NEW_PROJECT_EVENT, openDialog);
    return () => window.removeEventListener(OPEN_NEW_PROJECT_EVENT, openDialog);
  }, [openDialog]);

  const reset = () => {
    form.current?.reset();
    setTitle("");
    setStep(0);
  };

  // Enter in the name field moves to the next step instead of submitting a half-filled project.
  const nextOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (hasTitle) setStep(1);
  };

  return (
    <>
      <button type="button" className="pf-new-card" onClick={openDialog} data-testid="new-project">
        <svg className="pf-new-plus" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <rect x="5" y="1" width="2" height="10" />
          <rect x="1" y="5" width="10" height="2" />
        </svg>
        <span className="pf-new-label">New project</span>
        <span className="pf-new-sub">Name it, pick a track.</span>
      </button>

      <dialog ref={dialog} className="pf-dialog" aria-labelledby={headingId} onClose={reset}>
        <div className="pf-dialog-head">
          <h2 id={headingId}>New project</h2>
          <button type="button" className="pf-btn" onClick={() => dialog.current?.close()}>Close</button>
        </div>

        <div className="pf-steps" role="group" aria-label="Steps">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              className="pf-step"
              aria-current={step === index ? "step" : undefined}
              disabled={index === 1 && !hasTitle}
              onClick={() => setStep(index)}
            >
              <span>{index + 1}.</span> {label}
            </button>
          ))}
        </div>

        <form ref={form} action={action} className="pf-dialog-form">
          <div className="pf-step-pane" hidden={step !== 0}>
            <div className="pf-field">
              <label htmlFor={titleId}>Project name</label>
              <span className="pf-hint" id={titleHint}>Up to {PROJECT_TITLE_MAX} characters. You can change it later.</span>
              <input
                ref={titleField}
                id={titleId}
                name="title"
                className="pf-input"
                type="text"
                required
                maxLength={PROJECT_TITLE_MAX}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={nextOnEnter}
                aria-describedby={titleError ? `${titleHint} ${errorId}` : titleHint}
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
                aria-describedby={descriptionError ? errorId : undefined}
              />
              {descriptionError ? <p className="pf-error" id={errorId}>{descriptionError}</p> : null}
            </div>
            <button type="button" className="pf-btn pri pf-wide" disabled={!hasTitle} onClick={() => setStep(1)}>
              Next
            </button>
          </div>

          <fieldset ref={trackStep} hidden={step !== 1} className="pf-field pf-choices" aria-describedby={trackError ? errorId : undefined}>
            <legend>Which track is this build in? <span className="pf-hint">(you can pick later)</span></legend>
            <TrackChoices />
            {trackError ? <p className="pf-error" id={errorId}>{trackError}</p> : null}
          </fieldset>

          <div aria-live="polite"><FormStatus state={state} /></div>

          <div className="pf-dialog-actions" hidden={step !== 1}>
            <button type="button" className="pf-btn" onClick={() => setStep(0)}>Back</button>
            <button type="submit" className="pf-btn pri pf-wide" disabled={pending || !hasTitle}>
              {pending ? "Creating" : "Create project"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
