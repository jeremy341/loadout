import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/app/_components/platform/ProfileView";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { parseProfileQuery } from "@/lib/platform/profile-view";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Profile - LOADOUT" };

// Your own profile: edit the handle and bio, see every project, pin and hide. A builder without a handle sees the prompt to
// choose one. The address keeps the status and track filter, so the list survives a reload.
export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireViewer();
  const person = await getOwnProfile(viewer.id);
  if (!person) notFound();
  const query = parseProfileQuery(await searchParams, true);
  return <ProfileView person={person} viewerId={viewer.id} query={query} own base="/dashboard/profile" />;
}
