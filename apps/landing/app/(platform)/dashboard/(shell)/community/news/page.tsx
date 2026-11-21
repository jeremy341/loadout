import type { Metadata } from "next";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { relativeTime } from "@/lib/platform/explore-feed";
import { listNews } from "@/lib/platform/community-data";
import { ANON_AUTHOR } from "@/lib/platform/comments";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "News - LOADOUT" };

// The date of a note, written out: the day in UTC, month and year, so no note needs a clock to read.
function newsDate(date: Date): string {
  return `${date.getUTCDate()} ${date.toLocaleString("en-GB", { month: "long", timeZone: "UTC" })} ${date.getUTCFullYear()}`;
}

// Programme notes from the team, newest first: one title, the note in full, the author's handle and the day it was
// published. This is a short list, not a feed; each note is whatever the team wrote, saved as it was written.
export default async function NewsPage() {
  await requireViewer();
  const items = await listNews();

  return (
    <>
      <CommunityHead title="News">Programme notes from the team, newest first.</CommunityHead>

      {items.length === 0 ? (
        <p className="pf-empty-line">No news yet. The team writes a note here whenever there is something to tell builders.</p>
      ) : (
        <ol className="cm-news">
          {items.map((item) => (
            <li key={item.id}>
              <span className="cm-news-kind">{newsDate(item.publishedAt)}</span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <p className="cm-mini-kind">
                  By {item.authorHandle ? item.authorHandle : ANON_AUTHOR} &middot; {relativeTime(item.publishedAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
