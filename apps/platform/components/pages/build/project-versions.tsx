"use client";

import { useState, type FormEvent } from "react";
import { uid } from "../../../lib/preview-store";
import { EmptyState, Field, Panel, Status } from "../../ui/ui";
import { previewNow } from "./clock";
import { ConfirmButton, fmtDateTime, useLiveMessage } from "./parts";
import { validateVersion, type FieldErrors } from "./logic/validate";
import type { Project } from "./logic/types";

/** Version history: add a version, delete one. A ship names the version it submits. */
export function ProjectVersions({ project, onChange }: { project: Project; onChange: (patch: Partial<Project>) => void }) {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"label" | "notes">>({});
  const [message, say] = useLiveMessage();
  const versions = [...project.versions].sort((a, b) => b.at - a.at);

  function add(event: FormEvent) {
    event.preventDefault();
    const found = validateVersion(label, notes, project.versions.map((v) => v.label));
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onChange({ versions: [...project.versions, { id: uid("ver"), label: label.trim(), notes: notes.trim(), at: previewNow() }] });
    say(`Version ${label.trim()} added.`);
    setLabel("");
    setNotes("");
  }

  return (
    <div className="pg-stack">
      <Panel title="Add a version">
        <p className="mut" style={{ marginBottom: 12 }}>
          Projects can ship more than one major version when the work is genuinely new. The same work is never rewarded twice.
        </p>
        <form onSubmit={add} noValidate className="pg-stack" aria-label="Add a version">
          <div className="form-grid">
            <Field label="Version label" error={errors.label}>
              <input value={label} maxLength={24} placeholder="v0.2" aria-invalid={Boolean(errors.label) || undefined} onChange={(e) => setLabel(e.target.value)} autoComplete="off" />
            </Field>
            <div className="wide">
              <Field label="What changed (optional)" error={errors.notes}>
                <textarea value={notes} rows={2} maxLength={600} aria-invalid={Boolean(errors.notes) || undefined} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="bd-actions">
            <button type="submit" className="btn btn-sm">
              Add version
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Version history">
        {versions.length === 0 ? (
          <EmptyState title="No versions yet">Add the first version above, for example v0.1 for a first working prototype.</EmptyState>
        ) : (
          <ul className="row-list">
            {versions.map((version) => (
              <li key={version.id} className="row-item">
                <div>
                  <strong>{version.label}</strong> <span className="bd-sub">{fmtDateTime(version.at)}</span>
                  {version.notes ? <p className="bd-wrap">{version.notes}</p> : null}
                </div>
                <ConfirmButton
                  label={`Delete ${version.label}`}
                  question={`Delete version ${version.label}?`}
                  onConfirm={() => {
                    onChange({ versions: project.versions.filter((v) => v.id !== version.id) });
                    say(`Version ${version.label} deleted.`);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Status message={message} />
    </div>
  );
}
