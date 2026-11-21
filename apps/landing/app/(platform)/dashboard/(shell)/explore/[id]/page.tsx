import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProject } from "@/app/_components/platform/PublicProject";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Project - LOADOUT" };

// A public project, read only, after Stasis's public view (see PublicProject). Every project opens, drafts included (owner,
// 16 Nov 2026). Only a banned project, a banned builder or an unknown id is a plain 404.
export default async function ExploreProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const page = await PublicProject({ id, viewerId: viewer.id });
  if (!page) notFound();
  return page;
}
