"use client";

import { useActionState, useId } from "react";
import { addCommentAction, deleteCommentAction } from "@/lib/platform/comment-actions";
import { COMMENT_MAX } from "@/lib/platform/comments";
import type { FormState } from "@/lib/platform/actions";
import { FormStatus } from "@/app/_components/platform/forms";

const idle: FormState = { status: "idle" };

// The reply box on a public project. The comment is checked on the server again (comments-data.ts), so a bad comment never
// reaches the database whatever this form lets through. The textarea keeps its length honest with a maxlength, and the
// status line below it is the same one Settings uses.
export function CommentForm({ projectId }: Readonly<{ projectId: string }>) {
  const [state, action, pending] = useActionState(addCommentAction, idle);
  const bodyId = useId();
  const hintId = useId();
  const own = state.status === "error" && state.field === "body" ? state.message : undefined;

  return (
    <form action={action} className="pf-panel">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="pf-field">
        <label htmlFor={bodyId}>Add a comment</label>
        <span className="pf-hint" id={hintId}>
          Plain text, at most {COMMENT_MAX.toLocaleString("en-GB")} characters. Comments on a project are public.
        </span>
        <textarea
          id={bodyId}
          name="body"
          className="pf-textarea"
          required
          maxLength={COMMENT_MAX}
          aria-describedby={own ? `${hintId} ${bodyId}-error` : hintId}
          aria-invalid={own ? true : undefined}
        />
        {own ? (
          <p className="pf-error" id={`${bodyId}-error`}>
            {own}
          </p>
        ) : null}
      </div>
      <button className="pf-btn pri" type="submit" disabled={pending}>
        {pending ? "Posting" : "Post comment"}
      </button>
      <div aria-live="polite">
        <FormStatus state={state} />
      </div>
    </form>
  );
}

// The writer's own Remove press: the write takes the viewer's id again, so nobody else's comment can be removed. The
// comment stays visible until the refresh lands; the answer says what happened.
export function DeleteCommentButton({ id, projectId }: Readonly<{ id: string; projectId: string }>) {
  const [state, action, pending] = useActionState(deleteCommentAction, idle);
  return (
    <form action={action} className="pf-comment-remove">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="projectId" value={projectId} />
      <button className="pf-btn" type="submit" disabled={pending}>
        {pending ? "Removing" : "Remove"}
        <span className="pf-sr"> your comment</span>
      </button>
      {state.status === "error" ? <span className="pf-error" role="alert">{state.message}</span> : null}
    </form>
  );
}
