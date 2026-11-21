import type { ReactNode } from "react";
import "./states.css";

// The one empty state of the participant platform: a dashed panel with a plain sentence, an optional title and one optional
// action (a link or a button). It says what is missing and what to do next. It is never an apology and never shows a number.
export function EmptyState({ title, children, action }: Readonly<{ title?: string; children: ReactNode; action?: ReactNode }>) {
  return (
    <div className="pf-empty">
      {title ? <h3>{title}</h3> : null}
      <p>{children}</p>
      {action ? <p className="pf-empty-action">{action}</p> : null}
    </div>
  );
}
