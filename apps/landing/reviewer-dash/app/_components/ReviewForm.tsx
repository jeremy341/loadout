"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ComponentPropsWithRef,
  type FormEvent,
  type ReactNode,
} from "react";
import { REVIEW_MACROS, MAX_REVIEW_NOTE_LENGTH, expandMacro, hasUnfilledMacroPlaceholder, showReviewMacroPrompt, type CustomReviewMacro } from "@/reviewer-dash/lib/reviewMacros";
import { dismissReviewerMacroPrompt } from "@/reviewer-dash/app/actions";
import { reviewProject, applySubmissionEdits, saveReviewDraft } from "@/reviewer-dash/app/actions";
import {
  CHANGE_REASONS,
  CHANGE_REASON_LABELS,
  JOURNAL_HOURS,
  ORE_PER_HOUR,
  QUALITY_DIMENSIONS,
  TRACK_XP_PER_HOUR,
  USD_PER_TEN_ORE,
  creditFor,
  type ChangeReason,
} from "@/lib/platform/review";
import { TECHNICAL_FEATURES_MIN } from "@/reviewer-dash/lib/auditNote";
import { Badge, Button, ButtonLink, Callout, Checkbox, Details, Field, formatDateTime, Input, Textarea } from "@/reviewer-dash/app/_ui/ui";
import { actionErrorMessage, isStaleDeployError } from "@/reviewer-dash/app/_ui/actionError";
import { round1 } from "@/reviewer-dash/lib/hours";

export interface CollaboratorHours {
  id: number;
  name: string;
  claimedHours: number;
}

type Draft = Record<string, string | number>;

const STEP_ERROR_ID = "review-verdict-error";

// Friendly names for the browser's own validation messages, see onVerdictSelect.
const FIELD_LABEL: Record<string, string> = {
  approvedHours: "Hours to credit",
  technicalFeatures: "Technical features",
  deflationReason: "Why lower the hours?",
  ageJustification: "Age justification",
  notes: "Additional notes",
  note: "Note to the builder",
};

function fieldLabel(name: string): string {
  if (name.startsWith("collabHours_")) return "Collaborator hours";
  return FIELD_LABEL[name] ?? name;
}

// The kit's Textarea drops refs; the audit fields need them for the draft restore.
function AuditTextarea(props: ComponentPropsWithRef<"textarea">) {
  return <textarea className="hc-textarea" {...props} />;
}

// The ?error= message of a redirect() an action threw, or null for any other
// error (including a redirect onward to the next project).
function bouncedError(err: unknown): string | null {
  const digest = err && typeof err === "object" && "digest" in err ? err.digest : null;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) return null;
  const target = digest.split(";").slice(2, -2).join(";");
  try {
    return new URL(target, window.location.href).searchParams.get("error");
  } catch {
    return null;
  }
}

function PayoutRow({ label, value, strong = false }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className={strong ? "font-bold" : "hc-muted"}>{label}</span>
      <span className={strong ? "font-bold" : ""}>{value}</span>
    </div>
  );
}

/**
 * The ship's one track plus what the credited hours become, worked out live so a reviewer never has to do the arithmetic. A
 * project has exactly one track (picked by the builder, locked on submit): all Track XP goes to it, so there is nothing to
 * set here. The rates come from lib/platform/review.ts (ORE_PER_HOUR, USD_PER_TEN_ORE, TRACK_XP_PER_HOUR).
 */
function TrackAndCredit({ hours, track }: { hours: number; track: string }) {
  const credit = creditFor(hours * 60);
  return (
    <div className="hc-panel flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="hc-label">Track</span>
        <Badge tone="info">{track}</Badge>
      </div>
      <p className="hc-caption text-xs">
        Track: {track}. All Track XP from this ship goes to this track. If the work does not fit it, request changes with the
        reason Does not fit the track.
      </p>
      <Details
        summary={
          <span className="tabular-nums">
            Credit: {credit.ore.toLocaleString()} Ore · ${credit.usd.toFixed(2)} · {round1(hours * TRACK_XP_PER_HOUR).toLocaleString()} Track XP
          </span>
        }
      >
        <div className="flex flex-col gap-1 text-sm tabular-nums">
          <PayoutRow label={`This ship · ${hours}h × ${ORE_PER_HOUR} Ore/h`} value={`${credit.ore.toLocaleString()} Ore`} />
          <PayoutRow label={`Worth (ten Ore = $${USD_PER_TEN_ORE.toFixed(2)})`} value={`$${credit.usd.toFixed(2)}`} />
          <PayoutRow
            label={`Track XP · ${hours}h × ${TRACK_XP_PER_HOUR} per hour`}
            value={`${round1(hours * TRACK_XP_PER_HOUR).toLocaleString()} to ${track}`}
          />
        </div>
        <p className="hc-caption text-xs">
          Credit is for approved hours only. Pending hours are not counted, and nothing here is credited until a final verdict.
        </p>
      </Details>
    </div>
  );
}

function InlineNumber({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-3">
      <span className="hc-label">
        {label}
        {hint && <span className="hc-label-hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function CollaboratorHoursInput({ c }: { c: CollaboratorHours }) {
  const [value, setValue] = useState(c.claimedHours);
  return (
    <InlineNumber label={`${c.name}'s hours to credit`} hint="Decrease only">
      <Input
        name={`collabHours_${c.id}`}
        type="number"
        step="0.1"
        min="0"
        max={c.claimedHours}
        value={value}
        onChange={(e) => setValue(Math.min(c.claimedHours, Math.max(0, Number(e.target.value) || 0)))}
        className="w-28"
      />
    </InlineNumber>
  );
}

function VerdictButtons({
  secondPass,
  pendingVerdict,
  onVerdictSelect,
}: {
  secondPass: boolean;
  /** The verdict currently being submitted, or null when idle. */
  pendingVerdict: string | null;
  /** Runs on click, before the browser's own validation, and can cancel the submit. */
  onVerdictSelect: (verdict: string) => boolean;
}) {
  const busy = pendingVerdict !== null;
  const select = (verdict: string, e: React.MouseEvent) => {
    if (!onVerdictSelect(verdict)) e.preventDefault();
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="submit"
        name="verdict"
        value="approved"
        variant="success"
        disabled={busy}
        onClick={(e) => select("approved", e)}
      >
        {pendingVerdict === "approved" ? "Approving…" : secondPass ? "Approve & credit Ore" : "Approve"}
      </Button>
      <Button type="submit" name="verdict" value="needs_changes" disabled={busy} onClick={(e) => select("needs_changes", e)}>
        {pendingVerdict === "needs_changes" ? "Sending back…" : "Request changes"}
      </Button>
      <Button type="submit" name="verdict" value="ban" variant="danger" disabled={busy} onClick={(e) => select("ban", e)}>
        {pendingVerdict === "ban"
          ? secondPass
            ? "Banning…"
            : "Proposing ban…"
          : secondPass
            ? "Ban project"
            : "Propose ban"}
      </Button>
    </div>
  );
}

// Title/image/links/description edits. Applies on its own, independent of the
// verdict form below.
function EditSubmission({
  projectId,
  repoUrl,
  demoUrl,
  currentName,
  currentDescription,
  currentImageUrl,
}: {
  projectId: number;
  repoUrl: string | null;
  demoUrl: string | null;
  currentName?: string;
  currentDescription?: string | null;
  currentImageUrl?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      try {
        await applySubmissionEdits(fd);
        if (fileRef.current) fileRef.current.value = "";
        setResult({ ok: true, text: "Saved. The project is updated everywhere." });
      } catch (err) {
        setResult({ ok: false, text: actionErrorMessage(err, "apply these edits") });
      }
    });
  };

  return (
    <Details summary="Edit submission: title, image, repo and demo links, description">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <p className="hc-caption text-xs">
          Applies immediately and updates the project everywhere: the builder&apos;s own page and the next reviewer who
          opens this. Independent of your verdict below.
        </p>
        <input type="hidden" name="projectId" value={projectId} />
        <Field label="Title">
          <Input name="editedName" defaultValue={currentName ?? ""} maxLength={200} />
        </Field>
        <Field label="Replace image" hint="Optional. Leave empty to keep the current one.">
          {currentImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImageUrl}
              alt=""
              className="h-20 w-auto self-start rounded border border-[var(--border)] object-cover"
            />
          )}
          <input
            ref={fileRef}
            name="editedImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hc-file"
          />
        </Field>
        <Field label="Repo URL">
          <Input name="editedRepoUrl" defaultValue={repoUrl ?? ""} placeholder="https://github.com/…" />
        </Field>
        <Field label="Demo URL">
          <Input name="editedDemoUrl" defaultValue={demoUrl ?? ""} placeholder="https://…" />
        </Field>
        <Field label="Description">
          <Textarea name="editedDescription" defaultValue={currentDescription ?? ""} maxLength={5000} rows={4} />
        </Field>
        {result && (
          <Callout tone={result.ok ? "success" : "danger"} icon={result.ok ? "checkmark" : "important"}>
            {result.text}
          </Callout>
        )}
        <div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Applying…" : "Apply changes"}
          </Button>
        </div>
      </form>
    </Details>
  );
}

export function ReviewForm({
  projectId,
  repoUrl,
  demoUrl,
  claimedHours,
  defaultHours,
  journalDeflatedHours = 0,
  secondPass = false,
  track,
  researchMode = false,
  kind = "software",
  ageFlag = false,
  collaborators = [],
  firstPass,
  currentName,
  currentDescription,
  currentImageUrl,
  isSuper = false,
  canAiDraft = false,
  canEditSubmission = false,
  defaultRevealName = true,
  defaultNotifyOnResubmit = false,
  initialReviewMacros = [],
  initialMacroPromptDismissed = false,
  serverDraft,
}: {
  projectId: number;
  repoUrl: string | null;
  demoUrl: string | null;
  claimedHours: number;
  defaultHours?: number;
  /** Hours the credited total already lost to per-journal-entry deflation
   * (Journals tab / setJournalHours), shown apart from what this form lowers. */
  journalDeflatedHours?: number;
  secondPass?: boolean;
  /** The project's one track (Tools, Systems, Compute or Hardware). All Track XP from this ship goes to it. */
  track: string;
  /** Research Mode is a modifier: expect a question, a method, measurements and a write-up. It earns no extra XP. */
  researchMode?: boolean;
  /** Hardware ships are reviewed with Lapse recordings and the bill of materials. */
  kind?: "software" | "hardware";
  ageFlag?: boolean;
  collaborators?: CollaboratorHours[];
  /** The first pass's own audit note + builder note, so the final reviewer
   * starts from what was already written instead of a blank form. */
  firstPass?: {
    technicalFeatures: string;
    deflationReason: string;
    ageJustification: string;
    notes: string;
    note: string;
  };
  currentName?: string;
  currentDescription?: string | null;
  currentImageUrl?: string | null;
  /** Owner: gates the owner-only parts of the form. */
  isSuper?: boolean;
  /** Shows the AI draft stub (the drafting service is not connected). */
  canAiDraft?: boolean;
  /** Whether the viewer may edit the submission's details at any review stage. */
  canEditSubmission?: boolean;
  /** Default for the "Show my name to the builder" checkbox. */
  defaultRevealName?: boolean;
  /** Default for the "Notify on resubmit" checkbox. */
  defaultNotifyOnResubmit?: boolean;
  /** Personal text macros saved on this reviewer\'s account. */
  initialReviewMacros?: CustomReviewMacro[];
  initialMacroPromptDismissed?: boolean;
  /** The shared server-side draft (saveReviewDraft). Used only when this
   * browser has no local draft of its own to restore. */
  serverDraft?: {
    draft: Draft | null;
    by: string;
    at: string | null;
  };
}) {
  const [customMacros] = useState<CustomReviewMacro[]>(initialReviewMacros);
  const [macroPromptDismissed, setMacroPromptDismissed] = useState(initialMacroPromptDismissed);
  const [macroPromptSaving, setMacroPromptSaving] = useState(false);
  const [macroPromptError, setMacroPromptError] = useState(false);
  const dismissMacroInvite = async () => {
    setMacroPromptSaving(true);
    setMacroPromptError(false);
    try {
      const result = await dismissReviewerMacroPrompt();
      if (result.ok) setMacroPromptDismissed(true);
      else setMacroPromptError(true);
    } catch {
      setMacroPromptError(true);
    } finally {
      setMacroPromptSaving(false);
    }
  };
  const formRef = useRef<HTMLFormElement>(null);
  const repoOpened = useRef<HTMLInputElement>(null);
  const demoOpened = useRef<HTMLInputElement>(null);
  const repoSeconds = useRef<HTMLInputElement>(null);
  const demoSeconds = useRef<HTMLInputElement>(null);
  const totalSeconds = useRef<HTMLInputElement>(null);
  const away = useRef<{ kind: "repo" | "demo"; at: number } | null>(null);
  // Review time only counts while this tab is the one the reviewer is looking
  // at: visible AND the window focused (alt-tabbing to another app keeps the
  // tab "visible"). activeMs sums finished stretches; visibleSince is when the
  // current one started (null while away).
  const activeMs = useRef(0);
  const visibleSince = useRef<number | null>(null);
  const isActiveNow = () =>
    typeof document !== "undefined" && document.visibilityState === "visible" && document.hasFocus();
  const submittedRef = useRef(false);

  // The default can come from an earlier reviewer (first or second-pass pass), so
  // it may predate a journal deflation that has since lowered claimedHours. Never
  // start above what can actually be credited (the input's own max).
  const baseHours = round1(Math.min(defaultHours ?? claimedHours, claimedHours));
  const [hours, setHours] = useState(baseHours);
  const [hoursInput, setHoursInput] = useState(String(baseHours));
  // Why changes were asked for (a CHANGE_REASONS code). "track" tells the builder they may change the track.
  const [changeReason, setChangeReason] = useState<ChangeReason | "">("");
  const deflated = hours < claimedHours;
  // claimedHours is already post-journal-deflation (payoutHours on the page),
  // so a journal-only deflation would leave `deflated` false and skip the
  // required reason. Count journal-level deflation too, and show the true
  // pre-journal total in the label.
  const needsDeflationReason = deflated || journalDeflatedHours > 0;
  const rawClaimedHours = round1(claimedHours + journalDeflatedHours);

  // Deflating a journal entry revalidates this page without remounting, so
  // `hours` (seeded once from baseHours) would go stale. Re-sync whenever
  // baseHours changes, unless the reviewer already typed their own value.
  const hoursEditedRef = useRef(false);
  useEffect(() => {
    if (!hoursEditedRef.current) {
      setHours(baseHours);
      setHoursInput(String(baseHours));
    }
  }, [baseHours]);

  // The audit note is the one hard-to-redo part of a review, so it autosaves
  // to localStorage (this browser) and, debounced, to the project itself (any
  // reviewer, any device). The local copy is only cleared once a submit
  // actually navigated away, see the unmount effect below.
  const draftKey = `loadout-review-draft-${projectId}`;
  const technicalFeaturesRef = useRef<HTMLTextAreaElement>(null);
  const deflationReasonRef = useRef<HTMLTextAreaElement>(null);
  const ageJustificationRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const pendingDraft = useRef<Draft | null>(null);
  const [draftSource, setDraftSource] = useState<"local" | "server" | "firstPass" | null>(null);
  const [featuresLen, setFeaturesLen] = useState(0);
  const [serverSave, setServerSave] = useState<"idle" | "saving" | "saved" | "error" | "stale">("idle");
  const staleDeploy = useRef(false);

  const pushServerDraft = (draft: Draft) => {
    // A deploy happened while this tab was open: its action ids no longer
    // exist, so every further save would fail the same way (one per keystroke).
    // Stop trying and ask for a reload instead; the local copy carries over.
    if (staleDeploy.current) return;
    setServerSave("saving");
    saveReviewDraft(projectId, draft)
      .then(() => setServerSave("saved"))
      // Best-effort: the localStorage copy is unaffected either way.
      .catch((e: unknown) => {
        const stale = isStaleDeployError(e);
        staleDeploy.current = stale;
        setServerSave(stale ? "stale" : "error");
      });
  };

  useEffect(() => {
    let draft: Draft | null = null;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) draft = JSON.parse(raw);
    } catch {
      draft = null;
    }
    if (draft) {
      // A local copy is saved on any edit (hours, notes...), so it can hold a
      // blank text box. Blank fields must not hide text the server draft has,
      // such as the AI draft pre-filled in technical features.
      for (const [k, v] of Object.entries(serverDraft?.draft ?? {})) {
        const mine = draft[k];
        if (typeof v === "string" && v.trim() !== "" && typeof mine === "string" && mine.trim() === "") draft[k] = v;
      }
      setDraftSource("local");
      // Push it to the server right away, so a restored draft the reviewer
      // never edits again still reaches whoever does the real pass.
      pushServerDraft(draft);
    } else if (serverDraft?.draft) {
      // Someone else (or this reviewer on another device) already started.
      draft = { ...serverDraft.draft };
      setDraftSource("server");
    } else if (firstPass) {
      // Start from what the first reviewer wrote. Still fully editable.
      draft = { ...firstPass };
      setDraftSource("firstPass");
    }
    if (!draft) return;
    if (typeof draft.technicalFeatures === "string" && technicalFeaturesRef.current) {
      technicalFeaturesRef.current.value = draft.technicalFeatures;
      setFeaturesLen(draft.technicalFeatures.trim().length);
    }
    if (typeof draft.ageJustification === "string" && ageJustificationRef.current)
      ageJustificationRef.current.value = draft.ageJustification;
    if (typeof draft.notes === "string" && notesRef.current) notesRef.current.value = draft.notes;
    if (typeof draft.note === "string" && noteRef.current) noteRef.current.value = draft.note;
    // The deflation reason box only renders once `deflated` is true, which
    // depends on the hours this draft is about to set, so fill it in later.
    pendingDraft.current = draft;
    // A saved `hours` is only trustworthy if the server baseline it was
    // measured against hasn't moved (a journal deflation since then would be
    // silently undone otherwise).
    if (typeof draft.hours === "number" && draft.baseHours === baseHours) {
      hoursEditedRef.current = true;
      setHours(draft.hours);
      setHoursInput(String(draft.hours));
    }
    if (typeof draft.changeReason === "string" && (CHANGE_REASONS as readonly string[]).includes(draft.changeReason)) setChangeReason(draft.changeReason as ChangeReason);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const draft = pendingDraft.current;
    if (!draft) return;
    if (typeof draft.deflationReason === "string" && deflationReasonRef.current) {
      deflationReasonRef.current.value = draft.deflationReason;
      pendingDraft.current = null;
    }
  }, [needsDeflationReason]);

  // Callers that just called setHours pass the new value, since
  // state hasn't updated yet inside the same handler.
  const serverDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraft = (overrides?: { hours?: number; changeReason?: string }) => {
    const snapshot = {
      hours: overrides?.hours ?? hours,
      baseHours,
      changeReason: overrides?.changeReason ?? changeReason,
      technicalFeatures: technicalFeaturesRef.current?.value ?? "",
      deflationReason: deflationReasonRef.current?.value ?? "",
      ageJustification: ageJustificationRef.current?.value ?? "",
      notes: notesRef.current?.value ?? "",
      note: noteRef.current?.value ?? "",
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(snapshot));
    } catch {
      // Storage full or blocked: the review still works, it just can't be recovered.
    }
    // Debounced so a fast typist doesn't fire a server write per keystroke.
    if (serverDraftTimer.current) clearTimeout(serverDraftTimer.current);
    serverDraftTimer.current = setTimeout(() => pushServerDraft(snapshot), 1000);
  };

  const clearDraft = () => {
    if (serverDraftTimer.current) clearTimeout(serverDraftTimer.current);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  };

  // Submission, audit notes and verdict all sit on one scrolling form, so
  // nothing has to be opened or clicked through before judging.
  const [stepError, setStepError] = useState("");
  // Focus target for errors that are not about one field (a failed or bounced submit).
  const errorRef = useRef<HTMLDivElement>(null);
  const verdictRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fresh accumulator per mount: a remount without a page load would
    // otherwise inherit a stale total.
    activeMs.current = 0;
    visibleSince.current = isActiveNow() ? Date.now() : null;
    const trackActiveTime = () => {
      const activeNow = isActiveNow();
      if (activeNow && visibleSince.current === null) {
        visibleSince.current = Date.now();
      } else if (!activeNow && visibleSince.current !== null) {
        activeMs.current += Date.now() - visibleSince.current;
        visibleSince.current = null;
      }
    };
    const settle = () => {
      const a = away.current;
      if (!a || document.visibilityState !== "visible") return;
      away.current = null;
      const el = a.kind === "repo" ? repoSeconds.current : demoSeconds.current;
      if (el) el.value = String(Math.round(Number(el.value || 0) + (Date.now() - a.at) / 1000));
    };
    window.addEventListener("focus", settle);
    document.addEventListener("visibilitychange", settle);
    window.addEventListener("focus", trackActiveTime);
    window.addEventListener("blur", trackActiveTime);
    document.addEventListener("visibilitychange", trackActiveTime);
    return () => {
      window.removeEventListener("focus", settle);
      document.removeEventListener("visibilitychange", settle);
      window.removeEventListener("focus", trackActiveTime);
      window.removeEventListener("blur", trackActiveTime);
      document.removeEventListener("visibilitychange", trackActiveTime);
    };
  }, []);

  // Clear the local draft only when a submit actually navigated somewhere
  // else. A request that dies mid-flight (a redeploy) can still force a reload
  // of this same URL, which unmounts with submittedRef set; comparing the
  // pathname keeps the draft in that case.
  const mountedPathname = useRef<string | null>(null);
  useEffect(() => {
    mountedPathname.current = window.location.pathname;
    return () => {
      if (submittedRef.current && window.location.pathname !== mountedPathname.current) clearDraft();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markOpen = (kind: "repo" | "demo") => {
    const el = kind === "repo" ? repoOpened.current : demoOpened.current;
    if (el) el.value = "1";
    away.current = { kind, at: Date.now() };
  };

  // The repo/demo links live in the owner card on the review page (outside
  // this form), tagged with data-review-link, so listen for their clicks here
  // to keep recording whether and how long the reviewer opened them. auxclick
  // catches middle-click, which opens a new tab without firing click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.type === "auxclick" && e.button !== 1) return;
      const kind = (e.target as Element | null)?.closest("[data-review-link]")?.getAttribute("data-review-link");
      if (kind === "repo" || kind === "demo") markOpen(kind);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("auxclick", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("auxclick", onClick);
    };
  }, []);

  // Technical features / additional notes are only required for approve
  // (reviewProject relaxes them for needs_changes and ban too). Those fields live
  // sit far above the verdict buttons, out of sight when they're clicked, so
  // this checks everything itself and says what's wrong next to the buttons,
  // instead of a click that does nothing.
  const onVerdictSelect = (verdict: string): boolean => {
    const required = verdict === "approved";
    if (technicalFeaturesRef.current) {
      technicalFeaturesRef.current.required = required;
      if (required) technicalFeaturesRef.current.minLength = TECHNICAL_FEATURES_MIN;
      else technicalFeaturesRef.current.removeAttribute("minlength");
    }
    if (notesRef.current) notesRef.current.required = required;
    if (ageJustificationRef.current) ageJustificationRef.current.required = required && ageFlag;

    // The message is announced (role="alert" below) and focus moves to the field it is about, so a keyboard or screen reader user
    // lands where the problem is instead of on a verdict button far from it.
    const fail = (field: HTMLElement | null | undefined, message: string) => {
      setStepError(message);
      if (field) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", STEP_ERROR_ID);
        field.focus();
      } else {
        errorRef.current?.focus();
      }
      return false;
    };
    for (const el of [
      technicalFeaturesRef.current,
      deflationReasonRef.current,
      ageJustificationRef.current,
      notesRef.current,
      noteRef.current,
    ]) {
      el?.removeAttribute("aria-invalid");
      el?.removeAttribute("aria-describedby");
    }
    if (verdict === "needs_changes" && hasUnfilledMacroPlaceholder(noteRef.current?.value ?? "")) {
      return fail(noteRef.current, "Specify what's missing from the README before requesting changes.");
    }
    // Hours are only credited on an approve, so only an approve needs the reason.
    if (verdict === "approved" && needsDeflationReason && !deflationReasonRef.current?.value.trim())
      return fail(deflationReasonRef.current, "Say why you're lowering the hours before deciding.");
    if (verdict === "approved" && ageFlag && !ageJustificationRef.current?.value.trim())
      return fail(ageJustificationRef.current, "Age justification is required before deciding.");
    if (required) {
      if ((technicalFeaturesRef.current?.value.trim().length ?? 0) < TECHNICAL_FEATURES_MIN)
        return fail(technicalFeaturesRef.current, `Technical features needs at least ${TECHNICAL_FEATURES_MIN} characters.`);
      if (!notesRef.current?.value.trim()) return fail(notesRef.current, "Additional notes is required before approving.");
    }
    // Anything else the browser would reject (an hours value off the 0.1 step,
    // above the cap, ...): named here, since its own bubble can be scrolled
    // out of view.
    const invalid = formRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      "input:invalid, textarea:invalid, select:invalid",
    );
    if (invalid) return fail(invalid, `${fieldLabel(invalid.name)}: ${invalid.validationMessage}`);
    setStepError("");
    return true;
  };

  // Submitting through a transition instead of <form action> keeps a failed
  // verdict on this page with a real message (and every typed note intact),
  // instead of the app-wide "Something broke" screen.
  const [pendingVerdict, setPendingVerdict] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [, startSubmit] = useTransition();
  // Move focus to the message when a submit fails, so it is read out and the reviewer is not left on a disabled button.
  useEffect(() => {
    if (submitError) errorRef.current?.focus();
  }, [submitError]);

  // Undo window: a verdict is only sent (and so only announced, credited)
  // UNDO_SECONDS after the click, and Undo within that time cancels
  // it. The FormData is captured at click time and held here until then.
  const UNDO_SECONDS = 10;
  const [undoLeft, setUndoLeft] = useState<number | null>(null);
  const undoWindowOpen = undoLeft !== null;
  const pendingFd = useRef<FormData | null>(null);

  useEffect(() => {
    if (undoLeft === null) return;
    if (undoLeft <= 0) {
      sendVerdict();
      return;
    }
    const t = setTimeout(() => setUndoLeft((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
    // sendVerdict only reads refs and stable setters.
  }, [undoLeft]);

  // Leaving the page inside the window would drop the verdict silently.
  useEffect(() => {
    if (!undoWindowOpen) return;
    const warn = (ev: BeforeUnloadEvent) => ev.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [undoWindowOpen]);

  const [undone, setUndone] = useState(false);
  const undoVerdict = () => {
    pendingFd.current = null;
    setUndoLeft(null);
    setPendingVerdict(null);
    setUndone(true);
    // The Undo button is about to unmount: put focus back on the verdict buttons (they re-enable on this render).
    requestAnimationFrame(() => verdictRowRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus());
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pendingVerdict) return;
    if (totalSeconds.current) {
      const finalMs = activeMs.current + (visibleSince.current !== null ? Date.now() - visibleSince.current : 0);
      totalSeconds.current.value = String(Math.round(finalMs / 1000));
    }
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    // Ensure approvedHours in the submitted payload is rounded to tenths
    const roundedHours = round1(Math.min(claimedHours, Math.max(0, Number(hoursInput) || 0)));
    fd.set("approvedHours", String(roundedHours));
    const verdict = String(fd.get("verdict") ?? "");
    setSubmitError("");
    setUndone(false);
    setPendingVerdict(verdict);
    pendingFd.current = fd;
    setUndoLeft(UNDO_SECONDS);
  };

  const sendVerdict = () => {
    const fd = pendingFd.current;
    if (!fd) return;
    pendingFd.current = null;
    setUndoLeft(null);
    // Only flags the attempt; the unmount effect decides whether to clear the draft.
    submittedRef.current = true;
    if (serverDraftTimer.current) clearTimeout(serverDraftTimer.current);
    startSubmit(async () => {
      try {
        await reviewProject(fd);
        // Every verdict that sticks redirects (to the next project, or back
        // here with ?error=), so getting here means the action stopped early.
        setSubmitError(
          "The verdict didn't go through. The project probably changed while you had it open (someone else reviewed it, or it left the review queue). Reload to see where it stands. Your notes are kept in this browser.",
        );
      } catch (err) {
        // A validation failure redirects back to this same page with ?error=,
        // which doesn't remount the form: re-enable it and repeat the message
        // next to the buttons, where the reviewer is looking.
        const bounced = bouncedError(err);
        if (bounced) {
          submittedRef.current = false;
          setPendingVerdict(null);
          setSubmitError(bounced);
        }
        // Opened before a deploy: nothing was submitted. The reload notice
        // above the form says what to do, so don't repeat it as an error.
        if (isStaleDeployError(err)) {
          staleDeploy.current = true;
          setServerSave("stale");
        } else if (!bounced) {
          setSubmitError(actionErrorMessage(err, "submit this verdict"));
        }
      }
      submittedRef.current = false;
      setPendingVerdict(null);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {(secondPass || isSuper || canEditSubmission) && (
        <EditSubmission
          projectId={projectId}
          repoUrl={repoUrl}
          demoUrl={demoUrl}
          currentName={currentName}
          currentDescription={currentDescription}
          currentImageUrl={currentImageUrl}
        />
      )}

      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
        {draftSource === "local" && (
          <Callout tone="warning" icon="history">
            Restored your unsaved notes from last time you had this open.
          </Callout>
        )}
        {draftSource === "server" && (
          <Callout tone="info" icon="history">
            Started from {serverDraft?.by || "another reviewer"}&apos;s in-progress notes
            {serverDraft?.at ? ` (${formatDateTime(serverDraft.at)})` : ""}. Edit anything before you
            decide. Whatever you type here saves for anyone else who opens this project too.
          </Callout>
        )}
        {draftSource === "firstPass" && (
          <Callout tone="neutral" icon="history">
            Started from the first reviewer&apos;s notes. Edit anything before you decide.
          </Callout>
        )}
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="repoOpened" defaultValue="0" ref={repoOpened} />
        <input type="hidden" name="demoOpened" defaultValue="0" ref={demoOpened} />
        <input type="hidden" name="repoSeconds" defaultValue="0" ref={repoSeconds} />
        <input type="hidden" name="demoSeconds" defaultValue="0" ref={demoSeconds} />
        <input type="hidden" name="totalSeconds" defaultValue="0" ref={totalSeconds} />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="hc-save-status" data-tone={serverSave === "error" || serverSave === "stale" ? "danger" : serverSave === "saved" ? "success" : undefined}>
            {serverSave === "saving"
              ? "Saving draft…"
              : serverSave === "saved"
                ? "Draft saved"
                : serverSave === "error" || serverSave === "stale"
                  ? "Draft kept in this browser only"
                  : "Autosaves as you type"}
          </span>
        </div>
        {serverSave === "stale" && (
          <Callout tone="warning" icon="history">
            A new version of the dashboard was deployed while this page was open, so nothing can be saved or
            submitted from it. Reload, then submit again: what you have typed is saved in this browser and will still
            be here.
            <div className="mt-2">
              <button type="button" className="hc-btn hc-btn-outline hc-btn-sm" onClick={() => window.location.reload()}>
                Reload now
              </button>
            </div>
          </Callout>
        )}
        <div className="flex flex-col gap-4">
          <p className="hc-eyebrow">Submission</p>
          <InlineNumber
            label="Hours to credit"
            hint={
              journalDeflatedHours > 0 || deflated
                ? [
                    journalDeflatedHours > 0 ? `${journalDeflatedHours}h deflated in journals` : null,
                    deflated ? `${round1(claimedHours - hours)}h deflated not in journals` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Decrease only"
            }
          >
            <Input
              name="approvedHours"
              type="number"
              step="0.1"
              min="0"
              max={claimedHours}
              value={hoursInput}
              onChange={(e) => {
                const raw = e.target.value;
                setHoursInput(raw);
                hoursEditedRef.current = true;
                const num = Number(raw);
                const val = raw !== "" && Number.isFinite(num) ? Math.min(claimedHours, Math.max(0, num)) : 0;
                setHours(val);
                saveDraft({ hours: val });
              }}
              onBlur={() => {
                const rounded = round1(Math.min(claimedHours, Math.max(0, Number(hoursInput) || 0)));
                setHours(rounded);
                setHoursInput(String(rounded));
                saveDraft({ hours: rounded });
              }}
              className="w-28"
            />
          </InlineNumber>
          {collaborators.map((c) => (
            <CollaboratorHoursInput key={c.id} c={c} />
          ))}
          <p className="hc-caption text-xs">
            Journals are due every {JOURNAL_HOURS} hours of work. Each tracked minute can sit in one entry only.
          </p>
          <TrackAndCredit hours={hours} track={track} />
          {kind === "hardware" && (
            <Callout tone="info" icon="view">
              Hardware ship: check the Lapse recordings against the bill of materials. The parts need quantities and sources, and the
              design files must be in the public source.
            </Callout>
          )}
          {researchMode && (
            <Callout tone="info" icon="idea">
              Research Mode: expect a question, a method, measurements and a public write-up. It is a modifier, so it earns no extra XP and
              does not lower the shipping requirement.
            </Callout>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
          <p className="hc-eyebrow">Audit notes</p>
          {canAiDraft && (
            <div className="hc-panel flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hc-eyebrow">AI draft</span>
                <Button type="button" variant="outline" size="sm" disabled>
                  Generate AI draft
                </Button>
              </div>
              <p className="hc-caption text-xs">
                Would draft the fields below for you to check and edit. It never picks a verdict or hours. Opens with the review
                service. Nothing here is saved.
              </p>
            </div>
          )}

          <p className="hc-eyebrow">
            Internal audit note, never shown to the builder. Someone who wasn&apos;t involved should reach the same
            conclusion you did.
          </p>
          <Field
            label="Technical features"
            hint={
              <>
                A detailed explanation of what the project is, to show you actually checked it. Use specific technical
                terms (&quot;OAuth app&quot;, not generic words). If you can&apos;t find any, describe in detail what
                it looks like and does. For hardware, name the parts and what the Lapse recordings show.
              </>
            }
          >
            <AuditTextarea
              name="technicalFeatures"
              ref={technicalFeaturesRef}
              onChange={(e) => {
                setFeaturesLen(e.target.value.trim().length);
                saveDraft();
              }}
              placeholder={
                "Example: The demo is a single-page tool with an action button labeled \"Encode some data\" and a secondary \"Decode an image\". The encoding page has a drag-and-drop box that shows the image's resolution and size, and lets you encode text, an image or a file into it. The repository has a broad README with screenshots and sections (Features, Tech Stack, How to use, Run locally). Written with React.\n\nThen cover the README (is it clear, does it explain how to run locally and how it was made) and the demo (how it is hosted)."
              }
              rows={5}
            />
            <span className="hc-counter" data-done={featuresLen >= TECHNICAL_FEATURES_MIN ? true : undefined}>
              {featuresLen}/{TECHNICAL_FEATURES_MIN}
            </span>
          </Field>
          {needsDeflationReason && (
            <Field
              label={`Why lower the hours? (${rawClaimedHours}h claimed → ${hours}h credited)`}
              hint="A short justification: what made you deflate (suspected AI use, too few proofs such as few commits and no journal) and how much you deflated and approved."
            >
              <AuditTextarea
                name="deflationReason"
                ref={deflationReasonRef}
                onChange={() => saveDraft()}
                placeholder={
                  "Example: The HTML has AI comments like <!-- Open Graph tags -->, the CSS and JS do not and look handwritten. The commits are numerous and consistent but not descriptive (\"added css\" for all of them), so they do not show progress. I deflate 2h from the 10h submitted to approve 8h."
                }
                rows={3}
              />
            </Field>
          )}
          {ageFlag && (
            <Field label="Age justification" hint="LOADOUT is for ages 13 to 18. This builder turned 19 between shipping and this review.">
              <AuditTextarea
                name="ageJustification"
                ref={ageJustificationRef}
                onChange={() => saveDraft()}
                placeholder="Document the builder's age at shipping and now. An owner decides on any age exception."
                rows={3}
              />
            </Field>
          )}
          <Field
            label="Additional notes"
            hint={
              <>
                Required for approval. Show your thinking, one line for each quality dimension (
                {QUALITY_DIMENSIONS.map((d) => d.name).join(", ")}): what you saw and what it means for the hours. Say why you
                didn&apos;t deflate (commit count, whether they are descriptive and show steady progress, journals), and any
                other proof that supports the time.
              </>
            }
          >
            <AuditTextarea
              name="notes"
              ref={notesRef}
              onChange={() => saveDraft()}
              placeholder={
                "Example: Originality: a new approach to the encoder, not a tutorial copy. Technical Depth: the core codec is theirs, 38 descriptive commits show steady progress, like 002793b adding a loading state (22 lines in 6 minutes). Execution: it runs from a clean checkout. Documentation: the README has build steps and an example. The longest gap between commits is 1.2h, which is consistent with the journals, so the 8h stands."
              }
              rows={5}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
          <p className="hc-eyebrow">Verdict</p>
          <Field
            label="Note to the builder"
            hint={`Required. Be friendly and specific, and show their work is good. Built-in shortcuts: ${REVIEW_MACROS.map((m) => m.trigger).join(", ")}. Your custom shortcuts work here too.`}
          >
            <AuditTextarea
              name="note"
              required
              maxLength={MAX_REVIEW_NOTE_LENGTH}
              ref={noteRef}
              onChange={(e) => {
                // Macros (lib/reviewMacros.ts): typing /ai or /track swaps in the canned
                // text. Only after something was typed or pasted, so deleting
                // back down to "/ai" never expands it.
                const input = e.currentTarget;
                if ((e.nativeEvent as InputEvent).inputType?.startsWith("insert")) {
                  const expanded = expandMacro(input.value, input.selectionStart ?? input.value.length, [...REVIEW_MACROS, ...customMacros], { track });
                  if (expanded) {
                    input.value = expanded.value;
                    input.setSelectionRange(expanded.caret, expanded.caret);
                  }
                }
                saveDraft();
              }}
              placeholder={
                "Say what works, what to fix first, and finish with a short motivation like \"Keep it up!\"."
              }
              rows={4}
            />
          </Field>
          <div className="flex flex-col gap-2">
            <p className="hc-label">
              If you request changes, why?
              <span className="hc-label-hint">Optional. A preset reason for the builder.</span>
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Reason for requesting changes">
              {CHANGE_REASONS.map((code) => (
                <button
                  key={code}
                  type="button"
                  className="hc-btn hc-btn-outline hc-btn-sm"
                  aria-pressed={changeReason === code}
                  data-active={changeReason === code ? true : undefined}
                  onClick={() => {
                    const next = changeReason === code ? "" : code;
                    setChangeReason(next);
                    saveDraft({ changeReason: next });
                  }}
                >
                  {CHANGE_REASON_LABELS[code]}
                </button>
              ))}
            </div>
            <input type="hidden" name="changeReason" value={changeReason} />
            {changeReason === "track" && (
              <p className="hc-caption text-xs">
                The builder is told the work does not fit {track}, and that they may change the project&apos;s track or add more work in {track}
                before shipping again. Type /track in the note to add that message.
              </p>
            )}
          </div>
          {showReviewMacroPrompt(customMacros, macroPromptDismissed) && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--sunken)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">Want your own review shortcuts?</p>
                  <p className="hc-muted text-xs">Optional: create a personal /macro in Settings. This invitation disappears once you save one or dismiss it.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ButtonLink href="/settings#review" variant="outline" size="sm">Set up macros</ButtonLink>
                  <Button type="button" size="sm" variant="ghost" disabled={macroPromptSaving} onClick={() => { void dismissMacroInvite(); }}>
                    {macroPromptSaving ? "Dismissing..." : "Not now"}
                  </Button>
                </div>
              </div>
              {macroPromptError && <p className="mt-2 text-xs text-[var(--hc-red)]" role="alert">Could not dismiss the invitation. Try again.</p>}
            </div>
          )}
          <Checkbox
            name="revealName"
            value="1"
            defaultChecked={defaultRevealName}
            label={'Show my name to the builder in this verdict\'s notification (approved / needs changes). Untick to send it as "the review team" instead.'}
          />
          <Checkbox
            name="notifyOnResubmit"
            value="1"
            defaultChecked={defaultNotifyOnResubmit}
            label="If you request changes: tell me when the builder ships this project again, so I can re-review it while I still remember it."
          />
          {(stepError || submitError) && (
            <div ref={errorRef} id={STEP_ERROR_ID} role="alert" tabIndex={-1} className="outline-none">
              <Callout tone="danger" icon="important">{stepError || submitError}</Callout>
            </div>
          )}
          {/* Always mounted so a screen reader announces it. The message is said once, not on every tick of the countdown. */}
          <div role="status" aria-live="polite" className="sr-only">
            {undoLeft !== null
              ? `Sending your verdict in ${UNDO_SECONDS} seconds. Nothing is posted or credited until then. Undo and Send now are available.`
              : undone
                ? "Verdict cancelled. Nothing was sent."
                : ""}
          </div>
          {undoLeft !== null && (
            <Callout tone="neutral" icon="clock">
              <span className="flex flex-wrap items-center gap-3">
                <span aria-hidden="true">
                  Sending your verdict in {undoLeft}s. Nothing is posted or credited until then.
                </span>
                <Button type="button" variant="outline" onClick={undoVerdict}>
                  Undo
                </Button>
                <Button type="button" variant="success" onClick={sendVerdict}>
                  Send now
                </Button>
              </span>
            </Callout>
          )}
          <div ref={verdictRowRef}>
            <VerdictButtons
              secondPass={secondPass}
              pendingVerdict={pendingVerdict}
              onVerdictSelect={onVerdictSelect}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
