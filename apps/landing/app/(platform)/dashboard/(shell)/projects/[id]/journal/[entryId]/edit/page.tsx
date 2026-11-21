import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalWriter } from "@/app/_components/platform/JournalWriter";
import { loadWriter } from "@/lib/platform/journal-writer-data";
import { requireViewer } from "@/lib/platform/session";
import { uploadsEnabled } from "@/lib/platform/uploads";

export const metadata: Metadata = { title: "Edit journal entry - LOADOUT" };

// The same writer, filled in with one entry. Only the owner can open it.
export default async function EditJournalEntryPage({ params }: { params: Promise<{ id: string; entryId: string }> }) {
  const viewer = await requireViewer();
  const { id, entryId } = await params;
  const data = await loadWriter(viewer.id, id, entryId);
  if (!data || !data.entry) notFound();
  return <JournalWriter data={data} uploadsOn={uploadsEnabled()} />;
}
