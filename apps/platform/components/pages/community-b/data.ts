// Seed data and Draft preview rules for Leaderboards, Seasons and Events.
//
// Everything here is either (a) content the plans define, quoted with its source, or (b) a clearly labelled
// Draft preview rule or sample record. No value in this file is a program fact. The gaps are listed in SOURCES.md
// under "Unsettled by the plans".

import type { TrackName } from "../../../lib/sample/builders";
import { SAMPLE_BUILDERS } from "../../../lib/sample/builders";
import type { QuestDef } from "./logic/quests";
import type { EraConfig } from "./logic/era";
import type { BoardBuilder, Metric, PeriodTriple } from "./logic/standings";
import type { SeasonSpec } from "./logic/windows";
import { parseMs } from "./logic/dates";

/** Preview "now" a new visitor starts at. Never the real clock, so server and browser render the same text. */
export const PREVIEW_ANCHOR_ISO = "2026-10-20T12:00:00.000Z";

/**
 * The one place the Draft preview rules live. Each entry names the plan gap it fills. Change a rule here and
 * every page and test follows.
 */
export const DRAFT_RULES = {
  week: "Weeks run Monday 00:00 UTC to Sunday 24:00 UTC. Plan 11 leaves the reset time zone open.",
  calendar:
    "Season and Era dates are placeholders on a preview calendar so the rules can be tested. They are not a LOADOUT schedule.",
  streak:
    "A streak is the number of consecutive ISO weeks with at least one logged ship, review or journal entry. A week that has not ended yet does not break it, but the streak is marked at risk.",
  leaderboard:
    "Boards rank the highest value first with competition ranking (1, 2, 2, 4). A builder needs a value above zero to be ranked. Track scope on Ore, Reviews and Journal hours lists builders whose home track matches.",
  level: "Track level in the preview is one level per approved ship in that track, capped at 15. The real XP formula is open in Plan 02.",
  eraPointsPerShip: 120,
  eraPoints: "Only approved ships add Era Points (Plan 11). Each ship is worth a placeholder 120 points; the real formula is open.",
  certificate:
    "A preview certificate records attendance at a sample event. The wording and layout are a draft, and it is not an official LOADOUT record.",
  rsvp: "Seats are first come first served. A full event has a waitlist and the first person waiting takes a freed seat. RSVP closes when the event starts.",
} as const;

/** Where each rule sits in the plans, for the "How this works" notes. */
export const PLAN_NOTES = {
  seasons:
    "Plan 02 section 22: Season 00 runs 4 weeks, later Seasons 6 weeks after validation. Competitive Season rankings reset; lifetime Ore, Track XP and project history persist.",
  eras: "Plan 11: an Era lasts at least 14 days. It advances only when the minimum duration has passed and the community threshold is met, at a weekly reset.",
} as const;

// ---------------------------------------------------------------------------------------------------------
// Seasons (Plan 02 section 22: names and one-line themes are from the plan; dates are the preview calendar).
// ---------------------------------------------------------------------------------------------------------

export const SEASON_CALENDAR_START_ISO = "2026-10-05T00:00:00.000Z";

export interface SeasonInfo extends SeasonSpec {
  /** One line quoted from Plan 02. */
  theme: string;
}

export const SEASONS: SeasonInfo[] = [
  { id: "S00", name: "BOOT", weeks: 4, theme: "Build the first pieces of your technical stack." },
  {
    id: "S01",
    name: "TOOLCHAIN",
    weeks: 6,
    theme: "Developer tools, compilers, automation, debugging, workflow infrastructure.",
  },
  { id: "S02", name: "ACCELERATE", weeks: 6, theme: "Compute, GPU, graphics, optimization, ML systems, efficiency." },
  { id: "S03", name: "BARE METAL", weeks: 6, theme: "Embedded, FPGA, electronics, low-level systems." },
  { id: "S04", name: "NETWORK", weeks: 6, theme: "Networking, servers, protocols, distributed systems, deployment." },
  {
    id: "S05",
    name: "MEASURE",
    weeks: 6,
    theme: "Research Mode, benchmarks, profilers, test infrastructure, reproducible technical experiments.",
  },
];

export function seasonLabel(season: Pick<SeasonSpec, "id" | "name">): string {
  return `${season.id} // ${season.name}`;
}

// ---------------------------------------------------------------------------------------------------------
// Community Eras (Plan 11).
// ---------------------------------------------------------------------------------------------------------

export const ERA_SEQUENCE_NOTE = "STEAM, ELECTRIFICATION, COMPUTING, NETWORKS, ACCELERATION is an example sequence in Plan 11, not a launch order or a promise.";

export const ERA_CONFIG: EraConfig = {
  startMs: parseMs("2026-10-12T00:00:00.000Z"),
  minDays: 14,
  resetDays: 7,
  specs: [
    { id: "steam", name: "STEAM", sampleBaseline: 640, threshold: 1000 },
    { id: "electrification", name: "ELECTRIFICATION", sampleBaseline: 300, threshold: 1200 },
    { id: "computing", name: "COMPUTING", sampleBaseline: 250, threshold: 1400 },
    { id: "networks", name: "NETWORKS", sampleBaseline: 200, threshold: 1600 },
    { id: "acceleration", name: "ACCELERATION", sampleBaseline: 150, threshold: 1800 },
  ],
};

/** Plan 11 "Era objectives": examples for an Electrification-themed Era. Optional, never a guarantee of approval. */
export const ERA_OBJECTIVE_EXAMPLES: { name: string; text: string }[] = [
  { name: "Measure", text: "Collect or visualize physical data." },
  { name: "Control", text: "Build electronic control." },
  { name: "Automate", text: "Automate a physical or computational process." },
  { name: "Optimize", text: "Improve system efficiency or performance." },
];

/** Plan 11 "Seasons, Eras, and weekly resets" table. */
export const SYSTEM_DIFFERENCES: { system: string; meaning: string; reset: string }[] = [
  { system: "Season", meaning: "Competitive leaderboard and program period.", reset: "Season-specific ranks reset." },
  {
    system: "Era",
    meaning: "Shared technological progression.",
    reset: "Advances only when the threshold and the minimum duration are both satisfied at an eligible weekly reset.",
  },
  { system: "Weekly reset", meaning: "Schedule boundary.", reset: "Refreshes weekly missions and checks whether a ready Era may advance." },
];

// ---------------------------------------------------------------------------------------------------------
// Seasonal quests: Draft list (Plan 02 section 23 gives examples and says values are open).
// ---------------------------------------------------------------------------------------------------------

export const QUEST_DEFS: QuestDef[] = [
  {
    id: "boot-sequence",
    name: "BOOT SEQUENCE",
    blurb: "Do one of each thing the program is built on.",
    steps: [
      { id: "journal", label: "Write a journal entry", kind: "count", action: "journal", target: 1 },
      { id: "review", label: "Review another builder's ship", kind: "count", action: "review", target: 1 },
      { id: "ship", label: "Get a ship approved", kind: "count", action: "ship", target: 1 },
    ],
  },
  {
    id: "keep-a-log",
    name: "KEEP A LOG",
    blurb: "Journal as you build, not at the end.",
    steps: [{ id: "journal", label: "Write 5 journal entries", kind: "count", action: "journal", target: 5 }],
  },
  {
    id: "pay-it-back",
    name: "PAY IT BACK",
    blurb: "Peer review keeps payouts fair. Do your share.",
    steps: [{ id: "review", label: "Complete 4 reviews", kind: "count", action: "review", target: 4 }],
  },
  {
    id: "weekly-rhythm",
    name: "WEEKLY RHYTHM",
    blurb: "Show up week after week.",
    steps: [{ id: "streak", label: "Reach a 3 week streak", kind: "streak", target: 3 }],
  },
  {
    id: "double-ship",
    name: "DOUBLE SHIP",
    blurb: "Ship twice in one Season.",
    steps: [
      { id: "ship", label: "Get 2 ships approved", kind: "count", action: "ship", target: 2 },
      { id: "journal", label: "Write 2 journal entries", kind: "count", action: "journal", target: 2 },
    ],
  },
];

/** Plan 02 section 23 examples. They need reviewer or user verification the preview cannot do, so they are listed, not playable. */
export const PLAN_QUEST_EXAMPLES: { name: string; text: string }[] = [
  { name: "2X", text: "Improve a measured workload by 2x." },
  { name: "LOCAL", text: "Run something normally cloud-hosted on hardware you control." },
  { name: "FIRST PCB", text: "Design or order your first PCB." },
  { name: "SHIP TO SOMEONE", text: "Get another person to actually use or install your project." },
  { name: "100 USERS", text: "Reach 100 genuine users." },
  { name: "SMALLER", text: "Reduce a build, model or storage footprint significantly." },
];

// ---------------------------------------------------------------------------------------------------------
// Leaderboard sample standings.
// ---------------------------------------------------------------------------------------------------------

export interface MetricInfo {
  id: Metric;
  label: string;
  unit: string;
  /** Plan-backed boards are labelled by the plan section; others are Draft. */
  draft: boolean;
  note: string;
}

export const METRICS: MetricInfo[] = [
  {
    id: "level",
    label: "Track level",
    unit: "Level",
    draft: false,
    note: "Plan 02 lists Track boards. Levels cap at 15 and never reset, so the period does not change this board.",
  },
  {
    id: "ore",
    label: "Ore earned",
    unit: "Ore",
    draft: false,
    note: "Plan 02 lists Season Ore and Lifetime Ore boards. Your value is the Ore you earned in this browser.",
  },
  {
    id: "reviews",
    label: "Reviews given",
    unit: "Reviews",
    draft: true,
    note: "Draft. Plan 02's Review Contribution board is quality-weighted and not a raw count; this raw count is a preview stand-in.",
  },
  {
    id: "hours",
    label: "Journal hours",
    unit: "Hours",
    draft: true,
    note: "Draft. Plan 02's Hours board counts approved hours; this one counts hours covered by your journal entries.",
  },
];

interface ExtraBuilder {
  handle: string;
  name: string;
  track: TrackName;
  isPublic: boolean;
}

/**
 * More sample builders so the board has several pages. Invented for the preview, like SAMPLE_BUILDERS: no real
 * person. Two keep their standing private to show the privacy rule.
 */
const EXTRA_BUILDERS: ExtraBuilder[] = [
  { handle: "ola-stack", name: "Ola Stack", track: "Systems", isPublic: true },
  { handle: "pip-fab", name: "Pip Fab", track: "Hardware", isPublic: true },
  { handle: "quin-cache", name: "Quin Cache", track: "Compute", isPublic: true },
  { handle: "rho-bits", name: "Rho Bits", track: "Tools", isPublic: true },
  { handle: "sol-wire", name: "Sol Wire", track: "Hardware", isPublic: true },
  { handle: "tam-nodes", name: "Tam Nodes", track: "Systems", isPublic: false },
  { handle: "uma-shade", name: "Uma Shade", track: "Compute", isPublic: true },
  { handle: "vik-lint", name: "Vik Lint", track: "Tools", isPublic: true },
  { handle: "wen-fpga", name: "Wen Fpga", track: "Compute", isPublic: true },
  { handle: "xan-rack", name: "Xan Rack", track: "Systems", isPublic: true },
  { handle: "yui-servo", name: "Yui Servo", track: "Hardware", isPublic: false },
  { handle: "zed-heap", name: "Zed Heap", track: "Systems", isPublic: true },
  { handle: "abe-diff", name: "Abe Diff", track: "Tools", isPublic: true },
  { handle: "bea-ray", name: "Bea Ray", track: "Compute", isPublic: true },
];

/** Deterministic pseudo-random number in [0, 1) from an index and a salt. No Math.random, so renders match. */
export function mix(index: number, salt: number): number {
  let h = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function triple(all: number, seasonShare: number, weekShare: number, step: number): PeriodTriple {
  const season = Math.min(all, roundTo(all * seasonShare, step));
  const week = Math.min(season, roundTo(season * weekShare, step));
  return { week, season, all };
}

/**
 * Standings for the sample builders. Numbers are invented and stable. Week <= Season <= All time for every
 * builder, and values are coarse on purpose so ties happen and the shared-rank rule is visible.
 */
export function sampleBoardBuilders(): BoardBuilder[] {
  const people: ExtraBuilder[] = [
    ...SAMPLE_BUILDERS.map((b) => ({ handle: b.handle, name: b.name, track: b.track, isPublic: true })),
    ...EXTRA_BUILDERS,
  ];
  return people.map((person, i) => {
    const primary = 2 + Math.floor(mix(i, 1) * 12);
    const other = Math.max(1, Math.floor(primary / 3));
    const levels = { Tools: other, Systems: other, Compute: other, Hardware: other } as Record<TrackName, number>;
    levels[person.track] = primary;
    const oreAll = 300 + Math.floor(mix(i, 2) * 100) * 50;
    const reviewsAll = 4 + Math.floor(mix(i, 3) * 60);
    const hoursAll = 10 + Math.floor(mix(i, 4) * 190);
    return {
      handle: person.handle,
      name: person.name,
      track: person.track,
      isYou: false,
      isPublic: person.isPublic,
      stats: {
        levels,
        ore: triple(oreAll, 0.2 + mix(i, 5) * 0.3, 0.1 + mix(i, 6) * 0.3, 10),
        reviews: triple(reviewsAll, 0.2 + mix(i, 7) * 0.3, 0.15 + mix(i, 8) * 0.3, 1),
        hours: triple(hoursAll, 0.2 + mix(i, 9) * 0.3, 0.15 + mix(i, 10) * 0.3, 1),
      },
    };
  });
}

// ---------------------------------------------------------------------------------------------------------
// Events.
// ---------------------------------------------------------------------------------------------------------

export interface SampleEvent {
  id: string;
  title: string;
  /** UTC start, ISO. */
  startsAt: string;
  durationMin: number;
  capacity: number;
  baseGoing: number;
  baseWaitlist: number;
  blurb: string;
}

/**
 * Four invented online events. They are samples to exercise RSVP, capacity, waitlist, calendar export and
 * certificates. They are not scheduled LOADOUT events. Dates sit just after the preview anchor.
 */
export const SAMPLE_EVENTS: SampleEvent[] = [
  {
    id: "sample-build-night",
    title: "Build night",
    startsAt: "2026-10-22T18:00:00.000Z",
    durationMin: 120,
    capacity: 30,
    baseGoing: 12,
    baseWaitlist: 0,
    blurb: "Co-working call. Bring a project, work in the open and write one journal entry before you leave.",
  },
  {
    id: "sample-review-sprint",
    title: "Review sprint",
    startsAt: "2026-10-24T15:00:00.000Z",
    durationMin: 90,
    capacity: 12,
    baseGoing: 12,
    baseWaitlist: 2,
    blurb: "A focused session to clear the review queue together. Small room, so it fills and keeps a waitlist.",
  },
  {
    id: "sample-demo-hour",
    title: "Demo hour",
    startsAt: "2026-10-29T17:00:00.000Z",
    durationMin: 60,
    capacity: 25,
    baseGoing: 9,
    baseWaitlist: 0,
    blurb: "Three minutes each to show something you built this week. Questions welcome, polish optional.",
  },
  {
    id: "sample-bench-hour",
    title: "Bench hour",
    startsAt: "2026-11-05T17:00:00.000Z",
    durationMin: 90,
    capacity: 8,
    baseGoing: 7,
    baseWaitlist: 0,
    blurb: "Show-and-tell for boards, wiring and measurements, with a few seats left.",
  },
];

/** Plan 15 / future-platform-ui.md content only. Nothing here is a confirmed fact. */
export const IRL_PLANNED = {
  title: "LOADOUT IRL // RUHR",
  line: "Build the next Era.",
  status: "Planned, details unconfirmed",
  points: [
    "A future concept: a proposed Friday to Sunday build weekend in Germany's Ruhr area.",
    "The date, city and venue, funding, travel support and registration are not confirmed.",
    "There is no RSVP and nothing to apply for yet. Attending would never be required to progress online.",
    "Projects from the weekend would use the normal review and the same shared Community Era.",
  ],
} as const;
