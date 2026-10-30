import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/platform/PlatformNotice";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Expeditions - LOADOUT" };

export default async function ExpeditionsPage() {
  await requireViewer();
  return (
    <>
      <h1>Expeditions</h1>
      <p className="pf-lead">Guided steps with configured rewards.</p>
      <EmptyState title="Opens in a later release">
        Expeditions open in a later release. None are available yet.
      </EmptyState>
    </>
  );
}
