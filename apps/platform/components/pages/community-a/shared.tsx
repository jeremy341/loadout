"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./community-a.css";
import { formatDay } from "./logic/activity";
import { commentsFor } from "./logic/content";
import { COMMUNITY_CONDUCT, DRAFT_RULES } from "./logic/rules";
import { REPORT_REASONS, hasReported } from "./logic/moderation";
import { makeRef } from "./logic/refs";
import { textLength } from "./logic/text";
import { ME_HANDLE, nameOf, useComments, useModeration } from "./stores";
import type { RefKind } from "./logic/types";

// Building blocks shared by the four community tabs: byline, pager, like button, inline confirm, report form,
// comment thread, preview-tools box and the conduct line. All user text is rendered as text.

/** Moves focus to the first of these elements that exists, after the next render. Used after a delete, a page change or leaving a detail view. */
export function focusById(...ids: string[]) {
  window.setTimeout(() => {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        el.focus();
        return;
      }
    }
  }, 0);
}

export function ConductLine() {
  return (
    <p className="ca-conduct">
      <strong>Community conduct.</strong> {COMMUNITY_CONDUCT}
    </p>
  );
}

export function DraftRuleNote({ children }: { children: ReactNode }) {
  return (
    <p className="ca-rule">
      <strong>Draft preview rule.</strong> {children}
    </p>
  );
}

export function Byline({ handle, at, edited }: { handle: string; at?: string; edited?: string }) {
  const you = handle === ME_HANDLE;
  return (
    <span className="ca-by">
      <strong>{you ? "You" : nameOf(handle)}</strong> <span className="mut">@{handle}</span>
      {at ? (
        <>
          {" "}
          <span className="mut" aria-hidden="true">
            &middot;
          </span>{" "}
          <time dateTime={at}>{formatDay(at)}</time>
        </>
      ) : null}
      {edited ? <span className="mut"> (edited {formatDay(edited)})</span> : null}
    </span>
  );
}

// ---- Fields ----

export function CaField({
  id,
  label,
  hint,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  counter?: ReactNode;
  children: (aria: { id: string; "aria-describedby"?: string; "aria-invalid"?: true }) => ReactNode;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint || counter ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <div className="ca-field">
      <label htmlFor={id} className="fld-label">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy || undefined, "aria-invalid": error ? true : undefined })}
      {hint || counter ? (
        <p id={hintId} className="fld-hint">
          {hint}
          {hint && counter ? " " : null}
          {counter}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="ca-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const length = textLength(value.trim());
  return (
    <span className={length > max ? "ca-over" : undefined}>
      {length} / {max} characters{length > max ? ` (${length - max} too many)` : ""}
    </span>
  );
}

// ---- Buttons ----

/** Like or upvote toggle. `pressed` is announced; the text also changes, so state is not colour alone. */
export function ReactionButton({
  verb,
  doneVerb,
  pressed,
  count,
  subject,
  onToggle,
}: {
  verb: string;
  doneVerb: string;
  pressed: boolean;
  count: number;
  subject: string;
  onToggle: () => void;
}) {
  return (
    <button type="button" className={pressed ? "btn btn-sm" : "btn btn-sm btn-quiet"} aria-pressed={pressed} onClick={onToggle}>
      <span aria-hidden="true">{pressed ? `${doneVerb} ✓` : verb}</span>
      <span className="sr-only">
        {verb} {subject}
      </span>
      <span className="ca-count">{count}</span>
    </button>
  );
}

/** A destructive action with an inline confirm step. Cancel returns focus to the first button. */
export function ConfirmButton({
  label,
  confirmLabel,
  subject,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  subject: string;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  if (!asking) {
    return (
      <button
        ref={trigger}
        type="button"
        className="btn btn-sm btn-danger"
        onClick={() => {
          setAsking(true);
          window.setTimeout(() => cancel.current?.focus(), 0);
        }}
      >
        {label}
        <span className="sr-only"> {subject}</span>
      </button>
    );
  }
  return (
    <span className="ca-confirm" role="group" aria-label={`Confirm: ${label} ${subject}`}>
      <span className="ca-confirm-q">{label} {subject}?</span>
      <button type="button" className="btn btn-sm btn-danger" onClick={() => onConfirm()}>
        {confirmLabel}
      </button>
      <button
        ref={cancel}
        type="button"
        className="btn btn-sm btn-quiet"
        onClick={() => {
          setAsking(false);
          window.setTimeout(() => trigger.current?.focus(), 0);
        }}
      >
        Cancel
      </button>
    </span>
  );
}

// ---- Pager ----

/** Explicit Previous / Next controls (no infinite scroll). The page state is announced politely. */
export function Pager({
  page,
  pageCount,
  from,
  to,
  total,
  noun,
  focusId,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  noun: string;
  focusId: string;
  onPage: (page: number) => void;
}) {
  const go = (next: number) => {
    onPage(next);
    focusById(focusId);
  };
  return (
    <nav className="ca-pager" aria-label={`${noun} pages`}>
      <button type="button" className="btn btn-sm btn-quiet" disabled={page <= 1} onClick={() => go(page - 1)}>
        Previous page
      </button>
      <p className="ca-pager-state" role="status" aria-live="polite">
        Page {page} of {pageCount}
        <span className="mut">
          {" "}
          &middot; {total === 0 ? `no ${noun}` : `${from}–${to} of ${total}`}
        </span>
      </p>
      <button type="button" className="btn btn-sm btn-quiet" disabled={page >= pageCount} onClick={() => go(page + 1)}>
        Next page
      </button>
    </nav>
  );
}

export function HiddenNotice({ count, noun, onShow }: { count: number; noun: string; onShow: () => void }) {
  if (count <= 0) return null;
  return (
    <p className="ca-hidden-note">
      {count} {noun}
      {count === 1 ? " is" : "s are"} hidden for you.{" "}
      <button type="button" className="link-btn" onClick={onShow}>
        Show hidden {noun}s
      </button>
    </p>
  );
}

// ---- Report ----

/**
 * Report content: a reason (required), optional details, and two choices: also hide the item for you, and
 * (for someone else's content) also block the builder. The report is stored in this browser only in the preview.
 */
export function ReportControl({
  kind,
  itemId,
  label,
  authorHandle,
  onDone,
}: {
  kind: RefKind;
  itemId: string;
  label: string;
  authorHandle: string;
  onDone: (message: string) => void;
}) {
  const moderation = useModeration();
  const uidBase = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [hide, setHide] = useState<boolean>(DRAFT_RULES.reportHidesByDefault);
  const [block, setBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reasonField = useRef<HTMLSelectElement>(null);
  const ref = makeRef(kind, itemId);
  const reported = hasReported(moderation.state, ref);
  const own = authorHandle === ME_HANDLE;
  if (own) return null;

  if (reported) {
    return (
      <span className="ca-reported" role="note">
        Reported <span className="sr-only">{label}</span>
      </span>
    );
  }

  if (!open) {
    return (
      <button
        ref={trigger}
        type="button"
        className="btn btn-sm btn-quiet"
        aria-expanded={false}
        onClick={() => {
          setOpen(true);
          window.setTimeout(() => reasonField.current?.focus(), 0);
        }}
      >
        Report<span className="sr-only"> {label}</span>
      </button>
    );
  }

  const noteId = `${uidBase}-note`;
  return (
    <form
      className="ca-report"
      onSubmit={(event) => {
        event.preventDefault();
        const result = moderation.report({ ref, label, reason, note, hide, blockHandle: block ? authorHandle : undefined });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setOpen(false);
        onDone(result.message);
      }}
    >
      <fieldset>
        <legend>Report: {label}</legend>
        <p className="mut">Reports are saved in this browser in the preview. No one reviews them yet.</p>
        <CaField id={`${uidBase}-reason`} label="Reason" error={error && !reason ? error : null}>
          {(aria) => (
            <select {...aria} ref={reasonField} value={reason} onChange={(e) => setReason(e.target.value)} required>
              <option value="">Choose a reason</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
        </CaField>
        <CaField
          id={noteId}
          label="Details (optional)"
          error={error && reason ? error : null}
          counter={<CharCount value={note} max={DRAFT_RULES.reportNoteMax} />}
        >
          {(aria) => <textarea {...aria} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
        </CaField>
        <label className="check">
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} />
          <span>Hide this for me</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} />
          <span>Also block {nameOf(authorHandle)} (hides all their content)</span>
        </label>
        <div className="ca-actions">
          <button type="submit" className="btn btn-sm">
            Send report
          </button>
          <button
            type="button"
            className="btn btn-sm btn-quiet"
            onClick={() => {
              setOpen(false);
              setError(null);
              window.setTimeout(() => trigger.current?.focus(), 0);
            }}
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}

// ---- Comments ----

export function CommentThread({
  kind,
  itemId,
  itemTitle,
  headingId,
  level = 3,
  onStatus,
}: {
  kind: RefKind;
  itemId: string;
  itemTitle: string;
  headingId: string;
  level?: 3 | 4;
  onStatus: (message: string) => void;
}) {
  const comments = useComments();
  const moderation = useModeration();
  const uidBase = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = makeRef(kind, itemId);
  const all = commentsFor(comments.all, ref);
  const visible = all.filter((c) => c.handle === ME_HANDLE || (!moderation.state.hidden.includes(makeRef("comment", c.id)) && !moderation.blocked.includes(c.handle)));
  const hiddenHere = all.filter((c) => c.handle !== ME_HANDLE && moderation.state.hidden.includes(makeRef("comment", c.id)) && !moderation.blocked.includes(c.handle));
  const Heading = level === 3 ? "h3" : "h4";
  const fieldId = `${uidBase}-comment`;
  const listId = `${uidBase}-list`;

  return (
    <div className="ca-thread">
      <Heading id={headingId} tabIndex={-1} className="ca-subhead">
        Comments ({visible.length})
      </Heading>
      {visible.length === 0 ? (
        <p className="mut">No comments yet. Be the first to write one.</p>
      ) : (
        <ul id={listId} className="ca-comments">
          {visible.map((c) => {
            const preview = c.body.length > 40 ? `${c.body.slice(0, 40)}…` : c.body;
            return (
              <li key={c.id} className="ca-comment">
                <p className="ca-comment-head">
                  <Byline handle={c.handle} at={c.at} />
                </p>
                <p className="ca-body">{c.body}</p>
                <div className="ca-actions">
                  {c.handle === ME_HANDLE ? (
                    <ConfirmButton
                      label="Delete"
                      confirmLabel="Yes, delete"
                      subject={`your comment "${preview}"`}
                      onConfirm={() => {
                        comments.remove(c.id);
                        onStatus("Comment deleted.");
                        focusById(headingId);
                      }}
                    />
                  ) : (
                    <ReportControl
                      kind="comment"
                      itemId={c.id}
                      label={`comment by ${nameOf(c.handle)}`}
                      authorHandle={c.handle}
                      onDone={(message) => {
                        onStatus(message);
                        focusById(headingId);
                      }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <HiddenNotice
        count={hiddenHere.length}
        noun="comment"
        onShow={() => {
          for (const c of hiddenHere) moderation.unhide(makeRef("comment", c.id));
          onStatus("Hidden comments are showing again.");
        }}
      />
      <form
        className="ca-comment-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const result = comments.add(ref, draft);
          if (!result.ok) {
            setError(result.message);
            return;
          }
          setDraft("");
          setError(null);
          onStatus(`Comment posted on ${itemTitle}.`);
        }}
      >
        <CaField
          id={fieldId}
          label={`Add a comment on ${itemTitle}`}
          error={error}
          counter={<CharCount value={draft} max={DRAFT_RULES.commentMax} />}
          hint={`Draft preview rule: up to ${DRAFT_RULES.commentMax} characters, ${DRAFT_RULES.rate.commentsPerHour} comments per hour.`}
        >
          {(aria) => (
            <textarea
              {...aria}
              rows={3}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
            />
          )}
        </CaField>
        <button type="submit" className="btn btn-sm">
          Post comment
        </button>
      </form>
    </div>
  );
}

// ---- Preview tools ----

export function PreviewTools({ children, intro }: { children: ReactNode; intro?: string }) {
  return (
    <details className="ca-tools">
      <summary>Preview tools</summary>
      <p className="mut">{intro ?? "These buttons create sample events so you can see notifications and updates. They are not real activity."}</p>
      <div className="ca-actions">{children}</div>
    </details>
  );
}

/** Returns a setter for a polite status line that clears itself, so the same message can be announced again. */
export function useStatus(): [string, (message: string) => void] {
  const [message, setMessage] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 8000);
    return () => window.clearTimeout(timer);
  }, [message, tick]);
  return [
    message,
    (next: string) => {
      setMessage(next);
      setTick((n) => n + 1);
    },
  ];
}
