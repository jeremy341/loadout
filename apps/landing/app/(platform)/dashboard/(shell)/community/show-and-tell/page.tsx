import type { Metadata } from "next";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { SessionRow } from "@/app/_components/platform/community/SessionRow";
import { SampleNote } from "@/app/_components/platform/community/Parts";
import { NEXT_SESSION_LINE, pastSessions, upcomingSessions } from "@/lib/platform/community";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Show & Tell - LOADOUT" };

// Show & Tell, after Pixl's rounds: sessions where builders present a project. No session here has a confirmed date or
// place, so an upcoming one says its date is to be announced. Past sessions are sample recaps.
export default async function ShowAndTellPage() {
  await requireViewer();
  const upcoming = upcomingSessions();
  const past = pastSessions();

  return (
    <>
      <CommunityHead title="Show & Tell">Sessions where builders show a project they have worked on.</CommunityHead>
      <SampleNote>Show &amp; Tell is proposed. The recaps below are invented samples, and no session has a confirmed date or place.</SampleNote>

      <section className="pf-box cm-next" aria-labelledby="cm-next-title">
        <h2 id="cm-next-title">Upcoming</h2>
        <p className="cm-next-line">{NEXT_SESSION_LINE}</p>
        <ul className="cm-sessions">
          {upcoming.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
        <p className="cm-closed">Showcase sign-up opens with the community release. Nothing here is saved.</p>
        <button type="button" className="pf-btn" disabled>
          Offer a showcase
        </button>
      </section>

      <section className="cm-plain" aria-labelledby="cm-past-title">
        <h2 id="cm-past-title" className="cm-h2">
          Past sessions
        </h2>
        <ul className="cm-sessions cm-sessions-ruled">
          {past.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      </section>
    </>
  );
}
