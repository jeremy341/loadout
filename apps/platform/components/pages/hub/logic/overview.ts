import type { OreEntry } from "../../../../lib/ore-ledger";
import type { PreviewNotification } from "../../../../lib/notifications";
import type { BuildSummary } from "../../build/logic/summary";
import type { CommunityASummary } from "../../community-a/logic/summary-calc";
import type { CommunityBSummary } from "../../community-b/summary";
import type { GearSummary } from "../../gear/summary";
import { HUB_RULES } from "./rules";
import { compareIsoDesc, isRecord, plural } from "./text";

// The pure parts of the Overview: the first-run checklist, the prompts it derives, and the recent-activity list.

// ---- First-run checklist ---------------------------------------------------------------------------------

export interface OnboardingState {
  dismissed: boolean;
}

export const INITIAL_ONBOARDING: OnboardingState = { dismissed: false };

export function normalizeOnboarding(raw: unknown): OnboardingState {
  return isRecord(raw) && raw.dismissed === true ? { dismissed: true } : INITIAL_ONBOARDING;
}

export interface OnboardingItem {
  id: "project" | "journal" | "review" | "wishlist";
  label: string;
  href: string;
  done: boolean;
}

/** Each step ticks itself from what the other tabs hold. Nothing here is stored. */
export function onboardingItems(build: Pick<BuildSummary, "projects" | "journalEntries" | "reviewsDone">, gear: Pick<GearSummary, "wishlistCount">): OnboardingItem[] {
  return [
    { id: "project", label: "Create a project", href: "/projects", done: build.projects.length > 0 },
    { id: "journal", label: "Write a journal entry", href: "/journals", done: build.journalEntries > 0 },
    { id: "review", label: "Review a ship", href: "/reviews", done: build.reviewsDone > 0 },
    { id: "wishlist", label: "Add an item to your wishlist", href: "/wishlist", done: gear.wishlistCount > 0 },
  ];
}

export function onboardingProgress(items: readonly OnboardingItem[]): { done: number; total: number; complete: boolean } {
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, complete: done === items.length };
}

// ---- Next actions ----------------------------------------------------------------------------------------

export interface NextAction {
  label: string;
  href: string;
}

export interface ActionInput {
  build: BuildSummary;
  community: CommunityASummary;
  seasons: CommunityBSummary;
  gear: GearSummary;
  unread: number;
  bioEmpty: boolean;
}

/** One Hub-only prompt: shown when `count` is above zero. */
type ActionRule = { count: number; label: (n: number) => string; href: string };

function hubActionRules(input: ActionInput): ActionRule[] {
  const { community, seasons, gear, unread, bioEmpty } = input;
  return [
    { count: unread, label: (n) => `Read your ${plural(n, "unread notification")}`, href: "/notifications" },
    { count: community.pendingRequests, label: (n) => `Answer ${plural(n, "friend request")}`, href: "/friends" },
    { count: seasons.eventsRsvped, label: (n) => `Check the details of your ${plural(n, "event RSVP")}`, href: "/events" },
    {
      count: Math.max(0, gear.referralsTotal - gear.referralsQualified),
      label: (n) => `Follow up ${plural(n, "referral")} that ${n === 1 ? "has" : "have"} not qualified yet`,
      href: "/referrals",
    },
    { count: gear.wishlistAffordable, label: (n) => `You can afford ${plural(n, "item")} on your wishlist`, href: "/wishlist" },
    { count: gear.ordersOpen, label: (n) => `Track ${plural(n, "open order")}`, href: "/orders" },
    { count: bioEmpty ? 1 : 0, label: () => "Add a bio to your profile", href: "/profile" },
  ];
}

function uniqueByLabel(actions: readonly NextAction[]): NextAction[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    if (seen.has(a.label)) return false;
    seen.add(a.label);
    return true;
  });
}

/** The Build tabs' own prompts first, then the ones that only the Hub can see across tabs. */
export function deriveNextActions(input: ActionInput): NextAction[] {
  const mine: NextAction[] = hubActionRules(input)
    .filter((rule) => rule.count > 0)
    .map((rule) => ({ label: rule.label(rule.count), href: rule.href }));
  return uniqueByLabel([...input.build.nextActions, ...mine]).slice(0, HUB_RULES.nextActions);
}

// ---- Recent activity -------------------------------------------------------------------------------------

export type ActivitySource = "ore" | "community" | "notification";

export interface ActivityItem {
  id: string;
  text: string;
  href: string | null;
  at: string;
  source: ActivitySource;
}

const ORE_HREF: Record<string, string> = { shop: "/orders", achievement: "/achievements", referral: "/referrals" };

export function oreText(entry: Pick<OreEntry, "amount" | "reason">): string {
  const abs = Math.abs(entry.amount).toLocaleString("en-GB");
  return `${entry.amount >= 0 ? "Earned" : "Spent"} ${abs} Ore: ${entry.reason}`;
}

/** Ledger entries, community events and notifications in one list, newest first. */
export function mergeActivity(
  input: {
    ledger: readonly OreEntry[];
    community: readonly { text: string; href: string; at: string }[];
    notifications: readonly PreviewNotification[];
  },
  limit: number = HUB_RULES.recentActivity,
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...input.ledger.map((e): ActivityItem => ({ id: `ore:${e.id}`, text: oreText(e), href: ORE_HREF[e.source] ?? null, at: e.at, source: "ore" })),
    ...input.community.map((c, i): ActivityItem => ({ id: `community:${i}:${c.at}`, text: c.text, href: c.href, at: c.at, source: "community" })),
    ...input.notifications.map((n): ActivityItem => ({ id: `notification:${n.id}`, text: n.title, href: n.href ?? "/notifications", at: n.at, source: "notification" })),
  ];
  return items.sort((a, b) => compareIsoDesc(a.at, b.at) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)).slice(0, Math.max(0, limit));
}

export const SOURCE_LABEL: Record<ActivitySource, string> = { ore: "Ore", community: "Community", notification: "Notification" };
