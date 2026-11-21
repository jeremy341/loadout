import Link from "next/link";
import { db } from "@/lib/platform/db";
import { isBookmarked, kudosCounts, kudosGivenIds } from "@/lib/platform/discover-data";
import { relativeTime } from "@/lib/platform/explore-feed";
import { listJournal } from "@/lib/platform/journal-data";
import { coverOf, photosByEntry } from "@/lib/platform/media-data";
import { listToolsUsedBy, listUsersOfTool } from "@/lib/platform/profile-data";
import { handleLabel, summariseHandles } from "@/lib/platform/profile-view";
import { projectHours } from "@/lib/platform/progress";
import { visitorNotice } from "@/lib/platform/project-page";
import { trackSlugOf } from "@/lib/platform/search-view";
import { ProjectComments } from "@/app/(platform)/dashboard/(shell)/projects/[id]/ProjectComments";
import { KudosButton } from "./KudosButton";
import { ProjectCover } from "./ProjectCover";
import { HandleMark, ProjectTimeline } from "./ProjectTimeline";
import { SaveButton, SavedStatus } from "./SaveButton";
import "./explore.css";
import "./profile.css";
import "./project-stasis.css";

const JOURNAL_SHOWN = 50;

// The public project page, after Stasis's project page (discover/[id]): the back link, one header box (cover, title, byline, the
// description, the facts, the links), the tools the project uses, and the journal as a timeline, newest first. Every project is
// public, drafts included (owner, 16 Nov 2026); a project that is not approved carries a plain notice instead of a status tag.
// Visitors see approved and pending hours and never Ore. The owner's Visitor view tab renders this same component (embedded: no back
// link, and the title is a second level heading under the owner page's own title). Returns null for an unknown, banned or
// banned-owner project so the caller can answer 404.
export async function PublicProject({ id, viewerId, embedded = false }: Readonly<{ id: string; viewerId: string; embedded?: boolean }>) {
  const project = await db().project.findFirst({
    where: { id, status: { not: "banned" }, owner: { bannedAt: null } },
    select: {
      id: true, title: true, description: true, track: true, status: true, repoUrl: true, demoUrl: true, createdAt: true,
      owner: { select: { id: true, handle: true } },
    },
  });
  if (!project) return null;

  const [users, equippedByOwner, kudos, given, journal, saved] = await Promise.all([
    listUsersOfTool(project.id, viewerId),
    listToolsUsedBy(project.owner.id),
    kudosCounts([project.id]),
    kudosGivenIds(viewerId, [project.id]),
    listJournal(project.id),
    isBookmarked(viewerId, project.id),
  ]);
  const [photos, cover] = await Promise.all([photosByEntry(journal.map((entry) => entry.id)), coverOf(project.id)]);
  const confirmedUsers = users.filter((use) => use.status === "confirmed");
  const { shown: shownUsers, more: moreUsers } = summariseHandles(confirmedUsers);
  const equipped = equippedByOwner.filter((use) => use.project.id === project.id);
  const hours = projectHours(project.id);
  const trackSlug = trackSlugOf(project.track);
  const notice = visitorNotice(project.status);
  const handle = project.owner.handle;
  const Heading = embedded ? "h2" : "h1";
  const pre = embedded ? "vv-" : "";

  return (
    <div className="pf-spp" data-track={trackSlug}>
      {!embedded ? (
        <Link className="pf-back" href="/dashboard/explore">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Explore
        </Link>
      ) : null}
      <SavedStatus className="pf-explore-saved-status" />
      {notice ? <p className="pf-explore-notice" role="note" data-testid="project-notice">{notice}</p> : null}

      <section className="pf-spp-head" aria-labelledby={`${pre}spp-title`}>
        <div className="pf-spp-cover">
          <ProjectCover status={project.status} track={project.track} hours={hours} large depth={false} badges={false} cover={cover} title={project.title} />
        </div>
        <div className="pf-spp-top">
          <div className="pf-spp-id">
            <Heading id={`${pre}spp-title`} className="pf-spp-title">{project.title}</Heading>
            <p className="pf-spp-by">
              <HandleMark handle={handle} />
              {handle ? <Link className="pf-meta-link" href={`/dashboard/builders/${handle}`}>{handle}</Link> : <span>{handleLabel(null)}</span>}
              <span className="pf-spp-dot" aria-hidden="true">&bull;</span>
              <span className="pf-spp-muted">
                {journal.length} journal {journal.length === 1 ? "entry" : "entries"}
              </span>
              <span className="pf-spp-dot" aria-hidden="true">&bull;</span>
              <span className="pf-spp-muted">Started {relativeTime(project.createdAt)}</span>
            </p>
            {project.track ? (
              <p className="pf-spp-tags">
                <span className="pf-spp-tag" data-track={trackSlug}>
                  <span className="pf-swatch" aria-hidden="true" />
                  {project.track}
                </span>
              </p>
            ) : null}
          </div>
          <div className="pf-spp-tools">
            <KudosButton projectId={project.id} title={project.title} count={kudos[project.id] ?? 0} given={given[project.id] ?? false} own={project.owner.id === viewerId} variant="button" />
            <SaveButton projectId={project.id} saved={saved} title={project.title} variant="button" />
          </div>
        </div>

        <p className={project.description ? "pf-spp-desc" : "pf-spp-desc pf-muted"}>{project.description ?? "No description yet."}</p>

        <dl className="pf-spp-facts">
          <div>
            <dt>Approved hours</dt>
            <dd>{hours.approved} H</dd>
          </div>
          <div>
            <dt>Pending hours</dt>
            <dd>{hours.pending} H</dd>
          </div>
          <div>
            <dt>Hackatime</dt>
            <dd>Not connected</dd>
          </div>
        </dl>

        {project.repoUrl || project.demoUrl ? (
          <div className="pf-spp-links">
            {project.repoUrl ? <ExternalLink label="Source" url={project.repoUrl} /> : null}
            {project.demoUrl ? <ExternalLink label="Demo" url={project.demoUrl} /> : null}
          </div>
        ) : null}
      </section>

      {(
        <section className="pf-spp-box" aria-labelledby={`${pre}spp-tools-heading`}>
          <h2 id={`${pre}spp-tools-heading`}>Toolbelt</h2>
          {equipped.length === 0 ? <p className="pf-muted" data-testid="project-tools-empty">No tools listed yet.</p> : (
            <ul className="pf-prof-tools" data-testid="project-tools">
              {equipped.map((row) => (
                <li key={row.id}>
                  <Link className="pf-prof-tool-title" href={`/dashboard/explore/${row.tool.id}`}>{row.tool.title}</Link>{" "}
                  <span className="pf-muted">
                    by {row.tool.ownerHandle ? <Link href={`/dashboard/builders/${row.tool.ownerHandle}`}>{row.tool.ownerHandle}</Link> : handleLabel(null)}
                  </span>
                  <p className="pf-prof-note-line">{row.note}</p>
                </li>
              ))}
            </ul>
          )}
          {confirmedUsers.length > 0 ? (
            <p className="pf-prof-handles" data-testid="project-used-by">
              <span className="pf-spp-muted">Used by</span>
              {shownUsers.map((use) =>
                use.userHandle ? (
                  <Link key={use.id} className="pf-prof-handle" href={`/dashboard/builders/${use.userHandle}`}>{use.userHandle}</Link>
                ) : (
                  <span key={use.id} className="pf-muted">a builder</span>
                ),
              )}
              {moreUsers > 0 ? <span className="pf-muted">and {moreUsers} more</span> : null}
            </p>
          ) : null}
        </section>
      )}

      <section className="pf-spp-box" aria-labelledby={`${pre}journal-heading`}>
        <h2 id={`${pre}journal-heading`}>Journal</h2>
        {journal.length === 0 ? <p className="pf-muted" data-testid="project-journal-empty">No journal entries on this project yet.</p> : null}
        <ProjectTimeline projectId={project.id} entries={journal} handle={handle} startedAt={project.createdAt} limit={JOURNAL_SHOWN} photos={photos} idPrefix={pre} entryTestId={embedded ? "visitor-entry" : "journal-entry"} />
        {journal.length > JOURNAL_SHOWN ? <p className="pf-muted pf-box-note">Showing the newest {JOURNAL_SHOWN} of {journal.length} entries.</p> : null}
      </section>

      <ProjectComments projectId={project.id} viewerId={viewerId} idPrefix={pre} />
    </div>
  );
}

// Only an https address becomes a link; anything else is shown as plain text. The label is the link text and the host and path
// follow it, so the destination is always visible.
function ExternalLink({ label, url }: { label: string; url: string }) {
  let shown = url;
  let safe = false;
  try {
    const parsed = new URL(url);
    safe = parsed.protocol === "https:";
    shown = `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    safe = false;
  }
  return safe ? (
    <a className="pf-spp-link" href={url} target="_blank" rel="noopener noreferrer">
      <span>{label}</span>
      <span className="pf-spp-link-host">{shown}</span>
    </a>
  ) : (
    <span className="pf-spp-link pf-spp-link-plain">
      <span>{label}</span> <span className="pf-spp-link-host">{shown}</span>
    </span>
  );
}
