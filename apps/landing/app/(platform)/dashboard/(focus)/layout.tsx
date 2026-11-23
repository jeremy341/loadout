import Link from "next/link";
import { FocusFrame } from "@/app/_components/platform/FocusFrame";
import { PlatformNotice } from "@/app/_components/platform/PlatformNotice";
import { databaseConfigured } from "@/lib/platform/db";
import { readViewer } from "@/lib/platform/session";

// Focused task pages (the project wizard). They sit outside the shell, so they draw no sidebar and no topbar. The same
// viewer and database checks as the shell apply, so a signed-out visitor never reaches the task.
// The shell depends on the server's configuration, so this layout renders on each request too (see the shell layout).
export const dynamic = "force-dynamic";

export default async function FocusLayout({ children }: { children: React.ReactNode }) {
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
      <FocusFrame>
        <h1>Sign in to continue</h1>
        <p className="pf-lead">The participant platform uses your Hack Club account.</p>
        <Link className="pf-btn pri" href="/dashboard/sign-in">
          Go to sign-in
        </Link>
      </FocusFrame>
    );
  }
  return <FocusFrame>{children}</FocusFrame>;
}
