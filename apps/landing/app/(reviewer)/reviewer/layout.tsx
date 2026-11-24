import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/reviewer-dash/app/_ui/admin.css";
import "@/reviewer-dash/app/_ui/themes.css";
import "@/reviewer-dash/app/reviewer-root.css";
import { ReviewerNotice } from "@/app/_components/reviewer/ReviewerShell";
import ThemeToggle from "@/reviewer-dash/app/_ui/ThemeToggle";
import { databaseConfigured } from "@/lib/platform/db";
import { PREVIEW_COOKIE, readViewer, viewAsRoleKey } from "@/lib/platform/session";
import { PREVIEW_ACCOUNTS, localTestAccountsEnabled } from "@/lib/platform/local-accounts";
import { isReviewHost } from "@/lib/reviewer/host";
import { getAccess } from "@/reviewer-dash/lib/guard";
import { sampleShipsOn } from "@/reviewer-dash/lib/real";
import { countPendingByKind, countReviewTabs, getStaffSettings } from "@/reviewer-dash/lib/db";
import TopNav from "@/reviewer-dash/app/_ui/TopNav";
import CommandPalette from "@/reviewer-dash/app/_ui/CommandPalette";
import Tooltips from "@/reviewer-dash/app/_ui/Tooltips";
import ThemeBridge from "@/reviewer-dash/app/_ui/ThemeBridge";
import ViewAs from "@/reviewer-dash/app/_ui/ViewAs";
import SampleDataInfo from "@/reviewer-dash/app/_ui/SampleDataInfo";
import { buildNav } from "@/reviewer-dash/app/_ui/nav";
import type { AdminAccess } from "@/reviewer-dash/lib/roles";
import { Icon, Mono } from "@/reviewer-dash/app/_ui/ui";

// The reviewer site is staff-only and never indexed. The proxy already answers 404 for /reviewer on other hosts; the host is checked
// again here so the tree stays closed even if the proxy is bypassed or misconfigured.
// This is Pixl's app/layout.tsx, with the <html> and <body> left to LOADOUT's root layout (see ThemeBridge) and the Slack and
// Pixl-only parts removed. See reviewer-dash/ADJUSTMENTS.md.
export const metadata: Metadata = {
  title: { default: "LOADOUT Review", template: "%s - LOADOUT Review" },
  robots: { index: false, follow: false },
};

// Badge counts in the top bar. Each is best effort: a slow or failing count must never take the whole dashboard down with it.
// The review count is the viewer's own queue (a hardware-only reviewer is never shown the software count). A viewer who can open both
// queues gets the two added together, and the label says so: the queue page lists one queue at a time, so a bare "39" would read as
// a contradiction beside its "29". The other counts (open reports, tickets, orders to fulfil) show only where the role can open the
// page, from the same lists the pages use.
async function navCounts(access: AdminAccess) {
  const counts: Record<string, number> = {};
  const labels: Record<string, string> = {};
  if (access.isOwner || access.isReviewer) {
    if (access.reviewQueues === "both") {
      const by = await countPendingByKind();
      counts["/review"] = by.software + by.hardware;
      labels["/review"] = `${counts["/review"]} ships waiting for first review: ${by.software} software and ${by.hardware} hardware`;
    } else {
      counts["/review"] = (await countReviewTabs(access.reviewQueues)).pending;
      labels["/review"] = `${counts["/review"]} ${access.reviewQueues} ships waiting for first review`;
    }
  }
  return { counts, labels };
}

async function navCountsSafe(access: AdminAccess) {
  // A failed count must never take the dashboard down. It also must not stream the layout: a page that then calls notFound() or
  // redirect() has to set the real HTTP status, not a 200 with a meta refresh. So counts are awaited before any markup is sent.
  try {
    return await navCounts(access);
  } catch {
    return { counts: {}, labels: {} } as { counts: Record<string, number>; labels: Record<string, string> };
  }
}

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  if (!isReviewHost((await headers()).get("host"))) notFound();
  if (!databaseConfigured()) {
    return (
      <ReviewerNotice title="Not connected">
        This environment has no database, so the reviewer site cannot load. Set DATABASE_URL to run it locally.
      </ReviewerNotice>
    );
  }
  // Anonymous visitors get the same plain 404 as anyone without a role: no "coming soon" page that advertises the site.
  const viewer = await readViewer();
  if (!viewer) notFound();
  // Everyone else gets the plain 404, so the site does not advertise itself. Each page checks staff again.
  const access = await getAccess();
  if (!access) notFound();

  const session = access.session;
  const nav = buildNav(access);
  // Everything the shell needs is resolved before the first byte is written. No Suspense boundary here: once the shell streams,
  // a page's 404/307 turns into a 200 with a meta refresh, which hides a denied page's real status from clients.
  const [{ counts, labels }, settings] = await Promise.all([navCountsSafe(access), getStaffSettings(session.slackId)]);
  const firstName = session.name.split(" ")[0] || "Staff";
  // Development only: the "View as" menu exists only while local test accounts are on (never in production).
  const viewAs = localTestAccountsEnabled();
  const chosen = viewAs ? ((await cookies()).get(PREVIEW_COOKIE)?.value ?? process.env.LOADOUT_PREVIEW_ROLE) : "";
  // An unknown role signs the reader out; the menu says so rather than showing a builder or the owner they are not.
  const viewAsCurrent = viewAs ? viewAsRoleKey(chosen) : "";

  return (
    <div className="reviewer-root">
      <ThemeBridge theme={settings.theme} accent={settings.accent} font={settings.font} monoFont={settings.monoFont} density={settings.compact ? "compact" : "normal"} />
      <div className="admin-shell">
        <Tooltips />
        <header className="hc-topbar sticky top-0 z-20">
          <div className="hc-topbar-inner mx-auto flex min-h-14 max-w-[1840px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-2">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="hc-heading">LOADOUT Review</span>
            </Link>
            <TopNav nav={nav} counts={counts} countLabels={labels} />
            <div className="flex min-w-48 flex-1 justify-center">
              <CommandPalette nav={nav} />
            </div>
            <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-3">
              <span className="hidden text-sm 2xl:inline">
                <span className="font-bold">{firstName}</span>{" "}
                <span className="hc-muted">
                  (<Mono>{session.slackId}</Mono>)
                </span>
              </span>
              {viewAs && (
                <ViewAs
                  options={[{ key: "signed-out", label: "Signed out" }, ...PREVIEW_ACCOUNTS.map(({ key, label }) => ({ key, label }))]}
                  current={viewAsCurrent}
                />
              )}
              {/* Only where sample records can exist (local test accounts, development). Each page's own data note still says where its data lives. */}
              {sampleShipsOn() && <SampleDataInfo />}
              <ThemeToggle />
              <Link href="/settings" className="hc-btn hc-btn-ghost hc-btn-sm hc-btn-icon" title="Settings" aria-label="Settings">
                <Icon glyph="settings" size={20} />
              </Link>
              <form method="post" action="/api/auth/signout">
                <button type="submit" className="hc-btn hc-btn-ghost hc-btn-sm" title="Sign out" aria-label="Sign out">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="hc-main mx-auto max-w-[1840px] px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
