"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { equipTool } from "@/lib/platform/profile-actions";
import { filterTools, toolsCountText } from "@/lib/platform/toolbelt-ui";
import { USE_NOTE_MAX } from "@/lib/platform/toolbelt";
import "./toolbelt.css";

export type EquipTool = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  ownerHandle: string | null;
  usedBy: number;
};

const idle: FormState = { status: "idle" };
const NOTE_EXAMPLE = "Name the file or feature that uses the tool. Example: calls the parser in src/build.ts to read every config file.";

function EquipForm({ projectId, tools, onClose, onDone }: { projectId: string; tools: EquipTool[]; onClose: () => void; onDone: (toolId: string) => void }) {
  const [state, action, pending] = useActionState(equipTool, idle);
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(() => toolsCountText(tools.length, tools.length, ""));
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [pickError, setPickError] = useState<string | undefined>();
  const searchId = useId();
  const searchHintId = useId();
  const noteId = useId();
  const noteHintId = useId();
  const noteErrorId = useId();
  const pickErrorId = useId();
  const legendId = useId();
  const search = useRef<HTMLInputElement>(null);
  const noteField = useRef<HTMLTextAreaElement>(null);

  const shown = useMemo(() => filterTools(tools, query), [tools, query]);

  // The result line follows the typing after a short pause, so a screen reader hears one message and not one per key.
  useEffect(() => {
    const timer = window.setTimeout(() => setCount(toolsCountText(tools.length, shown.length, query)), 250);
    return () => window.clearTimeout(timer);
  }, [tools.length, shown.length, query]);

  useEffect(() => {
    if (state.status === "saved") onDone(selected);
    // onDone and selected are read once when the action finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const noteError = state.status === "error" && state.field === "note" ? state.message : undefined;
  const toolError = pickError ?? (state.status === "error" && state.field === "toolId" ? state.message : undefined);
  const generalError = state.status === "error" && state.field !== "note" && state.field !== "toolId" ? state.message : undefined;

  useEffect(() => {
    if (!noteError) return;
    noteField.current?.focus();
    // The action bar sticks to the bottom of the form, so scroll the message clear of it.
    document.getElementById(noteErrorId)?.scrollIntoView({ block: "nearest" });
  }, [noteError, noteErrorId, state]);

  return (
    <form
      className="pf-dialog-form"
      action={action}
      noValidate
      onSubmit={(event) => {
        if (!selected) {
          event.preventDefault();
          setPickError("Pick a tool.");
          search.current?.focus();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="toolId" value={selected} />
      {generalError ? <p className="pf-error pf-belt-alert" role="alert">{generalError}</p> : null}
      <div className="pf-field">
        <label htmlFor={searchId}>Find a tool</label>
        <span className="pf-hint" id={searchHintId}>Approved open-source projects from other builders.</span>
        <input
          id={searchId}
          ref={search}
          className="pf-input"
          type="search"
          autoComplete="off"
          value={query}
          aria-describedby={searchHintId}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="pf-hint pf-belt-results" role="status" aria-live="polite">{count}</p>
      </div>
      <fieldset className="pf-field pf-choices pf-belt-tools" aria-describedby={toolError ? pickErrorId : undefined}>
        <legend id={legendId}>Tool</legend>
        <div className="pf-belt-toollist">
          {shown.map((tool) => (
            <label className="pf-choice pf-belt-choice" data-track={tool.track ? tool.track.toLowerCase() : undefined} key={tool.id}>
              <input
                type="radio"
                name="toolPick"
                value={tool.id}
                checked={selected === tool.id}
                onChange={() => {
                  setSelected(tool.id);
                  setPickError(undefined);
                }}
              />
              <span className="pf-choice-name">{tool.title}</span>
              <span className="pf-hint pf-belt-by">
                by {tool.ownerHandle ?? "a builder"}. Used by {tool.usedBy}.
              </span>
              {tool.description ? <span className="pf-hint pf-belt-desc">{tool.description}</span> : null}
            </label>
          ))}
        </div>
        {toolError ? <p className="pf-error" id={pickErrorId}>{toolError}</p> : null}
      </fieldset>
      <div className="pf-field">
        <label htmlFor={noteId}>How does your project use it?</label>
        <span className="pf-hint" id={noteHintId}>
          {NOTE_EXAMPLE} <span className="pf-belt-counter">{note.length} of {USE_NOTE_MAX}</span>
        </span>
        <textarea
          id={noteId}
          ref={noteField}
          name="note"
          className="pf-textarea"
          maxLength={USE_NOTE_MAX}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-describedby={noteError ? `${noteHintId} ${noteErrorId}` : noteHintId}
          aria-invalid={noteError ? true : undefined}
        />
        {noteError ? <p className="pf-error" id={noteErrorId}>{noteError}</p> : null}
      </div>
      <div className="pf-dialog-actions">
        <button type="button" className="pf-btn" onClick={onClose}>Cancel</button>
        <button type="submit" className="pf-btn pri pf-wide" disabled={pending}>
          {pending ? "Saving" : "Equip tool"}
        </button>
      </div>
    </form>
  );
}

// The Equip a tool dialog (design spec 3.15). The server sends the eligible tools; the search runs in the browser over them. The
// form exists only while the dialog is open, so it opens clean every time. With nothing eligible it shows one plain empty state.
export function EquipDialog({
  open,
  onClose,
  onDone,
  projectId,
  tools,
}: Readonly<{ open: boolean; onClose: () => void; onDone: (toolId: string) => void; projectId: string; tools: EquipTool[] }>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      (element.querySelector<HTMLElement>('input[type="search"]') ?? element.querySelector<HTMLElement>("button[data-close-empty]"))?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog ref={dialog} className="pf-dialog pf-equip" aria-labelledby={headingId} onClose={onClose}>
      <div className="pf-dialog-head">
        <h2 id={headingId}>Equip a tool</h2>
        <button type="button" className="pf-btn" onClick={onClose}>Close</button>
      </div>
      {open ? (
        tools.length === 0 ? (
          <div className="pf-belt-empty-wrap">
            <div className="pf-empty">
              <h3>No tools to equip yet</h3>
              <p>Tools show up here once other builders have an approved, open-source project.</p>
            </div>
            <div className="pf-dialog-actions pf-belt-single">
              <button type="button" className="pf-btn pri" data-close-empty onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <EquipForm projectId={projectId} tools={tools} onClose={onClose} onDone={onDone} />
        )
      ) : null}
    </dialog>
  );
}
