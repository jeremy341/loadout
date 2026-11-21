import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPlain } from "@/app/_components/platform/PlatformNotice";
import { PlatformShell } from "@/app/_components/platform/PlatformShell";
import { PlatformThemeToggle } from "@/app/_components/platform/PlatformThemeToggle";
import { AccessibilityTab } from "@/app/_components/Accessibility";
import { docsViewer } from "@/app/docs/docs-viewer";
import { ledgerBalances } from "@/lib/platform/ledger-data";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { ReviewQueue } from "./ReviewQueue";
import "./queue.css";

export const metadata: Metadata = {
  title: "Review Queue | LOADOUT",
  description: "Find a project and see its position in the LOADOUT review queue.",
  alternates: { canonical: "/review-queue" },
};

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; queue?: string | string[] }>;
}) {
  const [params, viewer] = await Promise.all([searchParams, docsViewer()]);
  const content = (
    <ReviewQueue
      key={JSON.stringify([params.q, params.queue])}
      initialSearch={typeof params.q === "string" ? params.q : ""}
      initialQueue={params.queue === "hardware" ? "hardware" : "software"}
      visitor={!viewer}
    />
  );
  if (!viewer) {
    // A visitor has no sidebar, so the header carries the way onward. The Accessibility tab sits in the header row here, where it can
    // never cover the title or the first result; queue.css lays the row out.
    return (
      <PlatformPlain
        headerActions={<>
          <nav className="pf-rq-links" aria-label="LOADOUT">
            <Link href="/">Home</Link>
            <Link href="/docs">Docs</Link>
          </nav>
          <div className="pf-rq-tools">
            <AccessibilityTab />
            <PlatformThemeToggle />
          </div>
        </>}
      >
        {content}
      </PlatformPlain>
    );
  }
  const [{ confirmed, pending }, profile] = await Promise.all([ledgerBalances(viewer.id), getOwnProfile(viewer.id)]);
  return (
    <PlatformShell ore={confirmed} orePending={pending} handle={profile?.handle ?? null}>
      {content}
    </PlatformShell>
  );
}
