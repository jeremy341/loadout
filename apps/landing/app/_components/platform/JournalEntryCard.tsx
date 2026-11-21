import type { ReactNode } from "react";
import Link from "next/link";
import { relativeTime } from "@/lib/platform/explore-feed";
import { mediaUrl } from "@/lib/platform/media-url";
import type { PreviewEntry } from "@/lib/platform/journal-writer";
import { JournalMarkdown } from "./JournalMarkdown";
import "./project-stasis.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// A small pixel square with the first letter of a handle, in the track colour (Stasis shows the avatar here; we have no upload).
export function HandleMark({ handle }: Readonly<{ handle: string | null }>) {
  return (
    <span className="pf-spp-avatar" aria-hidden="true">
      {(handle ?? "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

// One journal entry as a visitor reads it, drawn from the one preview model (previewEntry in journal-writer.ts). The public
// timeline and the writer's Preview both render this, so what you preview is what visitors get. children is the owner's actions.
export function JournalEntryCard({
  entry,
  handle,
  titleId,
  children,
}: Readonly<{ entry: PreviewEntry; handle: string | null; titleId: string; children?: ReactNode }>) {
  const when = new Date(entry.dateIso);
  return (
    <article className="pf-spp-entry" aria-labelledby={titleId}>
      <header className="pf-spp-entry-head">
        <p className="pf-spp-entry-who">
          <HandleMark handle={handle} />
          {handle ? <Link href={`/dashboard/builders/${handle}`}>{handle}</Link> : <span>a builder</span>}
          <span className="pf-spp-muted">added to the journal</span>
          <span className="pf-spp-hours">{entry.hoursText}</span>
        </p>
        <p className="pf-spp-entry-when">
          <time dateTime={entry.dateIso} title={dateFormat.format(when)}>
            {dateFormat.format(when)}
          </time>
          <span className="pf-spp-muted">{relativeTime(when)}</span>
        </p>
      </header>
      <h3 id={titleId} className="pf-spp-entry-title">
        {entry.title}
      </h3>
      {entry.empty ? <p className="pf-muted">Nothing written yet.</p> : <JournalMarkdown source={entry.body} className="pf-md pf-spp-entry-body" />}
      {entry.photos.length > 0 ? (
        <ul className="pf-spp-photos" data-testid="entry-photos">
          {entry.photos.map((photo) => (
            <li key={photo.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(photo.id)} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </article>
  );
}
