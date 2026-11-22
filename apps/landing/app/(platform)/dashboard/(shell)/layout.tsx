import type { Metadata } from "next";
import Link from "next/link";
import { AccessibilityTab } from "@/app/_components/Accessibility";
import { ImpersonationBanner } from "@/app/_components/platform/ImpersonationBanner";
import { PlatformShell } from "@/app/_components/platform/PlatformShell";
import { PlatformNotice, PlatformPlain } from "@/app/_components/platform/PlatformNotice";
import { databaseConfigured } from "@/lib/platform/db";
import { ledgerBalances } from "@/lib/platform/ledger-data";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { readViewer } from "@/lib/platform/session";

// The shell depends on the server's configuration (DATABASE_URL, the signed-in viewer). Without this, Next prerenders the
// shell during the CI build, where the database is not configured, and serves that frozen "not connected" page on every deploy.
export const dynamic = "force-dynamic";

// Participant pages are private and never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PlatformShellLayout({ children }: { children: React.ReactNode }) {
  if (!databaseConfigured()) {
    return (
      <PlatformNotice title="Not connected">
        This environment has no database, so the participant platform cannot load. Set DATABASE_URL to run it locally.
      </PlatformNotice>
    );
  }
  const viewer = await readViewer();
  if (!viewer) {
    return (
      <PlatformPlain accessibility={<AccessibilityTab />}>
        <h1>Sign in to continue</h1>
        <p className="pf-lead">The participant platform uses your Hack Club account.</p>
        <Link className="pf-btn pri" href="/dashboard/sign-in">
          Go to sign-in
        </Link>
      </PlatformPlain>
    );
  }
  const [{ confirmed, pending }, profile] = await Promise.all([ledgerBalances(viewer.id), getOwnProfile(viewer.id)]);
  return (
    <PlatformShell ore={confirmed} orePending={pending} handle={profile?.handle ?? null}>
      <ImpersonationBanner />
      {children}
    </PlatformShell>
  );
}
