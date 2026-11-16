import type {
  AuditSections,
  AuditVerdict,
  ChangeReason,
  JournalAction,
  ProjectType,
  ReviewAudit,
  ReviewCommit,
  ReviewEvidence,
  ReviewJournal,
  ReviewShip,
} from "./review";
import type { Track } from "./progress";

// Generated sample data so the reviewer lists have more than one page. Deterministic: the same lists on every load, no random
// calls, no dates read from the clock. Everything is invented: handles are made of two invented words, repositories sit on
// .example hosts, and nothing here is a real person, account or address. Ids start at sh-3101 so they never meet the
// hand-written samples (sh-2041 to sh-2057), whose roles (the double dip, the hold, the claim, the assignment) stay unique.
// This file imports types only, so review-fixtures.ts can spread its lists without a cycle.

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const NOW = Date.UTC(2026, 10, 15, 14, 0, 0);
const dayLabel = (hoursAgo: number): string => {
  const date = new Date(NOW - hoursAgo * 3_600_000);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
};

// ---- People ----

const PREFIXES = ["amber", "birch", "cinder", "dapple", "ember", "flint", "gorse", "heron", "ivory", "juniper", "kelp", "larch"];
const SUFFIXES = ["wren", "fox", "moth", "reed", "lark"];
export const BULK_HANDLES: readonly string[] = PREFIXES.flatMap((prefix) => SUFFIXES.map((suffix) => `${prefix}${suffix}`));

const COUNTRIES = ["United Kingdom", "Germany", "United States", "Canada", "Poland", "Netherlands", "France", "India", "Australia", "Sweden"];

// ---- Ships ----

type Kind = "software" | "hardware";
type Mix = { status: ReviewShip["status"]; count: number };
// 70 ships. Order matters only for the ids; kinds and tracks are spread by index.
const MIX: readonly Mix[] = [
  { status: "waiting", count: 30 },
  { status: "needs-changes", count: 14 },
  { status: "approved", count: 20 },
  { status: "spot-check", count: 3 },
  { status: "proposed-ban", count: 1 },
  { status: "banned", count: 2 },
];

const SOFT_TRACKS: readonly Track[] = ["Tools", "Systems", "Compute", "Tools", "Systems"];
const SOFT_TYPES: readonly ProjectType[] = ["web", "windows", "mac", "linux", "cross_platform", "python", "other"];
const LANGS: readonly (readonly [string, number][])[] = [
  [["Rust", 78], ["TOML", 12], ["Markdown", 10]],
  [["TypeScript", 70], ["CSS", 20], ["HTML", 10]],
  [["Python", 85], ["Markdown", 15]],
  [["C", 74], ["Makefile", 14], ["Markdown", 12]],
  [["Go", 80], ["Markdown", 20]],
];
const SOFT_NOUNS = ["tracer", "linter", "profiler", "scheduler", "parser", "emulator", "visualiser", "indexer", "sandbox", "planner", "compressor", "monitor", "router", "formatter", "debugger"];
const SOFT_MODS = ["Tiny", "Careful", "Offline", "Streaming", "Embedded", "Versioned", "Sandboxed", "Cached", "Typed", "Portable", "Incremental", "Deterministic"];
const HARD_NOUNS = ["logger", "controller", "tester", "driver board", "sensor node", "programmer", "display module", "power supply", "probe"];
const HARD_MODS = ["Battery", "Bench", "Pocket", "Low-power", "Modular", "Calibrated", "Mains-isolated", "Open"];
const PARTS = ["Microcontroller board", "Voltage regulator", "Level shifter", "Connector, 2.54 mm", "Resistor kit", "Capacitor kit", "OLED display module", "Custom PCB, 2 layer"];
const SOURCES = ["Online electronics distributor", "Local hardware shop", "Board house, ordered from my design files", "Salvaged from an old kit"];
const FIRST_PASSERS: Record<Kind, readonly string[]> = { software: ["tamsin", "saltmarsh", "lintel"], hardware: ["fenwick", "lintel"] };
const FINAL: Record<Kind, string> = { software: "bellwether", hardware: "orrery" };
const REASONS: readonly ChangeReason[] = ["readme", "hours", "other", "track", "readme", "ai"];
const REASON_TEXT: Record<ChangeReason, string> = {
  track: "The work does not fit this track. Add more work in the track or change the project's track, then ship again.",
  readme: "The README does not say how to build or run it. Add the steps and a note on what works, then ship again.",
  hours: "The hours are more than the history supports. Describe what happened in the long entries, then ship again.",
  ai: "More of this is generated than the declaration says. Show your own work in the commits and update the declaration.",
  other: "The demo link does not open. Fix it, and add a screenshot to the README, then ship again.",
};

const entry = (day: string, minutes: number, text: string, action?: JournalAction, keptMinutes?: number, reason?: string): ReviewJournal => ({ day, minutes, text, action, keptMinutes, reason });

function shaFor(seed: string, index: number): string {
  let hash = 2166136261;
  for (const char of `${seed}:${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(16).padStart(8, "0").slice(0, 7);
}

type Plan = {
  index: number;
  id: string;
  kind: Kind;
  status: ReviewShip["status"];
  builder: string;
  title: string;
  track: Track;
  projectType: ProjectType;
  isGame: boolean;
  // When the verdict (or the first pass) was given, for the shipped states. Older than every hand-written verdict.
  verdictHoursAgo: number;
  submittedHoursAgo: number;
  firstPass: string;
  final: string;
};

function plans(): Plan[] {
  const out: Plan[] = [];
  const next = rng(3101);
  let index = 0;
  for (const mix of MIX) {
    for (let n = 0; n < mix.count; n += 1) {
      const kind: Kind = index % 5 === 4 ? "hardware" : "software";
      const track: Track = kind === "hardware" ? "Hardware" : SOFT_TRACKS[index % SOFT_TRACKS.length];
      const title = kind === "hardware" ? `${HARD_MODS[index % HARD_MODS.length]} ${HARD_NOUNS[(index * 3) % HARD_NOUNS.length]}` : `${SOFT_MODS[index % SOFT_MODS.length]} ${SOFT_NOUNS[(index * 7) % SOFT_NOUNS.length]}`;
      const waiting = mix.status === "waiting";
      // Waiting ships have short waits, so the hand-written queue rows (12 hours and up) stay first. The others were decided 850
      // to 1,900 hours ago, so they sort after the hand-written verdicts too.
      const verdictHoursAgo = waiting ? 0 : 850 + Math.floor(next() * 1050);
      out.push({
        index,
        id: `sh-${3101 + index}`,
        kind,
        status: mix.status,
        builder: BULK_HANDLES[(index * 7 + 3) % BULK_HANDLES.length],
        title: `${title} ${index + 1}`,
        track,
        projectType: kind === "hardware" ? "hardware" : SOFT_TYPES[index % SOFT_TYPES.length],
        isGame: kind === "software" && index % 11 === 0,
        verdictHoursAgo,
        submittedHoursAgo: waiting ? 1 + (index % 11) : verdictHoursAgo + 30 + Math.floor(next() * 150),
        firstPass: FIRST_PASSERS[kind][index % FIRST_PASSERS[kind].length],
        final: FINAL[kind],
      });
      index += 1;
    }
  }
  return out;
}

const PLANS = plans();

function buildShip(plan: Plan): ReviewShip {
  const next = rng(9000 + plan.index);
  const base = plan.submittedHoursAgo + 24 * 9;
  const minutesEach = [0, 1, 2].map(() => 240 + 60 * Math.floor(next() * 5));
  const days = [0, 1, 2].map((n) => dayLabel(base - n * 72));
  const judged = plan.status === "approved" || plan.status === "spot-check";
  const rejected = plan.status === "needs-changes";
  const journals = minutesEach.map((minutes, n): ReviewJournal => {
    const text = `Worked on part ${n + 1} of ${plan.title}: ${n === 0 ? "the core loop and a first test" : n === 1 ? "the second part and the edge cases" : "cleanup, the README and a demo"}.`;
    if (rejected) return entry(days[n], minutes, text, "reject");
    if (!judged) return entry(days[n], minutes, text);
    // One in four judged ships has a lowered entry, so the deflation reason and the partial rows have something to show.
    if (n === 2 && plan.index % 4 === 0) return entry(days[n], minutes, text, "partial", minutes - 60, "About an hour of this entry is idle time.");
    return entry(days[n], minutes, text, "approve-all");
  });
  const journaled = journals.reduce((sum, item) => sum + item.minutes, 0);
  const tracked = journaled + 60 + 15 * (plan.index % 5);
  const kept = journals.reduce((sum, item) => sum + (item.action === "approve-all" ? item.minutes : item.action === "partial" ? (item.keptMinutes ?? 0) : 0), 0);

  const evidence: ReviewEvidence =
    plan.kind === "software"
      ? {
          source: "hackatime",
          projects: [{ name: plan.id.replace("sh-", "proj-"), minutes: tracked, sessions: Math.max(1, Math.round(tracked / 55)), first: days[2], last: days[0] }],
          languages: LANGS[plan.index % LANGS.length].map(([name, percent]) => ({ name, percent })),
          trust: plan.index % 13 === 5 ? "yellow" : "green",
        }
      : {
          source: "lapse",
          recordings: journals.map((item) => ({ day: item.day, minutes: item.minutes + 15 })),
          bom: [0, 1, 2].map((n) => ({ part: PARTS[(plan.index + n * 3) % PARTS.length], qty: 1 + ((plan.index + n) % 3), source: SOURCES[(plan.index + n) % SOURCES.length] })),
          photos: [{ day: days[0], caption: "The assembled board on the bench" }],
          designFiles: [`pcb/${plan.id}.kicad_pcb`, `pcb/${plan.id}.kicad_sch`],
        };

  const repo = `git.example/${plan.builder}/${plan.id}`;
  const commits: ReviewCommit[] = journals.flatMap((item, n) => [
    { sha: shaFor(plan.id, n * 2), day: item.day, message: `Work for ${item.day}: first pass`, author: plan.builder, additions: 120 + 40 * n, deletions: 6 * n, codedMinutes: plan.kind === "software" ? Math.round(item.minutes / 2) : null },
    { sha: shaFor(plan.id, n * 2 + 1), day: item.day, message: `Work for ${item.day}: fixes and tests`, author: plan.builder, additions: 60 + 10 * n, deletions: 20, codedMinutes: plan.kind === "software" ? Math.round(item.minutes / 3) : null },
  ]);

  const ship: ReviewShip = {
    id: plan.id,
    title: plan.title,
    builder: plan.builder,
    kind: plan.kind,
    projectType: plan.projectType,
    isGame: plan.isGame,
    track: plan.track,
    researchMode: false,
    status: plan.status,
    submittedHoursAgo: plan.submittedHoursAgo,
    claimedBy: null,
    capability: `A small ${plan.kind === "hardware" ? "board" : "tool"} that does one job well: ${plan.title.toLowerCase()}, with notes on what it cannot do.`,
    evidence,
    journals,
    ai: plan.index % 6 === 2 ? { percent: 10, uses: ["Debugging"], note: "Asked a model to explain an error message." } : { percent: 0, uses: [], note: "No AI used." },
    source: repo,
    demo: plan.kind === "software" && plan.index % 3 === 0 ? `${plan.builder}.example/${plan.id}` : null,
    commits,
    readme: plan.index % 7 === 3 ? null : { title: plan.id, sections: [{ heading: "What it is", text: `${plan.title}. A sample README.` }, { heading: "Limits", text: "Sample data. Nothing here is real." }] },
    notes: [],
    builderAge: 13 + (plan.index % 6),
    builderCountry: COUNTRIES[plan.index % COUNTRIES.length],
  };

  const note = `Sample note for ${plan.title}: ${rejected ? REASON_TEXT[REASONS[plan.index % REASONS.length]] : "the work is real and the hours match the history."}`;
  if (plan.status === "approved") {
    ship.firstPass = { by: plan.firstPass, hoursAgo: plan.verdictHoursAgo + 10, verdict: "approved", minutes: kept, note };
    ship.decision = { outcome: "approved", by: plan.final, hoursAgo: plan.verdictHoursAgo, reason: note };
  } else if (plan.status === "needs-changes") {
    const reasonCode = REASONS[plan.index % REASONS.length];
    ship.decision = { outcome: "needs-changes", by: plan.firstPass, hoursAgo: plan.verdictHoursAgo, reason: REASON_TEXT[reasonCode], reasonCode };
  } else if (plan.status === "spot-check") {
    ship.firstPass = { by: plan.firstPass, hoursAgo: plan.verdictHoursAgo, verdict: "approved", minutes: kept, note };
  } else if (plan.status === "proposed-ban") {
    ship.firstPass = { by: plan.firstPass, hoursAgo: plan.verdictHoursAgo, verdict: "banned", minutes: null, note: "Proposing a ban. The history does not support the hours, and the first commit is one large import." };
  } else if (plan.status === "banned") {
    ship.firstPass = { by: plan.firstPass, hoursAgo: plan.verdictHoursAgo + 20, verdict: "banned", minutes: null, note: "Proposing a ban. The files match another public project." };
    ship.ban = { by: "bellwether", hoursAgo: plan.verdictHoursAgo, reason: "The files match another public project and the history was removed. Confirmed by an owner." };
  }
  return ship;
}

// Not frozen by value: a ship is built once and shared.
export const BULK_SHIPS: readonly ReviewShip[] = PLANS.map(buildShip);

// ---- Audits ----

type AuditSeed = Omit<ReviewAudit, "sections"> & { sections?: AuditSections };

function makeAudit(n: number, ship: ReviewShip, reviewer: string, verdict: AuditVerdict, hoursAgo: number, approved: number | null, note: string, withSections: boolean): AuditSeed {
  const claimed = ship.journals.reduce((sum, item) => sum + item.minutes, 0);
  const next = rng(40_000 + n);
  const seconds = 240 + Math.floor(next() * 1100);
  return {
    id: `au-b${String(n).padStart(3, "0")}`,
    ship: ship.id,
    reviewer,
    verdict,
    hoursAgo,
    claimedMinutes: claimed,
    approvedMinutes: approved,
    seconds,
    repoSeconds: next() < 0.85 ? Math.floor(seconds * 0.5) : null,
    demoSeconds: ship.demo && next() < 0.7 ? Math.floor(seconds * 0.2) : null,
    note,
    sections: withSections
      ? {
          technical: `A ${ship.kind === "hardware" ? "board" : "tool"} called ${ship.title}. The repository has a README, the source and ${ship.commits.length} commits that match the journal entries. The core part was written by the builder.`,
          notes: "Checked the commits against the journals and the hours against the tracked time. Nothing stood out.",
        }
      : undefined,
  };
}

function buildAudits(): AuditSeed[] {
  const out: AuditSeed[] = [];
  let n = 1;
  const add = (ship: ReviewShip, reviewer: string, verdict: AuditVerdict, hoursAgo: number, approved: number | null, note: string, sections = true) => {
    out.push(makeAudit(n, ship, reviewer, verdict, hoursAgo, approved, note, sections));
    n += 1;
  };
  for (const ship of BULK_SHIPS) {
    const plan = PLANS[BULK_SHIPS.indexOf(ship)];
    const credit = ship.journals.reduce((sum, item) => sum + (item.action === "approve-all" ? item.minutes : item.action === "partial" ? (item.keptMinutes ?? 0) : 0), 0);
    if (ship.status === "approved" && ship.decision && ship.firstPass) {
      // An earlier round that was sent back, then the first pass and the final approval.
      add(ship, plan.firstPass, "needs_changes", ship.decision.hoursAgo + 140, 0, "Sent back once: the README did not say how to run it. It does now.", false);
      add(ship, plan.firstPass, "first_pass_approved", ship.firstPass.hoursAgo, credit, ship.firstPass.note);
      add(ship, plan.final, "approved", ship.decision.hoursAgo, credit, ship.decision.reason);
    } else if (ship.status === "needs-changes" && ship.decision) {
      add(ship, plan.firstPass, "needs_changes", ship.decision.hoursAgo, 0, ship.decision.reason);
      if (plan.index % 3 === 0) add(ship, plan.firstPass, "needs_changes", ship.decision.hoursAgo + 200, 0, "A first look: the demo did not open. Asked for a fix.", false);
    } else if (ship.status === "spot-check" && ship.firstPass) {
      add(ship, plan.firstPass, "first_pass_approved", ship.firstPass.hoursAgo, credit, ship.firstPass.note);
    } else if (ship.status === "proposed-ban" && ship.firstPass) {
      add(ship, plan.firstPass, "first_pass_banned", ship.firstPass.hoursAgo, null, ship.firstPass.note);
    } else if (ship.status === "banned" && ship.firstPass && ship.ban) {
      add(ship, plan.firstPass, "first_pass_banned", ship.firstPass.hoursAgo, null, ship.firstPass.note);
      add(ship, "bellwether", "banned", ship.ban.hoursAgo, null, ship.ban.reason);
    } else if (ship.status === "waiting") {
      // A waiting ship that was sent back on an earlier version: the past review shows on its desk page.
      add(ship, plan.firstPass, "needs_changes", 900 + plan.index * 20, 0, "An earlier version was sent back for a missing README. This one is waiting for a new first pass.", false);
    }
  }
  return out;
}

export const BULK_AUDITS: readonly ReviewAudit[] = buildAudits().sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id));

// ---- Players, projects, orders, tickets, reports: plain seed rows that each module turns into its own type ----

export type PlayerSeed = { handle: string; joinedDaysAgo: number; lastActiveHoursAgo: number; approved: [tools: number, systems: number, compute: number, hardware: number]; orders: number };

export const BULK_PLAYERS: readonly PlayerSeed[] = BULK_HANDLES.map((handle, i): PlayerSeed => {
  const next = rng(70_000 + i);
  const ship = BULK_SHIPS.filter((item) => item.builder === handle && item.status === "approved");
  const hours = ship.reduce((sum, item) => sum + Math.floor(item.journals.reduce((s, j) => s + (j.action === "approve-all" ? j.minutes : (j.keptMinutes ?? 0)), 0) / 60), 0);
  // Enough approved hours that a small order is covered; the ships above add to the first track.
  const base = 40 + (i % 5) * 10;
  return { handle, joinedDaysAgo: 20 + Math.floor(next() * 60), lastActiveHoursAgo: 1 + Math.floor(next() * 400), approved: [base + hours, base, base, base], orders: 0 };
});

export type ProjectSeed = { number: number; title: string; owner: string; kind: Kind; track: Track; stage: "draft" | "logging"; minutes: number; lastActiveHoursAgo: number };

export const BULK_PROJECTS: readonly ProjectSeed[] = Array.from({ length: 40 }, (_, i): ProjectSeed => {
  const kind: Kind = i % 5 === 4 ? "hardware" : "software";
  const stage = i % 3 === 0 ? "draft" : "logging";
  return {
    number: 5001 + i,
    title: `${kind === "hardware" ? HARD_MODS[(i + 2) % HARD_MODS.length] : SOFT_MODS[(i + 5) % SOFT_MODS.length]} ${kind === "hardware" ? HARD_NOUNS[(i * 5) % HARD_NOUNS.length] : SOFT_NOUNS[(i * 4 + 1) % SOFT_NOUNS.length]} (work in progress ${i + 1})`,
    owner: BULK_HANDLES[(i * 11 + 5) % BULK_HANDLES.length],
    kind,
    track: kind === "hardware" ? "Hardware" : SOFT_TRACKS[i % SOFT_TRACKS.length],
    stage,
    minutes: stage === "draft" ? 0 : 120 + 30 * (i % 9),
    lastActiveHoursAgo: 2 + ((i * 13) % 300),
  };
});

export type OrderSeed = { number: number; buyer: string; country: string; status: "new" | "claimed" | "packed" | "shipped" | "delivered" | "cancelled"; placedHoursAgo: number; items: [itemId: string, quantity: number][]; assignee: string };

const ORDER_ITEMS = ["screwdriver-set", "samsung-t7-ssd", "ergonomic-mouse", "book-grant"];
const ORDER_STATUSES: readonly OrderSeed["status"][] = ["new", "new", "claimed", "packed", "shipped", "delivered", "delivered", "cancelled"];
const FULFILLER_IDS = ["deskcrate"];

export const BULK_ORDERS: readonly OrderSeed[] = Array.from({ length: 34 }, (_, i): OrderSeed => {
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length];
  const placedHoursAgo = status === "new" ? 1 + (i % 20) : 250 + i * 17;
  return {
    number: 2001 + i,
    buyer: BULK_HANDLES[(i * 7 + 2) % BULK_HANDLES.length],
    country: COUNTRIES[i % COUNTRIES.length],
    status,
    placedHoursAgo,
    items: [[ORDER_ITEMS[i % ORDER_ITEMS.length], 1]],
    assignee: FULFILLER_IDS[i % FULFILLER_IDS.length],
  };
});

export type TicketSeed = { number: number; subject: string; builder: string; order: number | null; hoursAgo: number; resolved: boolean; helper: string };
const TICKET_SUBJECTS = ["A question about my order", "The parcel has not arrived", "I changed my address", "Which hours count toward an order", "A part was missing from the box", "How do I change my track"];
export const BULK_TICKETS: readonly TicketSeed[] = Array.from({ length: 32 }, (_, i): TicketSeed => ({
  number: 401 + i,
  subject: `${TICKET_SUBJECTS[i % TICKET_SUBJECTS.length]} (sample ${i + 1})`,
  builder: BULK_ORDERS[i % BULK_ORDERS.length].buyer,
  order: i % 3 === 0 ? BULK_ORDERS[i % BULK_ORDERS.length].number : null,
  hoursAgo: 30 + i * 21,
  resolved: i % 3 !== 1,
  helper: ["tamsin", "saltmarsh", "examplehelp"][i % 3],
}));

export type ReportSeed = { number: number; title: string; kind: "project" | "post"; where: string; owner: string; reporter: string; anonymous: boolean; reason: "kind" | "own-work" | "private" | "safe" | "spam" | "honest" | "other"; hoursAgo: number; status: "open" | "resolved" | "dismissed"; handler: string };
const REPORT_REASONS: readonly ReportSeed["reason"][] = ["kind", "own-work", "private", "spam", "honest", "safe", "other"];
export const BULK_REPORTS: readonly ReportSeed[] = Array.from({ length: 32 }, (_, i): ReportSeed => ({
  number: 401 + i,
  title: i % 2 === 0 ? `${SOFT_MODS[i % SOFT_MODS.length]} ${SOFT_NOUNS[(i * 2) % SOFT_NOUNS.length]} (sample ${i + 1})` : `Reply on a sample idea (${i + 1})`,
  kind: i % 2 === 0 ? "project" : "post",
  where: i % 2 === 0 ? "Explore" : "Ideas",
  owner: BULK_HANDLES[(i * 3 + 1) % BULK_HANDLES.length],
  reporter: BULK_HANDLES[(i * 9 + 4) % BULK_HANDLES.length],
  anonymous: i % 4 === 0,
  reason: REPORT_REASONS[i % REPORT_REASONS.length],
  hoursAgo: 40 + i * 25,
  status: i % 3 === 0 ? "dismissed" : i % 3 === 1 ? "resolved" : "open",
  handler: ["lintel", "saltmarsh", "tamsin"][i % 3],
}));
