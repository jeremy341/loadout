"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { addJournalEntry, updateJournalEntry } from "@/lib/platform/journal-actions";
import { JOURNAL_BODY_MAX, JOURNAL_HOURS_MAX, JOURNAL_HOURS_MIN, JOURNAL_TITLE_MAX, timelapseAdvice } from "@/lib/platform/journal";
import { FormStatus } from "./forms";
import { JournalMarkdown } from "./JournalMarkdown";
import { PfModal } from "./PfModal";
import "./project-journal.css";
import "./project-stasis.css";

const idle: FormState = { status: "idle" };
export const JOURNAL_OPEN_EVENT = "pf-journal-open";

// A second button elsewhere on the page (the empty journal) asks the one dialog to open. The browser gives focus back to
// whichever button was focused when the dialog opened.
export function OpenJournalButton({ children, className = "pf-btn" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(JOURNAL_OPEN_EVENT))}>
      {children}
    </button>
  );
}

export type JournalEntryDraft = { id: string; title: string; body: string; hours: number };

// One form for a new entry and for editing one (the entry prop). The body is Markdown; the Preview button swaps the box for how it
// will read, and back (not a live split, owner 16 Nov 2026). The textarea stays mounted so the text is posted either way.
function JournalForm({ projectId, hint, entry, onSaved, onCancel }: { projectId: string; hint: string | null; entry?: JournalEntryDraft; onSaved: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(entry ? updateJournalEntry : addJournalEntry, idle);
  const form = useRef<HTMLFormElement>(null);
  // Controlled, because React resets uncontrolled fields after every form action, even one that returned an error.
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [hours, setHours] = useState(entry ? String(entry.hours) : "");
  const [preview, setPreview] = useState(false);
  const titleId = useId();
  const bodyId = useId();
  const hoursId = useId();
  const hoursHintId = useId();
  const adviceId = useId();
  const errorIds = { title: useId(), body: useId(), hours: useId() };

  useEffect(() => {
    if (state.status === "saved") onSaved();
    if (state.status === "error" && state.field) {
      form.current?.querySelector<HTMLElement>(`[name="${state.field}"]`)?.focus();
      form.current?.querySelector<HTMLElement>(".pf-error")?.scrollIntoView({ block: "nearest" });
    }
  }, [state, onSaved]);

  const err = (field: string) => (state.status === "error" && state.field === field ? state.message : undefined);
  const advice = timelapseAdvice(Number(hours));

  return (
    <form ref={form} action={action} className="pf-modal-form pf-journal-form" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}
      <div className="pf-field">
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          name="title"
          className="pf-input"
          type="text"
          maxLength={JOURNAL_TITLE_MAX}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-describedby={err("title") ? errorIds.title : undefined}
          aria-invalid={err("title") ? true : undefined}
        />
        {err("title") ? <p className="pf-error" id={errorIds.title}>{err("title")}</p> : null}
      </div>
      <div className="pf-field">
        <div className="pf-journal-bodyhead">
          <label htmlFor={bodyId}>What did you do?</label>
          <button type="button" className="pf-btn pf-journal-preview-btn" aria-pressed={preview} onClick={() => setPreview((on) => !on)}>
            {preview ? "Back to writing" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div className="pf-journal-preview" data-testid="journal-preview" aria-live="polite">
            {body.trim() ? <JournalMarkdown source={body} /> : <p className="pf-muted">Nothing to preview yet.</p>}
          </div>
        ) : null}
        <textarea
          hidden={preview}
          id={bodyId}
          name="body"
          className="pf-textarea pf-journal-body"
          maxLength={JOURNAL_BODY_MAX}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          aria-describedby={err("body") ? errorIds.body : undefined}
          aria-invalid={err("body") ? true : undefined}
        />
        <p className="pf-hint pf-journal-count" aria-live="off">
          Markdown works: **bold**, *italic*, lists, links and https images. {body.length} of {JOURNAL_BODY_MAX} characters.
        </p>
        {err("body") ? <p className="pf-error" id={errorIds.body}>{err("body")}</p> : null}
      </div>
      <div className="pf-field">
        <label htmlFor={hoursId}>Hours worked</label>
        <input
          id={hoursId}
          name="hours"
          className="pf-input pf-journal-hours"
          type="number"
          inputMode="decimal"
          min={JOURNAL_HOURS_MIN}
          max={JOURNAL_HOURS_MAX}
          step={0.25}
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          aria-describedby={[hoursHintId, advice ? adviceId : null, err("hours") ? errorIds.hours : null].filter(Boolean).join(" ")}
          aria-invalid={err("hours") ? true : undefined}
        />
        <p className="pf-hint" id={hoursHintId}>Quarter hour steps, from {JOURNAL_HOURS_MIN} to {JOURNAL_HOURS_MAX}. You report these yourself. A reviewer approves them later.</p>
        {advice ? <p className="pf-journal-advice" id={adviceId} role="status">{advice}</p> : null}
        {err("hours") ? <p className="pf-error" id={errorIds.hours}>{err("hours")}</p> : null}
      </div>
      {hint ? <p className="pf-journal-due">{hint}</p> : null}
      <div aria-live="polite">{state.status === "error" && !state.field ? <FormStatus state={state} /> : null}</div>
      <div className="pf-modal-actions">
        <button type="button" className="pf-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="pf-btn pri pf-wide" disabled={pending}>
          {entry ? (pending ? "Saving" : "Save entry") : pending ? "Adding" : "Add entry"}
        </button>
      </div>
    </form>
  );
}

// The New journal entry button and its dialog (native dialog: Escape closes it and focus returns to the button).
export function JournalDialog({ projectId, hint, triggerClassName = "pf-btn pri" }: Readonly<{ projectId: string; hint: string | null; triggerClassName?: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const saved = useCallback(() => {
    setIsOpen(false);
    router.refresh();
  }, [router]);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(JOURNAL_OPEN_EVENT, open);
    return () => window.removeEventListener(JOURNAL_OPEN_EVENT, open);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setIsOpen(true)}>New journal entry</button>
      <PfModal open={isOpen} onClose={close} title="New journal entry" size="wide" initialFocus='input[name="title"]'>
        {isOpen ? <JournalForm projectId={projectId} hint={hint} onSaved={saved} onCancel={close} /> : null}
      </PfModal>
    </>
  );
}

// The Edit button of one entry and its dialog. Same form, filled in; the server checks the owner and that the journal is open.
export function EditJournalEntry({ projectId, entry }: Readonly<{ projectId: string; entry: JournalEntryDraft }>) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const saved = useCallback(() => {
    setIsOpen(false);
    router.refresh();
  }, [router]);
  const close = useCallback(() => setIsOpen(false), []);
  return (
    <>
      <button type="button" className="pf-btn pf-journal-edit" onClick={() => setIsOpen(true)} aria-label={`Edit entry ${entry.title}`}>
        Edit
      </button>
      <PfModal open={isOpen} onClose={close} title="Edit journal entry" size="wide" initialFocus='input[name="title"]'>
        {isOpen ? <JournalForm projectId={projectId} hint={null} entry={entry} onSaved={saved} onCancel={close} /> : null}
      </PfModal>
    </>
  );
}
