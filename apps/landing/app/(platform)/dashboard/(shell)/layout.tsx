import type { Metadata } from "next";
import { PlatformShell } from "@/app/_components/platform/PlatformShell";
import { PlatformNotice } from "@/app/_components/platform/PlatformNotice";
import { databaseConfigured } from "@/lib/platform/db";
import { readViewer } from "@/lib/platform/session";

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
  if (!(await readViewer())) {
    return (
      <PlatformNotice title="Opening soon">
        The participant platform opens once Hack Club Auth is connected.
      </PlatformNotice>
    );
  }
  return <PlatformShell>{children}</PlatformShell>;
}
