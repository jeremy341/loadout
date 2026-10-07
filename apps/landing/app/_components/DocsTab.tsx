"use client";

import Link from "next/link";

export function DocsTab() {
  return (
    <Link className="docs-tab" href="/docs" aria-label="Open LOADOUT documentation">
      LOADOUT DOCS
    </Link>
  );
}
