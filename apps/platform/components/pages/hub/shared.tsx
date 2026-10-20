"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./hub.css";
import { initialsOf, type AvatarChoice } from "./logic/profile";

// Small building blocks shared by the five Hub pages.

/** A 32 by 32 pixel sprite from /loadout/sprites. Decorative: it has no accessible name. */
export function Sprite({ name, size = 32 }: { name: string; size?: number }) {
  return <span aria-hidden="true" className="hb-sprite" style={{ width: size, height: size, backgroundImage: `url(/loadout/sprites/${name}.png)` }} />;
}

/** The builder's avatar: a sprite, or initials in a square. Decorative; the name is always beside it. */
export function Avatar({ choice, name, size = 64 }: { choice: AvatarChoice; name: string; size?: number }) {
  return (
    <span className="hb-avatar" aria-hidden="true" style={{ width: size, height: size }}>
      {choice === "initials" ? <span className="hb-initials" style={{ fontSize: Math.round(size / 2.6) }}>{initialsOf(name)}</span> : <Sprite name={choice} size={Math.round(size * 0.625)} />}
    </span>
  );
}

/**
 * Feeds a page's polite live region. Saying the same sentence twice in a row still announces it, because a
 * zero-width space is toggled onto the end.
 */
export function useAnnounce(): [string, (message: string) => void] {
  const [message, setMessage] = useState("");
  const flip = useRef(false);
  const announce = useCallback((next: string) => {
    flip.current = !flip.current;
    setMessage(flip.current ? next : `${next}​`);
  }, []);
  return [message, announce];
}

/** Confirm and cancel buttons for a destructive action. Focus moves to the safe button when it appears. */
export function InlineConfirm({
  message,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
  onCancel,
}: {
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const keep = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    keep.current?.focus();
  }, []);
  return (
    <div className="hb-confirm" role="group" aria-label="Confirm">
      <p>{message}</p>
      <div className="pg-actions">
        <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" ref={keep} className="btn btn-quiet btn-sm" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

/** A labelled area for controls that exist only because the preview has no backend. Say so every time. */
export function PreviewTools({ title = "Preview tools", level = 2, hint, children }: { title?: string; level?: 2 | 3; hint?: ReactNode; children: ReactNode }) {
  const id = useId();
  const Heading = `h${level}` as "h2" | "h3";
  return (
    <section className="hb-tools" aria-labelledby={id}>
      <Heading id={id} className="hb-tools-title">
        {title} <span className="tg">Preview only</span>
      </Heading>
      <p className="mut">{hint ?? "A live platform has no such controls. They stand in for things the program does for you."}</p>
      {children}
    </section>
  );
}

/** A text input with a visible label, a hint, and an error tied to the control for screen readers. */
export function TextField({
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  type = "text",
  multiline = false,
  inputMode,
  autoComplete = "off",
  maxLength,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hint?: ReactNode;
  error?: string | null;
  type?: "text" | "url" | "time";
  multiline?: boolean;
  inputMode?: "url" | "text";
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    value,
    onBlur,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    maxLength,
    placeholder,
    disabled,
    autoComplete,
  };
  return (
    <div className="fld">
      <label className="fld-label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea {...common} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input {...common} type={type} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
      )}
      {hint ? (
        <span className="fld-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="fld-error" id={errId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** A checkbox with its label and optional help text, both read by a screen reader. */
export function CheckRow({
  label,
  help,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  help?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className="hb-check">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} aria-describedby={help ? helpId : undefined} onChange={(event) => onChange(event.target.checked)} />
      <div>
        <label htmlFor={id}>{label}</label>
        {help ? (
          <p className="mut hb-help" id={helpId}>
            {help}
          </p>
        ) : null}
      </div>
    </div>
  );
}
