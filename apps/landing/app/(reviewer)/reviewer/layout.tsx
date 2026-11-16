import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/reviewer-dash/app/_ui/admin.css";
import "@/reviewer-dash/app/_ui/themes.css";
import "@/reviewer-dash/app/reviewer-root.css";
import { ReviewerNotice } from "@/app/_components/reviewer/ReviewerShell";
import ThemeToggle from "@/reviewer-dash/app/_ui/ThemeToggle";
import { databaseConfigured } from "@/lib/platform/db";
import { PREVIEW_COOKIE, readViewer } from "@/lib/platform/session";
import { PREVIEW_ACCOUNTS, localTestAccountsEnabled } from "@/lib/platform/local-accounts";
import { isReviewHost } from "@/lib/reviewer/host";
import { getAccess } from "@/reviewer-dash/lib/guard";
import { countReviewTabs, getStaffSettings } from "@/reviewer-dash/lib/db";
import TopNav from "@/reviewer-dash/app/_ui/TopNav";
import CommandPalette from "@/reviewer-dash/app/_ui/CommandPalette";
import Tooltips from "@/reviewer-dash/app/_ui/Tooltips";
import ThemeBridge from "@/reviewer-dash/app/_ui/ThemeBridge";
import ViewAs from "@/reviewer-dash/app/_ui/ViewAs";
import { NOT_SAVED } from "@/reviewer-dash/lib/sample/store";
import { buildNav, type NavModel } from "@/reviewer-dash/app/_ui/nav";
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
// The review count is the viewer's own queue (a hardware-only reviewer is never shown the software count). The other counts
// (open reports, tickets, orders to fulfil) show only where the role can open the page, from the same lists the pages use.
async function navCounts(access: AdminAccess) {
  const scope = access.reviewQueues === "both" ? undefined : access.reviewQueues;
  const review = access.isOwner || access.isReviewer ? (await countReviewTabs(scope)).pending : 0;
  return { "/review": review };
}

async function TopNavWithCounts({ nav, access }: { nav: NavModel; access: AdminAccess }) {
  return <TopNav nav={nav} counts={await navCounts(access)} />;
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
  const viewer = await readViewer();
  if (!viewer) {
    return (
      <ReviewerNotice title="Opening soon">
        The reviewer site opens once Hack Club Auth is connected.
      </ReviewerNotice>
    );
  }
  // Everyone else gets the plain 404, so the site does not advertise itself. Each page checks staff again.
  const access = await getAccess();
  if (!access) notFound();

  const session = access.session;
  const nav = buildNav(access);
  const settings = await getStaffSettings(session.slackId);
  const firstName = session.name.split(" ")[0] || "Staff";
  // Development only: the "View as" menu exists only while local test accounts are on (never in production).
  const viewAs = localTestAccountsEnabled();
  const chosen = viewAs ? ((await cookies()).get(PREVIEW_COOKIE)?.value ?? process.env.LOADOUT_PREVIEW_ROLE ?? "builder") : "";
  const viewAsCurrent = PREVIEW_ACCOUNTS.some((account) => account.key === chosen) ? chosen : "owner";

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
            <Suspense fallback={<TopNav nav={nav} counts={{}} />}>
              <TopNavWithCounts nav={nav} access={access} />
            </Suspense>
            <div className="flex min-w-48 flex-1 justify-center">
              <CommandPalette nav={nav} />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-sm 2xl:inline">
                <span className="font-bold">{firstName}</span>{" "}
                <span className="hc-muted">
                  (<Mono>{session.slackId}</Mono>)
                </span>
              </span>
              {viewAs && <ViewAs options={PREVIEW_ACCOUNTS.map(({ key, label }) => ({ key, label }))} current={viewAsCurrent} />}
              <ThemeToggle />
              <Link href="/settings" className="hc-btn hc-btn-ghost hc-btn-sm hc-btn-icon" title="Settings" aria-label="Settings">
                <Icon glyph="settings" size={20} />
              </Link>
            </div>
          </div>
        </header>
        <p className="reviewer-sample-note">{NOT_SAVED} A change you make is kept in memory only and is gone when the server restarts.</p>
        <main className="hc-main mx-auto max-w-[1840px] px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
