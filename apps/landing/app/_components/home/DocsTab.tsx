import Link from "next/link";

// Floating entry to the docs route, themed by the homepage tokens in home.css.
export function DocsTab() {
  return (
    <nav aria-label="Documentation shortcut">
    <Link className="docs-tab" href="/docs/start" aria-label="LOADOUT DOCS — open documentation">
      LOADOUT DOCS
    </Link>
    </nav>
  );
}
