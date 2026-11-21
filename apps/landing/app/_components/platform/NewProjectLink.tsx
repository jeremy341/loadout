import Link from "next/link";

export const NEW_PROJECT_HREF = "/dashboard/projects/new";

// The header button and the empty state button. The wizard is a page, so these are plain links.
export function NewProjectButton() {
  return (
    <Link className="pf-btn pri" href={NEW_PROJECT_HREF}>
      New project →
    </Link>
  );
}

// The dashed tile that starts the grid.
export function NewProjectCard() {
  return (
    <Link className="pf-new-card" href={NEW_PROJECT_HREF} data-testid="new-project">
      <svg className="pf-new-plus" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
        <rect x="5" y="1" width="2" height="10" />
        <rect x="1" y="5" width="10" height="2" />
      </svg>
      <span className="pf-new-label">New project</span>
      <span className="pf-new-sub">Pick a kind, say what it is.</span>
    </Link>
  );
}
