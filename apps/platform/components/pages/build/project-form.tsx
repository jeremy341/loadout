"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field } from "../../ui/ui";
import { focusFirstInvalid } from "./parts";
import { OPEN_LICENSES, validateProject, type FieldErrors, type ProjectInput } from "./logic/validate";
import type { Project, TrackName } from "./logic/types";

const TRACKS: TrackName[] = ["Tools", "Systems", "Compute", "Hardware"];

export interface ProjectDraft extends ProjectInput {
  track: TrackName;
  researchMode: boolean;
  visibility: "public" | "private";
}

export function emptyDraft(): ProjectDraft {
  return { name: "", summary: "", capability: "", track: "Tools", researchMode: false, repoUrl: "", license: "", visibility: "public", collaborators: "" };
}

export function draftFromProject(project: Project): ProjectDraft {
  return {
    name: project.name,
    summary: project.summary,
    capability: project.capability,
    track: project.track,
    researchMode: project.researchMode,
    repoUrl: project.repoUrl,
    license: project.license,
    visibility: project.visibility,
    collaborators: project.collaborators,
  };
}

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ProjectDraft;
  submitLabel: string;
  onSubmit: (draft: ProjectDraft) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<ProjectDraft>(initial);
  const [errors, setErrors] = useState<FieldErrors<keyof ProjectInput>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const hardware = draft.track === "Hardware";

  function set<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof ProjectInput]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateProject(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }
    onSubmit({ ...draft, name: draft.name.trim(), summary: draft.summary.trim(), capability: draft.capability.trim(), repoUrl: draft.repoUrl.trim(), collaborators: draft.collaborators.trim() });
  }

  const software = OPEN_LICENSES.filter((l) => l.group === "Software");
  const hardwareLicenses = OPEN_LICENSES.filter((l) => l.group === "Hardware design files");

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="pg-stack" aria-label={submitLabel}>
      <div className="form-grid">
        <Field label="Project name" error={errors.name}>
          <input value={draft.name} maxLength={120} aria-invalid={Boolean(errors.name) || undefined} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Track" hint="Hardware projects use Lapse and need a bill of materials. The other tracks use Hackatime.">
          <select value={draft.track} onChange={(e) => set("track", e.target.value as TrackName)}>
            {TRACKS.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </Field>
        <div className="wide">
          <Field label="Summary" hint="What the project does, in a sentence or two. Shown on the public page." error={errors.summary}>
            <textarea value={draft.summary} rows={3} maxLength={500} aria-invalid={Boolean(errors.summary) || undefined} onChange={(e) => set("summary", e.target.value)} />
          </Field>
        </div>
        <div className="wide">
          <Field label="Capability statement (optional)" hint="What new technical capability does this project create or make easier?" error={errors.capability}>
            <textarea value={draft.capability} rows={2} maxLength={500} aria-invalid={Boolean(errors.capability) || undefined} onChange={(e) => set("capability", e.target.value)} />
          </Field>
        </div>
        <Field label="Public repository link" hint="Accepted projects publish their source. Add the link when it exists." error={errors.repoUrl}>
          <input type="url" inputMode="url" value={draft.repoUrl} aria-invalid={Boolean(errors.repoUrl) || undefined} onChange={(e) => set("repoUrl", e.target.value)} placeholder="https://github.com/you/project" autoComplete="off" />
        </Field>
        <Field label="Open-source licence" hint="Closed or unlicensed code is not accepted. Hardware design files can use a CERN OHL licence." error={errors.license}>
          <select value={draft.license} aria-invalid={Boolean(errors.license) || undefined} onChange={(e) => set("license", e.target.value)}>
            <option value="">Choose an open-source licence</option>
            <optgroup label="Software">
              {software.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Hardware design files">
              {hardwareLicenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>
        <div className="wide">
          <Field label="Collaborators (optional)" hint="Names or handles, separated by commas. Each team member tracks and journals their own work." error={errors.collaborators}>
            <input value={draft.collaborators} maxLength={240} aria-invalid={Boolean(errors.collaborators) || undefined} onChange={(e) => set("collaborators", e.target.value)} autoComplete="off" />
          </Field>
        </div>
      </div>

      <div className="form-grid">
        <fieldset className="bd-fieldset">
          <legend>Visibility</legend>
          <div className="bd-choices">
            <label className="check">
              <input type="radio" name="visibility" checked={draft.visibility === "public"} onChange={() => set("visibility", "public")} />
              Public (default)
            </label>
            <label className="check">
              <input type="radio" name="visibility" checked={draft.visibility === "private"} onChange={() => set("visibility", "private")} />
              Private
            </label>
          </div>
          <p className="bd-sub">Projects and journals are public by default. A private project is hidden from other builders, but an accepted project must still publish its source.</p>
        </fieldset>
        <div>
          <label className="check">
            <input type="checkbox" checked={draft.researchMode} onChange={(e) => set("researchMode", e.target.checked)} />
            Research Mode
          </label>
          <p className="bd-sub">A modifier, not a track: the main purpose is to answer a technical question. It does not lower the shipping requirement.</p>
        </div>
      </div>

      <p className="bd-sub">
        Mode: <strong>{hardware ? "Hardware" : "Software"}</strong>, tracked with <strong>{hardware ? "Lapse" : "Hackatime"}</strong>.
      </p>

      <div className="bd-actions">
        <button type="submit" className="btn">
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
