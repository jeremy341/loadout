import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink, SampleNote } from "@/app/_components/platform/community/Parts";
import { COMMUNITY_HOME, findSession } from "@/lib/platform/community";
import { requireViewer } from "@/lib/platform/session";
import { trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Show & Tell session - LOADOUT" };

// One session: its theme and the projects shown. An upcoming session lists nothing and has no date; an unknown id is a 404.
export default async function ShowAndTellSessionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const session = findSession(id);
  if (!session) notFound();

  return (
    <>
      <BackLink href={`${COMMUNITY_HOME}/show-and-tell`}>Back to Show &amp; Tell</BackLink>
      <SampleNote>This session is a proposed sample. Names and projects are invented.</SampleNote>

      <div className="cm-detail-head">
        <h1>
          Session {session.number}: {session.title}
        </h1>
        <p className="pf-project-lead">{session.summary}</p>
        <dl className="pf-meta-box">
          <div>
            <dt>Status</dt>
            <dd>{session.status === "past" ? "Held" : "Not scheduled"}</dd>
          </div>
          <div>
            <dt>{session.status === "past" ? "Showcases" : "Date"}</dt>
            <dd>{session.status === "past" ? session.showcases.length : "To be announced"}</dd>
          </div>
        </dl>
      </div>

      {session.showcases.length === 0 ? (
        <p className="pf-empty-line">No showcases are listed yet.</p>
      ) : (
        <section aria-labelledby="cm-shown-title">
          <h2 id="cm-shown-title" className="cm-h2">
            Shown
          </h2>
          <ul className="cm-showcases">
            {session.showcases.map((item) => (
              <li key={item.title} data-track={trackSlug(item.track)}>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
                <p className="cm-meta">
                  <span className="cm-track">{item.track}</span>
                  <span>by {item.handle}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
