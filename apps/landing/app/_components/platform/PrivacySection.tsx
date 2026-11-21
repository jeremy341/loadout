"use client";

import { useCallback, useId, useState, useTransition } from "react";
import { cancelDeletion, requestDeletion, setVisibility } from "@/app/(platform)/dashboard/(shell)/settings/actions";
import type { FormState } from "@/lib/platform/actions";
import { ConfirmDialog } from "./ConfirmDialog";
import "./settings-api.css";

function Visibility({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const toggle = () => {
    const next = !on;
    setOn(next);
    setMessage("");
    start(async () => {
      const done = await setVisibility(next).catch(() => ({ ok: false as const, message: "Something went wrong. Try again." }));
      if (!done.ok) {
        setOn(!next);
        setMessage(done.message);
      }
    });
  };
  return (
    <div className="sa-block">
      <button type="button" className="sa-switch" aria-pressed={on} onClick={toggle} disabled={pending}>
        <span className="sa-switch-track" aria-hidden="true"><span className="sa-switch-knob" /></span>
        <span className="sa-switch-label">Show me on public stats and leaderboards</span>
        <span className="sa-switch-state" aria-hidden="true">{on ? "On" : "Off"}</span>
      </button>
      <p className="sa-hint">
        When this is on, public stats and leaderboards show your handle and your hours, and nothing else. It is off until you turn it on.
      </p>
      <div aria-live="polite">{message ? <p className="pf-error" role="alert">{message}</p> : null}</div>
    </div>
  );
}

function DeleteAccount({ handle, scheduledFor }: { handle: string; scheduledFor: string | null }) {
  const [open, setOpen] = useState(false);
  const [cancelling, start] = useTransition();
  const [message, setMessage] = useState("");
  const close = useCallback(() => setOpen(false), []);
  const typeId = useId();
  const action = useCallback(async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const done = await requestDeletion(formData.get("typed"));
    return done.ok ? { status: "saved", message: "Deletion scheduled." } : { status: "error", message: done.message };
  }, []);
  const cancel = () => {
    setMessage("");
    start(async () => {
      const done = await cancelDeletion().catch(() => ({ ok: false as const, message: "Something went wrong. Try again." }));
      if (!done.ok) setMessage(done.message);
    });
  };

  if (scheduledFor) {
    return (
      <div className="sa-block">
        <p className="sa-warn">Your account is scheduled to be deleted on {scheduledFor}.</p>
        <p className="sa-hint">Until then nothing is removed, but your API keys no longer work. You can still cancel.</p>
        <div className="sa-row">
          <button type="button" className="sa-link" onClick={cancel} disabled={cancelling}>{cancelling ? "Cancelling" : "Cancel deletion"}</button>
        </div>
        <div aria-live="polite">{message ? <p className="pf-error" role="alert">{message}</p> : null}</div>
      </div>
    );
  }

  return (
    <div className="sa-block">
      <p className="sa-hint">
        Deleting your account waits 7 days, so you can change your mind. After that it removes your projects, journal entries, hours, ledger, orders and API keys, and your profile. Records moderators need, such as the audit log, stay without your name on them. Deleted data cannot be brought back.
      </p>
      <div className="sa-row">
        <button type="button" className="sa-link sa-danger" onClick={() => setOpen(true)}>Delete my account</button>
      </div>
      <ConfirmDialog
        open={open}
        onClose={close}
        onDone={close}
        title="Delete your account?"
        body={
          <>
            <p>This starts a 7 day wait. When it ends we remove your projects, journal, hours, orders and keys. Your API keys stop working now. You can cancel any time before the date.</p>
            <div className="pf-field">
              <label htmlFor={typeId}>Type {handle ? `“${handle}”` : "your email address"} to confirm</label>
              <input id={typeId} name="typed" className="pf-input" autoComplete="off" autoCapitalize="none" spellCheck={false} />
            </div>
          </>
        }
        confirmLabel="Delete my account"
        action={action}
        fields={{}}
      />
    </div>
  );
}

export function PrivacySection({ statsVisible, handle, scheduledFor }: Readonly<{ statsVisible: boolean; handle: string; scheduledFor: string | null }>) {
  return (
    <>
      <Visibility initial={statsVisible} />
      <div className="sa-block">
        <h3 className="sa-sub">Your data</h3>
        <p className="sa-hint">Everything LOADOUT holds about you, in one JSON file. You can download it twice a day.</p>
        <div className="sa-row">
          <a className="sa-link" href="/dashboard/settings/export" download>Download my data</a>
        </div>
      </div>
      <div className="sa-block">
        <h3 className="sa-sub">Delete my account</h3>
        <DeleteAccount handle={handle} scheduledFor={scheduledFor} />
      </div>
    </>
  );
}
