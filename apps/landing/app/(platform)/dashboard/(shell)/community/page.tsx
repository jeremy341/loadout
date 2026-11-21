import type { Metadata } from "next";
import Link from "next/link";
import { EraStrip } from "@/app/_components/platform/community/EraStrip";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { PreviewHead } from "@/app/_components/platform/community/Parts";
import { GoalBar } from "@/app/_components/platform/community/GoalBar";
import { COMMUNITY_HOME, NEXT_SESSION_LINE, pastSessions, topIdeas, upcomingSessions } from "@/lib/platform/community";
import { leaderboard, listNews, openGoals } from "@/lib/platform/community-data";
import { relativeTime } from "@/lib/platform/explore-feed";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Community - LOADOUT" };

// The Community hub: the Era, then a short look at each page that owns a full list. Three rows at most in each preview, no
// feed and no reposts. Goals, news and the leaderboard are read from the database; the Era strip and the idea board and
// Show & Tell are still proposed content, and each says so where it appears.
export default async function CommunityPage() {
  await requireViewer();
  const [board, news, goals] = await Promise.all([leaderboard("week"), listNews(3), openGoals()]);
  const boards = board.rows.slice(0, 3);
  const recent = pastSessions().slice(0, 2);
  const ideas = topIdeas(3);
  const next = upcomingSessions()[0];

  return (
    <>
      <CommunityHead title="Community">Where builders meet: the Era, Show &amp; Tell, the idea board, news, the leaderboard and shared goals.</CommunityHead>

      <EraStrip />

      {goals.length > 0 ? (
        <section className="pf-box cm-refer" aria-labelledby="cm-goals-title">
          <PreviewHead id="cm-goals-title" title="Community goals" href={`${COMMUNITY_HOME}/goals`} />
          <ul className="cm-mini">
            {goals.slice(0, 2).map((goal) => (
              <li key={goal.id}>
                <span className="cm-mini-kind">Goal</span>
                <div>
                  <p className="cm-mini-text">
                    <Link href={`${COMMUNITY_HOME}/goals`}>{goal.title}</Link>
                  </p>
                  <GoalBar goal={goal} compact />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
          <p className="pf-muted pf-box-note">Show &amp; Tell is still a proposal: these sessions are samples.</p>
        </section>

        <section className="pf-box" aria-labelledby="cm-lb-title">
          <PreviewHead id="cm-lb-title" title="Leaderboard" href={`${COMMUNITY_HOME}/leaderboard`} />
          <ol className="cm-mini" aria-label="Top builders this week by approved hours, all tracks">
            {boards.map((row) => (
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
            {boards.length === 0 ? <li className="cm-mini-kind">No builder has approved hours on the board yet.</li> : null}
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
          <p className="pf-muted pf-box-note">The idea board is still a proposal: these ideas and votes are samples.</p>
        </section>

        <section className="pf-box" aria-labelledby="cm-news-title">
          <PreviewHead id="cm-news-title" title="Latest news" href={`${COMMUNITY_HOME}/news`} />
          <ul className="cm-mini">
            {news.map((item) => (
              <li key={item.id}>
                <span className="cm-mini-kind">{relativeTime(item.publishedAt)}</span>
                <Link href={`${COMMUNITY_HOME}/news`}>{item.title}</Link>
              </li>
            ))}
            {news.length === 0 ? <li className="cm-mini-kind">No news yet.</li> : null}
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
