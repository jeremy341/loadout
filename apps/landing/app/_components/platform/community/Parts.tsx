import Link from "next/link";
import type { ReactNode } from "react";

// The "proposed or sample content" line is not shown any more: nothing is labelled as a demo until release.
export function SampleNote(props: { children: ReactNode }) {
  void props;
  return null;
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
