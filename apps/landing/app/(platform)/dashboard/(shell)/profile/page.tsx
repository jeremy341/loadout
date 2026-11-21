import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/app/_components/platform/ProfileView";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { isLegacyProfileTab } from "@/lib/platform/profile-view";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Profile - LOADOUT" };

// Your own profile, copied from Stasis's profile page (two columns, no tabs). The old ?tab= links go to the bare profile. A builder without a handle sees the prompt to choose one.
export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireViewer();
  const person = await getOwnProfile(viewer.id);
  if (!person) notFound();
  const rawTab = (await searchParams).tab;
  if (isLegacyProfileTab(rawTab)) redirect("/dashboard/profile");
  return <ProfileView person={person} own />;
}
