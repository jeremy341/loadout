import { requirePage } from "@/reviewer-dash/lib/guard";
import { getStaffSettings } from "@/reviewer-dash/lib/db";
import { PageHeader } from "@/reviewer-dash/app/_ui/ui";
import { listFlagRows } from "./flag-rows";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const access = await requirePage("staff");
  const settings = await getStaffSettings(access.session.slackId);
  // The Flags section is for owners only: the write action (setFlagState) is owner-only on the server, so nothing is shown to a
  // role that could not use it. Everyone else gets the page they had, with no flag rows loaded.
  const flags = access.isOwner ? await listFlagRows() : null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" description="Your display and review preferences. They are kept for your handle until the server restarts." />
      <SettingsClient initial={settings} account={{ name: access.session.name, slackId: access.session.slackId }} canEditReviewMacros={access.isReviewer || access.isOwner} flags={flags} />
    </div>
  );
}
