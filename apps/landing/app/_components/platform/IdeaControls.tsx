"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { applyAction, createIdeaAction, decideAction, setStatusAction, voteAction } from "@/app/(platform)/dashboard/(shell)/ideas/actions";
import type { FormState } from "@/lib/platform/actions";
import { APPLY_MAX, APPLY_MIN, IDEA_BODY_MAX, IDEA_BODY_MIN, IDEA_TITLE_MAX, IDEA_TITLE_MIN, MAX_OPEN_IDEAS } from "@/lib/platform/ideas";
import "./ideas.css";
import "./notifications.css";

const idle: FormState = { status: "idle" };

function Message({ state }: Readonly<{ state: FormState }>) {
  return (
    <p className="pf-inline-msg" role={state.status === "error" ? "alert" : "status"} data-error={state.status === "error" ? "true" : undefined}>
      {state.status === "idle" ? "" : state.message}
    </p>
  );
}

// Score with Up and Down as text. Your own vote is the one that is underlined and pressed; pressing it again takes it back.
// Flips at once and rolls back with a message if the server refuses. On your own idea there is only the score.
export function IdeaVote({ ideaId, score, myVote, own }: Readonly<{ ideaId: string; score: number; myVote: 1 | -1 | 0; own: boolean }>) {
  const [vote, setVote] = useState({ score, mine: myVote });
  const [seen, setSeen] = useState({ score, mine: myVote });
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  if (seen.score !== score || seen.mine !== myVote) {
    setSeen({ score, mine: myVote });
    setVote({ score, mine: myVote });
  }

  function press(value: 1 | -1) {
    if (busy.current) return;
    busy.current = true;
    const before = vote;
    const mine = before.mine === value ? 0 : value;
    setVote({ mine, score: before.score - before.mine + mine });
    setMessage("");
    startTransition(async () => {
      try {
        const result = await voteAction(ideaId, mine);
        if (!result.ok) throw new Error(result.message);
      } catch (e) {
        setVote(before);
        setMessage(e instanceof Error && e.message.length < 120 && /\.$/.test(e.message) ? e.message : "Could not vote. Try again.");
      } finally {
        busy.current = false;
      }
    });
  }

  return (
    <div className="pf-id-vote">
      <span className="pf-id-score"><span aria-hidden="true">{vote.score}</span><span className="pf-sr">Score {vote.score}</span></span>
      {own ? null : (
        <span className="pf-id-vote-btns">
          <button type="button" className="pf-tl" aria-pressed={vote.mine === 1} aria-disabled={pending ? true : undefined} onClick={() => press(1)}>Up</button>
          <button type="button" className="pf-tl" aria-pressed={vote.mine === -1} aria-disabled={pending ? true : undefined} onClick={() => press(-1)}>Down</button>
        </span>
      )}
      {message ? <span className="pf-id-vote-msg" role="alert">{message}</span> : null}
    </div>
  );
}

// "Apply to build this" opens a small form for the message to the author. After it is sent the link says Applied.
export function IdeaApply({ ideaId, applied }: Readonly<{ ideaId: string; applied: boolean }>) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(applyAction, idle);
  const [message, setMessage] = useState("");
  const fieldId = useId();
  const hintId = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const done = applied || state.status === "saved";

  useEffect(() => {
    if (open) area.current?.focus();
  }, [open]);

  if (done) return <p className="pf-id-applied">Applied. The author has your message.</p>;
  if (!open) return <button type="button" className="pf-tl" aria-expanded="false" onClick={() => setOpen(true)}>Apply to build this</button>;

  return (
    // Escape closes the form only while it is empty; a typed message is never thrown away by a stray key. Cancel still closes it.
    <form action={action} className="pf-id-form" onKeyDown={(event) => { if (event.key === "Escape" && message.trim() === "") setOpen(false); }}>
      <input type="hidden" name="ideaId" value={ideaId} />
      <label htmlFor={fieldId}>Tell the author why you and what you would build</label>
      <textarea
        ref={area}
        id={fieldId}
        name="message"
        className="pf-textarea"
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        minLength={APPLY_MIN}
        maxLength={APPLY_MAX}
        required
        aria-describedby={hintId}
      />
      <span className="pf-id-count" id={hintId}>{message.trim().length} of {APPLY_MAX}. At least {APPLY_MIN}.</span>
      <div className="pf-id-form-row">
        <button type="submit" className="pf-btn pri" disabled={pending}>{pending ? "Sending" : "Send application"}</button>
        <button type="button" className="pf-tl pf-tl-quiet" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <Message state={state} />
    </form>
  );
}

// "Share an idea": a text link that opens the form. Titles and bodies have the lib limits; you can have five open ideas.
export function IdeaShare({ openCount }: Readonly<{ openCount: number }>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData): Promise<FormState> => {
    const result = await createIdeaAction(prev, formData);
    if (result.status === "saved") {
      setTitle("");
      setBody("");
      setOpen(false);
      router.refresh();
    }
    return result;
  }, idle);
  const titleId = useId();
  const bodyId = useId();
  const titleHint = useId();
  const bodyHint = useId();
  const field = useRef<HTMLInputElement>(null);
  const full = openCount >= MAX_OPEN_IDEAS;

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <div className="pf-id-share">
        <button type="button" className="pf-tl" aria-expanded="false" onClick={() => setOpen(true)} disabled={full}>Share an idea</button>
        {full ? <span className="pf-id-note">You have {MAX_OPEN_IDEAS} open ideas. Close one to share another.</span> : null}
        {state.status === "saved" ? (
          <span className="pf-id-note" role="status">{state.message} {state.href ? <Link href={state.href}>Open it</Link> : null}</span>
        ) : null}
      </div>
    );
  }

  return (
    // Escape closes the form only while both fields are empty; typed text is never thrown away by a stray key. Cancel still closes it.
    <form action={action} className="pf-id-form pf-id-share-form" onKeyDown={(event) => { if (event.key === "Escape" && title.trim() === "" && body.trim() === "") setOpen(false); }}>
      <p className="pf-id-note">You can have {MAX_OPEN_IDEAS} open ideas at a time. You have {openCount}.</p>
      <label htmlFor={titleId}>Title</label>
      <input ref={field} id={titleId} name="title" className="pf-input" value={title} onChange={(event) => setTitle(event.target.value)} minLength={IDEA_TITLE_MIN} maxLength={IDEA_TITLE_MAX} required aria-describedby={titleHint} />
      <span className="pf-id-count" id={titleHint}>{title.trim().length} of {IDEA_TITLE_MAX}. At least {IDEA_TITLE_MIN}.</span>
      <label htmlFor={bodyId}>What do you want to build, and who could help?</label>
      <textarea id={bodyId} name="body" className="pf-textarea" rows={6} value={body} onChange={(event) => setBody(event.target.value)} minLength={IDEA_BODY_MIN} maxLength={IDEA_BODY_MAX} required aria-describedby={bodyHint} />
      <span className="pf-id-count" id={bodyHint}>{body.trim().length} of {IDEA_BODY_MAX}. At least {IDEA_BODY_MIN}.</span>
      <div className="pf-id-form-row">
        <button type="submit" className="pf-btn pri" disabled={pending}>{pending ? "Sharing" : "Share idea"}</button>
        <button type="button" className="pf-tl pf-tl-quiet" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <Message state={state} />
    </form>
  );
}

// Accept or Decline one pending application (the author's view).
export function IdeaDecide({ ideaId, applicationId }: Readonly<{ ideaId: string; applicationId: string }>) {
  const [state, action, pending] = useActionState(decideAction, idle);
  return (
    <form action={action} className="pf-id-decide">
      <input type="hidden" name="ideaId" value={ideaId} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <button type="submit" name="decision" value="accept" className="pf-tl" disabled={pending}>Accept</button>
      <button type="submit" name="decision" value="decline" className="pf-tl pf-tl-quiet" disabled={pending}>Decline</button>
      <Message state={state} />
    </form>
  );
}

// The author closes an open or taken idea, or reopens a closed one (while under the open limit).
export function IdeaStatusControl({ ideaId, status }: Readonly<{ ideaId: string; status: "open" | "taken" | "closed" }>) {
  const [state, action, pending] = useActionState(setStatusAction, idle);
  const next = status === "closed" ? "open" : "closed";
  return (
    <form action={action} className="pf-id-decide">
      <input type="hidden" name="ideaId" value={ideaId} />
      <input type="hidden" name="status" value={next} />
      <button type="submit" className="pf-tl pf-tl-quiet" disabled={pending}>{status === "closed" ? "Reopen this idea" : "Close this idea"}</button>
      <Message state={state} />
    </form>
  );
}
