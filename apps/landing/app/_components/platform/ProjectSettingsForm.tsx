"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { updateProject, type FormState } from "@/lib/platform/actions";
import { checkLinkUrl } from "@/lib/platform/profile";
import { setProjectLinks } from "@/lib/platform/profile-actions";
import { PROJECT_DESCRIPTION_MAX, PROJECT_TITLE_MAX, trackLocked } from "@/lib/platform/projects";
import { FormStatus } from "./forms";
import { TrackChoices } from "./TrackChoices";

export type EditableProject = {
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

// The Settings tab form: name, description, source and demo addresses and track, one Save. It replaces the old Edit project dialog.
export function ProjectSettingsForm({ project }: Readonly<{ project: EditableProject }>) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProjectAndLinks, idle);
  // Controlled, because React resets uncontrolled fields after every form action, even one that returned an error.
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? "");
  const [demoUrl, setDemoUrl] = useState(project.demoUrl ?? "");
  // "Saved." describes the text as it was saved, so any edit afterwards (the track choices are uncontrolled, hence the form-level
  // handler) retires it.
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const repoId = useId();
  const repoHintId = useId();
  const repoErrorId = useId();
  const demoId = useId();
  const demoErrorId = useId();

  // The links are a second write after the project fields; refresh once both are in so the page props are current.
  useEffect(() => {
    if (state.status === "saved") router.refresh();
  }, [state, router]);

  const titleError = state.status === "error" && state.field === "title" ? state.message : undefined;
  const descriptionError = state.status === "error" && state.field === "description" ? state.message : undefined;
  const repoError = state.status === "error" && state.field === "repoUrl" ? state.message : undefined;
  const demoError = state.status === "error" && state.field === "demoUrl" ? state.message : undefined;
  const locked = trackLocked(project.status);
  const trackError = state.status === "error" && state.field === "track" ? state.message : undefined;

  return (
    <section className="pf-box" aria-labelledby="project-details-heading">
    <h2 id="project-details-heading">Project details</h2>
    <form action={action} className="pf-settings-form" noValidate onChange={() => setDismissed(state)}>
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
        <TrackChoices defaultValue={project.track ?? ""} locked={locked} allowLater={project.track === null} />
        <p className="pf-hint">
          {locked
            ? "The track is locked: this project has been submitted."
            : "The track locks when you submit. You can change it while the project is a draft or after a reviewer asks for changes."}
        </p>
        {trackError ? <p className="pf-error" id={errorId}>{trackError}</p> : null}
      </fieldset>
      {locked ? <p className="pf-hint" id="edit-locked">This project is with the reviewers or approved, so it can&apos;t be edited right now.</p> : null}
      <div aria-live="polite">{state.status === "error" && !state.field ? <FormStatus state={state} /> : null}{state.status === "saved" && state !== dismissed ? <p className="pf-saved" role="status">Saved.</p> : null}</div>
      <div className="pf-settings-actions">
        <button type="submit" className="pf-btn pri pf-wide" disabled={pending || locked} aria-describedby={locked ? "edit-locked" : undefined}>
          {pending ? "Saving" : "Save changes"}
        </button>
      </div>
    </form>
    </section>
  );
}
