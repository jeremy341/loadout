// The participant sidebar: four small groups of links, the same for everyone. Build includes Projects and the public Review Queue (Overview is gone: /dashboard
// goes to Projects). Expeditions sits under Shop and Ledger under Me. Community sits under Discover and owns every page
// under its own address (the tab row on those pages is its own). Referrals is left out for now. Orders, Profile and Settings are
// also in the account menu at the top right.
// There is no staff group, ever: reviewer and admin pages are a separate site on their own host (see lib/reviewer/host.ts).
export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; links: readonly NavItem[] };

export const SIDEBAR_GROUPS: readonly NavGroup[] = [
  {
    label: "Build",
    links: [
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/review-queue", label: "Review Queue" },
    ],
  },
  {
    label: "Discover",
    links: [
      { href: "/dashboard/explore", label: "Explore" },
      { href: "/dashboard/ideas", label: "Ideas" },
      { href: "/dashboard/community", label: "Community" },
      { href: "/docs/start", label: "Docs" },
    ],
  },
  {
    label: "Shop",
    links: [
      { href: "/dashboard/shop", label: "Shop" },
      { href: "/dashboard/shop/expeditions", label: "Expeditions" },
      { href: "/dashboard/orders", label: "Orders" },
    ],
  },
  {
    label: "Me",
    links: [
      { href: "/dashboard/profile", label: "Profile" },
      { href: "/dashboard/ledger", label: "Ledger" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
  },
];

export const SIDEBAR_LINKS: readonly NavItem[] = SIDEBAR_GROUPS.flatMap((group) => group.links);

export const ACCOUNT_MENU: readonly NavItem[] = [
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/ledger", label: "Ledger" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/referrals", label: "Referrals" },
  { href: "/dashboard/settings", label: "Settings" },
];

// Pages a link owns beyond its own address. A track page belongs to Projects, a builder page to Explore. Docs owns the whole public
// documentation. The longest matching address wins, so Expeditions (under Shop) is its own link.
const OWNS: Record<string, readonly string[]> = {
  "/dashboard/projects": ["/dashboard/projects", "/dashboard/tracks"],
  "/dashboard/explore": ["/dashboard/explore", "/dashboard/builders"],
  "/dashboard/community": ["/dashboard/community"],
  "/docs/start": ["/docs"],
};

function under(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + "/");
}

// The sidebar link that is current for a path, or null when no link owns it (Referrals).
export function currentLink(pathname: string): NavItem | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  let best: { item: NavItem; size: number } | null = null;
  for (const item of SIDEBAR_LINKS) {
    for (const base of OWNS[item.href] ?? [item.href]) {
      if (under(path, base) && (!best || base.length > best.size)) best = { item, size: base.length };
    }
  }
  return best?.item ?? null;
}

export function isLinkCurrent(pathname: string, href: string): boolean {
  return currentLink(pathname)?.href === href;
}

// Old addresses and where they go. The routes answer these with a permanent redirect. The Overview page is gone, so /dashboard
// goes to Projects.
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/dashboard": "/dashboard/projects",
  "/dashboard/expeditions": "/dashboard/shop/expeditions",
};

// The new address for an old one, or null when the path is not an old address. A mission page keeps its id.
export function legacyTarget(pathname: string): string | null {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const direct = LEGACY_REDIRECTS[trimmed];
  if (direct) return direct;
  if (trimmed.startsWith("/dashboard/expeditions/")) return "/dashboard/shop/expeditions/" + trimmed.slice("/dashboard/expeditions/".length);
  return null;
}

// Pages that open bare, with no sidebar and no top bar: the project creation wizard (a focus task with its own Close control).
const BARE_PATHS: readonly string[] = ["/dashboard/projects/new"];
export function isBarePath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return BARE_PATHS.includes(path);
}

export function reviewQueueHref(projectNumber: number, hardware: boolean): string {
  const params = new URLSearchParams({ q: `#${projectNumber}` });
  if (hardware) params.set("queue", "hardware");
  return `/review-queue?${params}`;
}
