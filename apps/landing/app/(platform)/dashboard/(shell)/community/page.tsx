import type { Metadata } from "next";
import Link from "next/link";
import { EraStrip } from "@/app/_components/platform/community/EraStrip";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { PreviewHead, SampleNote } from "@/app/_components/platform/community/Parts";
import { COMMUNITY_HOME, latestNews, leaderboardRows, NEXT_SESSION_LINE, pastSessions, topIdeas, upcomingSessions } from "@/lib/platform/community";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Community - LOADOUT" };

// The Community hub: the Era, then a short look at each page that owns a full list. Three rows at most in each preview, no
// feed and no reposts. Everything is a fixture of invented builders and proposed content.
export default async function CommunityPage() {
  await requireViewer();
  const next = upcomingSessions()[0];
  const recent = pastSessions().slice(0, 2);
  const ideas = topIdeas(3);
  const news = latestNews(3);
  const leaders = leaderboardRows({ range: "weekly", track: null }).slice(0, 3);

  return (
    <>
      <CommunityHead title="Community">Where builders meet: the Era, Show &amp; Tell, the idea board, news, the leaderboard and shared goals.</CommunityHead>
      <SampleNote>This section is proposed. The builders, hours, votes and sessions on these pages are invented samples and nothing is saved.</SampleNote>

      <EraStrip />

      <div className="cm-grid cm-grid-even">
        <section className="pf-box" aria-labelledby="cm-st-title">
          <PreviewHead id="cm-st-title" title="Show & Tell" href={`${COMMUNITY_HOME}/show-and-tell`} />
          <ul className="cm-mini">
            {next ? (
              <li>
                <span className="cm-mini-kind">Next</span>
                <Link href={`${COMMUNITY_HOME}/show-and-tell/${next.id}`}>{NEXT_SESSION_LINE}</Link>
              </li>
            ) : null}
            {recent.map((session) => (
              <li key={session.id}>
                <span className="cm-mini-kind">Session {session.number}</span>
                <Link href={`${COMMUNITY_HOME}/show-and-tell/${session.id}`}>{session.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="pf-box" aria-labelledby="cm-lb-title">
          <PreviewHead id="cm-lb-title" title="Leaderboard" href={`${COMMUNITY_HOME}/leaderboard`} />
          <ol className="cm-mini" aria-label="Top builders this week by approved hours, all tracks">
            {leaders.map((row) => (
              <li key={row.handle}>
                <span className="cm-mini-kind">
                  Rank {row.rank}
                  {row.tied ? ", tied" : ""}
                </span>
                <span className="cm-mini-text">
                  <span className="cm-handle-text">{row.handle}</span>
                  <span className="cm-num">{row.hours} H</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="cm-grid cm-grid-even">
        <section className="pf-box" aria-labelledby="cm-ideas-title">
          <PreviewHead id="cm-ideas-title" title="Top ideas" href={`${COMMUNITY_HOME}/ideas`} />
          <ul className="cm-mini">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <span className="cm-mini-kind">
                  {idea.votes} {idea.votes === 1 ? "vote" : "votes"}
                </span>
                <Link href={`${COMMUNITY_HOME}/ideas/${idea.id}`}>{idea.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="pf-box" aria-labelledby="cm-news-title">
          <PreviewHead id="cm-news-title" title="Latest news" href={`${COMMUNITY_HOME}/news`} />
          <ul className="cm-mini">
            {news.map((item) => (
              <li key={item.id}>
                <span className="cm-mini-kind">{item.kind}</span>
                <Link href={`${COMMUNITY_HOME}/news`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="pf-box cm-refer" aria-labelledby="cm-refer-title">
        <div className="pf-box-head">
          <h2 id="cm-refer-title">Referrals</h2>
          <Link href="/dashboard/referrals">
            Open<span className="pf-sr"> Referrals</span>
          </Link>
        </div>
        <p className="cm-closed">A referral counts a builder you invited once their first ship is approved. See how referrals will work.</p>
      </section>
    </>
  );
}
