"use client";

import { useActionState, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { FormState } from "@/lib/platform/actions";
import { equipTool } from "@/lib/platform/profile-actions";
import { USE_NOTE_MAX } from "@/lib/platform/toolbelt";
import { trackSlugOf } from "@/lib/platform/search-view";
import { handleLabel } from "@/lib/platform/toolbelt-ui";
import type { FinderTool } from "./ToolFinder";
import "./toolbelt.css";

const idle: FormState = { status: "idle" };
const NOTE_EXAMPLE = "Name the file or feature that uses the tool. Example: calls the parser in src/build.ts to read every config file.";

// The inline equip step (stardance-layout.md F.5). It replaces the old Equip dialog: it opens under the finder when a result is
// chosen, puts focus in the note, shows the server's own messages next to the field, and closes on Cancel or Escape.
export function ToolStep({
  projectId,
  tool,
  onCancel,
  onDone,
}: Readonly<{ projectId: string; tool: FinderTool; onCancel: () => void; onDone: (toolId: string) => void }>) {
  const [state, action, pending] = useActionState(equipTool, idle);
  const [note, setNote] = useState("");
  const noteId = useId();
  const hintId = useId();
  const errorId = useId();
  const noteField = useRef<HTMLTextAreaElement>(null);
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    noteField.current?.focus({ preventScroll: true });
    box.current?.scrollIntoView({ block: "nearest" });
  }, []);

  useEffect(() => {
    if (state.status === "saved") onDone(tool.id);
    // onDone and tool are read once, when the action finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const noteError = state.status === "error" && state.field === "note" ? state.message : undefined;
  const generalError = state.status === "error" && state.field !== "note" ? state.message : undefined;

  useEffect(() => {
    if (!noteError) return;
    noteField.current?.focus({ preventScroll: true });
    document.getElementById(errorId)?.scrollIntoView({ block: "nearest" });
  }, [noteError, errorId, state]);

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };

  return (
    <form
      ref={box}
      className="pf-belt-step"
      action={action}
      noValidate
      role="group"
      aria-label={`Equip ${tool.title}`}
      data-track={trackSlugOf(tool.track)}
      onKeyDown={onKeyDown}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="toolId" value={tool.id} />
      <p className="pf-belt-step-sum">
        <span className="pf-swatch" aria-hidden="true" />
        <strong>{tool.title}</strong>
        <span>by {handleLabel(tool.ownerHandle)}</span>
        <span>Used by {tool.usedBy}</span>
        {tool.repoHost ? <span>{tool.repoHost}</span> : null}
      </p>
      {generalError ? <p className="pf-error pf-belt-alert" role="alert">{generalError}</p> : null}
      <div className="pf-field">
        <label htmlFor={noteId}>How does your project use it?</label>
        <span className="pf-hint" id={hintId}>
          {NOTE_EXAMPLE} <span className="pf-belt-counter">{note.length} of {USE_NOTE_MAX}</span>
        </span>
        <textarea
          id={noteId}
          ref={noteField}
          name="note"
          className="pf-textarea"
          rows={3}
          maxLength={USE_NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-describedby={noteError ? `${hintId} ${errorId}` : hintId}
          aria-invalid={noteError ? true : undefined}
        />
        {noteError ? <p className="pf-error" id={errorId}>{noteError}</p> : null}
      </div>
      <div className="pf-belt-step-actions">
        <button type="submit" className="pf-btn pri" disabled={pending}>
          {pending ? "Saving" : "Equip tool"}
        </button>
        <button type="button" className="pf-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
