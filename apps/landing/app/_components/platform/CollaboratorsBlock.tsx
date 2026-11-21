"use client";

import { useActionState, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { inviteAction, removeAction } from "@/app/(platform)/dashboard/(shell)/projects/[id]/collaborator-actions";
import type { FormState } from "@/lib/platform/actions";
import { MAX_COLLABORATORS } from "@/lib/platform/collaborators";
import { ConfirmDialog } from "./ConfirmDialog";
import "./notifications.css";

const idle: FormState = { status: "idle" };

// The Settings tab block for the owner: who is on the project, invite by handle, remove. Invited and accepted count toward the
// limit. Hours stay with each person, so the block says that once and nothing here moves any.
export function CollaboratorsBlock({ projectId, collaborators }: Readonly<{ projectId: string; collaborators: { handle: string; status: string }[] }>) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  // Clear the field and refresh the list once the invite is in; a refused invite keeps what was typed.
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData): Promise<FormState> => {
    const result = await inviteAction(prev, formData);
    if (result.status === "saved") {
      setHandle("");
      router.refresh();
    }
    return result;
  }, idle);
  const [removing, setRemoving] = useState<string | null>(null);
  const inputId = useId();
  const full = collaborators.length >= MAX_COLLABORATORS;

  return (
    <section className="pf-collab" aria-labelledby="pf-collab-h">
      <h2 id="pf-collab-h" className="pf-nt-h">Collaborators</h2>
      <p className="pf-inline-msg">Up to {MAX_COLLABORATORS}. Each person keeps their own hours.</p>
      {collaborators.length === 0 ? (
        <p>No collaborators yet.</p>
      ) : (
        <ul className="pf-collab-list">
          {collaborators.map((person) => (
            <li key={person.handle}>
              <span>
                {person.handle} <span className="pf-collab-state">{person.status === "invited" ? "Invited" : "On the project"}</span>
              </span>
              <button type="button" className="pf-tl pf-tl-quiet" onClick={() => setRemoving(person.handle)}>
                {person.status === "invited" ? "Cancel invite" : "Remove"}<span className="pf-sr"> {person.handle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="pf-collab-invite">
        <input type="hidden" name="projectId" value={projectId} />
        <label className="pf-sr" htmlFor={inputId}>Builder handle to invite</label>
        <input id={inputId} name="handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="Handle of the builder to invite" autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={full} required />
        <button type="submit" className="pf-tl" disabled={pending || full}>{pending ? "Inviting" : "Invite"}</button>
      </form>
      <p className="pf-inline-msg" role={state.status === "error" ? "alert" : "status"} data-error={state.status === "error" ? "true" : undefined}>
        {full ? `You have ${MAX_COLLABORATORS} collaborators or invites. Remove one to invite another.` : state.status === "idle" ? "" : state.message}
      </p>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onDone={() => {
          setRemoving(null);
          router.refresh();
        }}
        title={`Remove ${removing ?? ""}?`}
        body={<p>They leave this project. Their own hours stay theirs. You can invite them again later.</p>}
        confirmLabel="Remove"
        action={removeAction}
        fields={{ projectId, handle: removing ?? "" }}
      />
    </section>
  );
}
