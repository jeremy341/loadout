// The top-level tabs: seven, and the same for everyone. Events lives inside Community, Referrals is reached from Settings and the
// Community hub, and Orders and the wishlist are reached from the Shop. Docs leaves the dashboard for the public documentation,
// which the platform has no other link to. Settings is not a tab: it is reached from the account controls in the top bar.
// There is no staff group, ever: reviewer and admin pages are a separate site on their own host (see lib/reviewer/host.ts).
export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

export const PARTICIPANT_NAV: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/dashboard/shop", label: "Shop" },
      { href: "/dashboard/explore", label: "Explore" },
      { href: "/dashboard/community", label: "Community" },
      { href: "/dashboard/expeditions", label: "Expeditions" },
      { href: "/docs/start", label: "Docs" },
    ],
  },
];
