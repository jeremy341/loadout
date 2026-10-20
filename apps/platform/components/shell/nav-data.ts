// Structure adapted from Pixl's participant shell navigation
// (references/pixl/apps/web-shell/app/(shell)/nav-data.ts, MIT, Copyright (c) 2026 Pixl;
// notice kept in docs/source-audit/ATTRIBUTION.md). Pixl's PLAY / ECONOMY / YOU groups
// become Build / Community / Gear / You, its game tabs are removed and the tabs LOADOUT
// needs are added. Policy for each tab lives in the plan named in `policy`; this file
// only decides where a destination sits and what it is called.
//
// A tab is "preview" until its module reads real LOADOUT records. Preview tabs are fully
// working pages that run on sample data saved in the browser (see lib/preview-store.ts).
// Flip a tab to "live" only in the change that connects its real service.

export type NavStatus = "preview" | "live";

export interface NavItem {
  /** URL segment and icon name. Unique across the whole shell. */
  slug: string;
  /** One label per destination: the same text in the sidebar, the sheet and the page title. */
  label: string;
  /** One sentence shown under the page title. No dates, prices or counts. */
  purpose: string;
  status: NavStatus;
  /** Where the rules for this tab are owned (developer note, never rendered). */
  policy: string;
  /** Pixl tab this one descends from, if any (developer note, never rendered). */
  from?: string;
  /** Opens a page outside the platform (the public Docs). Rendered as a plain link. */
  external?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Build",
    items: [
      {
        slug: "overview",
        label: "Overview",
        purpose: "Your track levels, Seasons, achievements, approved projects, Ore and community progress in one place.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
        from: "dashboard",
      },
      {
        slug: "projects",
        label: "Projects",
        purpose: "Create projects, keep versions, attach evidence and submit ships for review.",
        status: "preview",
        policy: "plans/01 (participant and program rules)",
        from: "projects",
      },
      {
        slug: "journals",
        label: "Journals",
        purpose: "Write the journal entries that go with your build time. Each project needs one at least every eight hours of development.",
        status: "preview",
        policy: "plans/01",
      },
      {
        slug: "reviews",
        label: "Reviews",
        purpose: "Review other builders' ships, and read the anonymous scores and written reasons on your own.",
        status: "preview",
        policy: "plans/22 (peer review and multipliers)",
      },
      {
        slug: "missions",
        label: "Missions",
        purpose: "Guided missions with steps, prerequisites and review, plus seasonal quests.",
        status: "preview",
        policy: "plans/11 (Community Eras and missions)",
        from: "trials",
      },
      {
        slug: "docs",
        label: "Docs",
        purpose: "The program guides and rules.",
        status: "live",
        policy: "apps/landing /docs",
        external: true,
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        slug: "explore",
        label: "Explore",
        purpose: "Browse public projects and journals from other builders.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
        from: "explore",
      },
      {
        slug: "ideas",
        label: "Ideas",
        purpose: "A public idea board where builders post and upvote ideas.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
        from: "ideas",
      },
      {
        slug: "show-and-tell",
        label: "Show & Tell",
        purpose: "Present finished work to the community.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
      },
      {
        slug: "leaderboards",
        label: "Leaderboards",
        purpose: "Rankings across tracks and Seasons.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
      },
      {
        slug: "seasons",
        label: "Seasons",
        purpose: "Seasons and Community Eras, with progress toward shared goals.",
        status: "preview",
        policy: "plans/11",
        // Pixl's vault (GOALS) is a community-wide goal, so it informs this tab, not Wishlist.
        from: "vault (GOALS)",
      },
      {
        slug: "events",
        label: "Events",
        purpose: "RSVP to events and collect achievement certificates.",
        status: "preview",
        policy: "plans/15 (LOADOUT IRL)",
      },
      {
        slug: "friends",
        label: "Friends",
        purpose: "Follow builders and keep up with what they post.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
      },
    ],
  },
  {
    label: "Gear",
    items: [
      {
        slug: "shop",
        label: "Shop",
        purpose: "Spend Ore on gear. Prices are the same in every region; availability and delivery can differ.",
        status: "preview",
        policy: "plans/02 (economy and rewards)",
        from: "shop",
      },
      {
        slug: "wishlist",
        label: "Wishlist",
        purpose: "Save the items you want and see how close you are.",
        status: "preview",
        policy: "plans/02",
      },
      {
        slug: "orders",
        label: "Orders",
        purpose: "Your order history and the status of each order.",
        status: "preview",
        policy: "plans/02",
        from: "orders",
      },
      {
        slug: "collectibles",
        label: "Collectibles",
        purpose: "The collectibles you have earned.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
        from: "collectibles",
      },
      {
        slug: "referrals",
        label: "Referrals",
        purpose: "Invite builders. A referral counts once the builder verifies, logs real work and earns a first approved ship.",
        status: "preview",
        policy: "plans/02",
        from: "refers",
      },
      {
        slug: "ore-calculator",
        label: "Ore calculator",
        purpose: "Estimate Ore from your hours and a multiplier. It is an estimate: the final multiplier comes from peer review.",
        status: "preview",
        policy: "plans/02, plans/22",
        from: "calc",
      },
    ],
  },
  {
    label: "You",
    items: [
      {
        slug: "profile",
        label: "Profile",
        purpose: "Your builder profile, with the projects and journals you have made public.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
      },
      {
        slug: "achievements",
        label: "Achievements",
        purpose: "The achievements you have earned and what each one rewards.",
        status: "preview",
        policy: "plans/02, plans/11",
      },
      {
        slug: "notifications",
        label: "Notifications",
        purpose: "Likes, comments, reviews and order updates.",
        status: "preview",
        policy: "plans/proposals/future-platform-ui.md",
      },
      {
        slug: "account",
        label: "Account",
        purpose: "Hack Club verification, privacy and notification settings.",
        status: "preview",
        policy: "plans/01",
        from: "account",
      },
    ],
  },
];

/** What the phone dock shows without opening the MORE sheet. Same four as Pixl. */
export const MOBILE_PRIMARY = ["overview", "projects", "shop", "explore"];

/** Home of the shell: "/" redirects here. */
export const HOME_SLUG = "overview";

export const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function findItem(slug: string): NavItem | undefined {
  return ALL_ITEMS.find((item) => item.slug === slug);
}

/** Slugs that get a platform route. External tabs (Docs) link out instead. */
export const ROUTE_SLUGS: string[] = ALL_ITEMS.filter((item) => !item.external).map((item) => item.slug);
