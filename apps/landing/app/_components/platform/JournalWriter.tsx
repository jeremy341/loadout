"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { FormState } from "@/lib/platform/actions";
import { JOURNAL_BODY_MAX, JOURNAL_HOURS_MAX, JOURNAL_TITLE_MAX, formatHours, timelapseAdvice } from "@/lib/platform/journal";
import { addJournalEntry, updateJournalEntry } from "@/lib/platform/journal-actions";
import {
  MAX_PHOTOS_PER_ENTRY,
  draftKey,
  joinHours,
  oreEstimateLine,
  photosNeeded,
  previewEntry,
  splitHours,
  uncoveredHours,
} from "@/lib/platform/journal-writer";
import type { WriterData } from "@/lib/platform/journal-writer-data";
import { mediaUrl } from "@/lib/platform/media-url";
import { journalTextLength, journalTextNeeded } from "@/lib/platform/ship-gate";
import { FormStatus } from "./forms";
import { JournalEntryCard } from "./JournalEntryCard";
import { PfModal } from "./PfModal";
import "./journal-writer.css";
import "./project-journal.css";

const idle: FormState = { status: "idle" };
// The toolbar buttons: Markdown put around the selection, or around a placeholder word when nothing is selected.
const TOOLS = [
  { label: "Bold", before: "**", after: "**", fallback: "bold text", line: false },
  { label: "Italic", before: "*", after: "*", fallback: "italic text", line: false },
  { label: "Heading", before: "## ", after: "", fallback: "Heading", line: true },
  { label: "Link", before: "[", after: "](https://)", fallback: "link text", line: false },
  { label: "List", before: "- ", after: "", fallback: "List item", line: true },
] as const;
const MINUTE_STEPS = [0, 15, 30, 45];

// Enter in a single-line field should not send the whole entry. Saving is the button at the bottom.
function blockEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter" && !event.nativeEvent.isComposing) event.preventDefault();
}
type PhotoDraft = { id: string; alt: string; width: number; height: number };
type Draft = { title: string; body: string; hours: string; minutes: string; lapse: string };

function readDraft(key: string): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}
function writeDraft(key: string, draft: Draft | null) {
  try {
    if (draft) window.sessionStorage.setItem(key, JSON.stringify(draft));
    else window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be blocked or full; the page works without it.
  }
}

// The full page journal writer, laid out like Stasis's journal page (plans/proposals/journal-writer-stasis-map.md): the way back,
// the title, a short guidelines box, one card with Title, Time spent and the writing box with its toolbar, then the photos card,
// the Lapse card (Hardware only), an error box and one full width save button. Preview is a button that swaps the writing box for
// how a visitor will read the entry; it is not live. Unsent text is kept in sessionStorage only.
export function JournalWriter({ data, uploadsOn }: Readonly<{ data: WriterData; uploadsOn: boolean }>) {
  const { project, entry } = data;
  const router = useRouter();
  const [state, action, pending] = useActionState(entry ? updateJournalEntry : addJournalEntry, idle);
  const form = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bodyBox = useRef<HTMLTextAreaElement>(null);
  const initial = useMemo(() => {
    const parts = splitHours(entry?.hours ?? 0);
    return { title: entry?.title ?? "", body: entry?.body ?? "", hours: entry ? String(parts.hours) : "", minutes: String(parts.minutes), lapse: entry?.lapseUrl ?? "" };
  }, [entry]);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [hoursPart, setHoursPart] = useState(initial.hours);
  const [minutesPart, setMinutesPart] = useState(initial.minutes);
  const [lapse, setLapse] = useState(initial.lapse);
  const [photos, setPhotos] = useState<PhotoDraft[]>(data.photos.map((photo) => ({ id: photo.id, alt: photo.alt, width: photo.width, height: photo.height })));
  const [preview, setPreview] = useState(false);
  const [previewAt, setPreviewAt] = useState<Date>(() => entry?.createdAt ?? new Date(0));
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // The photo waiting on the remove confirm, and whether its delete request is in flight.
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const removedRef = useRef(false);
  const photosHeading = useRef<HTMLHeadingElement>(null);
  // The hours field is checked when it is left, then live once it has been checked.
  const [hoursTouched, setHoursTouched] = useState(false);
  const key = draftKey(project.id, entry?.id);
  const ids = { title: useId(), body: useId(), hours: useId(), minutes: useId(), lapse: useId(), hoursHint: useId(), advice: useId(), photoHint: useId() };
  const errIds = { title: useId(), body: useId(), hours: useId(), lapseUrl: useId() };
  const hardware = project.track === "Hardware";

  // Restore unsent text once, after the page has loaded in the browser. sessionStorage does not exist on the server, so this
  // cannot be the initial state without a hydration mismatch.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const draft = readDraft(key);
    if (draft) {
      setTitle(draft.title ?? "");
      setBody(draft.body ?? "");
      setHoursPart(draft.hours ?? "");
      setMinutesPart(draft.minutes ?? "0");
      setLapse(draft.lapse ?? "");
      setRestored(true);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [key]);

  const changed = title !== initial.title || body !== initial.body || hoursPart !== initial.hours || minutesPart !== initial.minutes || lapse !== initial.lapse;
  useEffect(() => {
    if (!ready || state.status === "saved") return;
    writeDraft(key, changed ? { title, body, hours: hoursPart, minutes: minutesPart, lapse } : null);
  }, [ready, changed, key, title, body, hoursPart, minutesPart, lapse, state.status]);

  useEffect(() => {
    if (state.status === "saved") {
      writeDraft(key, null);
      router.push(state.href ?? `/dashboard/projects/${project.id}`);
      router.refresh();
    }
    if (state.status === "error" && state.field) {
      const name = state.field === "hours" ? "hoursPart" : state.field;
      form.current?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
    }
  }, [state, key, router, project.id]);

  const hours = joinHours(hoursPart, minutesPart);
  const hoursNumber = Number(hoursPart);
  const hoursProblem =
    hoursPart.trim() !== "" && (!Number.isFinite(hoursNumber) || hoursNumber < 0 || !Number.isInteger(hoursNumber))
      ? "Enter whole hours, 0 or more."
      : hours > JOURNAL_HOURS_MAX
        ? `One entry covers up to ${JOURNAL_HOURS_MAX} hours. Split longer sessions.`
        : null;
  const textLen = journalTextLength(body);
  const textNeed = journalTextNeeded(hours);
  const photoNeed = photosNeeded(hours);
  // The estimates only describe a value that can be saved, so a typo does not produce a made-up Ore figure.
  const uncovered = hoursProblem ? 0 : uncoveredHours(data.otherHours, data.otherCount, hours);
  const ore = hoursProblem ? null : oreEstimateLine(hours, true);
  const charsMet = textLen >= textNeed;
  const photosMet = !uploadsOn || photos.length >= photoNeed;
  const advice = timelapseAdvice(hours);
  const err = (field: string) => (state.status === "error" && state.field === field ? state.message : undefined);
  const clientHoursError = hoursTouched && hoursProblem ? hoursProblem : undefined;
  const hoursError = clientHoursError ?? err("hours");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!hoursProblem) return;
    event.preventDefault();
    setHoursTouched(true);
    form.current?.querySelector<HTMLElement>('[name="hoursPart"]')?.focus();
  };

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setPhotoError(null);
    let count = photos.length;
    for (const file of Array.from(files)) {
      if (count >= MAX_PHOTOS_PER_ENTRY) {
        setPhotoError(`One entry holds up to ${MAX_PHOTOS_PER_ENTRY} photos.`);
        break;
      }
      const send = new FormData();
      send.set("file", file);
      send.set("projectId", project.id);
      send.set("kind", "photo");
      if (entry) send.set("entryId", entry.id);
      try {
        const res = await fetch("/api/journal-media", { method: "POST", body: send });
        const json = (await res.json().catch(() => ({}))) as { id?: string; width?: number; height?: number; error?: string };
        if (!res.ok || !json.id) {
          setPhotoError(json.error ?? "The upload failed. Try again.");
          break;
        }
        count += 1;
        setPhotos((list) => [...list, { id: json.id as string, alt: "", width: json.width ?? 1, height: json.height ?? 1 }]);
      } catch {
        setPhotoError("The upload failed. Check your connection and try again.");
        break;
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  // Toolbar: put Markdown around the selection (or a placeholder word) and keep the cursor on it, like Stasis's editor toolbar.
  function format(before: string, after: string, fallback: string, linePrefix = false) {
    const box = bodyBox.current;
    if (!box) return;
    const start = box.selectionStart;
    const end = box.selectionEnd;
    const chosen = body.slice(start, end) || fallback;
    const lead = linePrefix && start > 0 && body[start - 1] !== "\n" ? "\n" : "";
    const next = body.slice(0, start) + lead + before + chosen + after + body.slice(end);
    if (next.length > JOURNAL_BODY_MAX) return;
    setBody(next);
    const from = start + lead.length + before.length;
    requestAnimationFrame(() => {
      box.focus();
      box.setSelectionRange(from, from + chosen.length);
    });
  }

  async function removePhoto(id: string) {
    setPhotoError(null);
    setRemoving(true);
    try {
      const res = await fetch(`/api/journal-media/${id}`, { method: "DELETE" });
      if (!res.ok) setPhotoError("That photo could not be removed. Try again.");
      else {
        removedRef.current = true;
        setPhotos((list) => list.filter((photo) => photo.id !== id));
      }
    } catch {
      setPhotoError("That photo could not be removed. Check your connection and try again.");
    }
    setRemoving(false);
    setRemoveId(null);
  }

  const model = previewEntry({
    title,
    body,
    hours,
    date: previewAt,
    photos: photos.map((photo) => ({ id: photo.id, alt: photo.alt.trim() || "Photo for this entry", width: photo.width, height: photo.height })),
  });

  const status = pending
    ? "Saving"
    : state.status === "error"
      ? "Not saved. Check the marked fields."
      : state.status === "saved"
        ? "Saved"
        : changed
          ? "Not saved yet. Your text is kept in this tab."
          : "No changes yet";
  const bannerError = state.status === "error" && !state.field ? state.message : null;

  return (
    <div className="pf-jw">
      <Link className="pf-back" href={`/dashboard/projects/${project.id}`}>
        <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
        </svg>
        Back to {project.title}
      </Link>
      <header className="pf-jw-head">
        <h1 className="pf-jw-title">{entry ? "Edit journal entry" : "New journal entry"}</h1>
        <p className="pf-jw-project">Project: {project.title}</p>
      </header>

      {!data.open ? (
        <p className="pf-journal-locked" role="note">
          This project is submitted, so its journal is locked. It opens again if a reviewer asks for changes.
        </p>
      ) : (
        <>
          <section className="pf-jw-guide" aria-labelledby={`${ids.title}-guide`}>
            <h2 id={`${ids.title}-guide`}>Journal entry guidelines</h2>
            <ul>
              <li>Include your thoughts, failures and dead ends, not just the final steps.</li>
              <li>Write 100 characters for every hour you log, and at least 100. Images do not count.</li>
              <li>{uploadsOn ? "Add one photo for every 4 hours, and at least one." : "Photos are not required yet, because uploads are off on this site."}</li>
              <li>Everything here is public. Visitors see your hours, never your Ore.</li>
            </ul>
          </section>

          <form ref={form} action={action} onSubmit={onSubmit} className="pf-jw-form" noValidate>
            <input type="hidden" name="projectId" value={project.id} />
            {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}
            <input type="hidden" name="hours" value={hours > 0 ? String(hours) : ""} />
            <input type="hidden" name="photos" value={JSON.stringify(photos.map((photo) => ({ id: photo.id, alt: photo.alt })))} />

            <div className="pf-jw-card">
              {restored ? (
                <p className="pf-hint" role="note">
                  Your unsent text from this tab is back.
                </p>
              ) : null}

              <div className="pf-field">
                <label htmlFor={ids.title}>Title</label>
                <input
                  id={ids.title}
                  name="title"
                  className="pf-input"
                  type="text"
                  maxLength={JOURNAL_TITLE_MAX}
                  placeholder="What did you work on?"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={blockEnter}
                  aria-describedby={err("title") ? errIds.title : undefined}
                  aria-invalid={err("title") ? true : undefined}
                />
                {err("title") ? <p className="pf-error" id={errIds.title}>{err("title")}</p> : null}
              </div>

              <div className="pf-field">
                <span className="pf-jw-label" id={`${ids.hours}-label`}>Time spent this session</span>
                <p className="pf-hint pf-jw-cap" id={ids.hoursHint}>
                  Hours and minutes, in quarter hours. Up to {JOURNAL_HOURS_MAX} hours in one entry. A reviewer approves them later.
                </p>
                <div className="pf-jw-time" role="group" aria-labelledby={`${ids.hours}-label`}>
                  <span className="pf-jw-unit">
                    <input
                      id={ids.hours}
                      name="hoursPart"
                      className="pf-input"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={JOURNAL_HOURS_MAX}
                      step={1}
                      value={hoursPart}
                      onChange={(event) => setHoursPart(event.target.value)}
                      onBlur={() => setHoursTouched(true)}
                      onKeyDown={blockEnter}
                      aria-label="Hours"
                      aria-describedby={[ids.hoursHint, advice && !hoursProblem ? ids.advice : null, hoursError ? errIds.hours : null].filter(Boolean).join(" ")}
                      aria-invalid={hoursError ? true : undefined}
                    />
                    <label htmlFor={ids.hours}>hours</label>
                  </span>
                  <span className="pf-jw-unit">
                    <select id={ids.minutes} name="minutesPart" className="pf-input" value={minutesPart} onChange={(event) => setMinutesPart(event.target.value)} aria-label="Minutes">
                      {MINUTE_STEPS.map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <label htmlFor={ids.minutes}>minutes</label>
                  </span>
                </div>
                {advice && !hoursProblem ? <p className="pf-jw-note pf-jw-note-hot" id={ids.advice} role="status">{advice}</p> : null}
                {uncovered > 0 ? (
                  <p className="pf-jw-note" data-testid="uncovered-note">
                    After this entry, {formatHours(uncovered)} of your work are still not covered by an entry. One entry covers up to 8 hours.
                  </p>
                ) : null}
                {ore ? (
                  <p className="pf-jw-note" data-testid="ore-line">
                    {ore} Only you see this.
                  </p>
                ) : null}
                {hoursError ? <p className="pf-error" id={errIds.hours} role={clientHoursError ? "alert" : undefined}>{hoursError}</p> : null}
              </div>

              <div className="pf-field">
                <label htmlFor={ids.body}>What did you work on?</label>
                <p className="pf-hint pf-jw-cap">Write in Markdown. Use the buttons or type it yourself.</p>
                <div className="pf-jw-editor">
                  <div className="pf-jw-toolbar" role="toolbar" aria-label="Formatting" aria-controls={ids.body}>
                    {TOOLS.map((tool) => (
                      <button key={tool.label} type="button" className="pf-btn" disabled={preview} onClick={() => format(tool.before, tool.after, tool.fallback, tool.line)}>
                        {tool.label}
                      </button>
                    ))}
                    {uploadsOn ? (
                      <button type="button" className="pf-btn" disabled={uploading || photos.length >= MAX_PHOTOS_PER_ENTRY} onClick={() => fileInput.current?.click()}>
                        Photo
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="pf-btn pf-jw-toggle"
                      aria-pressed={preview}
                      onClick={() => {
                        if (!preview && !entry) setPreviewAt(new Date());
                        setPreview((on) => !on);
                      }}
                    >
                      {preview ? "Write" : "Preview"}
                    </button>
                  </div>
                  {preview ? (
                    <div className="pf-jw-preview" data-testid="journal-preview">
                      <p className="pf-hint">This is how visitors read your entry.</p>
                      <JournalEntryCard entry={model} handle={project.handle} titleId={`${ids.body}-preview-title`} />
                    </div>
                  ) : null}
                  <textarea
                    ref={bodyBox}
                    hidden={preview}
                    id={ids.body}
                    name="body"
                    className="pf-textarea pf-journal-body pf-jw-body"
                    maxLength={JOURNAL_BODY_MAX}
                    placeholder="Describe what you did in this session..."
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    onPaste={(event) => {
                      const files = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
                      if (uploadsOn && files.length > 0) {
                        event.preventDefault();
                        const list = new DataTransfer();
                        files.forEach((file) => list.items.add(file));
                        void upload(list.files);
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      if (uploadsOn && event.dataTransfer.files.length > 0) {
                        event.preventDefault();
                        void upload(event.dataTransfer.files);
                      }
                    }}
                    aria-describedby={err("body") ? errIds.body : undefined}
                    aria-invalid={err("body") ? true : undefined}
                  />
                </div>
                <p className="pf-jw-count" data-testid="chars-count" data-met={charsMet}>
                  {textLen} of {textNeed} characters needed
                  <span className="pf-jw-count-max"> · {body.length} of {JOURNAL_BODY_MAX} allowed</span>
                </p>
                {err("body") ? <p className="pf-error" id={errIds.body}>{err("body")}</p> : null}
                <p className="pf-jw-saved" role="status" aria-live="polite" data-testid="save-status">
                  {status}
                </p>
              </div>
            </div>

            <section className="pf-jw-card pf-jw-photos" aria-labelledby={`${ids.photoHint}-h`}>
              <h2 id={`${ids.photoHint}-h`} className="pf-jw-label" ref={photosHeading} tabIndex={-1}>Photos</h2>
              {!uploadsOn ? (
                <p className="pf-hint" data-testid="photos-off">
                  Photo uploads are off on this site for now, so photos are not required yet. When they are on, an entry needs one photo for every 4 hours it logs, and at least one.
                </p>
              ) : (
                <>
                  <p className="pf-hint pf-jw-cap" id={ids.photoHint}>
                    JPEG, PNG or WebP, up to 10 MB each, up to {MAX_PHOTOS_PER_ENTRY} per entry. Drop or paste a picture into the writing box, or use the Photo button. Location data is removed. Describe each photo for people who can&apos;t see it.
                  </p>
                  {photos.length > 0 ? (
                    <ul className="pf-jw-photolist" data-testid="photo-list">
                      {photos.map((photo, index) => {
                        const altId = `alt-${photo.id}`;
                        return (
                          <li key={photo.id}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mediaUrl(photo.id)} alt={photo.alt || `Uploaded photo ${index + 1}`} width={photo.width} height={photo.height} loading="lazy" />
                            <div className="pf-field">
                              <label htmlFor={altId}>Describe photo {index + 1}</label>
                              <input
                                id={altId}
                                name={altId}
                                className="pf-input"
                                type="text"
                                maxLength={200}
                                value={photo.alt}
                                onChange={(event) => setPhotos((list) => list.map((item) => (item.id === photo.id ? { ...item, alt: event.target.value } : item)))}
                                aria-invalid={err(altId) ? true : undefined}
                                aria-describedby={err(altId) ? `${altId}-err` : undefined}
                              />
                              {err(altId) ? <p className="pf-error" id={`${altId}-err`}>{err(altId)}</p> : null}
                            </div>
                            <button type="button" className="pf-btn pf-btn-danger" onClick={() => setRemoveId(photo.id)} aria-label={`Remove photo ${index + 1}`}>
                              Remove
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="pf-sr" tabIndex={-1} aria-label="Photo files" onChange={(event) => void upload(event.target.files)} />
                  <button type="button" className="pf-btn" disabled={uploading || photos.length >= MAX_PHOTOS_PER_ENTRY} onClick={() => fileInput.current?.click()}>
                    {uploading ? "Uploading" : "Add photos"}
                  </button>
                  <p className="pf-jw-count" data-testid="photos-count" data-met={photosMet}>
                    {photos.length} of {photoNeed} photos needed
                  </p>
                  {photoError ? <p className="pf-error" role="alert">{photoError}</p> : null}
                </>
              )}
            </section>

            {hardware ? (
              <div className="pf-jw-card">
                <div className="pf-field">
                  <label htmlFor={ids.lapse}>Lapse timelapse (optional)</label>
                  <p className="pf-hint pf-jw-cap">Paste a Lapse timelapse link. Only reviewers see it. Visitors do not.</p>
                  <input
                    id={ids.lapse}
                    name="lapseUrl"
                    className="pf-input"
                    type="url"
                    inputMode="url"
                    placeholder="https://lapse.hackclub.com/timelapse/..."
                    value={lapse}
                    onChange={(event) => setLapse(event.target.value)}
                    onKeyDown={blockEnter}
                    aria-describedby={err("lapseUrl") ? errIds.lapseUrl : undefined}
                    aria-invalid={err("lapseUrl") ? true : undefined}
                  />
                  {err("lapseUrl") ? <p className="pf-error" id={errIds.lapseUrl}>{err("lapseUrl")}</p> : null}
                </div>
              </div>
            ) : null}

            <div aria-live="polite">{bannerError ? <div className="pf-jw-error"><FormStatus state={state} /></div> : null}</div>
            <button type="submit" className="pf-btn pri pf-wide pf-jw-save" disabled={pending || uploading}>
              {entry ? (pending ? "Saving" : "Save changes") : pending ? "Saving" : "Save journal entry"}
            </button>
          </form>

          <PfModal
            open={removeId !== null}
            onClose={() => {
              setRemoveId(null);
              // The Remove button is gone once the photo is, so focus goes to the Photos heading instead of the top of the page.
              if (removedRef.current) {
                removedRef.current = false;
                photosHeading.current?.focus();
              }
            }}
            title="Remove photo"
            size="confirm"
            variant="danger"
            closeButton={false}
            initialFocus="button[data-cancel]"
            describedBy={`${ids.photoHint}-remove`}
            busy={removing}
          >
            <div className="pf-confirm-form">
              <div className="pf-confirm-body" id={`${ids.photoHint}-remove`}>
                <p>{`Remove photo ${photos.findIndex((photo) => photo.id === removeId) + 1} from this entry? The file is deleted and this cannot be undone.`}</p>
              </div>
              <div className="pf-confirm-actions">
                <button type="button" className="pf-btn" data-cancel onClick={() => setRemoveId(null)} disabled={removing}>Cancel</button>
                <button type="button" className="pf-btn pf-btn-danger" onClick={() => removeId && void removePhoto(removeId)} disabled={removing}>{removing ? "Removing" : "Remove it"}</button>
              </div>
            </div>
          </PfModal>
        </>
      )}
    </div>
  );
}
