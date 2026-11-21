"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { respondAction } from "@/app/(platform)/dashboard/(shell)/projects/[id]/collaborator-actions";
import type { FormState } from "@/lib/platform/actions";
import "./notifications.css";

const idle: FormState = { status: "idle" };

function Invite({ projectId, title, owner }: Readonly<{ projectId: string; title: string; owner: string | null }>) {
  const [state, action, pending] = useActionState(respondAction, idle);
  if (state.status === "saved") {
    return (
      <li>
        <span role="status">{state.message}{state.message.startsWith("You joined") ? <> <Link href={`/dashboard/explore/${projectId}`}>See the project</Link></> : null}</span>
      </li>
    );
  }
  return (
    <li>
      <span>
        {owner ? <Link href={`/dashboard/builders/${owner}`}>{owner}</Link> : "A builder"} invites you to <strong>{title}</strong>
      </span>
      <form action={action}>
        <input type="hidden" name="projectId" value={projectId} />
        <button type="submit" name="decision" value="accept" className="pf-tl" disabled={pending}>Accept<span className="pf-sr"> {title}</span></button>
        <button type="submit" name="decision" value="decline" className="pf-tl pf-tl-quiet" disabled={pending}>Decline<span className="pf-sr"> {title}</span></button>
      </form>
      {state.status === "error" ? <p className="pf-inline-msg" role="alert" data-error="true">{state.message}</p> : null}
    </li>
  );
}

// "Invites" on the Projects page: only when someone has invited you to a project. Accept or Decline are text links.
export function ProjectInvites({ invites: fresh }: Readonly<{ invites: { projectId: string; projectTitle: string; ownerHandle: string | null }[] }>) {
  // The list is kept as it was when the page opened, so an answered invite stays to show its result instead of vanishing on refresh.
  const [invites] = useState(fresh);
  if (invites.length === 0) return null;
  return (
    <section className="pf-invites" aria-labelledby="pf-invites-h">
      <h2 id="pf-invites-h" className="pf-nt-h">Invites</h2>
      <ul>
        {invites.map((invite) => (
          <Invite key={invite.projectId} projectId={invite.projectId} title={invite.projectTitle} owner={invite.ownerHandle} />
        ))}
      </ul>
    </section>
  );
}
