import type { TrackName } from "../../../../lib/sample/builders";
import type { BuildSummary } from "../../build/logic/summary";
import type { CommunityASummary } from "../../community-a/logic/summary-calc";
import type { CommunityBSummary } from "../../community-b/summary";
import type { GearSummary } from "../../gear/summary";
import { HUB_RULES } from "./rules";
import { compareIsoDesc, isRecord } from "./text";

// The achievement catalog and how it is evaluated. Plan 02 section 21 lists example achievements but defines no
// catalog, so everything computed here is a Draft preview rule, except the external-contributor achievement
// (Plan 02 section 20: one time, +50 Ore).

export type Rarity = "Common" | "Uncommon" | "Rare";

/** Everything the criteria can look at. Built from the group summaries; see buildFacts. */
export interface AchievementFacts {
  projects: number;
  projectsByTrack: Record<TrackName, number>;
  journalEntries: number;
  hoursLogged: number;
  reviewsDone: number;
  approvedShips: number;
  missionsDone: number;
  wishlistCount: number;
  ordersTotal: number;
  collectiblesOwned: number;
  referralsQualified: number;
  streakWeeks: number;
  eventsJoined: number;
  friends: number;
  showAndTellPosts: number;
  ideasPosted: number;
  /** 1 once the external-contributor claim is approved. */
  contributorApproved: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  /** The criterion in one sentence, shown on the card. */
  criteria: string;
  measure: (facts: AchievementFacts) => number;
  target: number;
  rarity: Rarity;
  /** A track the achievement belongs to, or null for any track. */
  track: TrackName | null;
  /** "plan" when a plan defines it; "draft" for the Draft preview achievements. */
  rule: "plan" | "draft";
  /** Ore this achievement grants. Only the plan-defined one has any. */
  oreReward: number;
}

export const CONTRIBUTOR_ID = "outside-contribution";

function draft(
  id: string,
  name: string,
  criteria: string,
  target: number,
  rarity: Rarity,
  measure: (facts: AchievementFacts) => number,
  track: TrackName | null = null,
): AchievementDef {
  return { id, name, criteria, target, rarity, measure, track, rule: "draft", oreReward: 0 };
}

const TRACK_PROJECT = (track: TrackName) =>
  draft(`start-${track.toLowerCase()}`, `${track} builder`, `Create a ${track} project.`, 1, "Common", (f) => f.projectsByTrack[track], track);

export const CATALOG: AchievementDef[] = [
  draft("first-project", "First project", "Create your first project.", 1, "Common", (f) => f.projects),
  draft("first-journal", "First journal entry", "Write your first journal entry.", 1, "Common", (f) => f.journalEntries),
  draft("journal-10", "Ten entries", "Write 10 journal entries.", 10, "Uncommon", (f) => f.journalEntries),
  draft("hours-20", "Twenty hours", "Log 20 hours of development.", 20, "Uncommon", (f) => f.hoursLogged),
  draft("first-review", "First review", "Review another builder's ship.", 1, "Common", (f) => f.reviewsDone),
  draft("reviews-8", "Review duty", "Complete 8 reviews, the number owed before a payout.", 8, "Uncommon", (f) => f.reviewsDone),
  draft("first-ship", "First approved ship", "Get a ship approved and paid.", 1, "Rare", (f) => f.approvedShips),
  draft("first-mission", "First mission", "Complete a mission.", 1, "Uncommon", (f) => f.missionsDone),
  draft("first-wish", "First wish", "Save an item to your wishlist.", 1, "Common", (f) => f.wishlistCount),
  draft("first-order", "First order", "Place an order in the Shop.", 1, "Uncommon", (f) => f.ordersTotal),
  draft("first-collectible", "First collectible", "Earn a collectible.", 1, "Uncommon", (f) => f.collectiblesOwned),
  draft("streak-4", "Four-week streak", "Keep a four-week streak of logged work.", 4, "Rare", (f) => f.streakWeeks),
  draft("first-event", "Joined an event", "Hold a seat at an event or collect an event certificate.", 1, "Common", (f) => f.eventsJoined),
  draft("first-friend", "First friend", "Become friends with another builder.", 1, "Common", (f) => f.friends),
  draft("first-idea", "Idea posted", "Post an idea on the idea board.", 1, "Common", (f) => f.ideasPosted),
  draft("first-show", "Show and tell", "Share work in Show & Tell.", 1, "Common", (f) => f.showAndTellPosts),
  draft("first-referral", "First qualified referral", "Invite a builder who qualifies: verifies, logs real work and earns a first approved ship.", 1, "Rare", (f) => f.referralsQualified),
  TRACK_PROJECT("Tools"),
  TRACK_PROJECT("Systems"),
  TRACK_PROJECT("Compute"),
  TRACK_PROJECT("Hardware"),
  {
    id: CONTRIBUTOR_ID,
    name: "First outside contribution",
    criteria: "A meaningful contribution to your project from someone outside the project team, approved on review.",
    measure: (f) => f.contributorApproved,
    target: 1,
    rarity: "Rare",
    track: null,
    rule: "plan",
    oreReward: HUB_RULES.contributorOre,
  },
];

/** Plan 02 section 21 examples. They are judged by reviewers, so the preview cannot compute them. */
export const REVIEW_AWARDED: { name: string; criteria: string }[] = [
  { name: "FIRST TOOL", criteria: "Ship a useful developer or tooling project." },
  { name: "BARE METAL", criteria: "Meaningful low-level systems work." },
  { name: "BENCHMARKED", criteria: "Publish real performance measurements." },
  { name: "DOCUMENTED", criteria: "Exceptional technical documentation." },
  { name: "LOCAL BRAIN", criteria: "Meaningful local inference or runtime work." },
  { name: "IT'S ALIVE", criteria: "A successful physical project." },
  { name: "KERNEL PANIC", criteria: "Ship an OS, runtime or kernel-level project." },
  { name: "PACKET PUSHER", criteria: "A networking or protocol project." },
  { name: "SILICON CURIOUS", criteria: "Your first FPGA or accelerator project." },
  { name: "CLOCKED", criteria: "A measured performance improvement." },
  { name: "TOOLMAKER", criteria: "Another builder genuinely uses your tool." },
  { name: "PAPER CUT", criteria: "A strong Research Mode ship." },
];

// ---------------------------------------------------------------------------------------------------------

export interface FactsInput {
  build: BuildSummary;
  community: CommunityASummary;
  seasons: CommunityBSummary;
  gear: GearSummary;
  contributorApproved: boolean;
}

export function buildFacts(input: FactsInput): AchievementFacts {
  const { build, community, seasons, gear } = input;
  const byTrack: Record<TrackName, number> = { Tools: 0, Systems: 0, Compute: 0, Hardware: 0 };
  for (const project of build.projects) byTrack[project.track] += 1;
  return {
    projects: build.projects.length,
    projectsByTrack: byTrack,
    journalEntries: build.journalEntries,
    hoursLogged: build.hoursLogged,
    reviewsDone: build.reviewsDone,
    approvedShips: build.approvedShips,
    missionsDone: build.missionsDone,
    wishlistCount: gear.wishlistCount,
    ordersTotal: gear.ordersTotal,
    collectiblesOwned: gear.collectiblesOwned,
    referralsQualified: gear.referralsQualified,
    streakWeeks: seasons.streakWeeks,
    eventsJoined: seasons.eventsRsvped + seasons.certificates,
    friends: community.friends,
    showAndTellPosts: community.showAndTellPosts,
    ideasPosted: community.ideasPosted,
    contributorApproved: input.contributorApproved ? 1 : 0,
  };
}

/** Earned achievements: id -> ISO time it was first earned. Once written it is never removed. */
export type EarnedMap = Record<string, string>;
export const NO_EARNED: EarnedMap = {};

export interface AchievementRow {
  def: AchievementDef;
  value: number;
  target: number;
  met: boolean;
  earned: boolean;
  earnedAt: string | null;
}

export function evaluate(facts: AchievementFacts, earned: EarnedMap, defs: readonly AchievementDef[] = CATALOG): AchievementRow[] {
  return defs.map((def) => {
    const raw = Math.max(0, Math.floor(def.measure(facts)));
    const earnedAt = Object.hasOwn(earned, def.id) ? earned[def.id] : null;
    return {
      def,
      value: Math.min(raw, def.target),
      target: def.target,
      met: raw >= def.target,
      earned: earnedAt !== null,
      earnedAt,
    };
  });
}

/** Ids whose criteria are met but that are not recorded as earned yet. */
export function newlyMet(rows: readonly AchievementRow[]): string[] {
  return rows.filter((row) => row.met && !row.earned).map((row) => row.def.id);
}

/** Records ids as earned at `at`. Existing entries are kept as they are, so an earned date never changes and nothing is removed. */
export function applyEarned(earned: EarnedMap, ids: readonly string[], at: string): EarnedMap {
  const next: EarnedMap = { ...earned };
  for (const id of ids) if (!Object.hasOwn(next, id)) next[id] = at;
  return next;
}

export function normalizeEarned(raw: unknown): EarnedMap {
  if (!isRecord(raw)) return NO_EARNED;
  const known = new Set(CATALOG.map((d) => d.id));
  const out: EarnedMap = {};
  for (const [id, at] of Object.entries(raw)) if (known.has(id) && typeof at === "string") out[id] = at;
  return out;
}

export function earnedNames(rows: readonly AchievementRow[]): string[] {
  return rows
    .filter((r) => r.earned)
    .sort((a, b) => compareIsoDesc(a.earnedAt ?? "", b.earnedAt ?? ""))
    .map((r) => r.def.name);
}

export type StatusFilter = "all" | "earned" | "locked";
export type TrackFilter = "all" | TrackName;

export function filterRows(rows: readonly AchievementRow[], status: StatusFilter, track: TrackFilter): AchievementRow[] {
  return rows.filter((row) => {
    if (status === "earned" && !row.earned) return false;
    if (status === "locked" && row.earned) return false;
    if (track !== "all" && row.def.track !== track) return false;
    return true;
  });
}

export function rewardLabel(def: AchievementDef): string {
  return def.oreReward > 0 ? `+${def.oreReward} Ore, once` : "No Ore reward";
}

/** The sentence announced when achievements are earned. One notification covers a batch so the inbox is not flooded. */
export function earnedMessage(ids: readonly string[], defs: readonly AchievementDef[] = CATALOG): { title: string; body: string } | null {
  const names = ids.flatMap((id) => defs.filter((d) => d.id === id).map((d) => d.name));
  if (names.length === 0) return null;
  if (names.length === 1) return { title: `Achievement earned: ${names[0]}`, body: "Open Achievements to see how you earned it." };
  return { title: `${names.length} achievements earned`, body: names.join(", ") };
}
