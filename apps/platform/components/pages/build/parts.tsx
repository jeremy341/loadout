"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import "./build.css";

// Small helpers shared by the four Build pages.

export function Loading({ what = "your saved preview data" }: { what?: string }) {
  return (
    <p className="pg-status" role="status">
      Loading {what}...
    </p>
  );
}

export function fmtHours(hours: number): string {
  return `${Math.round(hours * 100) / 100} h`;
}

export function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** A polite live message that is announced again even when the text repeats. */
export function useLiveMessage(): [string, (message: string) => void] {
  const [message, setMessage] = useState("");
  const say = (next: string) => setMessage((prev) => (prev === next ? `${next} ` : next));
  return [message, say];
}

/**
 * A destructive action with an inline confirm step. The first press asks, the second does it. Focus moves to the
 * confirm button when it appears and returns to the first button on cancel.
 */
export function ConfirmButton({
  label,
  question,
  confirmLabel = "Yes, delete",
  onConfirm,
  small = true,
}: {
  label: string;
  question: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  small?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasAsking = useRef(false);

  useEffect(() => {
    if (asking) confirmRef.current?.focus();
    else if (wasAsking.current) triggerRef.current?.focus();
    wasAsking.current = asking;
  }, [asking]);

  if (!asking) {
    return (
      <button ref={triggerRef} type="button" className={`btn btn-danger${small ? " btn-sm" : ""}`} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <div className="bd-confirm" role="group" aria-label={`Confirm: ${label}`}>
      <p>{question}</p>
      <button ref={confirmRef} type="button" className="btn btn-danger btn-sm" onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </div>
  );
}

/** A number input that keeps what the user types and commits a valid number on blur or Enter. */
export function NumberField({
  value,
  onCommit,
  min = 0,
  max,
  step = 0.5,
  id,
  label,
  describedBy,
  invalid,
}: {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  label?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);

  function commit() {
    if (draft === null) return;
    const parsed = Number(draft);
    setDraft(null);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.max(min, max === undefined ? parsed : Math.min(max, parsed));
    if (clamped !== value) onCommit(clamped);
  }

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      aria-label={label}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      min={min}
      max={max}
      step={step}
      value={shown}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
}

/** Focus the first field marked invalid inside a form, after the error state has rendered. */
export function focusFirstInvalid(form: HTMLElement | null) {
  setTimeout(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, 0);
}

export function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
