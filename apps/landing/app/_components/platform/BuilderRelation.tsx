"use client";

import { useState, useTransition } from "react";
import { blockAction, followAction, unblockAction, unfollowAction } from "@/app/(platform)/dashboard/(shell)/builders/[handle]/actions";
import { ConfirmDialog } from "./ConfirmDialog";
import "./notifications.css";

// The visitor's controls on another builder's profile: Follow / Following and a quiet Block. Follow flips at once and rolls back with
// a message if the server says no. Block asks first, because it removes follows and pending invites both ways. If you have already
// blocked this builder the follow control is gone and the line offers Unblock instead.
export function BuilderRelation({ handle, following, blocked }: Readonly<{ handle: string; following: boolean; blocked: boolean }>) {
  const [isFollowing, setFollowing] = useState(following);
  const [seen, setSeen] = useState(following);
  const [message, setMessage] = useState("");
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();
  if (seen !== following) {
    setSeen(following);
    setFollowing(following);
  }

  function toggle() {
    if (pending) return;
    const before = isFollowing;
    setFollowing(!before);
    setMessage("");
    const body = new FormData();
    body.set("handle", handle);
    startTransition(async () => {
      try {
        const result = await (before ? unfollowAction : followAction)({ status: "idle" }, body);
        if (result.status === "error") throw new Error(result.message);
      } catch (e) {
        setFollowing(before);
        setMessage(e instanceof Error && e.message.length < 120 && /\.$/.test(e.message) ? e.message : "Could not change that. Try again.");
      }
    });
  }

  function unblock() {
    if (pending) return;
    const body = new FormData();
    body.set("handle", handle);
    startTransition(async () => {
      const result = await unblockAction({ status: "idle" }, body).catch(() => null);
      if (!result || result.status === "error") setMessage(result?.status === "error" ? result.message : "Could not unblock. Try again.");
    });
  }

  if (blocked) {
    return (
      <div className="pf-rel">
        <p className="pf-rel-note pf-sp-bio">You have blocked this builder.</p>
        <button type="button" className="pf-tl" onClick={unblock} disabled={pending}>Unblock</button>
        {message ? <p className="pf-rel-msg" role="alert">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="pf-rel">
      <button type="button" className="pf-tl" aria-pressed={isFollowing} aria-disabled={pending ? true : undefined} onClick={toggle}>
        {isFollowing ? "Following" : "Follow"}
        <span className="pf-sr"> {handle}</span>
      </button>
      <button type="button" className="pf-tl pf-tl-quiet" onClick={() => setAsking(true)}>Block</button>
      {message ? <p className="pf-rel-msg" role="alert">{message}</p> : null}
      <ConfirmDialog
        open={asking}
        onClose={() => setAsking(false)}
        onDone={() => setAsking(false)}
        title={`Block ${handle}?`}
        body={
          <>
            <p>They will not see you in lists, and you will not see them. Blocking also ends any follows between you and cancels pending project invites and idea applications.</p>
            <p>It leaves finished work alone. You can unblock them from this page later.</p>
          </>
        }
        confirmLabel="Block"
        action={blockAction}
        fields={{ handle }}
      />
    </div>
  );
}
