"use client";

import { createContext, useActionState, useCallback, useContext, useId, useState, type ReactNode } from "react";
import type { FormState } from "@/lib/platform/actions";
import { pinProject, setProjectVisibility } from "@/lib/platform/profile-actions";
import "./profile.css";

const idle: FormState = { status: "idle" };
const Announce = createContext<(message: string) => void>(() => {});

// One polite status line for the whole project list ("Pinned Tinyparse."), present before it changes. It wraps the list so the
// per-card controls can reach it without each card carrying its own.
export function ProfileListStatus({ children }: Readonly<{ children: ReactNode }>) {
  const [message, setMessage] = useState("");
  const announce = useCallback((text: string) => setMessage(text), []);
  return (
    <Announce.Provider value={announce}>
      <p className="pf-saved pf-prof-live" role="status">{message}</p>
      {children}
    </Announce.Provider>
  );
}

type Props = {
  id: string;
  title: string;
  status: "approved" | "logging" | "other";
  pinned: boolean;
  hidden: boolean;
  showBuilding: boolean;
  // How many projects are pinned in all, so the fourth pin can say why it is closed.
  pinnedCount: number;
  max: number;
  tag: string;
};

type ControlProps = { label: string; pending: boolean; disabledReason?: { id: string; text: string } };

function Button({ label, pending, disabledReason }: ControlProps) {
  return (
    <>
      <button
        type="submit"
        className="pf-btn pf-prof-btn"
        aria-disabled={disabledReason || pending ? true : undefined}
        aria-describedby={disabledReason?.id}
        onClick={(event) => {
          if (disabledReason || pending) event.preventDefault();
        }}
      >
        {label}
      </button>
      {disabledReason ? <span className="pf-hint" id={disabledReason.id}>{disabledReason.text}</span> : null}
    </>
  );
}

// The message is chosen when the button is pressed, from the state the page had then, so the refresh that follows the save
// cannot flip it ("Pinned" after a pin, not "Unpinned").
function useAction(action: (prev: FormState, data: FormData) => Promise<FormState>, message: string) {
  const announce = useContext(Announce);
  const [state, run, pending] = useActionState(async (prev: FormState, data: FormData) => {
    const result = await action(prev, data);
    announce(result.status === "saved" ? message : "");
    return result;
  }, idle);
  return { state, run, pending };
}

// The owner's strip under one card: what the public sees, then the buttons that change it. The buttons are outside the card
// link, so there is no link inside a link. Each action runs on the server and the page refreshes in place.
export function ProjectVisibilityControls(props: Props) {
  const { id, title, status, pinned, hidden, showBuilding, pinnedCount, max, tag } = props;
  const pinId = useId();
  const pin = useAction(pinProject, pinned ? "Unpinned." : `Pinned ${title}.`);
  const hide = useAction(setProjectVisibility, hidden ? `Showing ${title} on your profile.` : pinned ? "Hidden and unpinned." : "Hidden from your profile.");
  const building = useAction(setProjectVisibility, showBuilding ? "No longer shown as building." : "Now shown as building.");

  const pinClosed = !pinned && pinnedCount >= max;
  const pinReason = pinClosed
    ? { id: `${pinId}-full`, text: `${max} pinned. Unpin one first.` }
    : hidden && !pinned
      ? { id: `${pinId}-hidden`, text: "Show it on your profile to pin it." }
      : undefined;
  const failed = [pin.state, hide.state, building.state].find((state) => state.status === "error");

  return (
    <div className="pf-prof-controls">
      <p className="pf-prof-status">
        <span className="pf-tag">{tag}</span>
        {status === "approved" && pinned ? <span className="pf-tag">Pinned</span> : null}
      </p>
      {status === "approved" ? (
        <div className="pf-prof-actions">
          <form action={pin.run}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="pinned" value={pinned ? "false" : "true"} />
            <Button label={pinned ? "Unpin" : "Pin to profile"} pending={pin.pending} disabledReason={pinReason} />
          </form>
          <form action={hide.run}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="hidden" value={hidden ? "false" : "true"} />
            <Button label={hidden ? "Show on profile" : "Hide from profile"} pending={hide.pending} />
          </form>
        </div>
      ) : null}
      {status === "logging" ? (
        <div className="pf-prof-actions">
          <form action={building.run}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="showBuilding" value={showBuilding ? "false" : "true"} />
            <Button label={showBuilding ? "Stop showing" : "Show as building"} pending={building.pending} />
          </form>
        </div>
      ) : null}
      {failed ? <p className="pf-error" role="alert">Could not save. Try again.</p> : null}
    </div>
  );
}
