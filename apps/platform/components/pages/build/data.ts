import type { MissionProgress } from "./logic/missions";
import type { FlagPenaltyState, JournalEntry, Project, ReviewsState, Ship } from "./logic/types";

// Storage keys and seed data for the Build tabs. State lives in this browser's localStorage through
// lib/preview-store.ts. The seeds are sample content shown until the participant changes something.

export const KEYS = {
  projects: "build.projects",
  journals: "build.journals",
  ships: "build.ships",
  reviews: "build.reviews",
  missions: "build.missions",
  /** Hours the preview clock has been moved forward (the preview tools use it to skip the 24 hour gates). */
  clock: "build.clockOffsetHours",
  penalty: "build.flagPenalty",
  /** Award keys already credited to the Ore ledger, so nothing is ever credited twice. */
  awards: "build.awardKeys",
  /** Notification keys already sent, so a prompt such as "journal due" is not repeated. */
  notified: "build.notifiedKeys",
} as const;

const BASE = Date.UTC(2026, 9, 18, 9, 0, 0);
const HOUR = 3_600_000;

export const SEED_PROJECTS: Project[] = [
  {
    id: "seed_project_logger",
    name: "Sample: ring-buffer logger",
    summary: "A small logging library that keeps the last few thousand lines in memory and writes them out only when something fails.",
    capability: "Lets other builders add crash-time logs to a program without paying for disk writes on every line.",
    track: "Systems",
    researchMode: false,
    repoUrl: "https://github.com/sample-builder/ring-logger",
    license: "MIT",
    visibility: "public",
    collaborators: "",
    createdAt: BASE,
    trackerConnected: true,
    trackerHours: 14,
    allocatedHours: 14,
    bom: [],
    versions: [{ id: "seed_version_1", label: "v0.1", notes: "First working prototype with the in-memory ring and a flush on panic.", at: BASE + 20 * HOUR }],
  },
  {
    id: "seed_project_pad",
    name: "Sample: macro pad v1",
    summary: "A nine-key macro pad with a small custom firmware layer.",
    capability: "",
    track: "Hardware",
    researchMode: false,
    repoUrl: "",
    license: "",
    visibility: "public",
    collaborators: "",
    createdAt: BASE + 2 * HOUR,
    trackerConnected: false,
    trackerHours: 0,
    allocatedHours: 0,
    bom: [],
    versions: [],
  },
];

export const SEED_JOURNALS: JournalEntry[] = [
  {
    id: "seed_journal_1",
    projectId: "seed_project_logger",
    title: "Ring buffer works, flush is next",
    body: "Built the fixed-size ring and wrote tests for wrap-around.\n\nOne bug: the read index was off by one after the buffer wrapped twice. Fixed by tracking a total count instead of two indexes.\n\nNext: flush the buffer when the process panics.",
    hours: 5,
    tags: ["rust", "tests"],
    isPublic: true,
    at: BASE + 8 * HOUR,
  },
  {
    id: "seed_journal_2",
    projectId: "seed_project_logger",
    title: "Flush on panic",
    body: "Hooked the panic handler and checked that the last 2,000 lines appear in the output file.\n\nStill to do: a benchmark that shows the cost per line.",
    hours: 4,
    tags: ["rust"],
    isPublic: true,
    at: BASE + 20 * HOUR,
  },
];

export const SEED_SHIPS: Ship[] = [];

export const SEED_REVIEWS: ReviewsState = { active: null, done: [], skipped: [], reported: [], dutyShortcut: 0 };

export const SEED_MISSION_PROGRESS: MissionProgress[] = [];

export const SEED_PENALTY: FlagPenaltyState = { rejectedAt: [], pending: false };

export const SEED_CLOCK = 0;

export const SEED_KEYS: string[] = [];
