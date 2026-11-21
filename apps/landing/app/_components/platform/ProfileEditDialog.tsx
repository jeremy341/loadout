"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { BIO_MAX, HANDLE_MAX } from "@/lib/platform/profile";
import { saveProfile } from "@/lib/platform/profile-actions";
import { PfModal } from "./PfModal";
import "./profile.css";

const idle: FormState = { status: "idle" };

// "Edit profile" and "Choose a handle" both open the one dialog through this event, as New project does.
export const OPEN_PROFILE_EDIT_EVENT = "loadout:open-profile-edit";
export const PROFILE_HEADING_ID = "profile-h1";

export function OpenProfileEditButton({ children, primary = false, className }: Readonly<{ children: React.ReactNode; primary?: boolean; className?: string }>) {
  return (
    <button type="button" className={className ?? (primary ? "pf-btn pri" : "pf-btn")} onClick={() => window.dispatchEvent(new Event(OPEN_PROFILE_EDIT_EVENT))}>
      {children}
    </button>
  );
}

type Saved = { handle: string | null; bio: string | null };

function ProfileForm({ saved, onSaved, onCancel }: { saved: Saved; onSaved: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(saveProfile, idle);
  // Both fields are controlled: React resets an uncontrolled form after a server action, which would wipe a rejected handle.
  const [handle, setHandle] = useState(saved.handle ?? "");
  const [bio, setBio] = useState(saved.bio ?? "");
  const form = useRef<HTMLFormElement>(null);
  const handleId = useId();
  const handleHint = useId();
  const handleError = useId();
  const bioId = useId();
  const bioHint = useId();
  const bioError = useId();

  const hError = state.status === "error" && state.field === "handle" ? state.message : undefined;
  const bError = state.status === "error" && state.field === "bio" ? state.message : undefined;

  useEffect(() => {
    if (state.status === "saved") onSaved();
  }, [state, onSaved]);

  // The first field with an error takes focus, so a keyboard user lands on what to fix.
  useEffect(() => {
    if (state.status !== "error") return;
    const target = state.field === "bio" ? "bio" : "handle";
    form.current?.querySelector<HTMLElement>(`[name="${target}"]`)?.focus();
  }, [state]);

  return (
    <form ref={form} action={action} className="pf-modal-form" noValidate>
      <div className="pf-field">
        <label htmlFor={handleId}>Handle</label>
        <span className="pf-hint" id={handleHint}>
          3 to 24 characters. Use a to z, 0 to 9, _ and -. Start with a letter. Use a handle, not your real name. Do not add your school or where you live.
          {saved.handle ? " Changing your handle changes your profile address." : ""}
        </span>
        <input
          id={handleId}
          name="handle"
          className="pf-input"
          type="text"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          maxLength={HANDLE_MAX}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={hError ? `${handleHint} ${handleError}` : handleHint}
          aria-invalid={hError ? true : undefined}
        />
        {hError ? <p className="pf-error" id={handleError}>{hError}</p> : null}
      </div>
      <div className="pf-field">
        <label htmlFor={bioId}>Bio (optional)</label>
        <span className="pf-hint" id={bioHint}>
          Up to {BIO_MAX} characters. Everyone signed in can read it. <span className="pf-prof-count">{bio.length} of {BIO_MAX}</span>
        </span>
        <textarea
          id={bioId}
          name="bio"
          className="pf-textarea"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={BIO_MAX}
          aria-describedby={bError ? `${bioHint} ${bioError}` : bioHint}
          aria-invalid={bError ? true : undefined}
        />
        {bError ? <p className="pf-error" id={bioError}>{bError}</p> : null}
      </div>
      <div aria-live="polite">
        {state.status === "error" && !state.field ? <p className="pf-error" role="alert">Could not save. Try again.</p> : null}
      </div>
      <div className="pf-modal-actions">
        <button type="button" className="pf-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="pf-btn pri pf-wide" disabled={pending}>
          {pending ? "Saving" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// The profile dialog (handle and bio) and the "Profile saved." line. It stays mounted while the page refreshes, so the line
// and the focus move survive the save. The form is remounted each time the dialog closes, so it opens on the saved values.
export function ProfileEditDialog({ handle, bio }: Readonly<{ handle: string | null; bio: string | null }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [saved, setSaved] = useState(false);

  const open = useCallback(() => {
    setSaved(false);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    window.addEventListener(OPEN_PROFILE_EDIT_EVENT, open);
    return () => window.removeEventListener(OPEN_PROFILE_EDIT_EVENT, open);
  }, [open]);

  // After a save the button that opened the dialog may be gone (the choose-a-handle block), so focus goes to the page h1.
  const onSaved = useCallback(() => {
    setSaved(true);
    setIsOpen(false);
    window.setTimeout(() => document.getElementById(PROFILE_HEADING_ID)?.focus(), 60);
  }, []);

  return (
    <>
      <p className="pf-saved pf-prof-saved" role="status">{saved ? "Profile saved." : ""}</p>
      <PfModal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setOpenCount((count) => count + 1);
        }}
        title={handle ? "Edit profile" : "Choose a handle"}
        initialFocus='input[name="handle"]'
      >
        <ProfileForm key={openCount} saved={{ handle, bio }} onSaved={onSaved} onCancel={close} />
      </PfModal>
    </>
  );
}
