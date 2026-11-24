"use client";

import { useRef, useState } from "react";
import { setPrefAction } from "@/app/(platform)/dashboard/(shell)/notifications/actions";
import { NOTIFICATION_KINDS, type NotificationKind } from "@/lib/platform/notifications";
import "./notifications.css";
import "./page-polish.css";

const LABELS: Record<NotificationKind, string> = {
  kudos: "Someone gives kudos to your project",
  follow: "Someone follows you",
  "collab-invite": "You are invited to a project",
  "collab-accepted": "Someone accepts your invite to a project",
  "idea-application": "Someone offers to build your idea",
  "ship-approved": "A ship of yours is approved",
  "ship-needs-changes": "A ship of yours needs changes",
  "order-update": "An order of yours changes",
  "referral-qualified": "A referral of yours counts",
};

// One checkbox per kind. A change saves at once; if the save fails the box goes back and the line says why.
export function NotificationPrefs({ initial }: Readonly<{ initial: Record<NotificationKind, boolean> }>) {
  const [prefs, setPrefs] = useState(initial);
  const [message, setMessage] = useState("");
  const inflight = useRef(new Set<string>());

  async function change(kind: NotificationKind, enabled: boolean) {
    if (inflight.current.has(kind)) return;
    inflight.current.add(kind);
    setPrefs((current) => ({ ...current, [kind]: enabled }));
    try {
      const result = await setPrefAction(kind, enabled);
      if (!result.ok) throw new Error(result.message);
      setMessage("Saved.");
    } catch (e) {
      setPrefs((current) => ({ ...current, [kind]: !enabled }));
      setMessage(e instanceof Error && e.message.length < 120 ? e.message : "Could not save. Try again.");
    } finally {
      inflight.current.delete(kind);
    }
  }

  return (
    <section className="pf-nt-sec" aria-labelledby="pf-nt-prefs">
      <h2 id="pf-nt-prefs" className="pf-nt-h">Tell me when</h2>
      <p className="pf-nt-note" id="pf-nt-prefs-note">Each change saves as soon as you tick or untick a box.</p>
      <ul className="pf-nt-prefs" aria-describedby="pf-nt-prefs-note">
        {NOTIFICATION_KINDS.map((kind) => (
          <li key={kind}>
            <label className="pf-nt-pref">
              <input type="checkbox" checked={prefs[kind]} onChange={(event) => void change(kind, event.currentTarget.checked)} />
              <span>{LABELS[kind]}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="pf-nt-status" role="status">{message}</p>
    </section>
  );
}
