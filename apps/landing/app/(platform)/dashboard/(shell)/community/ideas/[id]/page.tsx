import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IdeaStatusTag, UpvoteButton } from "@/app/_components/platform/community/IdeaRow";
import { BackLink, SampleNote } from "@/app/_components/platform/community/Parts";
import { COMMUNITY_HOME, findIdea } from "@/lib/platform/community";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Idea - LOADOUT" };

// One idea, read only: what was asked, its status and vote count, and the team's reply once it is not open. An unknown id is
// a 404.
export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const idea = findIdea(id);
  if (!idea) notFound();

  return (
    <>
      <BackLink href={`${COMMUNITY_HOME}/ideas`}>Back to Ideas</BackLink>
      <SampleNote>This idea and its votes are an invented sample.</SampleNote>

      <div className="cm-detail-head">
        <h1>{idea.title}</h1>
        <p className="pf-project-lead">{idea.body}</p>
        <dl className="pf-meta-box">
          <div>
            <dt>Status</dt>
            <dd>
              <IdeaStatusTag status={idea.status} />
            </dd>
          </div>
          <div>
            <dt>Votes</dt>
            <dd>{idea.votes}</dd>
          </div>
          <div>
            <dt>Posted by</dt>
            <dd className="cm-handle-text">{idea.handle}</dd>
          </div>
        </dl>
      </div>

      {idea.note ? (
        <section className="pf-box cm-reply" aria-labelledby="cm-reply-title">
          <h2 id="cm-reply-title">Team reply</h2>
          <p>{idea.note}</p>
        </section>
      ) : null}

      <div className="cm-vote-bar">
        <UpvoteButton title={idea.title} />
        <p className="cm-closed">Voting opens with the community release. Nothing here is saved.</p>
      </div>
    </>
  );
}
