import { TRACKS, type Track } from "./progress";
import { trackBySlug } from "./tracks";

// Expeditions are LOADOUT's guided missions (plans/11 "Missions"): a curated sequence of steps toward a defined project or
// skill, with prerequisites where they help, a submission for review, and a configured achievement or Ore reward. They are
// not seasonal quests (short optional challenges) and not Era objectives (themes of the active Community Era), and there is
// no map, no characters and no chance. Nothing is stored: the list below is a proposed fixture, the progress is a sample
// and every reward is a draft until the owner sets it (plan 02 leaves mission and quest values open).

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type MissionStep = { title: string; detail: string };

// A draft reward. Achievement names come from plan 02 section 21; the Ore figures are placeholders and the pages say so.
export type MissionReward = { ore?: number; achievement?: string };

export type Mission = {
  id: string;
  name: string;
  summary: string;
  track: Track;
  difficulty: Difficulty;
  // A rough guide for the builder, in hours of real work. Not a rule and not paid by itself.
  hours: number;
  steps: readonly MissionStep[];
  // Missions to finish first, by id.
  prerequisites: readonly string[];
  // What the builder sends in at the end, as a plain list.
  submission: readonly string[];
  reward: MissionReward;
};

export const MISSION_STATUSES = ["in-progress", "available", "locked", "done"] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

// The labels group headings and filters use. "Locked" says why in the page text.
export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  "in-progress": "In progress",
  available: "Available",
  locked: "Locked behind a prerequisite",
  done: "Done",
};

// Shorter names for the filter chips.
export const MISSION_STATUS_CHIPS: Record<MissionStatus, string> = {
  "in-progress": "In progress",
  available: "Available",
  locked: "Locked",
  done: "Done",
};

export const MISSIONS: readonly Mission[] = [
  // Tools
  {
    id: "first-tool",
    name: "Build your first tool",
    summary: "Fix one small, real annoyance with a command-line tool other people could install.",
    track: "Tools",
    difficulty: "Beginner",
    hours: 6,
    steps: [
      { title: "Pick the annoyance", detail: "Write down one repeated chore in your own workflow that a tool could remove." },
      { title: "Make it work once", detail: "Get a first version running on your machine, however rough." },
      { title: "Add tests", detail: "Cover the main path and one failure, so you can change it safely." },
      { title: "Write the README", detail: "Say what it does, how to install it and how to run it, in that order." },
      { title: "Hand it to one person", detail: "Watch someone else install it and note where they got stuck." },
    ],
    prerequisites: [],
    submission: ["A public repository with an open-source licence", "A README with install and usage steps", "A journal entry about what the first user found hard"],
    reward: { ore: 30, achievement: "FIRST TOOL" },
  },
  {
    id: "profile-it",
    name: "Profile before you optimise",
    summary: "Find where a program really spends its time, change one thing and prove it got faster.",
    track: "Tools",
    difficulty: "Intermediate",
    hours: 8,
    steps: [
      { title: "Pick a slow program", detail: "Choose something of yours, or an open-source tool, that feels slower than it should." },
      { title: "Measure the baseline", detail: "Record a repeatable timing or profile before you touch anything." },
      { title: "Find the hot spot", detail: "Use a profiler to name the one place most of the time goes." },
      { title: "Change one thing", detail: "Make a single targeted change and keep the rest the same." },
    ],
    prerequisites: ["first-tool"],
    submission: ["The before and after measurements", "The profile or trace that pointed at the hot spot", "A short write-up of what changed and why"],
    reward: { ore: 40, achievement: "CLOCKED" },
  },
  {
    id: "toolmaker",
    name: "Ship a tool someone else uses",
    summary: "Release a tool, tell the people it is for and keep it working while they use it.",
    track: "Tools",
    difficulty: "Intermediate",
    hours: 10,
    steps: [
      { title: "Name who it is for", detail: "Write one sentence about the person who would use it and what they do today." },
      { title: "Package it", detail: "Make it installable with one command on a clean machine." },
      { title: "Share it", detail: "Post it where that person already looks, not only where your friends are." },
      { title: "Fix what they report", detail: "Answer at least one real issue or message and ship the fix." },
    ],
    prerequisites: ["first-tool"],
    submission: ["A link to where it was shared", "Evidence that someone outside your team used it", "The fix you made after their report"],
    reward: { achievement: "TOOLMAKER" },
  },
  // Systems
  {
    id: "serve-it",
    name: "Serve it yourself",
    summary: "Run a small service that is normally hosted for you on a machine you control.",
    track: "Systems",
    difficulty: "Beginner",
    hours: 6,
    steps: [
      { title: "Choose a service", detail: "Pick something small and self-hostable: a wiki, a feed reader, a file share." },
      { title: "Set up the machine", detail: "Use a Raspberry Pi, an old laptop or a small VPS, and lock it down." },
      { title: "Deploy it", detail: "Get the service running behind a proper address with HTTPS." },
      { title: "Back it up", detail: "Restore it once from a backup to prove the backup works." },
    ],
    prerequisites: [],
    submission: ["A description of the machine and how it is secured", "Proof the service is reachable", "A note from the restore test"],
    reward: { ore: 40 },
  },
  {
    id: "packet-pusher",
    name: "Speak a protocol",
    summary: "Read a small network protocol's specification and write a client that talks to a real server.",
    track: "Systems",
    difficulty: "Intermediate",
    hours: 10,
    steps: [
      { title: "Pick a small protocol", detail: "Something with a short specification, such as a simple text or binary protocol." },
      { title: "Read the specification", detail: "Summarise the message format and the handshake in your own words." },
      { title: "Capture real traffic", detail: "Record a session with a packet tool and match it to the specification." },
      { title: "Write the client", detail: "Send and parse messages without a high-level library doing it for you." },
      { title: "Handle a bad reply", detail: "Make the client fail clearly when the server sends something unexpected." },
    ],
    prerequisites: ["serve-it"],
    submission: ["Your client's source code", "A capture that shows it working", "Notes on where the specification was unclear"],
    reward: { ore: 50, achievement: "PACKET PUSHER" },
  },
  {
    id: "bare-metal",
    name: "Bare metal boot",
    summary: "Make a machine run your code with no operating system underneath it.",
    track: "Systems",
    difficulty: "Advanced",
    hours: 16,
    steps: [
      { title: "Choose a target", detail: "Pick a board or emulator with documentation you can read." },
      { title: "Boot to a blinking light", detail: "Write the smallest program that proves your code is running." },
      { title: "Print to a serial port", detail: "Get text out so you can see what the machine is doing." },
      { title: "Handle an interrupt", detail: "Set up one interrupt, such as a timer, and react to it." },
      { title: "Document the memory map", detail: "Explain where your code, stack and devices live." },
    ],
    prerequisites: ["packet-pusher"],
    submission: ["The source and the build steps", "A recording or log of it running", "A diagram of the memory map"],
    reward: { ore: 80, achievement: "BARE METAL" },
  },
  // Compute
  {
    id: "benchmarked",
    name: "Measure it properly",
    summary: "Benchmark a workload so that someone else can repeat the numbers and trust them.",
    track: "Compute",
    difficulty: "Beginner",
    hours: 6,
    steps: [
      { title: "Choose a workload", detail: "Pick a computation you can run many times, such as a sort, a render or an inference." },
      { title: "Fix the conditions", detail: "Record the machine, the settings and the input so the run can be repeated." },
      { title: "Run it enough times", detail: "Report a spread, not a single lucky number." },
      { title: "Publish the method", detail: "Write down how to repeat the benchmark from scratch." },
    ],
    prerequisites: [],
    submission: ["The benchmark code", "Your results with the spread", "A methods section another builder could follow"],
    reward: { ore: 30, achievement: "BENCHMARKED" },
  },
  {
    id: "local-brain",
    name: "Run a model locally",
    summary: "Get a language or vision model running on hardware you own and measure what it costs.",
    track: "Compute",
    difficulty: "Intermediate",
    hours: 10,
    steps: [
      { title: "Pick a small model", detail: "Choose one that fits in the memory you have." },
      { title: "Run it", detail: "Get a first answer out of it without calling an outside service." },
      { title: "Measure speed and memory", detail: "Record tokens or frames per second and the memory it needs." },
      { title: "Try one change", detail: "Quantise it or change the batch size, and measure again." },
      { title: "Write down the trade-off", detail: "Say what you gave up for what you gained." },
    ],
    prerequisites: ["benchmarked"],
    submission: ["How to run it on the same hardware", "Before and after measurements", "A write-up of the trade-off"],
    reward: { ore: 50, achievement: "LOCAL BRAIN" },
  },
  // Hardware
  {
    id: "first-circuit",
    name: "First working circuit",
    summary: "Build a circuit that senses something real and shows the reading.",
    track: "Hardware",
    difficulty: "Beginner",
    hours: 6,
    steps: [
      { title: "Draw the circuit first", detail: "Sketch the schematic by hand and check every connection before you wire it." },
      { title: "Make an LED blink", detail: "Prove the board, the power and the toolchain all work." },
      { title: "Read a sensor", detail: "Wire one sensor and print its readings." },
      { title: "Show it on a display", detail: "Put the reading on a screen or a row of lights." },
    ],
    prerequisites: [],
    submission: ["The schematic and a photo of the build", "The firmware source", "A short video of it responding to the sensor"],
    reward: { ore: 30, achievement: "IT'S ALIVE" },
  },
  {
    id: "first-pcb",
    name: "Design your first PCB",
    summary: "Take a working breadboard circuit and turn it into a board you designed.",
    track: "Hardware",
    difficulty: "Intermediate",
    hours: 12,
    steps: [
      { title: "Start from a working circuit", detail: "Use a design that already works on a breadboard." },
      { title: "Capture the schematic", detail: "Draw it in an electronics design tool with real part footprints." },
      { title: "Lay out the board", detail: "Place the parts and route the traces, then run the design-rule check." },
      { title: "Order or fabricate it", detail: "Send the files to a board maker, or make it yourself." },
      { title: "Assemble and test", detail: "Solder it up and write down every fault you had to fix." },
    ],
    prerequisites: ["first-circuit"],
    submission: ["The design files", "A photo of the finished board", "A list of faults found and how you fixed them"],
    reward: { ore: 50 },
  },
];

export function missionById(id: string): Mission | null {
  return MISSIONS.find((mission) => mission.id === id) ?? null;
}

// The sample builder's progress: how many steps of each mission are done, in order. A mission with no entry is untouched.
// This is sample data for the page, not a record of anyone's work.
export const SAMPLE_PROGRESS: Readonly<Record<string, number>> = {
  "first-tool": 5,
  "profile-it": 2,
  "serve-it": 4,
  "packet-pusher": 2,
  "first-circuit": 1,
};

export type Progress = Readonly<Record<string, number>>;

// Steps done, kept inside 0 to the mission's step count so a bad number cannot overflow a meter. A non-finite count is
// treated as zero: NaN survives the clamp and would otherwise print "NaN of n steps" and crash the next-action lookup.
export function stepsDone(mission: Mission, progress: Progress): number {
  const done = progress[mission.id] ?? 0;
  return Number.isFinite(done) ? Math.min(mission.steps.length, Math.max(0, Math.trunc(done))) : 0;
}

export function stepsLabel(mission: Mission, progress: Progress): string {
  return `${stepsDone(mission, progress)} of ${mission.steps.length} steps`;
}

export function isDone(mission: Mission, progress: Progress): boolean {
  return stepsDone(mission, progress) === mission.steps.length;
}

// The prerequisites a builder has not finished yet. An unknown prerequisite id counts as unfinished, so a typo locks a
// mission instead of silently opening it.
export function unmetPrerequisites(mission: Mission, progress: Progress, missions: readonly Mission[] = MISSIONS): string[] {
  return mission.prerequisites.filter((id) => {
    const required = missions.find((entry) => entry.id === id);
    return !required || !isDone(required, progress);
  });
}

// Done when every step is done. Otherwise locked while a prerequisite is open, then in progress once a step is done,
// else available. Finished work stays done even if a prerequisite was later reopened.
export function missionStatus(mission: Mission, progress: Progress, missions: readonly Mission[] = MISSIONS): MissionStatus {
  if (isDone(mission, progress)) return "done";
  if (unmetPrerequisites(mission, progress, missions).length > 0) return "locked";
  return stepsDone(mission, progress) > 0 ? "in-progress" : "available";
}

// Where one step stands: finished, the one to do next, or waiting. Nothing is current while the mission is locked.
export type StepState = "done" | "current" | "todo";
export function stepState(mission: Mission, progress: Progress, index: number, missions: readonly Mission[] = MISSIONS): StepState {
  const done = stepsDone(mission, progress);
  if (index < done) return "done";
  if (index === done && unmetPrerequisites(mission, progress, missions).length === 0) return "current";
  return "todo";
}

export const EXPEDITIONS_PAGE_SIZE = 6;
export const EXPEDITIONS_QUERY_MAX = 80;

export type ExpeditionsQuery = { q: string; track: Track | null; page: number };

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// Reads the search, track and page from the address. Anything unknown is ignored, so the page shows everything. The old
// ?status= filter no longer exists; the page sends an address that still carries it back to the list.
export function parseExpeditionsQuery(raw: { q?: string | string[]; track?: string | string[]; page?: string | string[] }): ExpeditionsQuery {
  const q = first(raw.q).replace(/\s+/g, " ").trim().slice(0, EXPEDITIONS_QUERY_MAX);
  const page = Number.parseInt(first(raw.page), 10);
  return {
    q,
    track: trackBySlug(first(raw.track).trim().toLowerCase()),
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

// The address for a view. The default view has no query at all, and page 1 is never written.
export function expeditionsHref(query: Partial<ExpeditionsQuery> = {}): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.track) params.set("track", query.track.toLowerCase());
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/dashboard/shop/expeditions?${text}` : "/dashboard/shop/expeditions";
}

// The missions a view shows: every word of the search must appear in the name, the line, the track, the level or a step
// title, and the track must match when one is chosen. Catalog order is kept.
export function filterMissions(missions: readonly Mission[], query: Pick<ExpeditionsQuery, "q" | "track">): Mission[] {
  const words = query.q.toLowerCase().split(" ").filter(Boolean);
  return missions.filter((mission) => {
    if (query.track && mission.track !== query.track) return false;
    if (words.length === 0) return true;
    const haystack = [mission.name, mission.summary, mission.track, mission.difficulty, ...mission.steps.map((step) => step.title)].join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

// Open work first: in progress, then available, locked and done. Catalog order holds inside each state, so the list reads
// the same way every time. This replaces the old group headings and the status filter.
export function sortByState(missions: readonly Mission[], progress: Progress, all: readonly Mission[] = MISSIONS): Mission[] {
  const rank = (mission: Mission) => MISSION_STATUSES.indexOf(missionStatus(mission, progress, all));
  return missions
    .map((mission, index) => ({ mission, index, rank: rank(mission) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.mission);
}

export type MissionPage = { items: Mission[]; page: number; pages: number; total: number };

// One page of the list. A page past the end shows the last page, and an empty list is one empty page.
export function pageMissions(missions: readonly Mission[], page: number, size: number = EXPEDITIONS_PAGE_SIZE): MissionPage {
  const pages = Math.max(1, Math.ceil(missions.length / size));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pages);
  return { items: missions.slice((current - 1) * size, current * size), page: current, pages, total: missions.length };
}

// How many missions are in each state, for the one summary line above the list.
export function statusCounts(missions: readonly Mission[], progress: Progress, all: readonly Mission[] = MISSIONS): Record<MissionStatus, number> {
  const counts: Record<MissionStatus, number> = { "in-progress": 0, available: 0, locked: 0, done: 0 };
  for (const mission of missions) counts[missionStatus(mission, progress, all)] += 1;
  return counts;
}

// What to do next on one mission: the step to work on, the missions to finish first, or nothing (it is done).
export type NextAction =
  | { kind: "step"; number: number; total: number; title: string; detail: string; started: boolean }
  | { kind: "locked"; blockers: { id: string; name: string }[] }
  | { kind: "done" };

export function nextAction(mission: Mission, progress: Progress, all: readonly Mission[] = MISSIONS): NextAction {
  const status = missionStatus(mission, progress, all);
  if (status === "done") return { kind: "done" };
  if (status === "locked") {
    return { kind: "locked", blockers: unmetPrerequisites(mission, progress, all).map((id) => ({ id, name: all.find((entry) => entry.id === id)?.name ?? id })) };
  }
  const index = stepsDone(mission, progress);
  const step = mission.steps[index] as MissionStep;
  return { kind: "step", number: index + 1, total: mission.steps.length, title: step.title, detail: step.detail, started: index > 0 };
}

// One count per track for the filter chips and the page's own summary.
export function countByTrack(missions: readonly Mission[]): Record<Track, number> {
  return Object.fromEntries(TRACKS.map((track) => [track, missions.filter((mission) => mission.track === track).length])) as Record<Track, number>;
}

// "40 Ore and FIRST TOOL", "TOOLMAKER" or "30 Ore". Every reward is a draft, which the page labels once.
export function rewardLine(reward: MissionReward): string {
  const parts: string[] = [];
  if (reward.ore !== undefined) parts.push(`${reward.ore.toLocaleString("en-GB")} Ore`);
  if (reward.achievement) parts.push(reward.achievement);
  return parts.length > 0 ? parts.join(" and ") : "No reward set";
}

// ---- Equipping (plans/proposals/trials-as-expeditions.md) ----
//
// Expeditions are LOADOUT's version of Pixl's Trials. A builder equips one expedition on one of their projects, and that
// project's approved hours count toward it, the way a project's tracked hours count toward a Pixl Trial's minimum. The mission's
// "hours" figure is the minimum: the steps share it evenly, so a four step mission over 8 hours opens a step every 2 hours, and
// the mission is finished at the full figure. Approved hours only; pending hours never count. The rewards stay drafts.

// Whole approved hours from the minutes the reviewers approved. Part hours do not round up, and a bad number is zero.
export function approvedHoursFromMinutes(minutes: number): number {
  return Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes / 60)) : 0;
}

// Steps done after this many approved hours: one per (mission hours / step count), never past the last step.
export function stepsFromHours(mission: Pick<Mission, "hours" | "steps">, hours: number): number {
  const total = mission.steps.length;
  if (total === 0 || !(mission.hours > 0) || !Number.isFinite(hours) || hours <= 0) return 0;
  return Math.min(total, Math.floor((hours * total) / mission.hours));
}

// Approved hours still needed to finish, for the line on the detail page.
export function hoursToFinish(mission: Pick<Mission, "hours" | "steps">, hours: number): number {
  return Math.max(0, mission.hours - Math.max(0, Math.floor(hours)));
}

export type EquippedRow = { expeditionId: string; projectTrack: string | null; approvedMinutes: number };

// The builder's progress: the sample baseline with the equipped projects laid over it. An equipped project counts only for
// its own track and never lowers a number the baseline or another project already reached. Unequipped rows are passed in
// too, so taking an expedition off a project does not undo what it earned.
export function progressWithEquips(base: Progress, rows: readonly EquippedRow[], missions: readonly Mission[] = MISSIONS): Progress {
  const next: Record<string, number> = { ...base };
  for (const row of rows) {
    const mission = missions.find((entry) => entry.id === row.expeditionId);
    if (!mission || row.projectTrack !== mission.track) continue;
    const steps = stepsFromHours(mission, approvedHoursFromMinutes(row.approvedMinutes));
    next[mission.id] = Math.max(next[mission.id] ?? 0, steps);
  }
  return next;
}

export type EquipCode = "not-your-project" | "wrong-track" | "no-expedition" | "finished" | "locked" | "project-busy" | "elsewhere";
export type EquipVerdict = { ok: true } | { ok: false; code: EquipCode; reason: string };

export type EquipCheck = {
  viewerId: string;
  project: { id: string; ownerId: string; track: string | null };
  mission: Mission | null;
  progress: Progress;
  // Expedition ids equipped now (not taken off) on this project, and on the builder's other projects.
  onProject: readonly string[];
  elsewhere: readonly string[];
  missions?: readonly Mission[];
};

const refuse = (code: EquipCode, reason: string): EquipVerdict => ({ ok: false, code, reason });

// The rules, in the order a builder meets them: your project, the right track, not finished, not locked, one at a time.
export function canEquipExpedition(input: EquipCheck): EquipVerdict {
  const { viewerId, project, mission, progress, onProject, elsewhere } = input;
  const all = input.missions ?? MISSIONS;
  if (project.ownerId !== viewerId) return refuse("not-your-project", "You can only equip an expedition on your own project.");
  if (!mission) return refuse("no-expedition", "That expedition was not found.");
  if (project.track !== mission.track) {
    return refuse("wrong-track", `${mission.name} is a ${mission.track} expedition. Pick a ${mission.track} project.`);
  }
  if (isDone(mission, progress)) return refuse("finished", `${mission.name} is finished, so it can't be equipped again.`);
  const unmet = unmetPrerequisites(mission, progress, all);
  if (unmet.length > 0) {
    const names = unmet.map((id) => all.find((entry) => entry.id === id)?.name ?? id).join(", ");
    return refuse("locked", `Finish ${names} first.`);
  }
  const busy = onProject.map((id) => all.find((entry) => entry.id === id)).find((entry) => entry && !isDone(entry, progress));
  if (busy) return refuse("project-busy", `This project already has ${busy.name} equipped. A project carries one expedition at a time.`);
  if (elsewhere.includes(mission.id)) return refuse("elsewhere", `${mission.name} is already equipped on another of your projects.`);
  return { ok: true };
}
