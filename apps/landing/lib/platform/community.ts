// The Community section: the pure rules and fixtures for the pages under /dashboard/community. The parts that are stored read
// the database through lib/platform/community-data.ts: goals (CommunityGoal rows, staff-written figures), news (News rows,
// staff-authored), events (Event rows, with a live RSVP count from EventRsvp) and the leaderboard (the same nightly snapshot
// the /api/v1 leaderboards/hours endpoint serves). The era strip and the idea board and Show & Tell are still proposed
// content, and their fixtures stay here and say so on the pages. The reviewer fulfilment fixture (lib/reviewer/fulfilment.ts)
// still borrows BUILDERS, the invented team. The rules come from plans/11 (Community Eras), plans/02 (no shop suggestions or
// voting, no permanent discounts for rank) and plans/proposals/future-platform-ui.md (no endless feed, no reposts).

import { formatDepth, type Track } from "./progress";

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
// The sequence of Eras and the four objectives are an example, not a launch order. The real Era Point calculation is not built,
// so the Overview reads a typed SAMPLE_ERA state (owner-approved sample numbers for the closed beta); the pages label it once.
// The rules the pages state come from the owner's Era decisions:
//   - Era Points are one community total. A project adds Era Points equal to its approved hours, only at final approval, and
//     they belong to the Era that is current then; they never carry into the next Era.
//   - Each Era has one fixed threshold and stays open at least 14 days. Threshold met plus 14 days is READY TO ADVANCE, and
//     the owner confirms the advance. Nothing advances on a timer.
//   - A finished Era keeps the total it had when it closed. A ban removes that builder's points from the current Era.
//   - A project marked as an Era project (a checkbox on submit) earns +10% of its approved Ore, once, at final approval.
export const ERA_RULES_HREF = "/docs/eras";
export const COMMUNITY_ERAS = ["Steam", "Electrification", "Computing", "Networks", "Acceleration"] as const;
export const ERA_PREVIEW_INDEX = 1;
export const ERA_MIN_DAYS = 14;
export const ERA_BONUS_PERCENT = 10;
export const ERA_OBJECTIVES = ["Measure", "Control", "Automate", "Optimize"] as const;

export type EraStage = { name: string; state: "earlier" | "current" | "later" };

export function eraStages(currentIndex: number = ERA_PREVIEW_INDEX): EraStage[] {
  return COMMUNITY_ERAS.map((name, index) => ({ name, state: index < currentIndex ? "earlier" : index === currentIndex ? "current" : "later" }));
}

export type EraState = {
  // Index into COMMUNITY_ERAS.
  stageIndex: number;
  name: string;
  // The community total for this Era: approved hours of projects finally approved while it is current.
  points: number;
  // The one fixed threshold the owner set for this Era.
  threshold: number;
  daysOpen: number;
  minDays: number;
  // Threshold met and the minimum days passed. The owner still confirms the advance.
  ready: boolean;
  // The total the previous Era had when it closed, or null for the first Era.
  previousClosedPoints: number | null;
};

export function isEraReady(input: Pick<EraState, "points" | "threshold" | "daysOpen" | "minDays">): boolean {
  return input.threshold > 0 && input.points >= input.threshold && input.daysOpen >= input.minDays;
}

export function makeEraState(input: Omit<EraState, "name" | "ready">): EraState {
  const name = COMMUNITY_ERAS[input.stageIndex] ?? COMMUNITY_ERAS[0];
  return { ...input, name, ready: isEraReady(input) };
}

// SAMPLE figures for the closed beta. The values mirror the sample goal (1,240 of 2,000) so the two pages agree.
export const SAMPLE_ERA: EraState = makeEraState({
  stageIndex: ERA_PREVIEW_INDEX,
  points: 1240,
  threshold: 2000,
  daysOpen: 9,
  minDays: ERA_MIN_DAYS,
  previousClosedPoints: 1815,
});

export type EraProgressStatus = "building" | "threshold-met" | "days-passed" | "ready";

export type EraProgress = {
  percent: number;
  pointsText: string;
  remaining: number;
  daysOpen: number;
  daysCapped: number;
  daysLeft: number;
  status: EraProgressStatus;
  statusLabel: string;
  statusText: string;
  // Prior, current and next stage names; null at either end of the sequence.
  previous: string | null;
  current: string;
  next: string | null;
  stageNumber: number;
  stageCount: number;
};

export const formatEraNumber = (value: number): string => Math.max(0, Math.round(value)).toLocaleString("en-GB");
const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

// Everything the Overview prints about the Era, derived from one state. The percentage is whole and rounded down, so the bar
// never reads 100% before the threshold is met (goalPercent). READY TO ADVANCE only means the owner may confirm now.
export function eraProgress(state: EraState): EraProgress {
  const percent = goalPercent(state.points, state.threshold);
  const remaining = Math.max(0, state.threshold - state.points);
  const daysOpen = Math.max(0, Math.floor(state.daysOpen));
  const daysLeft = Math.max(0, state.minDays - daysOpen);
  const thresholdMet = state.threshold > 0 && state.points >= state.threshold;
  const daysMet = daysLeft === 0;
  let status: EraProgressStatus;
  let statusLabel: string;
  let statusText: string;
  if (thresholdMet && daysMet) {
    status = "ready";
    statusLabel = "Ready to advance";
    statusText = "The threshold is met and the Era has been open long enough. The owner confirms the advance; it does not happen on a timer.";
  } else if (thresholdMet) {
    status = "threshold-met";
    statusLabel = "Threshold met";
    statusText = `${plural(daysLeft, "more day")} until the Era has been open ${state.minDays} days. Then it is ready to advance, and the owner confirms.`;
  } else if (daysMet) {
    status = "days-passed";
    statusLabel = "Building";
    statusText = `${formatEraNumber(remaining)} more Era Points to reach the threshold. The ${state.minDays} days have passed, so the owner can confirm the advance once it is met.`;
  } else {
    status = "building";
    statusLabel = "Building";
    statusText = `${formatEraNumber(remaining)} more Era Points and ${plural(daysLeft, "more day")} before this Era can advance. The owner confirms the advance.`;
  }
  return {
    percent,
    pointsText: `${formatEraNumber(state.points)} of ${formatEraNumber(state.threshold)} Era Points`,
    remaining,
    daysOpen,
    daysCapped: Math.min(daysOpen, state.minDays),
    daysLeft,
    status,
    statusLabel,
    statusText,
    previous: state.stageIndex > 0 ? (COMMUNITY_ERAS[state.stageIndex - 1] ?? null) : null,
    current: state.name,
    next: COMMUNITY_ERAS[state.stageIndex + 1] ?? null,
    stageNumber: state.stageIndex + 1,
    stageCount: COMMUNITY_ERAS.length,
  };
}

// The Era in one short line, for the slim banner on the other Community pages.
export function eraBannerText(state: EraState = SAMPLE_ERA): string {
  const progress = eraProgress(state);
  return `${progress.current} Era: ${progress.pointsText}, ${progress.percent}%`;
}


// ---- Builders ----
// Invented handles for the reviewer fulfilment fixtures (lib/reviewer/fulfilment.ts maps a signed-in staff member onto one
// of these people). The participant pages no longer read them: the leaderboard is real (community-data.ts).
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
// The two windows the nightly snapshot keeps (lib/platform/stats.ts snapshot kinds leaderboard-week and leaderboard-all).
// The same totals serve /api/v1/leaderboards/hours; the math is not duplicated here, only the display rules.
export const LEADERBOARD_RANGES = ["week", "all"] as const;
export type LeaderboardRange = (typeof LEADERBOARD_RANGES)[number];
export const LEADERBOARD_RANGE_LABELS: Record<LeaderboardRange, string> = { week: "This week", all: "All time" };

// An unknown window falls back to the week, so a bad address shows the default view rather than an error.
export function parseLeaderboardRange(raw: string | string[] | undefined): LeaderboardRange {
  return first(raw) === "all" ? "all" : "week";
}

export function leaderboardHref(range: LeaderboardRange): string {
  return range === "week" ? `${COMMUNITY_HOME}/leaderboard` : `${COMMUNITY_HOME}/leaderboard?range=all`;
}

export type LeaderRow = { handle: string; hours: number; rank: number; tied: boolean };

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

// A stored snapshot keeps more rows than are served, so people who turned stats off since the nightly write can be in it.
// Filter to the people still visible first, then take the served size, then rank: a hidden person must not take a place.
export function visibleSnapshotRows(
  stored: readonly { personId: string; hours: number }[],
  visible: ReadonlyMap<string, string>,
  limit: number,
): LeaderRow[] {
  return rankRows(
    stored
      .flatMap((entry) => {
        const handle = visible.get(entry.personId);
        return handle ? [{ handle, hours: entry.hours }] : [];
      })
      .slice(0, limit),
  );
}

// Depth is 1 m per approved hour. All time it is the depth reached; in a week it is the depth gained.
export function depthLabel(range: LeaderboardRange, approvedHours: number): string {
  return range === "week" ? `${Math.max(0, Math.floor(approvedHours))} M deeper` : formatDepth(approvedHours);
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
    note: "Depth is approved hours in metres, one metre for each hour. It is on your profile.",
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

// ---- Goals (CommunityGoal rows; the figures are staff-written) ----
// A goal counts the whole community's work toward one shared reward. The current figure and the target are written by staff
// (the reviewer site or the seed script); nothing counts up on its own, so a goal always reads as it was written.
export type CommunityGoalView = {
  id: string;
  key: string;
  title: string;
  body: string;
  current: number;
  target: number;
  // null means no end is set yet.
  endsAt: Date | null;
  closedAt: Date | null;
};

// Whole percent, rounded down so a goal never reads 100% before it is met. Clamped to 0..100; a target of zero or less is 0.
export function goalPercent(value: number, target: number): number {
  if (!(target > 0) || !(value > 0)) return 0;
  // A whole percentage can land just below its integer in binary floating point (29 / 100 * 100 is 28.999...), so nudge
  // the floor by a tiny epsilon. A goal that is not yet met still never reads 100%.
  if (value >= target) return 100;
  return Math.min(99, Math.floor((value * 100) / target + 1e-9));
}

// A goal states its figures in words; the bar beside them is decoration.
export function goalValueText(goal: Pick<CommunityGoalView, "current" | "target">): string {
  return `${goal.current.toLocaleString("en-GB")} of ${goal.target.toLocaleString("en-GB")}`;
}

// The fixture goals, kept only because reviewer-dash/lib/sample/content-data.ts (Pixl's sample store, owned by the reviewer
// site stream) reads its Era blurb from the first one. The participant pages read CommunityGoal rows now; this list is not
// shown to builders anywhere.
export type Goal = { id: string; title: string; text: string; unit: string; value: number; target: number; reward: string };

export const GOALS: readonly Goal[] = [
  {
    id: "era-threshold",
    title: "Meet the Era threshold",
    text: "Era Points from every finally approved project count toward the current Era. When the threshold is met and the Era has been open 14 days, it is ready to advance and the owner confirms.",
    unit: "Era Points",
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
    reward: "A one-use General Requisition for each builder who contributed.",
  },
  {
    id: "show-and-tell-reach",
    title: "Builders who showed a project",
    text: "Counts builders who have presented in a Show & Tell session.",
    unit: "builders",
    value: 14,
    target: 20,
    reward: "A shared collectible.",
  },
];

// ---- Events (Event rows; RSVP is a row in EventRsvp) ----
// An event's own words decide its window: RSVP is open from when it is announced until it ends. A stopped event never takes
// an RSVP (a stop is staff closing it early), and an event with no end time keeps taking them until it is stopped.
export type EventWindow = { startsAt: Date; endsAt: Date | null; stoppedAt: Date | null };

export type EventStatus = "upcoming" | "live" | "ended" | "stopped";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: "Upcoming",
  live: "Happens now",
  ended: "Ended",
  stopped: "Stopped",
};

export function eventStatus(event: EventWindow, now: Date = new Date()): EventStatus {
  if (event.stoppedAt) return "stopped";
  if (now < event.startsAt) return "upcoming";
  if (event.endsAt && now > event.endsAt) return "ended";
  return "live";
}

// RSVP is open until the end (an upcoming event takes them too), and only while the event is not stopped. The action checks
// this again before it writes, so a stale page cannot RSVP into a closed event.
export function isRsvpOpen(event: EventWindow, now: Date = new Date()): boolean {
  const status = eventStatus(event, now);
  return status === "live" || status === "upcoming";
}

export function rsvpCountText(count: number): string {
  if (count === 0) return "No builders going yet";
  return count === 1 ? "1 builder going" : `${count.toLocaleString("en-GB")} builders going`;
}
