"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { updateProject, type FormState } from "@/lib/platform/actions";
import { checkLinkUrl } from "@/lib/platform/profile";
import { setProjectLinks } from "@/lib/platform/profile-actions";
import { PROJECT_DESCRIPTION_MAX, PROJECT_TITLE_MAX, trackLocked } from "@/lib/platform/projects";
import { FormStatus } from "./forms";
import { TrackChoices } from "./TrackChoices";

type EditableProject = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status: string;
  repoUrl?: string | null;
  demoUrl?: string | null;
};

const idle: FormState = { status: "idle" };

// One Save does both writes. The addresses are checked here first (the same pure rule the server uses), so a bad address stops
// the save before anything is written; then the project fields, then the links.
async function saveProjectAndLinks(prev: FormState, formData: FormData): Promise<FormState> {
  const repo = checkLinkUrl(formData.get("repoUrl"), "source link");
  if (!repo.ok) return { status: "error", field: "repoUrl", message: repo.message };
  const demo = checkLinkUrl(formData.get("demoUrl"), "demo link");
  if (!demo.ok) return { status: "error", field: "demoUrl", message: demo.message };
  const saved = await updateProject(prev, formData);
  if (saved.status !== "saved") return saved;
  const links = await setProjectLinks(prev, formData);
  return links.status === "saved" ? saved : links;
}

function EditForm({ project, onSaved, onCancel }: { project: EditableProject; onSaved: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(saveProjectAndLinks, idle);
  // Controlled, because React resets uncontrolled fields after every form action, even one that returned an error.
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? "");
  const [demoUrl, setDemoUrl] = useState(project.demoUrl ?? "");
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const repoId = useId();
  const repoHintId = useId();
  const repoErrorId = useId();
  const demoId = useId();
  const demoErrorId = useId();

  useEffect(() => {
    if (state.status === "saved") onSaved();
  }, [state, onSaved]);

  const titleError = state.status === "error" && state.field === "title" ? state.message : undefined;
  const descriptionError = state.status === "error" && state.field === "description" ? state.message : undefined;
  const repoError = state.status === "error" && state.field === "repoUrl" ? state.message : undefined;
  const demoError = state.status === "error" && state.field === "demoUrl" ? state.message : undefined;
  const locked = trackLocked(project.status);
  const trackError = state.status === "error" && state.field === "track" ? state.message : undefined;

  return (
    <form action={action} className="pf-dialog-form" noValidate>
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
          value={title}
          onChange={(event) => setTitle(event.target.value)}
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
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-describedby={descriptionError ? errorId : undefined}
        />
        {descriptionError ? <p className="pf-error" id={errorId}>{descriptionError}</p> : null}
      </div>
      <div className="pf-field">
        <label htmlFor={repoId}>
          Source code address <span className="pf-hint">(optional)</span>
        </label>
        <span className="pf-hint" id={repoHintId}>
          A public https address. Needed if you want other builders to equip your project from the Toolbelt.
        </span>
        <input
          id={repoId}
          name="repoUrl"
          className="pf-input"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          aria-describedby={repoError ? `${repoHintId} ${repoErrorId}` : repoHintId}
          aria-invalid={repoError ? true : undefined}
        />
        {repoError ? <p className="pf-error" id={repoErrorId}>{repoError}</p> : null}
      </div>
      <div className="pf-field">
        <label htmlFor={demoId}>
          Demo address <span className="pf-hint">(optional)</span>
        </label>
        <input
          id={demoId}
          name="demoUrl"
          className="pf-input"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={demoUrl}
          onChange={(event) => setDemoUrl(event.target.value)}
          aria-describedby={demoError ? demoErrorId : undefined}
          aria-invalid={demoError ? true : undefined}
        />
        {demoError ? <p className="pf-error" id={demoErrorId}>{demoError}</p> : null}
      </div>
      <fieldset className="pf-field pf-choices" aria-describedby={trackError ? errorId : undefined}>
        <legend>Track</legend>
        <TrackChoices defaultValue={project.track ?? ""} locked={locked} />
        <p className="pf-hint">
          {locked
            ? "The track is locked: this project has been submitted."
            : "The track locks when you submit. You can change it while the project is a draft or after a reviewer asks for changes."}
        </p>
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

// The Edit project button and its dialog, as Stasis's edit modal: name, description, source and demo addresses and track in one step.
export function EditProjectDialog({ project }: Readonly<{ project: EditableProject }>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  // The form exists only while the dialog is open, so it always starts from the project as the page has it now.
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  // The links are a second write after the project fields; refresh once both are in so the page props are current when it reopens.
  const saved = useCallback(() => {
    dialog.current?.close();
    router.refresh();
  }, [router]);

  useEffect(() => {
    const element = dialog.current;
    if (isOpen && element && !element.open) {
      element.showModal();
      element.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
    }
  }, [isOpen]);
  const close = useCallback(() => dialog.current?.close(), []);

  return (
    <>
      <button type="button" className="pf-btn" onClick={() => setIsOpen(true)}>Edit project</button>
      <dialog ref={dialog} className="pf-dialog" aria-labelledby={headingId} onClose={() => setIsOpen(false)}>
        <div className="pf-dialog-head">
          <h2 id={headingId}>Edit project</h2>
          <button type="button" className="pf-btn" onClick={close}>Close</button>
        </div>
        {isOpen ? <EditForm project={project} onSaved={saved} onCancel={close} /> : null}
      </dialog>
    </>
  );
}
