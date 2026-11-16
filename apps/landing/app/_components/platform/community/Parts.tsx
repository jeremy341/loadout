import Link from "next/link";
import type { ReactNode } from "react";

// The one quiet line every Community page carries: what is on it is proposed or sample content.
export function SampleNote({ children }: { children: ReactNode }) {
  return (
    <p className="pf-event-line">
      <span className="pf-event-dot" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// A section title with a link to the page that owns the full list.
export function PreviewHead({ id, title, href }: { id: string; title: string; href: string }) {
  return (
    <div className="pf-box-head">
      <h2 id={id}>{title}</h2>
      <Link href={href}>
        See all<span className="pf-sr"> {title}</span>
      </Link>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <div className="pf-crumbs">
      <Link className="pf-back" href={href}>
        <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
        </svg>
        {children}
      </Link>
    </div>
  );
}
