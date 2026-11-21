"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { NoiseGrain } from "../NoiseGrain";
import "./modal.css";

export type PfModalProps = {
  open: boolean;
  // Escape, the Close button, a backdrop press and a caller that sets open to false all end here. The caller owns `open`.
  onClose: () => void;
  title: ReactNode;
  // confirm 440px, form 560px, wide 600px.
  size?: "confirm" | "form" | "wide";
  // Colours the top edge only: default accent, danger, notice.
  variant?: "default" | "danger" | "notice";
  // Confirms have no Close button: Cancel is the close.
  closeButton?: boolean;
  // A selector inside the body for the control that gets focus first. Without it, the first field, then the first button.
  initialFocus?: string;
  // The id of the text that describes the modal (a confirm's body).
  describedBy?: string;
  // True while the action the modal started is in flight. Escape, the backdrop and Close do nothing until it ends, so a
  // destructive confirm cannot be dismissed half way and its result is never lost.
  busy?: boolean;
  children: ReactNode;
};

// The one modal of the participant platform, on the native dialog: the browser makes the page behind it inert, traps Tab and
// closes on Escape. This adds the rest: focus lands on the first field and goes back to whatever opened it, a press on the
// backdrop closes it unless something was typed, and the panel looks the same everywhere.
export function PfModal({ open, onClose, title, size = "form", variant = "default", closeButton = true, initialFocus, describedBy, busy = false, children }: Readonly<PfModalProps>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dirty = useRef(false);
  const pressedBackdrop = useRef(false);
  const headingId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dirty.current = false;
      element.showModal();
      const target =
        (initialFocus ? element.querySelector<HTMLElement>(initialFocus) : null) ??
        element.querySelector<HTMLElement>(".pf-modal-body :is(input:not([type=hidden]), textarea, select), .pf-modal-form :is(input:not([type=hidden]), textarea, select)") ??
        element.querySelector<HTMLElement>(".pf-modal-body button, .pf-modal-form button");
      target?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open, initialFocus]);

  const outside = (event: MouseEvent<HTMLDialogElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };

  return (
    <dialog
      ref={dialog}
      className="pf-modal"
      data-size={size}
      data-variant={variant}
      aria-labelledby={headingId}
      aria-describedby={describedBy}
      aria-busy={busy || undefined}
      onCancel={(event) => {
        // Escape. Cancelling the event keeps the dialog open.
        if (busy) event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && busy) event.preventDefault();
      }}
      onMouseDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget && outside(event);
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget && outside(event) && !dirty.current && !busy) dialog.current?.close();
        pressedBackdrop.current = false;
      }}
      onInput={() => {
        dirty.current = true;
      }}
      onClose={() => {
        // Focus goes back to the opener if it is still on the page. A caller that moves focus on purpose does so later.
        const back = opener.current;
        opener.current = null;
        if (back?.isConnected) back.focus();
        onClose();
      }}
    >
      <div className="pf-modal-head">
        <h2 id={headingId}>{title}</h2>
        {closeButton ? (
          <button type="button" className="pf-btn pf-modal-x" disabled={busy} onClick={() => dialog.current?.close()}>
            Close
          </button>
        ) : null}
      </div>
      {children}
      {open ? <NoiseGrain /> : null}
    </dialog>
  );
}
