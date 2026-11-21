import Link from "next/link";
import type { ReactNode } from "react";
import type { SearchRow } from "@/lib/platform/discover-data";
import { handleLabel } from "@/lib/platform/profile-view";
import { highlightRanges, parseSearchQuery } from "@/lib/platform/search";
import { trackSlugOf } from "@/lib/platform/search-view";
import "./discover.css";

// One search result: track swatch and name, title with the matched text marked, "by handle", "Used by n", the repo host
// (toolbelt scope), a one-line description, and a slot for the Save star.
//
// No hooks, so it renders on the server or the client. The only interactive element it can contain is the optional `href`
// link around the main block. INSIDE role="option" (the Toolbelt combobox) pass no `href`, and never put the Save star in the
// option: the parent renders this row as the option's content and places <SaveButton variant="row"> as a SIBLING of the
// option element, in the same wrapper div. `saveSlot` is for lists where the row is NOT an option (Explore live results,
// saved lists); the slot is a sibling of the link, never nested in it.
//
// `row.repoHost` is optional: SearchRow only says hasRepo, so the page passes repoHost(url) when it knows the address.
export type ResultRowData = SearchRow & { repoHost?: string | null };

function Marked({ text, tokens }: { text: string; tokens: readonly string[] }) {
  const ranges = highlightRanges(text, tokens);
  if (ranges.length === 0) return <>{text}</>;
  const parts: ReactNode[] = [];
  let at = 0;
  ranges.forEach((range, index) => {
    if (range.start > at) parts.push(text.slice(at, range.start));
    parts.push(
      <mark key={index} className="pf-result-mark">
        {text.slice(range.start, range.end)}
      </mark>,
    );
    at = range.end;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

export function ProjectResultRow({
  row,
  query = "",
  href,
  showRepo = false,
  saveSlot,
  as: Tag = "div",
}: Readonly<{
  row: ResultRowData;
  query?: string;
  href?: string;
  showRepo?: boolean;
  saveSlot?: ReactNode;
  as?: "div" | "li";
}>) {
  const tokens = parseSearchQuery(query).tokens;
  const handle = handleLabel(row.ownerHandle);
  const repo = showRepo ? (row.repoHost ?? null) : null;
  const body = (
    <>
      <span className="pf-result-track">
        <span className="pf-swatch" aria-hidden="true" />
        <span className="pf-result-track-name">{row.track ?? "No track"}</span>
      </span>
      <span className="pf-result-text">
        <span className="pf-result-title">
          <Marked text={row.title} tokens={tokens} />
        </span>
        <span className="pf-result-meta">
          <span>
            by <Marked text={handle} tokens={tokens} />
          </span>
          <span>Used by {row.usedBy}</span>
          {repo ? <span className="pf-result-repo">{repo}</span> : null}
        </span>
        <span className="pf-result-desc">
          <Marked text={row.description ?? "No description."} tokens={tokens} />
        </span>
      </span>
    </>
  );
  return (
    <Tag className="pf-result" data-track={trackSlugOf(row.track)} data-saved={row.saved ? "true" : undefined}>
      {href ? (
        <Link className="pf-result-main" href={href}>
          {body}
        </Link>
      ) : (
        <span className="pf-result-main">{body}</span>
      )}
      {saveSlot ? <span className="pf-result-save">{saveSlot}</span> : null}
    </Tag>
  );
}
