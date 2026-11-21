"use client";

import { usePathname } from "next/navigation";
import { publicPath } from "@/lib/reviewer/host";
import { dataScopeFor } from "./dataScope";

// One line under a page's title that says where that page's data lives. It sits in the page header, beside the data it describes,
// instead of one site-wide sentence that could not be true for every page. The label is a word, never colour alone.
export default function DataScopeNote() {
  const scope = dataScopeFor(publicPath(usePathname()));
  if (!scope) return null;
  return (
    <p className="rv-data-scope" data-scope={scope.kind}>
      <strong>{scope.label}.</strong> {scope.text}
    </p>
  );
}
