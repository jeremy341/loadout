import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/platform/PlatformNotice";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Community - LOADOUT" };

export default async function CommunityPage() {
  await requireViewer();
  return (
    <>
      <h1>Community</h1>
      <p className="pf-lead">The idea board, Show and Tell, events and follows.</p>
      <EmptyState title="Opens in a later release">
        Community features open after projects and profiles are live.
      </EmptyState>
    </>
  );
}
