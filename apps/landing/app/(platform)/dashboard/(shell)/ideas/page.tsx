import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/app/_components/platform/EmptyState";
import { IdeaApply, IdeaShare, IdeaVote } from "@/app/_components/platform/IdeaControls";
import { ScrambleText } from "@/app/_components/platform/ScrambleText";
import { db } from "@/lib/platform/db";
import { IDEA_STATUSES, type IdeaStatus } from "@/lib/platform/ideas";
import { listIdeas } from "@/lib/platform/ideas-data";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { requireViewer } from "@/lib/platform/session";
import "@/app/_components/platform/ideas.css";
import "@/app/_components/platform/page-polish.css";

export const metadata: Metadata = { title: "Ideas - LOADOUT" };

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const LABEL: Record<IdeaStatus, string> = { open: "Open", taken: "Taken", closed: "Closed" };

function clip(text: string, max: number): string {
  const chars = Array.from(text.replace(/\s+/g, " "));
  return chars.length <= max ? chars.join("") : chars.slice(0, max - 1).join("").trimEnd() + "…";
}

// Ideas other builders want help with, best first. Vote up or down, offer to build one, or share your own. A list shows only handles.
export default async function IdeasPage({ searchParams }: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>) {
  const viewer = await requireViewer();
  const raw = (await searchParams).status;
  const status: IdeaStatus = IDEA_STATUSES.includes(raw as IdeaStatus) ? (raw as IdeaStatus) : "open";
  const [ideas, profile, openCount] = await Promise.all([
    listIdeas(viewer.id, status),
    getOwnProfile(viewer.id),
    db().idea.count({ where: { authorId: viewer.id, status: "open" } }),
  ]);
  const myHandle = profile?.handle ?? null;

  return (
    <div className="pf-id">
      <header className="pf-id-head">
        <h1><ScrambleText text="Ideas" /></h1>
        <p className="pf-id-lead">Projects other builders want help with. Vote on what you would use, or offer to build one together.</p>
      </header>

      <IdeaShare openCount={openCount} />

      <nav className="pf-id-filters" aria-label="Idea status">
        {IDEA_STATUSES.map((s) => (
          <Link key={s} href={s === "open" ? "/dashboard/ideas" : `/dashboard/ideas?status=${s}`} aria-current={s === status ? "page" : undefined}>
            {LABEL[s]}
          </Link>
        ))}
      </nav>

      {ideas.length === 0 ? (
        <EmptyState
          title={status === "open" ? "No open ideas yet" : `No ${status} ideas`}
          action={status === "open" ? undefined : <Link href="/dashboard/ideas">Show open ideas</Link>}
        >
          {status === "open" ? "Share the first one: say what you want to build and who could help." : "Nothing here at the moment."}
        </EmptyState>
      ) : (
        <ol className="pf-id-list">
          {ideas.map((idea) => {
            const own = myHandle !== null && idea.authorHandle === myHandle;
            return (
              <li key={idea.id} className="pf-id-row">
                <IdeaVote ideaId={idea.id} score={idea.score} myVote={idea.myVote} own={own} />
                <div className="pf-id-main">
                  <h2 className="pf-id-title"><Link href={`/dashboard/ideas/${idea.id}`}>{idea.title}</Link></h2>
                  <p className="pf-id-body">{clip(idea.body, 180)}</p>
                  <p className="pf-id-meta">
                    {idea.authorHandle ? <Link href={own ? "/dashboard/profile" : `/dashboard/builders/${idea.authorHandle}`}>{own ? "you" : idea.authorHandle}</Link> : "a builder"}
                    <span>{WHEN.format(idea.createdAt)}</span>
                    <span>{LABEL[idea.status]}</span>
                  </p>
                  {idea.status === "open" && !own ? <IdeaApply ideaId={idea.id} applied={idea.applied} /> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
