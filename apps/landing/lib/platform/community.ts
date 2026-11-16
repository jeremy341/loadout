import { formatDepth, TRACKS, type Track } from "./progress";
import { trackBySlug } from "./tracks";

// The Community section. Nothing here is stored: every list is a typed fixture of invented builders and proposed content,
// and the pages say so. The rules come from plans/11 (Community Eras), plans/02 (no shop suggestions or voting, no
// permanent discounts for rank) and plans/proposals/future-platform-ui.md (no endless feed, no reposts).

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim().toLowerCase();

export const COMMUNITY_HOME = "/dashboard/community";

export const COMMUNITY_TABS: readonly { href: string; label: string }[] = [
  { href: COMMUNITY_HOME, label: "Overview" },
  { href: `${COMMUNITY_HOME}/show-and-tell`, label: "Show & Tell" },
  { href: `${COMMUNITY_HOME}/ideas`, label: "Ideas" },
  { href: `${COMMUNITY_HOME}/news`, label: "News" },
  { href: `${COMMUNITY_HOME}/leaderboard`, label: "Leaderboard" },
  { href: `${COMMUNITY_HOME}/goals`, label: "Goals" },
  { href: `${COMMUNITY_HOME}/events`, label: "Events" },
];

// The Overview is current only on its own address; every other tab owns the pages below it.
export function isCommunityTabCurrent(pathname: string, href: string): boolean {
  if (href === COMMUNITY_HOME) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ---- Community Era (plan 11) ----
// The sequence is an example, not a launch order. No threshold, percentage, countdown or date is shown, because plan 11
// says those must come from configured server state.
export const COMMUNITY_ERAS = ["Steam", "Electrification", "Computing", "Networks", "Acceleration"] as const;
export const ERA_PREVIEW_INDEX = 1;
export const ERA_MIN_DAYS = 14;
export const ERA_BONUS_PERCENT = 10;
export const ERA_OBJECTIVES = ["Measure", "Control", "Automate", "Optimize"] as const;

export type EraStage = { name: string; state: "earlier" | "current" | "later" };

export function eraStages(currentIndex: number = ERA_PREVIEW_INDEX): EraStage[] {
  return COMMUNITY_ERAS.map((name, index) => ({ name, state: index < currentIndex ? "earlier" : index === currentIndex ? "current" : "later" }));
}

// ---- Builders ----
// Invented handles. Hours are approved hours per track: this week and in total.
export type HoursByTrack = Record<Track, number>;
export type CommunityBuilder = { handle: string; weekly: HoursByTrack; allTime: HoursByTrack };

const hours = (tools: number, systems: number, compute: number, hardware: number): HoursByTrack => ({ Tools: tools, Systems: systems, Compute: compute, Hardware: hardware });

export const BUILDERS: readonly CommunityBuilder[] = [
  { handle: "tinwren", weekly: hours(7, 0, 0, 3), allTime: hours(96, 12, 0, 20) },
  { handle: "quartzfox", weekly: hours(0, 5, 6, 0), allTime: hours(10, 88, 64, 0) },
  { handle: "brasskettle", weekly: hours(2, 0, 0, 9), allTime: hours(4, 0, 6, 120) },
  { handle: "mothvector", weekly: hours(0, 4, 12, 0), allTime: hours(0, 30, 141, 0) },
  { handle: "picopilgrim", weekly: hours(0, 0, 0, 9), allTime: hours(3, 0, 0, 77) },
  { handle: "solderbee", weekly: hours(5, 0, 0, 0), allTime: hours(45, 0, 0, 31) },
  { handle: "lathelark", weekly: hours(0, 8, 0, 2), allTime: hours(0, 70, 5, 18) },
  { handle: "nullwisp", weekly: hours(3, 3, 3, 0), allTime: hours(25, 25, 25, 0) },
];

// ---- Leaderboard ----
export const LEADERBOARD_RANGES = ["weekly", "all-time"] as const;
export type LeaderboardRange = (typeof LEADERBOARD_RANGES)[number];
export const LEADERBOARD_RANGE_LABELS: Record<LeaderboardRange, string> = { weekly: "This week", "all-time": "All time" };

export type LeaderboardQuery = { range: LeaderboardRange; track: Track | null };
export type LeaderRow = { handle: string; hours: number; rank: number; tied: boolean };

// An unknown range or track is ignored, so a bad address shows the default view rather than an error.
export function parseLeaderboardQuery(raw: { range?: string | string[]; track?: string | string[] }): LeaderboardQuery {
  const range = first(raw.range);
  return { range: range === "all-time" ? "all-time" : "weekly", track: trackBySlug(first(raw.track)) };
}

export function leaderboardHref(query: LeaderboardQuery): string {
  const params = new URLSearchParams();
  if (query.track) params.set("track", query.track.toLowerCase());
  if (query.range !== "weekly") params.set("range", query.range);
  const text = params.toString();
  return text ? `${COMMUNITY_HOME}/leaderboard?${text}` : `${COMMUNITY_HOME}/leaderboard`;
}

// Most hours first, equal hours share a rank and the next rank is skipped (1, 2, 2, 4). Equal hours are listed by handle so
// the order is stable. Builders with no hours are left out.
export function rankRows(entries: readonly { handle: string; hours: number }[]): LeaderRow[] {
  const sorted = entries.filter((entry) => entry.hours > 0).sort((a, b) => b.hours - a.hours || a.handle.localeCompare(b.handle));
  const rows = sorted.map((entry, index) => {
    const rank = index > 0 && sorted[index - 1].hours === entry.hours ? 0 : index + 1;
    return { handle: entry.handle, hours: entry.hours, rank, tied: false };
  });
  rows.forEach((row, index) => {
    if (row.rank === 0) row.rank = rows[index - 1].rank;
  });
  rows.forEach((row) => {
    row.tied = rows.filter((other) => other.rank === row.rank).length > 1;
  });
  return rows;
}

export function builderHours(builder: CommunityBuilder, range: LeaderboardRange, track: Track | null): number {
  const source = range === "weekly" ? builder.weekly : builder.allTime;
  return track ? source[track] : TRACKS.reduce((sum, name) => sum + source[name], 0);
}

export function leaderboardRows(query: LeaderboardQuery, builders: readonly CommunityBuilder[] = BUILDERS): LeaderRow[] {
  return rankRows(builders.map((builder) => ({ handle: builder.handle, hours: builderHours(builder, query.range, query.track) })));
}

// Depth is 1 m per approved hour. All time it is the depth reached; in a week it is the depth gained.
export function depthLabel(range: LeaderboardRange, approvedHours: number): string {
  return range === "weekly" ? `${Math.max(0, Math.floor(approvedHours))} M deeper` : formatDepth(approvedHours);
}

// ---- Ideas ----
// The board is for program and platform ideas. Shop suggestions and voting are excluded by plan 02, so no idea here is about
// the catalog and the page says that ideas cannot be shop requests.
export const IDEA_STATUSES = ["Open", "Planned", "Built", "Declined"] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];
export const IDEA_SORTS = ["top", "newest"] as const;
export type IdeaSort = (typeof IDEA_SORTS)[number];
export const IDEA_SORT_LABELS: Record<IdeaSort, string> = { top: "Most votes", newest: "Newest" };

export type Idea = {
  id: string;
  title: string;
  summary: string;
  body: string;
  handle: string;
  status: IdeaStatus;
  votes: number;
  // 1 is the newest. The fixtures carry no dates.
  recency: number;
  // The team's reply, for an idea that is not open.
  note?: string;
};

export const IDEAS: readonly Idea[] = [
  {
    id: "pin-a-project",
    title: "Pin one project to your profile",
    summary: "Choose the project you are proudest of and keep it at the top.",
    body: "Builders with many projects end up with the best one buried. One pinned project would be the first thing another builder sees.",
    handle: "solderbee",
    status: "Open",
    votes: 18,
    recency: 1,
  },
  {
    id: "parts-checklist",
    title: "A parts checklist for Hardware journals",
    summary: "A template for listing parts and what each one is for.",
    body: "Hardware journals repeat the same list of parts, links and substitutions. A template would make the list quick to write and easy to read.",
    handle: "tinwren",
    status: "Open",
    votes: 24,
    recency: 2,
  },
  {
    id: "random-project",
    title: "A random project button on Explore",
    summary: "Open any approved project when you do not know what to search for.",
    body: "Search needs a word to start from. A single button that opens a random approved project would help someone browse.",
    handle: "nullwisp",
    status: "Open",
    votes: 17,
    recency: 3,
  },
  {
    id: "era-build-alongs",
    title: "Build-along threads for each Era objective",
    summary: "One shared thread per objective, for people building the same thing.",
    body: "When an Era objective is announced, builders who pick the same one could compare notes in one place instead of many.",
    handle: "quartzfox",
    status: "Planned",
    votes: 31,
    recency: 4,
    note: "Planned alongside the first Community Era. Timing is not set.",
  },
  {
    id: "peer-scores",
    title: "Peer scores on every project",
    summary: "Let builders score each other's projects.",
    body: "A score from other builders would show which projects people like best.",
    handle: "picopilgrim",
    status: "Declined",
    votes: 6,
    recency: 5,
    note: "LOADOUT has no peer review and no scores. A reviewer writes an accept or reject reason against the four quality dimensions.",
  },
  {
    id: "depth-in-metres",
    title: "Show hours as metres of depth",
    summary: "Turn approved hours into a depth you can watch grow.",
    body: "A number of hours is easy to ignore. A depth in metres makes progress feel like going somewhere.",
    handle: "mothvector",
    status: "Built",
    votes: 17,
    recency: 6,
    note: "Depth is approved hours in metres, one metre for each hour. It is on the Overview.",
  },
];

export type IdeasQuery = { status: IdeaStatus | null; sort: IdeaSort };

export function parseIdeasQuery(raw: { status?: string | string[]; sort?: string | string[] }): IdeasQuery {
  const status = first(raw.status);
  const sort = first(raw.sort);
  return {
    status: IDEA_STATUSES.find((item) => item.toLowerCase() === status) ?? null,
    sort: sort === "newest" ? "newest" : "top",
  };
}

export function ideasHref(query: IdeasQuery): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status.toLowerCase());
  if (query.sort !== "top") params.set("sort", query.sort);
  const text = params.toString();
  return text ? `${COMMUNITY_HOME}/ideas?${text}` : `${COMMUNITY_HOME}/ideas`;
}

export function filterIdeas(ideas: readonly Idea[], status: IdeaStatus | null): Idea[] {
  return ideas.filter((idea) => status === null || idea.status === status);
}

// Most votes first, equal votes by the newer idea; "newest" is by recency alone.
export function sortIdeas(ideas: readonly Idea[], sort: IdeaSort): Idea[] {
  const list = [...ideas];
  return sort === "newest" ? list.sort((a, b) => a.recency - b.recency) : list.sort((a, b) => b.votes - a.votes || a.recency - b.recency);
}

// The Overview preview: the best ideas still in play, so a declined idea never headlines.
export function topIdeas(count: number, ideas: readonly Idea[] = IDEAS): Idea[] {
  return sortIdeas(
    ideas.filter((idea) => idea.status !== "Declined"),
    "top",
  ).slice(0, count);
}

export function findIdea(id: string): Idea | undefined {
  return IDEAS.find((idea) => idea.id === id);
}

// ---- News ----
// Fictional program notes that state nothing unconfirmed: no dates, no event details, no prices.
export type NewsItem = { id: string; kind: "Program" | "Platform" | "Community" | "Docs"; title: string; summary: string; order: number };

export const NEWS: readonly NewsItem[] = [
  {
    id: "eras-in-plain-words",
    kind: "Community",
    title: "How Community Eras are meant to work",
    summary: "An Era is a shared stage. It advances only when the community threshold is met and a minimum length has passed. The values are still being decided.",
    order: 1,
  },
  {
    id: "explore-lists-approved",
    kind: "Platform",
    title: "Explore lists approved projects",
    summary: "Approved projects can be searched by title or builder. Drafts and work in review stay private to their owner.",
    order: 2,
  },
  {
    id: "no-peer-rating",
    kind: "Program",
    title: "Review has no scores and no peer rating",
    summary: "Approval is a written decision against Originality, Technical Depth, Execution and Documentation. Nothing is scored.",
    order: 3,
  },
  {
    id: "show-and-tell-planned",
    kind: "Community",
    title: "Show & Tell is planned",
    summary: "Short sessions where builders present a project. The format and the first session are not confirmed.",
    order: 4,
  },
  {
    id: "level-hours-are-drafts",
    kind: "Docs",
    title: "Level hours between the set levels are drafts",
    summary: "Only the hours at LV.5, 8, 11, 15 and 20 are set. The hours for the levels in between may change.",
    order: 5,
  },
];

export function latestNews(count: number, items: readonly NewsItem[] = NEWS): NewsItem[] {
  return [...items].sort((a, b) => a.order - b.order).slice(0, count);
}

// ---- Show & Tell ----
// Sessions carry no dates. A past session is a sample recap; an upcoming one says its date is to be announced.
export type Showcase = { title: string; handle: string; track: Track; note: string };
export type Session = {
  id: string;
  number: number;
  status: "past" | "upcoming";
  title: string;
  summary: string;
  showcases: readonly Showcase[];
};

export const SESSIONS: readonly Session[] = [
  {
    id: "session-1",
    number: 1,
    status: "past",
    title: "Things that blink",
    summary: "A first round of short demos: lights, sensors and displays.",
    showcases: [
      { title: "Window light level logger", handle: "tinwren", track: "Hardware", note: "A light sensor and a log of how bright the room gets." },
      { title: "Tide clock on a spare e-paper screen", handle: "brasskettle", track: "Hardware", note: "Shows the next high tide as a single number." },
      { title: "Blink pattern composer", handle: "nullwisp", track: "Tools", note: "Draw a pattern, get the code for it." },
    ],
  },
  {
    id: "session-2",
    number: 2,
    status: "past",
    title: "Small servers",
    summary: "Things that run all day on very little: status pages, log shippers and small benchmarks.",
    showcases: [
      { title: "Home status page on a Pi", handle: "quartzfox", track: "Systems", note: "One page that says whether the house network is up." },
      { title: "A log shipper in 300 lines", handle: "lathelark", track: "Systems", note: "Reads a file, batches lines, sends them on." },
      { title: "Tiny inference benchmark", handle: "mothvector", track: "Compute", note: "Times the same small model on three machines." },
    ],
  },
  {
    id: "session-3",
    number: 3,
    status: "past",
    title: "Tools that rescued a bad afternoon",
    summary: "Small scripts written because something was annoying, and kept because they worked.",
    showcases: [
      { title: "Bench label printer script", handle: "solderbee", track: "Tools", note: "Turns a list of parts into a sheet of labels." },
      { title: "Pico flash helper", handle: "picopilgrim", track: "Hardware", note: "One command to flash and open the serial monitor." },
    ],
  },
  {
    id: "next-session",
    number: 4,
    status: "upcoming",
    title: "Open session",
    summary: "Builders show a project they have worked on. The format and the length are not confirmed.",
    showcases: [],
  },
  {
    id: "following-session",
    number: 5,
    status: "upcoming",
    title: "Theme to be chosen",
    summary: "The theme would be chosen with the community. Nothing is planned beyond the next session.",
    showcases: [],
  },
];

export function pastSessions(sessions: readonly Session[] = SESSIONS): Session[] {
  return sessions.filter((session) => session.status === "past").sort((a, b) => b.number - a.number);
}

export function upcomingSessions(sessions: readonly Session[] = SESSIONS): Session[] {
  return sessions.filter((session) => session.status === "upcoming").sort((a, b) => a.number - b.number);
}

export function findSession(id: string): Session | undefined {
  return SESSIONS.find((session) => session.id === id);
}

export const NEXT_SESSION_LINE = "Next session: date to be announced.";

// ---- Goals ----
// Community goals count the whole community's approved work toward one shared reward. Plan 11 fixes none of the values, so
// every target and every current figure here is provisional, and so is each reward.
export type Goal = { id: string; title: string; text: string; unit: string; value: number; target: number; reward: string };

export const GOALS: readonly Goal[] = [
  {
    id: "era-threshold",
    title: "Meet the Era threshold",
    text: "Approved hours from every builder count toward the Era. When the threshold is met at an eligible weekly reset, the next Era begins.",
    unit: "approved hours",
    value: 1240,
    target: 2000,
    reward: "The next Community Era begins at an eligible weekly reset.",
  },
  {
    id: "all-four-tracks",
    title: "An approved project in every track",
    text: "Tools, Systems, Compute and Hardware each need at least one approved project in the current Era.",
    unit: "tracks",
    value: 3,
    target: 4,
    reward: "A one-use General Requisition for each builder who contributed. Proposed; the triggers are not decided.",
  },
  {
    id: "show-and-tell-reach",
    title: "Builders who showed a project",
    text: "Counts builders who have presented in a Show & Tell session.",
    unit: "builders",
    value: 14,
    target: 20,
    reward: "A shared collectible. Proposed; nothing is designed yet.",
  },
];

// Whole percent, rounded down so a goal never reads 100% before it is met. Clamped to 0..100; a target of zero or less is 0.
export function goalPercent(value: number, target: number): number {
  if (!(target > 0) || !(value > 0)) return 0;
  return Math.min(100, Math.floor((value / target) * 100));
}

export function goalValueText(goal: Goal): string {
  return `${goal.value.toLocaleString("en-GB")} of ${goal.target.toLocaleString("en-GB")} ${goal.unit}`;
}
