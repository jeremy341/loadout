// Where the documentation is shown. A signed-in participant reads it inside the participant platform (the sidebar, the top bar with
// the Ore chip and the account menu, the Docs link current). Everyone else gets the public documentation layout. The pages, the
// addresses and the words are the same in both; only the frame around them changes.
export type DocsLayoutKind = "platform" | "public";

export function docsLayoutFor(viewer: { id: string } | null | undefined): DocsLayoutKind {
  return viewer ? "platform" : "public";
}

// The link back out of the documentation, one per layout.
export const DOCS_BACK: Record<DocsLayoutKind, { href: string; label: string }> = {
  platform: { href: "/dashboard/projects", label: "Back to projects" },
  public: { href: "/", label: "Back to LOADOUT" },
};

// True for /docs and every page under it.
export function isDocsPath(pathname: string): boolean {
  return pathname === "/docs" || pathname.startsWith("/docs/");
}
