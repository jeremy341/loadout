import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/platform/PlatformNotice";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Explore - LOADOUT" };

export default async function ExplorePage() {
  await requireViewer();
  return (
    <>
      <h1 className="pf-sr">Explore</h1>
      <p className="pf-lead">Public projects from other builders.</p>
      <EmptyState title="Opens in a later release">
        Public project pages open once projects can be shipped. There are no projects to browse yet.
      </EmptyState>
    </>
  );
}
