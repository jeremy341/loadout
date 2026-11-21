import Link from "next/link";
import { expeditionsHref, type ExpeditionsQuery } from "@/lib/platform/expeditions";

// Previous and Next as plain links, with the page count between them. Only shown when there is more than one page.
export function ExpeditionPager({ query, page, pages }: Readonly<{ query: Pick<ExpeditionsQuery, "q" | "track">; page: number; pages: number }>) {
  if (pages <= 1) return null;
  return (
    <nav className="pf-pager ex-pager" aria-label="Expedition pages">
      {page > 1 ? (
        <Link href={expeditionsHref({ ...query, page: page - 1 })} rel="prev">
          Previous
        </Link>
      ) : (
        <span className="ex-pager-off" aria-hidden="true">
          Previous
        </span>
      )}
      <span className="ex-pager-count">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={expeditionsHref({ ...query, page: page + 1 })} rel="next">
          Next
        </Link>
      ) : (
        <span className="ex-pager-off" aria-hidden="true">
          Next
        </span>
      )}
    </nav>
  );
}
