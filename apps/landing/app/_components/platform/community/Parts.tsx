import Link from "next/link";

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
