import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalWriter } from "@/app/_components/platform/JournalWriter";
import { loadWriter } from "@/lib/platform/journal-writer-data";
import { requireViewer } from "@/lib/platform/session";
import { uploadsEnabled } from "@/lib/platform/uploads";

export const metadata: Metadata = { title: "New journal entry - LOADOUT" };

// The full page journal writer for a new entry. Only the project's owner can open it; any other id is a plain 404.
export default async function NewJournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const data = await loadWriter(viewer.id, id);
  if (!data) notFound();
  return <JournalWriter data={{ ...data, entry: null }} uploadsOn={uploadsEnabled()} />;
}
