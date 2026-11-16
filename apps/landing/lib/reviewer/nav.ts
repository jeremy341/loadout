import { queueAllows, satisfies, type Requirement, type ReviewerAccess } from "./access";
import { publicPath } from "./host";

// The reviewer site's navigation, a port of Pixl's internal dashboard nav (references/pixl/apps/internal-dashboard/app/_ui/
// nav.ts): a slim top bar with a few role-filtered primary links, then one "More" menu with a labelled section per group.
// Addresses are root-relative (the review host serves the Overview at "/", the queue at "/review").
//
// Every item carries its `requires`, the access its own page asks for with requireAccess in page.tsx. nav.test.ts reads the
// page files and checks the two agree, so the nav can never offer a page to a role the page then turns away. `show` is the
// finer rule for what is worth showing (an owner has Tickets under More, a helper has it in the bar); it never widens access.
//
// Fulfilment is spelled the British way here. Pixl writes /fulfillment; the LOADOUT site keeps /fulfilment (and /fulfillers,
// where Pixl's /fulfillers/[id] also uses two l). Everything else follows Pixl's paths, see .ulpi/design/reviewer-site.md.

export type NavItem = {
  href: string;
  label: string;
  requires: Requirement;
  /** Extra words the command palette matches. */
  words?: string;
  /** A finer display rule. Never grants access. */
  show?: (access: ReviewerAccess) => boolean;
  /** The review queue the page belongs to: a reviewer limited to the other queue does not see it. */
  queue?: "software" | "hardware";
};

// What buildNav hands to the (client) top bar: plain data only.
export type NavLink = { href: string; label: string; requires: Requirement };

export type NavGroupKey = "queues" | "shop" | "community" | "moderation" | "admin";
export type NavGroup = { key: NavGroupKey; label: string; items: NavItem[] };

export type NavModel = {
  primary: NavLink[];
  groups: { key: NavGroupKey; label: string; items: NavLink[] }[];
};

const owner = (access: ReviewerAccess) => access.isOwner;
const notOwner = (access: ReviewerAccess) => !access.isOwner;

// Owners get the everyday links; their queues sit under More. Helpers and fulfillers see so little that their queue is a
// direct link instead. A reviewer's own stats stand in for the Overview, which is the owner's.
export const PRIMARY_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Overview", requires: "owner" },
  { href: "/review/stats", label: "My stats", requires: "reviewer", show: notOwner },
  { href: "/review", label: "Review", requires: "reviewer" },
  { href: "/projects", label: "Projects", requires: "reviewer" },
  { href: "/players", label: "Builders", requires: "owner" },
  { href: "/tickets", label: "Tickets", requires: "helper", show: notOwner },
  { href: "/fulfilment", label: "Fulfilment", requires: "fulfiller", show: notOwner },
];

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: "queues",
    label: "Queues",
    items: [
      { href: "/tickets", label: "Tickets", requires: "helper", show: owner, words: "support help" },
      { href: "/fulfilment", label: "Fulfilment", requires: "fulfiller", show: owner, words: "orders pack post ship" },
    ],
  },
  {
    key: "shop",
    label: "Shop and money",
    items: [
      { href: "/budget", label: "Budget", requires: "owner", words: "money cost platform ore dollars" },
      { href: "/shop", label: "Shop", requires: "owner", words: "catalog items prices" },
      { href: "/events", label: "Events", requires: "owner", words: "show and tell" },
      { href: "/referrals", label: "Referrals", requires: "owner", words: "invite" },
    ],
  },
  {
    key: "community",
    label: "Community",
    items: [
      { href: "/expeditions", label: "Expeditions", requires: "owner", words: "missions challenges" },
      { href: "/community-goals", label: "Community goals", requires: "owner", words: "eras" },
      { href: "/show-n-tell", label: "Show & Tell", requires: "owner", words: "posts" },
    ],
  },
  {
    key: "moderation",
    label: "Moderation",
    items: [
      { href: "/reports", label: "Reports", requires: "owner", words: "flagged" },
      { href: "/violations", label: "Violations", requires: "owner", words: "warnings rules" },
      { href: "/bans", label: "Bans", requires: "owner" },
      { href: "/ideas", label: "Ideas", requires: "owner", words: "suggestions" },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    items: [
      { href: "/reviewers", label: "Reviewers", requires: "owner" },
      { href: "/admins", label: "Team and roles", requires: "owner", words: "admins staff helpers fulfillers owners" },
      { href: "/fulfillers", label: "Fulfillers", requires: "owner", words: "packers partners" },
      { href: "/notify", label: "Notify", requires: "owner", words: "notice message" },
      { href: "/forms", label: "Forms", requires: "owner", words: "applications" },
      { href: "/flags", label: "Flags", requires: "owner", words: "feature switches" },
      { href: "/audit", label: "Audit log", requires: "owner", words: "history events" },
      { href: "/review/macros", label: "Review macros", requires: "owner", words: "canned messages notes triggers track" },
      { href: "/review/pay", label: "Pay and perks", requires: "owner", words: "reviewer pay milestones rewards" },
      { href: "/review/erasure", label: "Erasure", requires: "owner", words: "delete remove data privacy" },
      { href: "/review/age-exceptions", label: "Age exceptions", requires: "owner", words: "nineteen over age policy justification" },
    ],
  },
];

// The Review area's own tab row (ReviewTabs draws it, with live counts, in Pixl's order). They are not in the top bar, but the
// command palette offers them. Pixl shows Proposed bans, the reviewer log and the audit notes to owners only, and Spot check to
// owners and final reviewers; the pages ask for the same. Hardware is the hardware queue, reached from the queue and not a tab of
// its own; `queue` says which queue a page belongs to, so a reviewer limited to the other one is not offered it.
export type ReviewTabItem = NavItem;

export const REVIEW_TABS: readonly ReviewTabItem[] = [
  { href: "/review", label: "Needs review", requires: "reviewer", words: "queue software first pass" },
  { href: "/review/hardware", label: "Hardware", requires: "reviewer", queue: "hardware", words: "queue bill of materials" },
  { href: "/review/reviewed", label: "Reviewed", requires: "reviewer", words: "history verdicts" },
  { href: "/review/stats", label: "Stats", requires: "reviewer", words: "my stats totals" },
  { href: "/review/proposed-bans", label: "Proposed bans", requires: "owner", words: "ban proposals" },
  { href: "/review/spot-check", label: "Spot check", requires: { review: "second_pass" }, words: "sample final" },
  { href: "/review/log", label: "Reviewer log", requires: "owner", words: "claims" },
  { href: "/review/audit", label: "Audit notes", requires: "owner", words: "notes" },
  { href: "/review/guidelines", label: "Guidelines", requires: "reviewer", words: "rules handbook" },
];

function allowed(item: NavItem, access: ReviewerAccess): boolean {
  return satisfies(access, item.requires) && (item.show ? item.show(access) : true) && (item.queue === undefined || queueAllows(access.reviewQueues, item.queue));
}

const link = ({ href, label, requires }: NavItem): NavLink => ({ href, label, requires });

// Role-filtered nav. Each page still re-checks with requireAccess(); this only decides what is worth showing.
export function buildNav(access: ReviewerAccess): NavModel {
  return {
    primary: PRIMARY_ITEMS.filter((item) => allowed(item, access)).map(link),
    groups: NAV_GROUPS.map((group) => ({ key: group.key, label: group.label, items: group.items.filter((item) => allowed(item, access)).map(link) })).filter(
      (group) => group.items.length > 0,
    ),
  };
}

// The tabs of the Review area this person may open. A reviewer limited to one queue loses the other queue's tab.
export function visibleReviewTabs(access: ReviewerAccess): ReviewTabItem[] {
  return REVIEW_TABS.filter((tab) => allowed(tab, access));
}

function matches(path: string, href: string): boolean {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

// The one nav link to highlight: the longest href the path sits under. Longest wins because some links nest ("My stats" is
// /review/stats, under /review), and only the more specific one should light up. The path may be the browser's or the internal
// /reviewer one (publicPath). A path under no link (the audit log of another group, a 404) highlights nothing.
export function activeNavHref(pathname: string, nav: NavModel): string | null {
  const path = publicPath(pathname);
  const hrefs = [...nav.primary, ...nav.groups.flatMap((group) => group.items)].map((item) => item.href);
  let best: string | null = null;
  for (const href of hrefs) {
    if (matches(path, href) && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

// Every page this person may open, for the command palette: the bar, the More menu and the Review tabs. A page listed twice
// (Tickets for an owner is in More only; a helper has it in the bar) appears once, under the first section that names it.
export type PageEntry = { href: string; label: string; group: string; words: string };

export function pageEntries(access: ReviewerAccess): PageEntry[] {
  const words = new Map<string, string>();
  for (const item of [...PRIMARY_ITEMS, ...NAV_GROUPS.flatMap((group) => group.items), ...REVIEW_TABS]) {
    if (item.words) words.set(item.href, `${words.get(item.href) ?? ""} ${item.words}`.trim());
  }
  const nav = buildNav(access);
  const seen = new Set<string>();
  const entries: PageEntry[] = [];
  const add = (item: NavLink, group: string) => {
    if (seen.has(item.href)) return;
    seen.add(item.href);
    entries.push({ href: item.href, label: item.label, group, words: words.get(item.href) ?? "" });
  };
  for (const item of nav.primary) add(item, "Pages");
  for (const group of nav.groups) for (const item of group.items) add(item, group.label);
  for (const tab of visibleReviewTabs(access)) add(tab, "Review");
  return entries;
}

// Everything the nav can offer, as named sections: the top bar, each More section and the Review tabs. The Team and roles page
// reads this to say what each role opens, so nothing about a role is written twice.
export type NavSection = { label: string; items: NavItem[] };

export const NAV_SECTIONS: readonly NavSection[] = [
  { label: "Top bar", items: [...PRIMARY_ITEMS] },
  ...NAV_GROUPS.map((group) => ({ label: group.label, items: [...group.items] })),
  { label: "Review tabs", items: [...REVIEW_TABS] },
];

export type OpenSection = { label: string; items: NavItem[]; total: number };

// An owner passes every gate, so the items an owner is offered are the whole of a section.
const OWNER: ReviewerAccess = { personId: "owner", isOwner: true, isReviewer: true, isHelper: true, isFulfiller: true, canSecondPass: true, canEditSubmission: true, canAiDraft: true, canOpenFullQueue: true, canFraudReview: true, reviewQueues: "both" };

// The sections with at least one item this person may open, each with just those items and how many an owner is offered in it.
// A page can sit in two sections (Tickets is in the bar for a helper and under Queues for an owner), so the lists can overlap.
export function visibleSections(access: ReviewerAccess): OpenSection[] {
  return NAV_SECTIONS.map((section) => {
    return { label: section.label, items: section.items.filter((item) => allowed(item, access)), total: section.items.filter((item) => allowed(item, OWNER)).length };
  }).filter((section) => section.items.length > 0);
}
