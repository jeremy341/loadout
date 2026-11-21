import type { Metadata } from "next";
import Link from "next/link";
import { AccessibilitySettings } from "@/app/_components/Accessibility";
import { ConnectionPlaceholder } from "@/app/_components/platform/ConnectionPlaceholder";
import { ApiKeysSection, type KeyRowView, type ScopeInfo } from "@/app/_components/platform/ApiKeysSection";
import { PageHead } from "@/app/_components/platform/PageHead";
import { PrivacySection } from "@/app/_components/platform/PrivacySection";
import { API_SCOPES, MAX_ACTIVE_KEYS } from "@/lib/platform/api-keys";
import { listApiKeys } from "@/lib/platform/api-keys-data";
import { db } from "@/lib/platform/db";
import { erasureStatus } from "@/lib/platform/privacy-data";
import { eligibilityFor } from "@/lib/platform/eligibility-gate";
import { eligibilityMessage } from "@/lib/platform/eligibility";
import { hcaConfig } from "@/lib/platform/hca";
import { getOwnProfile } from "@/lib/platform/profile-data";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Settings - LOADOUT" };

const SCOPE_INFO: Record<string, { label: string; meaning: string }> = {
  profile: { label: "Profile", meaning: "Your name, handle and bio." },
  projects: { label: "Projects", meaning: "Your projects and their status." },
  journal: { label: "Journal", meaning: "Your journal entries." },
  hours: { label: "Hours", meaning: "Your tracked and approved hours." },
  ledger: { label: "Ledger", meaning: "Your Ore balance and what moved it." },
  activity: { label: "Activity", meaning: "Your day by day activity." },
  export: { label: "Export", meaning: "Everything above as one file." },
  stats: { label: "Stats", meaning: "Your totals, levels and streaks." },
};

const date = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function SettingsPage() {
  const viewer = await requireViewer();
  const profile = await getOwnProfile(viewer.id);
  const eligibility = await eligibilityFor(viewer);
  const connected = hcaConfig() !== null;
  const now = new Date();
  const [keyList, person, erasure] = await Promise.all([
    listApiKeys(viewer.id, now),
    db().person.findUnique({ where: { id: viewer.id }, select: { statsVisible: true } }),
    erasureStatus(viewer.id),
  ]);
  const keys: KeyRowView[] = [
    ...keyList.filter((k) => k.status === "active"),
    ...keyList.filter((k) => k.status === "expired"),
    ...keyList.filter((k) => k.status === "revoked"),
  ].map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    scopes: k.scopes,
    created: date(k.createdAt),
    lastUsed: k.lastUsedAt ? date(k.lastUsedAt) : "never",
    expires: k.expiresAt ? date(k.expiresAt) : "never",
    state: k.status,
  }));
  const scopes: ScopeInfo[] = API_SCOPES.map((scope) => ({ scope, ...SCOPE_INFO[scope] }));

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
          <div className="pf-fact-wide">
            <dt>Eligibility</dt>
            <dd>{eligibilityMessage(eligibility)}</dd>
          </div>
        </dl>
        <p className="pf-lead">
          <Link href="/dashboard/profile">Edit profile</Link> to change your handle and bio. Other builders see them.
        </p>
        {connected ? (
          <p className="pf-lead">
            <a className="pf-fact-link" href="/api/auth/hackclub/start">Sign in again with Hack Club Auth</a> to refresh your birthday and verification.
          </p>
        ) : (
        <ConnectionPlaceholder
          name="Hack Club Auth"
          status="Not connected"
          reason="Your name and email come from a local test account. Signing in with your Hack Club account is not connected yet."
        >
          <button type="button" className="pf-btn pri" disabled>
            Sign in with Hack Club Auth
          </button>
        </ConnectionPlaceholder>
        )}
      </section>
      <section className="pf-section" aria-labelledby="display-heading">
        <h2 id="display-heading">Display</h2>
        <AccessibilitySettings layout="page" />
      </section>
      <section className="pf-section" aria-labelledby="keys-heading">
        <h2 id="keys-heading">API keys</h2>
        <ApiKeysSection keys={keys} scopes={scopes} activeCount={keyList.filter((k) => k.status === "active").length} max={MAX_ACTIVE_KEYS} />
      </section>
      <section className="pf-section" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Privacy</h2>
        <PrivacySection statsVisible={person?.statsVisible ?? false} handle={profile?.handle ?? ""} scheduledFor={erasure ? date(erasure.scheduledFor) : null} />
      </section>
    </>
  );
}
