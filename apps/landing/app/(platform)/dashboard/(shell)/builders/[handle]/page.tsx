import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/app/_components/platform/ProfileView";
import { getProfileByHandle } from "@/lib/platform/profile-data";
import { builderRedirect, isLegacyProfileTab } from "@/lib/platform/profile-view";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Builder - LOADOUT" };

// Another builder's public profile, by handle. An unknown handle, a person without one and a banned person are all the same
// plain 404. Your own handle goes to your own profile, and a mixed-case address goes to the lower-case one.
export default async function BuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const { handle: param } = await params;
  let raw: string;
  try {
    raw = decodeURIComponent(param);
  } catch {
    notFound();
  }
  const person = await getProfileByHandle(raw.toLowerCase());
  if (!person) notFound();

  const rawTab = (await searchParams).tab;
  const redirectTo = builderRedirect(viewer.id, person.id, raw, person.handle);
  if (redirectTo === "own") redirect("/dashboard/profile");
  if (redirectTo === "lower") redirect(`/dashboard/builders/${person.handle}`);
  // The Journal and Toolbelt tabs are gone; their old links go to the bare profile.
  if (isLegacyProfileTab(rawTab)) redirect(`/dashboard/builders/${person.handle}`);

  return <ProfileView person={person} own={false} />;
}
