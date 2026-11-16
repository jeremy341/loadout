import { requirePage } from "@/reviewer-dash/lib/guard";
import { getStaffSettings } from "@/reviewer-dash/lib/db";
import { PageHeader } from "@/reviewer-dash/app/_ui/ui";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const access = await requirePage("staff");
  const settings = await getStaffSettings(access.session.slackId);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" description="Your display and review preferences. They are kept for your handle until the server restarts." />
      <SettingsClient initial={settings} account={{ name: access.session.name, slackId: access.session.slackId }} canEditReviewMacros={access.isReviewer || access.isOwner} />
    </div>
  );
}
