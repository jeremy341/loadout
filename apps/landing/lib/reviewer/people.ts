import { TRACKS, type Track } from "@/lib/platform/progress";
import {
  approvedMinutes,
  auditsForShip,
  paginate,
  parsePage,
  REVIEW_AUDITS,
  REVIEWERS,
  REVIEW_SHIPS,
  trackedMinutes,
  type Page,
  type ReviewAudit,
  type ReviewJournal,
  type ReviewKind,
  type ReviewShip,
  type ReviewStatus,
  type Reviewer,
} from "@/lib/platform/review";
import { BULK_PLAYERS, BULK_PROJECTS } from "@/lib/platform/review-fixtures-bulk";
import { MISSIONS } from "@/lib/platform/expeditions";
import { trackBySlug, trackSlug } from "@/lib/platform/tracks";
import {
  FULFILLER,
  HARDWARE_ONLY,
  HELPER,
  landingFor,
  NO_REVIEW,
  resolveAccess,
  REVIEWER,
  SECOND_PASS,
  SOFTWARE_ONLY,
  type ReviewerAccess,
} from "@/lib/reviewer/access";
import { NAV_SECTIONS, visibleSections } from "@/lib/reviewer/nav";
import { banState, bansFor, removedProjects, violationCount } from "@/lib/reviewer/moderation";

// The People group of the reviewer site: Players, Projects, Reviewers and Team and roles. Everything is invented sample data that
// reuses the builders, ships and reviewers in lib/platform/review.ts and the moderation records in lib/reviewer/moderation.ts, so
// the whole site tells one story. Nothing is saved: the staff actions on these pages are shown disabled with OPENS_SENTENCE.

export const OPENS_SENTENCE = "Opens with the review service. Nothing here is saved.";
export const PEOPLE_SAMPLE_NOTE = "Sample content. The builders, projects and team on this page are invented, and nothing here is saved.";

// Pixl pages its player list by 25 and its reviewer list by 15. Its project list is not paged; this one is, by 20.
export const PLAYERS_PAGE_SIZE = 25;
export const PROJECTS_PAGE_SIZE = 20;
export const REVIEWERS_PAGE_SIZE = 15;
// Kept for the pages that still page by twelve.
export const PEOPLE_PAGE_SIZE = 12;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));
const QUERY_MAX = 80;

// "now" for the sample is 6 Nov 2026 (moderation.ts SAMPLE_NOW). A date from a count of days ago.
const SAMPLE_DAY = Date.UTC(2026, 10, 6);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dateDaysAgo(days: number): string {
  const date = new Date(SAMPLE_DAY - Math.max(0, Math.round(days)) * 86_400_000);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
export function dateHoursAgo(hours: number): string {
  return dateDaysAgo(Math.floor(hours / 24));
}

// ---- Players ----

export type PlayerStanding = "active" | "warned" | "banned";
export const PLAYER_STANDINGS: readonly PlayerStanding[] = ["active", "warned", "banned"];
export const STANDING_LABELS: Record<PlayerStanding, string> = { active: "OK", warned: "Warned", banned: "Banned" };

export type HoursByTrack = Record<Track, number>;

export type Player = {
  // The handle, lower case: also the address (/players/kestrel42).
  id: string;
  handle: string;
  joinedDaysAgo: number;
  lastActiveHoursAgo: number;
  // Approved hours per track, whole hours.
  approved: HoursByTrack;
  orders: number;
  // Read from the moderation records, so the player list, the Violations page and the Bans page cannot disagree: Banned while a
  // ban is in force, Warned when something is on record, OK otherwise.
  standing: PlayerStanding;
  violations: number;
  bans: number;
};

const hrs = (tools: number, systems: number, compute: number, hardware: number): HoursByTrack => ({ Tools: tools, Systems: systems, Compute: compute, Hardware: hardware });
function player(handle: string, joinedDaysAgo: number, lastActiveHoursAgo: number, approved: HoursByTrack, orders = 0): Player {
  const violations = violationCount(handle);
  const bans = bansFor(handle);
  const standing: PlayerStanding = bans.some((ban) => banState(ban) === "active") ? "banned" : violations > 0 ? "warned" : "active";
  return { id: handle.toLowerCase(), handle, joinedDaysAgo, lastActiveHoursAgo, approved, orders, standing, violations, bans: bans.length };
}

export const PLAYERS: readonly Player[] = [
  // The builders behind the ships in the review sample.
  player("kestrel42", 70, 3, hrs(14, 22, 0, 0)),
  player("dovetail", 55, 5, hrs(0, 0, 6, 31), 1),
  player("ploughshare", 48, 8, hrs(12, 9, 0, 0)),
  player("halyard", 61, 2, hrs(0, 0, 0, 44), 2),
  player("tessel", 40, 26, hrs(18, 0, 0, 0)),
  player("nib", 33, 50, hrs(7, 0, 0, 0)),
  player("marlin_k", 29, 1, hrs(0, 5, 0, 0)),
  player("quill", 51, 4, hrs(26, 8, 0, 0), 1),
  player("ostler", 66, 70, hrs(0, 15, 40, 0), 1),
  player("brindle", 72, 96, hrs(0, 0, 0, 18)),
  player("cairn", 80, 30, hrs(34, 0, 8, 0), 3),
  player("fathom", 77, 120, hrs(0, 0, 0, 24), 2),
  player("pennant", 64, 330, hrs(14, 0, 0, 0)),
  player("wick", 58, 250, hrs(6, 0, 0, 0)),
  player("cobble", 62, 260, hrs(0, 0, 0, 12), 1),
  // The builders on the community leaderboard.
  player("tinwren", 90, 6, hrs(96, 12, 0, 20), 2),
  player("quartzfox", 88, 12, hrs(10, 88, 64, 0), 1),
  player("brasskettle", 85, 20, hrs(4, 0, 6, 120), 3),
  player("mothvector", 84, 9, hrs(0, 30, 141, 0)),
  player("picopilgrim", 79, 30, hrs(3, 0, 0, 77), 1),
  player("solderbee", 74, 15, hrs(45, 0, 0, 31), 2),
  player("lathelark", 69, 40, hrs(0, 70, 5, 18)),
  player("nullwisp", 45, 60, hrs(25, 25, 25, 0)),
  // Builders who only appear here.
  player("driftpin", 36, 200, hrs(8, 0, 0, 0)),
  player("gantry9", 52, 900, hrs(0, 0, 0, 5)),
  player("softlaunch", 12, 22, hrs(0, 0, 0, 0)),
  // A fulfiller who also buys from the shop, so every sample order belongs to a player.
  player("examplepack", 65, 12, hrs(10, 0, 0, 0), 1),
  // Generated builders, so the list has several pages (review-fixtures-bulk.ts).
  ...BULK_PLAYERS.map((seed) => player(seed.handle, seed.joinedDaysAgo, seed.lastActiveHoursAgo, hrs(...seed.approved), seed.orders)),
];

export function playerById(id: string): Player | null {
  const key = id.trim().toLowerCase();
  return PLAYERS.find((item) => item.id === key) ?? null;
}

export function approvedTotal(item: Pick<Player, "approved">): number {
  return TRACKS.reduce((sum, track) => sum + item.approved[track], 0);
}

// The tracks a player has approved hours in, most hours first. Ties keep the track order.
export function trackHoursList(item: Pick<Player, "approved">): { track: Track; hours: number }[] {
  return TRACKS.map((track, index) => ({ track, hours: item.approved[track], index }))
    .filter((entry) => entry.hours > 0)
    .sort((a, b) => b.hours - a.hours || a.index - b.index)
    .map(({ track, hours }) => ({ track, hours }));
}

export function playerShips(item: Pick<Player, "handle">, ships: readonly ReviewShip[] = REVIEW_SHIPS): ReviewShip[] {
  return ships.filter((ship) => ship.builder === item.handle);
}

export function playerProjects(item: Pick<Player, "handle">, projects: readonly StaffProject[] = STAFF_PROJECTS): StaffProject[] {
  return projects.filter((project) => project.owner === item.handle);
}

// What happened to a player's ships: the ships with a verdict, a first pass or a ban step, newest first by the time of the last step.
export function reviewHistory(item: Pick<Player, "handle">, ships: readonly ReviewShip[] = REVIEW_SHIPS): ReviewShip[] {
  const moved = (ship: ReviewShip) => ship.decision?.hoursAgo ?? ship.firstPass?.hoursAgo ?? ship.submittedHoursAgo;
  return playerShips(item, ships)
    .filter((ship) => ship.decision || ship.firstPass || ship.ban)
    .sort((a, b) => moved(a) - moved(b) || a.id.localeCompare(b.id));
}

// Does the player have anything on the moderation pages?
export function hasModeration(item: Pick<Player, "violations" | "bans" | "standing">): boolean {
  return item.violations > 0 || item.bans > 0 || item.standing !== "active";
}

export type PlayerSort = "active" | "hours" | "name";
export const PLAYER_SORTS: readonly PlayerSort[] = ["active", "hours", "name"];
export const PLAYER_SORT_LABELS: Record<PlayerSort, string> = { active: "Last active", hours: "Approved hours", name: "Handle A to Z" };

export type PlayersQuery = { q: string; track: Track | null; status: PlayerStanding | null; sort: PlayerSort; page: number };

type PlayersRaw = { q?: string | string[]; track?: string | string[]; status?: string | string[]; sort?: string | string[]; page?: string | string[] };

// Reads the filters from the address. Anything unknown falls back to the default view rather than an error.
export function parsePlayersQuery(raw: PlayersRaw): PlayersQuery {
  const status = first(raw.status).trim().toLowerCase();
  const sort = first(raw.sort).trim().toLowerCase();
  return {
    q: first(raw.q).trim().slice(0, QUERY_MAX),
    track: trackBySlug(first(raw.track).trim().toLowerCase()),
    status: PLAYER_STANDINGS.find((item) => item === status) ?? null,
    sort: PLAYER_SORTS.find((item) => item === sort) ?? "active",
    page: parsePage(raw.page),
  };
}

// The address for a players view, root-relative on the review host. The default view has no query.
export function playersHref(query: PlayersQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.track) params.set("track", trackSlug(query.track));
  if (query.status) params.set("status", query.status);
  if (query.sort !== "active") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/players?${text}` : "/players";
}

export function filterPlayers(players: readonly Player[], query: Pick<PlayersQuery, "q" | "track" | "status">): Player[] {
  const term = query.q.toLowerCase().replace(/^@/, "");
  return players.filter(
    (item) =>
      (!term || item.handle.toLowerCase().includes(term)) &&
      (!query.track || item.approved[query.track] > 0) &&
      (!query.status || item.standing === query.status),
  );
}

// Ties always fall back to the handle so the order never shifts between loads.
export function sortPlayers(players: readonly Player[], sort: PlayerSort): Player[] {
  const byName = (a: Player, b: Player) => a.handle.localeCompare(b.handle);
  const copy = [...players];
  if (sort === "hours") return copy.sort((a, b) => approvedTotal(b) - approvedTotal(a) || byName(a, b));
  if (sort === "name") return copy.sort(byName);
  return copy.sort((a, b) => a.lastActiveHoursAgo - b.lastActiveHoursAgo || byName(a, b));
}

export function playersView(players: readonly Player[], query: PlayersQuery, per = PLAYERS_PAGE_SIZE): Page<Player> {
  return paginate(sortPlayers(filterPlayers(players, query), query.sort), query.page, per);
}

// The ban in force for a player, if any, as the end date text: "until 20 Nov 2026" or "with no end date".
export function activeBanFor(handle: string) {
  return bansFor(handle).find((ban) => banState(ban) === "active") ?? null;
}

// ---- Projects ----

// Pixl's project statuses: Draft, In review (shipped), Final review (second review), Approved, Needs changes. Logging is the stage
// before a first ship that LOADOUT builders see on their own project strip. A project can also be archived, rejected or banned,
// which is separate from where it is in review (see ProjectRemoval).
export type ProjectStage = "draft" | "logging" | "in_review" | "final_review" | "needs_changes" | "approved";
export const PROJECT_STAGES: readonly ProjectStage[] = ["draft", "logging", "in_review", "final_review", "needs_changes", "approved"];
export const STAGE_LABELS: Record<ProjectStage, string> = {
  draft: "Draft",
  logging: "Logging",
  in_review: "In review",
  final_review: "Final review",
  needs_changes: "Needs changes",
  approved: "Approved",
};

// Where a ship's review status sits on the project stages.
export const STAGE_FOR_STATUS: Record<ReviewStatus, ProjectStage> = {
  waiting: "in_review",
  claimed: "in_review",
  "spot-check": "final_review",
  "proposed-ban": "final_review",
  approved: "approved",
  "needs-changes": "needs_changes",
  banned: "final_review",
};

export type RemovalKind = "archived" | "rejected" | "banned";
export const REMOVAL_LABELS: Record<RemovalKind, string> = { archived: "Archived", rejected: "Rejected", banned: "Banned" };
// A project that is archived, rejected or banned leaves the list of active projects and shows in the archive.
export type ProjectRemoval = { kind: RemovalKind; by: string; hoursAgo: number; reason: string };

export type StaffProject = {
  id: string;
  // The project number staff search by.
  number: number;
  title: string;
  owner: string;
  collaborators: string[];
  kind: ReviewKind;
  // The project's one track.
  track: Track;
  stage: ProjectStage;
  summary: string;
  loggedMinutes: number;
  journals: ReviewJournal[];
  // Minutes a reviewer kept, or null while no decision is final.
  approvedMinutes: number | null;
  createdHoursAgo: number;
  lastActiveHoursAgo: number;
  // The ship in the review sample, if the project has been submitted.
  shipId: string | null;
  // Sample addresses, as text. They are not links.
  source: string | null;
  demo: string | null;
  // The Hackatime projects (or "Lapse" for a hardware project) the time comes from.
  hackatime: string[];
  usedAi: boolean;
  isUpdate: boolean;
  // The expedition the builder shipped it for, if any.
  expeditionId: string | null;
  removal: ProjectRemoval | null;
  // Only an approved project is public in Explore.
  published: boolean;
};

const projectNumber = (id: string): number => Number(id.replace(/\D/g, "")) || 0;

function hackatimeNames(ship: ReviewShip): string[] {
  return ship.evidence.source === "hackatime" ? ship.evidence.projects.map((item) => item.name) : ["Lapse recordings"];
}

function fromShip(ship: ReviewShip): StaffProject {
  const approved = ship.status === "needs-changes" || ship.status === "banned" ? 0 : approvedMinutes(ship);
  const removal: ProjectRemoval | null = ship.status === "banned" && ship.ban ? { kind: "banned", by: ship.ban.by, hoursAgo: ship.ban.hoursAgo, reason: ship.ban.reason } : null;
  const lastActive = ship.decision?.hoursAgo ?? ship.firstPass?.hoursAgo ?? ship.submittedHoursAgo;
  return {
    id: `pr-${ship.id.replace(/^sh-/, "")}`,
    number: projectNumber(ship.id),
    title: ship.title,
    owner: ship.builder,
    collaborators: (ship.collaborators ?? []).map((item) => item.handle),
    kind: ship.kind,
    track: ship.track,
    stage: STAGE_FOR_STATUS[ship.status],
    summary: ship.capability,
    loggedMinutes: trackedMinutes(ship),
    journals: ship.journals,
    approvedMinutes: approved,
    createdHoursAgo: (ship.firstShippedHoursAgo ?? ship.submittedHoursAgo) + 24 * (ship.journals.length + 6),
    lastActiveHoursAgo: lastActive,
    shipId: ship.id,
    source: ship.source,
    demo: ship.demo,
    hackatime: hackatimeNames(ship),
    usedAi: ship.ai.percent > 0,
    isUpdate: Boolean(ship.update),
    expeditionId: ship.expeditionId ?? null,
    removal,
    published: ship.status === "approved",
  };
}

const note = (day: string, minutes: number, text: string): ReviewJournal => ({ day, minutes, text });
function inProgress(
  n: number,
  title: string,
  owner: string,
  kind: ReviewKind,
  track: Track,
  stage: "draft" | "logging",
  summary: string,
  loggedMinutes: number,
  journals: ReviewJournal[],
  lastActiveHoursAgo: number,
  source: string | null,
  removal: ProjectRemoval | null = null,
): StaffProject {
  return {
    id: `pr-${n}`,
    number: n,
    title,
    owner,
    collaborators: [],
    kind,
    track,
    stage,
    summary,
    loggedMinutes,
    journals,
    approvedMinutes: null,
    createdHoursAgo: lastActiveHoursAgo + 24 * (journals.length + 3),
    lastActiveHoursAgo,
    shipId: null,
    source,
    demo: null,
    hackatime: kind === "hardware" ? ["Lapse recordings"] : source ? [source.split("/").pop() ?? title] : [],
    usedAi: false,
    isUpdate: false,
    expeditionId: null,
    removal,
    published: false,
  };
}

const REMOVED_PROJECTS = removedProjects();
const removedFor = (title: string): ProjectRemoval => {
  const item = REMOVED_PROJECTS.find((entry) => entry.title === title);
  if (!item) throw new Error(`No removed project called ${title}`);
  return { kind: title.startsWith("Copy of") ? "banned" : "rejected", by: item.by, hoursAgo: item.hoursAgo, reason: item.note };
};

// Every project in the review sample, plus builders' unfinished projects that have no ship yet, and the projects staff removed.
export const STAFF_PROJECTS: readonly StaffProject[] = [
  ...REVIEW_SHIPS.map(fromShip),
  inProgress(3001, "Breadboard clock radio", "tinwren", "hardware", "Hardware", "logging", "A small clock radio built on a breadboard, with a seven-segment display and a tuned AM receiver.", 540, [note("1 Nov", 300, "Wired the display driver and counted seconds from a crystal.")], 10, "git.example/tinwren/clock-radio"),
  inProgress(3002, "Tiny ray marcher", "quartzfox", "software", "Compute", "logging", "A signed-distance ray marcher that renders a few shapes to a window.", 780, [note("29 Oct", 360, "Sphere tracing loop and a normal estimate."), note("3 Nov", 300, "Soft shadows, and a fix for the banding on steep surfaces.")], 14, "git.example/quartzfox/ray-marcher"),
  inProgress(3003, "Kiln controller", "brasskettle", "hardware", "Hardware", "logging", "A thermocouple-based controller that follows a firing schedule for a small ceramic kiln.", 960, [note("27 Oct", 420, "Thermocouple amplifier on a perfboard and a first temperature trace."), note("2 Nov", 360, "Relay driver with a hardware over-temperature cut-off.")], 24, "git.example/brasskettle/kiln-controller"),
  inProgress(3004, "Matrix kernel tuner", "mothvector", "software", "Compute", "draft", "A tool that tries tile sizes for a matrix multiply and picks the fastest.", 0, [], 20, null),
  inProgress(3005, "Pico weather dial", "picopilgrim", "hardware", "Hardware", "draft", "A needle dial on a Pico that shows the day's forecast.", 0, [], 36, null),
  inProgress(3006, "Fume extractor controller", "solderbee", "hardware", "Hardware", "logging", "A fan controller that speeds up with the soldering iron's temperature.", 420, [note("30 Oct", 240, "Read the iron's thermistor and mapped it to fan speed.")], 18, "git.example/solderbee/fume-extractor"),
  inProgress(3007, "Scheduler visualiser", "lathelark", "software", "Systems", "logging", "A timeline view of what a toy scheduler ran and when.", 600, [note("1 Nov", 300, "Trace format and a first timeline in the browser.")], 44, "git.example/lathelark/sched-vis"),
  inProgress(3008, "Toy regex engine", "nullwisp", "software", "Tools", "draft", "A small regular expression engine that compiles to a state machine.", 0, [], 62, null),
  inProgress(3009, "Pixel tile editor", "driftpin", "software", "Tools", "logging", "A tile editor for pixel art with a palette and an export to a sprite sheet.", 300, [note("20 Oct", 180, "Canvas, palette and undo.")], 210, "git.example/driftpin/tile-editor"),
  inProgress(3010, "CNC pendant", "gantry9", "hardware", "Hardware", "logging", "A handheld pendant with a jog wheel for a small CNC router.", 240, [note("5 Oct", 120, "Encoder reading and debouncing.")], 900, null),
  inProgress(3011, "Habit tracker CLI", "softlaunch", "software", "Tools", "draft", "A command line tool that logs daily habits to a local file.", 0, [], 22, null),
  // Removed by staff. They are not in the list of active projects; the archive shows them with the reason.
  inProgress(3012, "Wi-Fi password tester", "tessel", "software", "Systems", "logging", "A script that tries common passwords against nearby networks.", 360, [note("2 Oct", 180, "Scanner loop and a list of common passwords.")], 300, "git.example/tessel/wifi-tester", removedFor("Wi-Fi password tester")),
  inProgress(3013, "Copy of a classic game's levels", "ostler", "software", "Tools", "logging", "A level pack for a small platformer.", 480, [note("14 Oct", 240, "Imported the level files and wrote a loader.")], 820, "git.example/ostler/level-pack", removedFor("Copy of a classic game's levels")),
  inProgress(3014, "Dice roller (old)", "softlaunch", "software", "Tools", "draft", "A first draft the builder replaced with the habit tracker.", 0, [], 160, null, { kind: "archived", by: "ironlark", hoursAgo: 150, reason: "Left in draft for two weeks and replaced by a newer project." }),
  // Generated unfinished projects, so the list has several pages (review-fixtures-bulk.ts). Numbers start at 5001.
  ...BULK_PROJECTS.map((seed) =>
    inProgress(
      seed.number,
      seed.title,
      seed.owner,
      seed.kind,
      seed.track,
      seed.stage,
      "A work in progress on sample data.",
      seed.minutes,
      seed.minutes > 0 ? [note("3 Nov", Math.min(seed.minutes, 240), "Sample journal entry.")] : [],
      seed.lastActiveHoursAgo,
      seed.stage === "draft" ? null : `git.example/${seed.owner}/wip-${seed.number}`,
    ),
  ),
];

export function projectById(id: string): StaffProject | null {
  const key = id.trim().toLowerCase();
  return STAFF_PROJECTS.find((item) => item.id === key) ?? null;
}

export function projectForShip(shipId: string, projects: readonly StaffProject[] = STAFF_PROJECTS): StaffProject | null {
  return projects.find((item) => item.shipId === shipId) ?? null;
}

export function journaledOf(project: Pick<StaffProject, "journals">): number {
  return project.journals.reduce((sum, item) => sum + item.minutes, 0);
}

export function missionTitle(id: string | null): string | null {
  return id ? (MISSIONS.find((mission) => mission.id === id)?.name ?? null) : null;
}

export type ProjectSort = "created" | "recent" | "hours" | "title";
export const PROJECT_SORTS: readonly ProjectSort[] = ["created", "recent", "hours", "title"];
export const PROJECT_SORT_LABELS: Record<ProjectSort, string> = { created: "Newest first", recent: "Last activity", hours: "Hours logged", title: "Title A to Z" };

export type ProjectView = "active" | "archived";

export type ProjectsQuery = { q: string; view: ProjectView; kind: ReviewKind | null; stage: ProjectStage | null; track: Track | null; sort: ProjectSort; page: number };

type ProjectsRaw = {
  q?: string | string[];
  view?: string | string[];
  kind?: string | string[];
  stage?: string | string[];
  track?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

export function parseProjectsQuery(raw: ProjectsRaw): ProjectsQuery {
  const kind = first(raw.kind).trim().toLowerCase();
  const stage = first(raw.stage).trim().toLowerCase();
  const sort = first(raw.sort).trim().toLowerCase();
  return {
    q: first(raw.q).trim().slice(0, QUERY_MAX),
    view: first(raw.view).trim().toLowerCase() === "archived" ? "archived" : "active",
    kind: kind === "software" || kind === "hardware" ? kind : null,
    stage: PROJECT_STAGES.find((item) => item === stage) ?? null,
    track: trackBySlug(first(raw.track).trim().toLowerCase()),
    sort: PROJECT_SORTS.find((item) => item === sort) ?? "created",
    page: parsePage(raw.page),
  };
}

export function projectsHref(query: ProjectsQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.view === "archived") params.set("view", "archived");
  if (query.kind) params.set("kind", query.kind);
  if (query.stage) params.set("stage", query.stage);
  if (query.track) params.set("track", trackSlug(query.track));
  if (query.sort !== "created") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/projects?${text}` : "/projects";
}

// The search matches the title, the owner's handle or the project number ("2045" or "#2045").
export function filterProjects(projects: readonly StaffProject[], query: Pick<ProjectsQuery, "q" | "kind" | "stage" | "track">): StaffProject[] {
  const term = query.q.toLowerCase().replace(/^[@#]/, "");
  return projects.filter(
    (item) =>
      (!term || item.title.toLowerCase().includes(term) || item.owner.toLowerCase().includes(term) || String(item.number) === term) &&
      (!query.kind || item.kind === query.kind) &&
      (!query.stage || item.stage === query.stage) &&
      (!query.track || item.track === query.track),
  );
}

export function sortProjects(projects: readonly StaffProject[], sort: ProjectSort): StaffProject[] {
  const byTitle = (a: StaffProject, b: StaffProject) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  const copy = [...projects];
  if (sort === "hours") return copy.sort((a, b) => b.loggedMinutes - a.loggedMinutes || byTitle(a, b));
  if (sort === "title") return copy.sort(byTitle);
  if (sort === "recent") return copy.sort((a, b) => a.lastActiveHoursAgo - b.lastActiveHoursAgo || byTitle(a, b));
  return copy.sort((a, b) => a.createdHoursAgo - b.createdHoursAgo || byTitle(a, b));
}

// Owners see archived projects mixed into the main list, as in Pixl; a reviewer sees only the active ones. The archive view lists
// only archived, rejected and banned projects, for whoever opens it.
export function visibleProjects(projects: readonly StaffProject[], view: ProjectView, isOwner: boolean): StaffProject[] {
  if (view === "archived") return projects.filter((item) => item.removal !== null);
  return isOwner ? [...projects] : projects.filter((item) => item.removal === null);
}

export function projectsView(projects: readonly StaffProject[], query: ProjectsQuery, isOwner = true, per = PROJECTS_PAGE_SIZE): Page<StaffProject> {
  const visible = visibleProjects(projects, query.view, isOwner);
  return paginate(sortProjects(filterProjects(visible, query), query.sort), query.page, per);
}

export function projectsWord(count: number, view: ProjectView): string {
  return `${count} ${view === "archived" ? "archived " : ""}${count === 1 ? "project" : "projects"}`;
}

// ---- Audits on a project and on a reviewer ----

// Pixl flags a review that took under a minute, and an approval where the repository was never opened.
export function auditFlags(audit: Pick<ReviewAudit, "seconds" | "verdict" | "repoSeconds">): string[] {
  const flags: string[] = [];
  if (audit.seconds > 0 && audit.seconds < 60) flags.push("under a minute");
  if ((audit.verdict === "approved" || audit.verdict === "first_pass_approved") && audit.repoSeconds === null) flags.push("source never opened");
  return flags;
}

// A reviewer's verdict history, newest first.
export function auditsBy(handle: string, audits: readonly ReviewAudit[] = REVIEW_AUDITS): ReviewAudit[] {
  return audits.filter((item) => item.reviewer === handle).sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id));
}

// The justifications on a project's ship, newest first.
export function justificationsFor(project: Pick<StaffProject, "shipId">, audits: readonly ReviewAudit[] = REVIEW_AUDITS): ReviewAudit[] {
  return project.shipId ? auditsForShip(project.shipId, audits).sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id)) : [];
}

// ---- Team and roles ----

// The five-role model of the reviewer site (lib/reviewer/access.ts), shown as sample data. Owner is never granted here: it comes
// from the LOADOUT_OWNER_EMAILS environment variable only. Reviewer, Helper and Fulfiller are grants, and a reviewer may carry
// markers. Everything the role guide says about what a role opens is derived from lib/reviewer/nav.ts, so it cannot disagree
// with the real gating.

export type TeamRole = "owner" | "reviewer" | "helper" | "fulfiller";
export const TEAM_ROLES: readonly TeamRole[] = ["owner", "reviewer", "helper", "fulfiller"];
export const ROLE_LABELS: Record<TeamRole, string> = { owner: "Owner", reviewer: "Reviewer", helper: "Helper", fulfiller: "Fulfiller" };
// One plain line per role, for the guide. What each role opens is not written here: roleGuide() derives it.
export const ROLE_SUMMARY: Record<TeamRole, string> = {
  owner: "Set in the environment, never in the database. Does everything, including managing the team.",
  reviewer: "Reviews ships from the queues they may take. Cannot see other people's orders or the owner pages.",
  helper: "Answers builders' support tickets.",
  fulfiller: "Packs and posts shop orders from the order queue.",
};

export type RoleMarker = typeof SECOND_PASS | typeof HARDWARE_ONLY | typeof SOFTWARE_ONLY | typeof NO_REVIEW;
export const ROLE_MARKERS: readonly RoleMarker[] = [SECOND_PASS, HARDWARE_ONLY, SOFTWARE_ONLY, NO_REVIEW];
export const MARKER_LABELS: Record<RoleMarker, string> = {
  [SECOND_PASS]: "Second pass",
  [HARDWARE_ONLY]: "Hardware only",
  [SOFTWARE_ONLY]: "Software only",
  [NO_REVIEW]: "Not reviewing",
};
export const MARKER_MEANING: Record<RoleMarker, string> = {
  [SECOND_PASS]: "Makes a reviewer a final reviewer, who can take parked ships, spot checks and ban proposals.",
  [HARDWARE_ONLY]: "Limits a reviewer to the hardware queue.",
  [SOFTWARE_ONLY]: "Limits a reviewer to the software queue.",
  [NO_REVIEW]: "Takes reviewing away from an owner, who otherwise reviews like a reviewer. Their tabs stay the same.",
};

export const OWNER_SOURCE = "Set in the environment";
export const TEAM_RULES: readonly string[] = [
  "Nobody can remove their own role.",
  "Owners cannot be changed here. Owner comes from the environment, and the only marker an owner can carry is Not reviewing.",
  "With no role a person has no access, and the site answers as if it did not exist.",
  "Every change will need a written reason and is written to the audit log.",
];

export type TeamMember = {
  handle: string;
  roles: TeamRole[];
  markers: RoleMarker[];
  // Days since the role was granted. Owners have none: they are not granted.
  sinceDaysAgo: number | null;
};

// The review markers a reviewer carries, from the review sample, so a handle that reviews is the same person everywhere.
function reviewerMarkers(reviewer: Reviewer): RoleMarker[] {
  const markers: RoleMarker[] = [];
  if (reviewer.secondPass) markers.push(SECOND_PASS);
  if (reviewer.access === "hardware") markers.push(HARDWARE_ONLY);
  if (reviewer.access === "software") markers.push(SOFTWARE_ONLY);
  return markers;
}

// Invented team. tamsin and saltmarsh review and also pack orders, as in the Fulfillers sample.
const REVIEWER_SINCE: Record<string, number> = { bellwether: 96, fenwick: 33, lintel: 58, orrery: 74, saltmarsh: 29, tamsin: 52 };
const ALSO_FULFILLER = ["saltmarsh", "tamsin"];

export const TEAM: readonly TeamMember[] = [
  { handle: "ironlark", roles: ["owner"], markers: [], sinceDaysAgo: null },
  { handle: "tolliver", roles: ["owner"], markers: [NO_REVIEW], sinceDaysAgo: null },
  ...REVIEWERS.map(
    (reviewer): TeamMember => ({
      handle: reviewer.handle,
      roles: ALSO_FULFILLER.includes(reviewer.handle) ? ["reviewer", "fulfiller"] : ["reviewer"],
      markers: reviewerMarkers(reviewer),
      sinceDaysAgo: REVIEWER_SINCE[reviewer.handle] ?? 30,
    }),
  ),
  { handle: "lanternfly", roles: ["helper"], markers: [], sinceDaysAgo: 40 },
  { handle: "wick", roles: ["helper"], markers: [], sinceDaysAgo: 12 },
  { handle: "examplepack", roles: ["fulfiller"], markers: [], sinceDaysAgo: 65 },
];

const roleRank = (member: TeamMember) => Math.min(...member.roles.map((role) => TEAM_ROLES.indexOf(role)));

// Owners first, then reviewers, helpers and fulfillers; A to Z inside each.
export function teamMembers(team: readonly TeamMember[] = TEAM): TeamMember[] {
  return [...team].sort((a, b) => roleRank(a) - roleRank(b) || a.handle.localeCompare(b.handle));
}

export function memberFor(handle: string, team: readonly TeamMember[] = TEAM): TeamMember | null {
  return team.find((member) => member.handle === handle) ?? null;
}

export function isTeamMember(handle: string): boolean {
  return memberFor(handle) !== null;
}

// The roles a handle holds, for the line on a reviewer or player page. A builder with no role has none.
export function rolesOf(handle: string): TeamRole[] {
  return memberFor(handle)?.roles ?? [];
}

// "Reviewer and Fulfiller", or "Builder" when there is no role.
export function roleWords(roles: readonly TeamRole[]): string {
  return roles.length === 0 ? "Builder" : roles.map((role) => ROLE_LABELS[role]).join(" and ");
}

// A reviewer with no queue marker takes both queues; the markers are shown as words.
export function markerWords(member: Pick<TeamMember, "roles" | "markers">): string {
  const words = member.markers.map((marker) => MARKER_LABELS[marker]);
  if (member.roles.includes("reviewer") && !member.markers.includes(HARDWARE_ONLY) && !member.markers.includes(SOFTWARE_ONLY)) words.push("Both queues");
  return words.length === 0 ? "None" : words.join(", ");
}

export function isOwnerMember(member: Pick<TeamMember, "roles">): boolean {
  return member.roles.includes("owner");
}

// The role grants a member holds in the database. Owner is not one of them.
export function grantsOf(member: Pick<TeamMember, "roles" | "markers">): string[] {
  const roles = member.roles.flatMap((role) => (role === "reviewer" ? [REVIEWER] : role === "helper" ? [HELPER] : role === "fulfiller" ? [FULFILLER] : []));
  return [...roles, ...member.markers];
}

const SAMPLE_OWNER_EMAIL = "owner@example.test";
const SAMPLE_PERSON_EMAIL = "person@example.test";

// What the real gating does for these grants: the same resolveAccess the site uses.
export function accessFor(member: Pick<TeamMember, "roles" | "markers">): ReviewerAccess | null {
  const email = isOwnerMember(member) ? SAMPLE_OWNER_EMAIL : SAMPLE_PERSON_EMAIL;
  return resolveAccess({ id: "sample", email }, { ownerEmails: [SAMPLE_OWNER_EMAIL], roles: grantsOf(member) });
}

function sampleAccess(roles: readonly TeamRole[], markers: readonly RoleMarker[] = []): ReviewerAccess {
  const access = accessFor({ roles: [...roles], markers: [...markers] });
  if (!access) throw new Error("A sample role resolved to no access");
  return access;
}

export type OpenedGroup = { group: string; tabs: string[]; all: boolean };

// The sections of the nav an access object opens (the top bar, each More section, the Review tabs), from nav.ts. `all` says the
// section is open in full. The fields keep their old names: `group` is the section and `tabs` its pages.
export function openedBy(access: ReviewerAccess): OpenedGroup[] {
  return visibleSections(access).map((section) => ({ group: section.label, tabs: section.items.map((item) => item.label), all: section.items.length === section.total }));
}

export type RoleGuideEntry = { role: TeamRole; label: string; summary: string; opens: OpenedGroup[]; home: string; homeLabel: string };

// "Review in Top bar" for an address, read from the nav.
function tabLabelAt(href: string): string {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((entry) => entry.href === href);
    if (item) return `${item.label} in ${section.label}`;
  }
  return href;
}

// A representative access for each role: an owner from the environment, and a bare grant for the others. Nothing about what a
// role opens is written by hand, so if nav.ts or access.ts changes, this changes with it.
export function roleGuide(): RoleGuideEntry[] {
  return TEAM_ROLES.map((role) => {
    const access = sampleAccess([role]);
    const home = landingFor(access);
    return { role, label: ROLE_LABELS[role], summary: ROLE_SUMMARY[role], opens: openedBy(access), home, homeLabel: tabLabelAt(home) };
  });
}

export type MarkerEffect = { marker: RoleMarker; label: string; meaning: string; adds: string[]; removes: string[] };

const tabNames = (access: ReviewerAccess) => visibleSections(access).flatMap((section) => section.items.map((item) => item.label));

// How a marker changes the tabs, by comparing the access with and without it (a reviewer for the first three, an owner for
// Not reviewing).
export function markerEffects(): MarkerEffect[] {
  return ROLE_MARKERS.map((marker) => {
    const role: TeamRole = marker === NO_REVIEW ? "owner" : "reviewer";
    const before = tabNames(sampleAccess([role]));
    const after = tabNames(sampleAccess([role], [marker]));
    return {
      marker,
      label: MARKER_LABELS[marker],
      meaning: MARKER_MEANING[marker],
      adds: after.filter((name) => !before.includes(name)),
      removes: before.filter((name) => !after.includes(name)),
    };
  });
}

// A person who holds two roles counts under each.
export function roleCounts(team: readonly TeamMember[] = TEAM): Record<TeamRole, number> {
  const counts: Record<TeamRole, number> = { owner: 0, reviewer: 0, helper: 0, fulfiller: 0 };
  for (const member of team) for (const role of member.roles) counts[role] += 1;
  return counts;
}

// ---- Reviewers ----

// Everyone who can work the queue: the sample reviewers, and owners, who review whether or not they hold a grant (an owner with
// Not reviewing is left out). An owner with no verdicts has no Reviewer record, so their numbers are all zero.
export type ReviewerEntry = { handle: string; reviewer: Reviewer | null; owner: boolean; member: TeamMember | null };

export function reviewerEntries(team: readonly TeamMember[] = TEAM, reviewers: readonly Reviewer[] = REVIEWERS): ReviewerEntry[] {
  const owners = team.filter((member) => member.roles.includes("owner") && !member.markers.includes(NO_REVIEW));
  const implicit: ReviewerEntry[] = owners.filter((member) => !reviewers.some((item) => item.handle === member.handle)).map((member) => ({ handle: member.handle, reviewer: null, owner: true, member }));
  const granted: ReviewerEntry[] = reviewers.map((item) => {
    const member = memberFor(item.handle, team);
    return { handle: item.handle, reviewer: item, owner: Boolean(member?.roles.includes("owner")), member };
  });
  return [...implicit, ...granted];
}

export function reviewerEntry(handle: string): ReviewerEntry | null {
  const key = handle.trim().toLowerCase();
  return reviewerEntries().find((item) => item.handle.toLowerCase() === key) ?? null;
}

export type ReviewerStats = {
  reviews: number;
  finalApprovals: number;
  firstPasses: number;
  needsChanges: number;
  hoursCredited: number;
  avgSeconds: number;
  // The share of this reviewer's sample verdicts where the source was opened, 0 to 1. Null when there are none to count.
  sourceOpenRate: number | null;
  flagged: number;
  lastReviewHoursAgo: number | null;
};

export function statsFor(entry: ReviewerEntry, audits: readonly ReviewAudit[] = REVIEW_AUDITS): ReviewerStats {
  const own = auditsBy(entry.handle, audits);
  const reviewer = entry.reviewer;
  const opened = own.filter((item) => item.repoSeconds !== null).length;
  return {
    reviews: reviewer?.allTime ?? 0,
    finalApprovals: reviewer?.verdicts.all.approved ?? 0,
    firstPasses: reviewer?.verdicts.all.firstPass ?? 0,
    needsChanges: reviewer?.verdicts.all.changes ?? 0,
    hoursCredited: reviewer?.hoursCredited ?? 0,
    avgSeconds: reviewer?.avgSeconds ?? 0,
    sourceOpenRate: own.length === 0 ? null : opened / own.length,
    flagged: own.filter((item) => auditFlags(item).length > 0).length,
    lastReviewHoursAgo: reviewer ? reviewer.lastActiveHoursAgo : null,
  };
}

export function reviewerTotals(entries: readonly ReviewerEntry[] = reviewerEntries()): { reviews: number; finalApprovals: number; hoursCredited: number } {
  return entries.reduce(
    (sum, entry) => {
      const stats = statsFor(entry);
      return { reviews: sum.reviews + stats.reviews, finalApprovals: sum.finalApprovals + stats.finalApprovals, hoursCredited: sum.hoursCredited + stats.hoursCredited };
    },
    { reviews: 0, finalApprovals: 0, hoursCredited: 0 },
  );
}

export type ReviewersQuery = { q: string; page: number };

export function parseReviewersQuery(raw: { q?: string | string[]; page?: string | string[] }): ReviewersQuery {
  return { q: first(raw.q).trim().slice(0, QUERY_MAX), page: parsePage(raw.page) };
}

export function reviewersHref(query: ReviewersQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/reviewers?${text}` : "/reviewers";
}

// Search by handle. A reviewer who has done the most reviews is listed first; ties fall back to the handle.
export function reviewersView(entries: readonly ReviewerEntry[], query: ReviewersQuery, per = REVIEWERS_PAGE_SIZE): Page<ReviewerEntry> {
  const term = query.q.toLowerCase().replace(/^@/, "");
  const found = entries.filter((entry) => !term || entry.handle.toLowerCase().includes(term));
  const sorted = [...found].sort((a, b) => statsFor(b).reviews - statsFor(a).reviews || a.handle.localeCompare(b.handle));
  return paginate(sorted, query.page, per);
}

// "45s", "12m 04s", "1h 03m": a time on a review, or a dash when there is none.
export function reviewDuration(seconds: number): string {
  if (seconds <= 0) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${String(Math.round(seconds % 60)).padStart(2, "0")}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export const QUEUE_SCOPE_OPTIONS = [
  { value: "software", label: "Software only" },
  { value: "hardware", label: "Hardware only" },
  { value: "both", label: "Both" },
] as const;

// The queue scope of a reviewer entry: the markers decide, and a reviewer with neither marker takes both.
export function queueScopeOf(entry: Pick<ReviewerEntry, "member">): "software" | "hardware" | "both" {
  const markers = entry.member?.markers ?? [];
  if (markers.includes(HARDWARE_ONLY)) return "hardware";
  if (markers.includes(SOFTWARE_ONLY)) return "software";
  return "both";
}

// Final reviewer: the marker on a reviewer, or any owner who reviews.
export function isFinalReviewer(entry: ReviewerEntry): boolean {
  return entry.owner || Boolean(entry.member?.markers.includes(SECOND_PASS));
}

// ---- The team log ----

export type TeamLogAction = "added" | "removed" | "updated" | "undo";
export type TeamLogEntry = { id: string; handle: string; action: TeamLogAction; by: string; hoursAgo: number; before: string[]; after: string[]; reason: string | null };

// Newest first. Roles are named the way the Team and roles page names them.
export const TEAM_LOG: readonly TeamLogEntry[] = [
  { id: "tl-7", handle: "examplepack", action: "added", by: "ironlark", hoursAgo: 190, before: [], after: ["fulfiller"], reason: null },
  { id: "tl-6", handle: "orrery", action: "updated", by: "ironlark", hoursAgo: 330, before: ["reviewer"], after: ["reviewer", "second pass"], reason: "Took on final reviews for hardware." },
  { id: "tl-5", handle: "fenwick", action: "updated", by: "ironlark", hoursAgo: 500, before: ["reviewer"], after: ["reviewer", "hardware only"], reason: "Works the hardware queue only." },
  { id: "tl-4", handle: "wick", action: "added", by: "ironlark", hoursAgo: 290, before: [], after: ["helper"], reason: null },
  { id: "tl-3", handle: "wick", action: "updated", by: "ironlark", hoursAgo: 289, before: ["helper"], after: ["helper", "reviewer"], reason: "Added by mistake." },
  { id: "tl-2", handle: "wick", action: "undo", by: "ironlark", hoursAgo: 288, before: ["helper", "reviewer"], after: ["helper"], reason: null },
  { id: "tl-1", handle: "marginalia", action: "removed", by: "ironlark", hoursAgo: 900, before: ["fulfiller"], after: [], reason: "Stepped away from the team." },
];

const rolesText = (roles: readonly string[]) => (roles.length === 0 ? "nothing" : roles.join(", "));

export function describeTeamChange(entry: Pick<TeamLogEntry, "action" | "before" | "after">): string {
  switch (entry.action) {
    case "added":
      return `added to the team as ${rolesText(entry.after)}`;
    case "removed":
      return entry.after.length > 0 ? `removed (kept ${rolesText(entry.after)})` : `removed from the team (had ${rolesText(entry.before)})`;
    case "updated":
      return `roles changed: ${rolesText(entry.before)} to ${rolesText(entry.after)}`;
    case "undo":
      return `change undone: ${rolesText(entry.before)} to ${rolesText(entry.after)}`;
  }
}

// Only a change that was not itself an undo can be undone.
export function canUndo(entry: Pick<TeamLogEntry, "action">): boolean {
  return entry.action !== "undo";
}

// ---- Words ----

// "3d ago" from days, "5h ago" from hours; both read "just now" under an hour or a day.
export function daysAgoLabel(days: number): string {
  if (days < 1) return "today";
  if (days < 60) return `${Math.floor(days)}d ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function activityLabel(hours: number): string {
  if (hours < 1) return "under 1h ago";
  if (hours < 48) return `${Math.floor(hours)}h ago`;
  return daysAgoLabel(hours / 24);
}

// "9h", "31.5h": hours from minutes, one decimal at most. Lists and facts on these pages all read this way.
export function hoursLabel(minutes: number): string {
  return `${Math.round((Math.max(0, minutes) / 60) * 10) / 10}h`;
}

// A count with its noun: "1 ship", "2 ships".
export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
