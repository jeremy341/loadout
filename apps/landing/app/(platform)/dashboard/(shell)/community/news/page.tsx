import type { Metadata } from "next";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { SampleNote } from "@/app/_components/platform/community/Parts";
import { latestNews } from "@/lib/platform/community";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "News - LOADOUT" };

// Program announcements, newest first, one short note each. They state no dates, event details or prices, because none of
// those are confirmed. This is a short list, not a feed.
export default async function NewsPage() {
  await requireViewer();
  const items = latestNews(50);

  return (
    <>
      <CommunityHead title="News">Short program notes, newest first.</CommunityHead>
      <SampleNote>News is proposed. These notes are invented samples and state nothing that is confirmed.</SampleNote>

      <ol className="cm-news">
        {items.map((item) => (
          <li key={item.id}>
            <span className="cm-news-kind">{item.kind}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
