import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IdeaApply, IdeaDecide, IdeaStatusControl, IdeaVote } from "@/app/_components/platform/IdeaControls";
import { ScrambleText } from "@/app/_components/platform/ScrambleText";
import { getIdea, listApplications } from "@/lib/platform/ideas-view-data";
import { requireViewer } from "@/lib/platform/session";
import "@/app/_components/platform/ideas.css";

export const metadata: Metadata = { title: "Idea - LOADOUT" };

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const STATUS = { open: "Open", taken: "Taken", closed: "Closed" } as const;

// One idea: the full text, the votes, and (for its author only) the applications with Accept and Decline. A missing idea, a banned
// author and a block are all the same plain 404.
export default async function IdeaPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const viewer = await requireViewer();
  const { id } = await params;
  const idea = await getIdea(viewer.id, id);
  if (!idea) notFound();
  const own = idea.authorId === viewer.id;
  const applications = own ? await listApplications(viewer.id, idea.id) : [];

  return (
    <div className="pf-id pf-id-detail">
      <Link className="pf-back" href="/dashboard/ideas">
        <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
        </svg>
        Back to Ideas
      </Link>
      <header className="pf-id-head">
        <h1><ScrambleText text={idea.title} /></h1>
        <p className="pf-id-meta">
          {idea.authorHandle ? <Link href={own ? "/dashboard/profile" : `/dashboard/builders/${idea.authorHandle}`}>{own ? "you" : idea.authorHandle}</Link> : "a builder"}
          <span>{WHEN.format(idea.createdAt)}</span>
          <span>{STATUS[idea.status]}</span>
        </p>
      </header>

      <p className="pf-id-full">{idea.body}</p>

      <section className="pf-id-sec" aria-labelledby="pf-id-votes">
        <h2 id="pf-id-votes" className="pf-id-h">Votes</h2>
        <IdeaVote ideaId={idea.id} score={idea.score} myVote={idea.myVote} own={own} />
        <p className="pf-id-count">{idea.up} up, {idea.down} down</p>
      </section>

      {own ? (
        <section className="pf-id-sec" aria-labelledby="pf-id-apps">
          <h2 id="pf-id-apps" className="pf-id-h">Applications</h2>
          {applications.length === 0 ? (
            <p className="pf-id-body">No one has applied yet.</p>
          ) : (
            <ul className="pf-id-apps">
              {applications.map((application) => (
                <li key={application.id}>
                  <p className="pf-id-meta">
                    {application.handle ? <Link href={`/dashboard/builders/${application.handle}`}>{application.handle}</Link> : "a builder"}
                    <span>{WHEN.format(application.createdAt)}</span>
                    <span>{application.status === "pending" ? "Waiting" : application.status === "accepted" ? "Accepted" : "Declined"}</span>
                  </p>
                  <p className="pf-id-full">{application.message}</p>
                  {application.status === "pending" && idea.status === "open" ? <IdeaDecide ideaId={idea.id} applicationId={application.id} /> : null}
                </li>
              ))}
            </ul>
          )}
          <IdeaStatusControl ideaId={idea.id} status={idea.status} />
        </section>
      ) : idea.status === "open" ? (
        <section className="pf-id-sec" aria-labelledby="pf-id-apply">
          <h2 id="pf-id-apply" className="pf-id-h">Build it together</h2>
          <IdeaApply ideaId={idea.id} applied={idea.applied} />
        </section>
      ) : null}
    </div>
  );
}
