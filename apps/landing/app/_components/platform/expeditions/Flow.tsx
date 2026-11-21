import type { CSSProperties } from "react";

// The pixel tick the stage strip uses.
export function CheckGlyph() {
  return (
    <svg viewBox="0 1 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d="M1 6h2v2h2v2H3V8H1zM5 8h2V6h2V4h2v2H9v2H7v2H5z" />
    </svg>
  );
}

export type FlowStep = { label: string; note?: string };

// A short numbered strip: done steps filled, the current step marked, the rest waiting. Across on wide screens, down on a
// phone. `current` is the index of the step in progress, null when none has started, and `complete` marks every step done.
// The state is spoken as well as drawn, so colour is never the only signal.
export function ExFlow({ steps, current, complete = false, label }: Readonly<{ steps: readonly FlowStep[]; current: number | null; complete?: boolean; label: string }>) {
  return (
    <ol className="ex-flow" aria-label={label} style={{ "--n": steps.length } as CSSProperties}>
      {steps.map((step, index) => {
        const state = complete || (current !== null && index < current) ? "done" : current !== null && index === current ? "active" : "todo";
        return (
          <li className="ex-flow-step" data-state={state} aria-current={state === "active" ? "step" : undefined} key={step.label}>
            <span className="ex-node" aria-hidden="true">
              {state === "done" ? <CheckGlyph /> : state === "todo" ? index + 1 : null}
            </span>
            <span className="ex-flow-label">
              {step.label}
              {state === "done" ? <span className="pf-sr">, done</span> : state === "active" ? <span className="pf-sr">, current</span> : null}
            </span>
            {step.note ? <p className="ex-flow-note">{step.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
