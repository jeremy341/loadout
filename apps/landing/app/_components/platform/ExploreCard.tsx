import Link from "next/link";
import { entriesLabel, relativeTime, type FeedCard } from "@/lib/platform/explore-feed";
import { handleLabel } from "@/lib/platform/profile-view";
import { trackSlugOf } from "@/lib/platform/search-view";
import { KudosButton } from "./KudosButton";
import { projectStatusLabel } from "@/lib/platform/projects";
import { SaveButton } from "./SaveButton";
import "./explore.css";

// One public project in the Explore grid, after Stasis's Discover card: a dithered cover in the track colours with a check badge
// top left (only for an approved project; drafts and the other stages are public too and say their stage in the footer) and the kudos heart top right, the title, two lines of description, the author chip
// and "N entries" with the time of the newest journal entry.
//
// The title link stretches over the whole card (a ::after in explore.css), so the card is one click target. The kudos heart, the
// Save star and the author chip sit above it as their own controls: a button or a second link cannot live inside a link.
// Works on the server and in the client feed (no hooks here; the two buttons are their own client components).
export function ExploreCard({ card }: Readonly<{ card: FeedCard }>) {
  const handle = card.ownerHandle;
  const approved = card.status === "approved";
  return (
    <article className="pf-explore-card" data-track={trackSlugOf(card.track)}>
      <div className="pf-explore-media">
        <span className="pf-explore-cover" aria-hidden="true" />
        {approved ? (
          <span className="pf-explore-check">
            <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
              <path d="M1 6h2v2H1zM3 8h2v2H3zM5 6h2v2H5zM7 4h2v2H7zM9 2h2v2H9z" fill="currentColor" />
            </svg>
            <span className="pf-sr">Approved</span>
          </span>
        ) : null}
        <span className="pf-explore-kudos">
          <KudosButton projectId={card.id} title={card.title} count={card.kudos} given={card.kudosGiven} own={card.own} variant="card" />
        </span>
        <span className="pf-explore-track">
          <span className="pf-swatch" aria-hidden="true" />
          {card.track ?? "No track"}
        </span>
        <span className="pf-explore-star">
          <SaveButton projectId={card.id} saved={card.saved} title={card.title} variant="card" />
        </span>
      </div>
      <div className="pf-explore-card-body">
        <h3 className="pf-explore-card-title">
          <Link className="pf-explore-card-link" href={`/dashboard/explore/${card.id}`}>{card.title}</Link>
        </h3>
        <p className={card.description ? "pf-explore-card-text" : "pf-explore-card-text pf-muted"}>{card.description ?? "No description."}</p>
      </div>
      <div className="pf-explore-foot">
        {handle ? (
          <Link className="pf-explore-author" href={`/dashboard/builders/${handle}`}>
            <span className="pf-explore-avatar" aria-hidden="true">{handle.slice(0, 1).toUpperCase()}</span>
            <span className="pf-explore-author-name">{handle}</span>
          </Link>
        ) : (
          <span className="pf-explore-author pf-explore-author-plain">{handleLabel(null)}</span>
        )}
        <span className="pf-explore-activity">
          {approved ? null : <span>{projectStatusLabel(card.status)}</span>}
          <span>{entriesLabel(card.entries)}</span>
          {card.lastAt ? (
            <time dateTime={card.lastAt} suppressHydrationWarning>{relativeTime(card.lastAt)}</time>
          ) : null}
        </span>
      </div>
    </article>
  );
}
