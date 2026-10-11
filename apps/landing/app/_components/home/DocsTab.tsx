import Link from "next/link";

// Floating entry to the docs route, themed by the homepage tokens in home.css.
export function DocsTab() {
  return (
    <Link className="docs-tab" href="/docs" aria-label="Open LOADOUT documentation">
      LOADOUT DOCS
    </Link>
  );
}
