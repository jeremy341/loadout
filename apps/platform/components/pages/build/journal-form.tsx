"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field } from "../../ui/ui";
import { focusFirstInvalid, fmtHours } from "./parts";
import { maxEntryHours } from "./logic/cadence";
import { effectiveHours } from "./logic/ship";
import { parseTags, validateJournal, type FieldErrors } from "./logic/validate";
import type { JournalEntry, Project } from "./logic/types";

export interface JournalDraft {
  projectId: string;
  title: string;
  body: string;
  hours: number;
  tags: string[];
  isPublic: boolean;
}

/** Create or edit one journal entry. Hours are capped at the project's uncovered hours: each hour is covered once. */
export function JournalForm({
  projects,
  entries,
  editing,
  defaultProjectId,
  onSave,
  onCancel,
}: {
  projects: Project[];
  entries: JournalEntry[];
  editing: JournalEntry | null;
  defaultProjectId: string;
  onSave: (draft: JournalDraft) => void;
  onCancel: () => void;
}) {
  const startProject = editing?.projectId ?? defaultProjectId;
  const [projectId, setProjectId] = useState(startProject);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [hoursText, setHoursText] = useState(() => {
    if (editing) return String(editing.hours);
    const project = projects.find((p) => p.id === startProject);
    const max = project ? maxEntryHours(effectiveHours(project), entries.filter((e) => e.projectId === project.id)) : 0;
    return String(max);
  });
  const [tagsText, setTagsText] = useState(editing?.tags.join(", ") ?? "");
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? true);
  const [errors, setErrors] = useState<FieldErrors<"title" | "body" | "hours" | "tags">>({});
  const formRef = useRef<HTMLFormElement>(null);

  const project = projects.find((p) => p.id === projectId);
  const projectEntries = entries.filter((e) => e.projectId === projectId);
  // An entry already saved keeps the hours it has, even if a tracker change has since shrunk the pool.
  const maxHours = Math.max(project ? maxEntryHours(effectiveHours(project), projectEntries, editing?.id) : 0, editing?.hours ?? 0);

  function submit(event: FormEvent) {
    event.preventDefault();
    const hours = hoursText.trim() === "" ? 0 : Number(hoursText);
    const found = validateJournal({ title, body, hours, tagsText }, maxHours);
    setErrors(found);
    if (Object.keys(found).length > 0 || !project) {
      focusFirstInvalid(formRef.current);
      return;
    }
    onSave({ projectId, title: title.trim(), body: body.trim(), hours: Math.round(hours * 100) / 100, tags: parseTags(tagsText), isPublic });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="pg-stack" aria-label={editing ? "Edit journal entry" : "Write a journal entry"}>
      <div className="form-grid">
        <Field label="Project" hint={editing ? "An entry stays with its project." : undefined}>
          <select
            value={projectId}
            disabled={Boolean(editing)}
            onChange={(e) => {
              setProjectId(e.target.value);
              const next = projects.find((p) => p.id === e.target.value);
              if (next) setHoursText(String(maxEntryHours(effectiveHours(next), entries.filter((en) => en.projectId === next.id))));
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title" error={errors.title}>
          <input value={title} maxLength={140} aria-invalid={Boolean(errors.title) || undefined} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
        </Field>
        <div className="wide">
          <Field
            label="What happened"
            hint="Say what you worked on, what changed, what went wrong and what is next. Plain text: a blank line starts a new paragraph. Never include API keys, passwords, private addresses or personal information."
            error={errors.body}
          >
            <textarea value={body} rows={9} maxLength={5200} aria-invalid={Boolean(errors.body) || undefined} onChange={(e) => setBody(e.target.value)} />
          </Field>
        </div>
        <Field label="Development hours this entry covers" hint={`Up to ${fmtHours(maxHours)} not covered by another entry.`} error={errors.hours}>
          <input type="number" inputMode="decimal" min={0} max={maxHours} step={0.25} value={hoursText} aria-invalid={Boolean(errors.hours) || undefined} onChange={(e) => setHoursText(e.target.value)} />
        </Field>
        <Field label="Tags (optional)" hint="Separate with commas, for example rust, benchmarks." error={errors.tags}>
          <input value={tagsText} aria-invalid={Boolean(errors.tags) || undefined} onChange={(e) => setTagsText(e.target.value)} autoComplete="off" />
        </Field>
      </div>
      <div>
        <label className="check">
          <input type="checkbox" checked={!isPublic} onChange={(e) => setIsPublic(!e.target.checked)} />
          Keep this entry private
        </label>
        <p className="bd-sub">Entries are public by default. A private entry still counts toward your 8-hour rule and the 24-hour payout gate.</p>
      </div>
      <div className="bd-actions">
        <button type="submit" className="btn">
          {editing ? "Save changes" : "Save entry"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
