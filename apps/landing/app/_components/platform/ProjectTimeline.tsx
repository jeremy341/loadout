import Link from "next/link";
import type { JournalRow } from "@/lib/platform/journal-data";
import { previewEntry } from "@/lib/platform/journal-writer";
import type { MediaPhoto } from "@/lib/platform/media-data";
import { DeleteJournalEntry } from "./DeleteJournalEntry";
import { HandleMark, JournalEntryCard } from "./JournalEntryCard";
import "./project-stasis.css";

export { HandleMark };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// The journal as Stasis draws it: a thin line down the left, a square mark per item, and a flat card per entry. The card header
// has the handle ("added to the journal"), the hours the builder logged and the date; the body is Markdown. The owner also gets
// Edit and Delete on each entry while the journal is open. The last item is always "started this project".
export function ProjectTimeline({
  projectId,
  entries,
  handle,
  startedAt,
  owner = false,
  open = false,
  limit,
  photos = {},
  idPrefix = "",
  entryTestId = "journal-entry",
}: Readonly<{
  projectId: string;
  entries: JournalRow[];
  handle: string | null;
  startedAt: Date;
  owner?: boolean;
  open?: boolean;
  limit?: number;
  // Live photos by entry id (photosByEntry). A deleted photo is never in this map.
  photos?: Record<string, MediaPhoto[]>;
  // Set on the second copy of a timeline on one page (the Visitor view tab), so ids and test ids stay unique.
  idPrefix?: string;
  entryTestId?: string;
}>) {
  const shown = limit ? entries.slice(0, limit) : entries;
  const name = handle ?? "a builder";
  return (
    <div className="pf-spp-timeline">
      <span className="pf-spp-line" aria-hidden="true" />
      <ol className="pf-spp-items">
        {shown.map((entry) => (
          <li key={entry.id} className="pf-spp-item" data-testid={entryTestId}>
            <span className="pf-spp-icon" data-kind="entry" aria-hidden="true">
              <svg viewBox="0 0 12 12" width="14" height="14" shapeRendering="crispEdges" fill="currentColor" focusable="false">
                <path d="M2 1h6l2 2v8H2zM3 2v8h6V4H7V2zM4 5h4v1H4zM4 7h4v1H4z" fillRule="evenodd" />
              </svg>
            </span>
            <JournalEntryCard
              entry={previewEntry({ title: entry.title, body: entry.body, hours: entry.hours, date: entry.createdAt, photos: photos[entry.id] ?? [] })}
              handle={handle}
              titleId={`${idPrefix}entry-${entry.id}`}
            >
              {owner && open ? (
                <div className="pf-spp-entry-actions">
                  <Link className="pf-btn pf-journal-edit" href={`/dashboard/projects/${projectId}/journal/${entry.id}/edit`} aria-label={`Edit entry ${entry.title}`}>
                    Edit
                  </Link>
                  <DeleteJournalEntry id={entry.id} title={entry.title} />
                </div>
              ) : null}
            </JournalEntryCard>
          </li>
        ))}
        <li className="pf-spp-item" data-testid={`${entryTestId}-started`}>
          <span className="pf-spp-icon" data-kind="start" aria-hidden="true">
            <svg viewBox="0 0 12 12" width="14" height="14" shapeRendering="crispEdges" fill="currentColor" focusable="false">
              <path d="M5 2h2v3h3v2H7v3H5V7H2V5h3z" />
            </svg>
          </span>
          <div className="pf-spp-entry pf-spp-entry-start">
            <p className="pf-spp-entry-who">
              <HandleMark handle={handle} />
              {handle ? <Link href={`/dashboard/builders/${handle}`}>{handle}</Link> : <span>{name}</span>}
              <span className="pf-spp-muted">started this project</span>
            </p>
            <p className="pf-spp-entry-when">
              <time dateTime={startedAt.toISOString()}>{dateFormat.format(startedAt)}</time>
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}
