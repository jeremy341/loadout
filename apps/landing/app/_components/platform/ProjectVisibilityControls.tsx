"use client";

import { useActionState, useId, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { pinProject } from "@/lib/platform/profile-actions";
import { PinGlyph } from "./PinGlyph";
import "./profile.css";

const idle: FormState = { status: "idle" };

type Props = {
  id: string;
  title: string;
  status: string;
  pinned: boolean;
  // How many projects are pinned in all (this one included when it is pinned), so a full strip can say why Pin is closed.
  pinnedCount: number;
  max: number;
};

// The one place a project is pinned or unpinned: the project's Settings tab. Every project is public, so there is no visibility
// control here and no Hidden option. Only an approved project can be pinned, and at most `max` at a time. The action runs on the
// server, the page refreshes in place, and one polite status line says what happened.
export function PinSetting({ id, title, status, pinned, pinnedCount, max }: Readonly<Props>) {
  const reasonId = useId();
  const [message, setMessage] = useState("");
  const [, run, pending] = useActionState(async (prev: FormState, data: FormData) => {
    const result = await pinProject(prev, data);
    setMessage(result.status === "saved" ? (pinned ? `Unpinned ${title}.` : `Pinned ${title}.`) : result.status === "error" ? result.message : "");
    return result;
  }, idle);
  const notApproved = status !== "approved";
  const full = !pinned && pinnedCount >= max;
  const closed = !pinned && (notApproved || full);
  const reason = notApproved && !pinned ? "Only an approved project can be pinned." : full ? `${max} projects are pinned. Unpin one first.` : null;

  return (
    <section className="pf-box pf-pin-setting" aria-labelledby="pin-heading">
      <h2 id="pin-heading">Pin to profile</h2>
      <p className="pf-panel-lead">
        A pinned project shows first on your profile with a small pin. You can pin up to {max} approved projects. {pinnedCount} of {max} used.
      </p>
      <form action={run} className="pf-prof-pinform">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="pinned" value={pinned ? "false" : "true"} />
        <button
          type="submit"
          className="pf-btn pf-prof-btn"
          aria-disabled={closed || pending ? true : undefined}
          aria-describedby={closed && reason ? reasonId : undefined}
          onClick={(event) => {
            if (closed || pending) event.preventDefault();
          }}
        >
          <PinGlyph />
          {pinned ? "Unpin" : "Pin to profile"}
        </button>
        {closed && reason ? <span className="pf-hint" id={reasonId}>{reason}</span> : null}
      </form>
      <p className="pf-saved pf-prof-live" role="status">{message}</p>
    </section>
  );
}
