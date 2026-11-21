import type { ReactNode } from "react";
import "./page-head.css";

// The opening of a participant page: the visible h1, then one lead sentence. The same size and spacing everywhere, so no
// page starts with a bare tab strip or grid. The Overview and the finished Shop, Explore and Projects keep their own openings.
export function PageHead({ title, children }: Readonly<{ title: string; children?: ReactNode }>) {
  return (
    <header className="pf-head">
      <h1>{title}</h1>
      {children ? <p className="pf-lead">{children}</p> : null}
    </header>
  );
}
