import Link from "next/link";
import type { JournalRow } from "@/lib/platform/journal-data";
import { formatHours } from "@/lib/platform/journal";
import type { MediaPhoto } from "@/lib/platform/media-data";
import { ProjectTimeline } from "./ProjectTimeline";
import "./project-journal.css";

export const JOURNAL_LOCKED_TEXT = "This project is submitted, so its journal is locked. It opens again if a reviewer asks for changes.";

// The owner's Journal tab: the totals and notes, then the timeline of entries, newest first, with Edit and Delete on each entry
// while the journal is open. Bodies are Markdown, rendered safely (JournalMarkdown). Hours are what the builder reports, never
// approved hours.
export function ProjectJournal({
  projectId,
  entries,
  totalHours,
  open,
  dueHint,
  handle,
  startedAt,
  photos = {},
}: Readonly<{ photos?: Record<string, MediaPhoto[]>; projectId: string; entries: JournalRow[]; totalHours: number; open: boolean; dueHint: string | null; handle: string | null; startedAt: Date }>) {
  return (
    <section className="pf-box pf-journal" aria-labelledby="journal-heading" id="journal">
      <div className="pf-box-head">
        <h2 id="journal-heading">Journal</h2>
        <p className="pf-journal-total" data-testid="journal-total">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}, {formatHours(totalHours)} logged
        </p>
      </div>
      <p className="pf-hint pf-journal-note">Hours here are the ones you report. A reviewer approves them later, and only approved hours earn Ore.</p>
      {open && dueHint ? <p className="pf-journal-due">{dueHint}</p> : null}
      {!open ? <p className="pf-journal-locked" role="note">{JOURNAL_LOCKED_TEXT}</p> : null}
      {entries.length === 0 ? (
        <div className="pf-journal-empty">
          <p>{open ? "No journal entries yet. Write what you did, and how long it took." : "No journal entries."}</p>
          {open ? <Link className="pf-btn" href={`/dashboard/projects/${projectId}/journal/new`}>Write the first entry</Link> : null}
        </div>
      ) : null}
      <ProjectTimeline projectId={projectId} entries={entries} handle={handle} startedAt={startedAt} owner open={open} photos={photos} />
    </section>
  );
}
