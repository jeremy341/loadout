import type { Metadata } from "next";
import Link from "next/link";
import { EraHero } from "@/app/_components/platform/community/EraHero";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Community - LOADOUT" };

// The Community hub is the Era, and nothing else: the hero with its progress. Show & Tell, ideas, news, goals, the leaderboard and
// events each have their own tab, and how points and the Era bonus work is written once in the documentation. The Era numbers are
// sample content, labelled once by the line under the page title.
export default async function CommunityPage() {
  await requireViewer();
  return (
    <>
      <CommunityHead title="Community" era={false}>
        Where builders move the Era forward together.
      </CommunityHead>

      <div className="cm-era-block">
        <EraHero />
      </div>

      <p className="cm-closed">
        <Link href="/docs/eras">How Eras work</Link>
      </p>
    </>
  );
}
