import type { Metadata } from "next";
import { AccessibilitySettings } from "@/app/_components/Accessibility";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Settings - LOADOUT" };

export default async function SettingsPage() {
  const viewer = await requireViewer();

  return (
    <>
      <h1 className="pf-sr">Settings</h1>
      <p className="pf-lead">Your account details and the display settings used across LOADOUT.</p>
      <section className="pf-section" aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        <dl className="pf-facts">
          <div>
            <dt>Name</dt>
            <dd>{viewer.displayName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{viewer.email}</dd>
          </div>
        </dl>
      </section>
      <section className="pf-section" aria-labelledby="display-heading">
        <h2 id="display-heading">Display</h2>
        <AccessibilitySettings layout="page" />
      </section>
    </>
  );
}
