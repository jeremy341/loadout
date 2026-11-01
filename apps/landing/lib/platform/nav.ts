// The top-level tabs. Overview and Projects are live in M1; the rest are placeholders until their milestone lands. Docs
// leaves the dashboard for the public documentation, which the platform has no other link to.
// Settings is not a tab: it is reached from the account controls in the top bar. The You tab waits for the
// character icon design. Ship lives inside Projects.
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

export const STAFF_NAV: NavGroup = {
  label: "Staff",
  items: [
    { href: "/dashboard/staff/users", label: "Users" },
    { href: "/dashboard/staff/audit", label: "Audit log" },
    { href: "/dashboard/staff/flags", label: "Feature flags" },
  ],
};

export function navFor(isStaff: boolean): NavGroup[] {
  return isStaff ? [...PARTICIPANT_NAV, STAFF_NAV] : PARTICIPANT_NAV;
}
