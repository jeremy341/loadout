"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CountBadge } from "@/reviewer-dash/app/_ui/ui";

export function ReviewTabs({
  isSuper,
  canSecondPass,
  canFraudReview,
  fraudOnly,
  pending,
  secondPassCount,
  proposedBanCount,
  queues,
  queueScope,
}: {
  isSuper: boolean;
  /** Owners and final reviewers (second_pass) work the Second pass queue. */
  canSecondPass: boolean;
  canFraudReview: boolean;
  fraudOnly: boolean;
  pending?: number;
  secondPassCount?: number;
  proposedBanCount?: number;
  /** Ships waiting per queue, for a viewer who can open both. The Needs review badge follows the queue the page lists. */
  queues?: { software: number; hardware: number };
  /** The queue the badge counts when the viewer is limited to one. */
  queueScope?: "software" | "hardware" | "both";
}) {
  const pathname = usePathname();
  const kind = useSearchParams().get("kind") === "hardware" ? "hardware" : "software";
  const pendingLabel = queues
    ? `${queues[kind]} ${kind} ships waiting for first review. ${queues.software + queues.hardware} across both queues`
    : pending !== undefined && queueScope && queueScope !== "both"
      ? `${pending} ${queueScope} ships waiting for first review`
      : undefined;
  // An integrity reviewer sees the Integrity reviews tab and nothing else.
  const tabs: { href: string; label: string; count?: number; title?: string }[] = fraudOnly
    ? []
    : [
        { href: "/review", label: "Needs review", count: queues ? queues[kind] : pending, title: pendingLabel },
        { href: "/review/reviewed", label: "Reviewed" },
        { href: "/review/stats", label: "Stats" },
      ];
  if (canFraudReview) {
    // Ships with an AI-usage or double-dip flag.
    tabs.push({ href: "/review/fraud-reviews", label: "Integrity reviews" });
  }
  if (isSuper) {
    // A first-pass "ban" verdict is only a proposal (see reviewProject). It
    // sits in second_review like any other second-pass work, but is easy to
    // miss there, so it gets its own read-only tab.
    tabs.push({ href: "/review/proposed-bans", label: "Proposed bans", count: proposedBanCount });
  }
  if (canSecondPass) {
    tabs.push({ href: "/review/second-pass", label: "Second pass", count: secondPassCount, title: secondPassCount === undefined ? undefined : `${secondPassCount} ships waiting for a final review in the queues you can open` });
  }
  if (isSuper) {
    tabs.push({ href: "/review/log", label: "Reviewer log" });
    tabs.push({ href: "/review/audit", label: "Audit notes" });
  }
  // The guidelines gate only fires once per guidelines version, so this is
  // the way back in for anyone who skipped or wants a refresher.
  if (!fraudOnly) tabs.push({ href: "/review/guidelines", label: "Guidelines" });

  const active = activeTab(pathname, tabs.map((t) => t.href));

  return (
    <nav className="hc-tabs hc-tabs-fill hc-tabs-wrap mb-6" aria-label="Review sections">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className="hc-tab gap-2" aria-current={t.href === active ? "page" : undefined} title={t.title}>
          {t.label}
          {t.count ? <CountBadge>{t.count}</CountBadge> : null}
          {t.title && t.count ? <span className="sr-only">{t.title}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

/**
 * The tab a path belongs to. Sub-pages of a tab (/review/reviewed/anything) keep it current; the bare /review tab also owns the
 * project detail pages (/review/123) but nothing else under it, so /review/pay or /review/macros highlight no tab.
 */
export function activeTab(pathname: string | null, hrefs: string[]): string | undefined {
  if (!pathname) return undefined;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  let best: string | undefined;
  for (const href of hrefs) {
    const matches =
      href === "/review"
        ? path === href || /^\/review\/\d+(\/|$)/.test(path)
        : path === href || path.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.length)) best = href;
  }
  return best;
}
