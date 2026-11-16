import type { Metadata } from "next";
import Link from "next/link";
import { AccessibilitySettings } from "@/app/_components/Accessibility";
import { PageHead } from "@/app/_components/platform/PageHead";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Settings - LOADOUT" };

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const profile = await getOwnProfile(viewer.id);

  return (
    <>
      <PageHead title="Settings">Your account details and the display settings used across LOADOUT.</PageHead>
      <section className="pf-section" aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        <dl className="pf-facts pf-facts-account">
          <div>
            <dt>Name</dt>
            <dd>{viewer.displayName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{viewer.email}</dd>
          </div>
          <div className="pf-fact-wide">
            <dt>Handle</dt>
            <dd>
              {profile?.handle ?? "Not chosen"}
              {profile?.handle ? null : (
                <>
                  {" "}
                  <Link className="pf-fact-link" href="/dashboard/profile">Choose one</Link>
                </>
              )}
            </dd>
          </div>
        </dl>
      </section>
      <section className="pf-section" aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        <p className="pf-lead">
          Your handle and bio. Other builders see them. <Link href="/dashboard/profile">Open Profile</Link>
        </p>
      </section>
      <section className="pf-section" aria-labelledby="referrals-heading">
        <h2 id="referrals-heading">Referrals</h2>
        <p className="pf-lead">
          Invite other builders and see how a referral counts. <Link href="/dashboard/referrals">Open Referrals</Link>
        </p>
      </section>
      <section className="pf-section" aria-labelledby="display-heading">
        <h2 id="display-heading">Display</h2>
        <AccessibilitySettings layout="page" />
      </section>
    </>
  );
}
