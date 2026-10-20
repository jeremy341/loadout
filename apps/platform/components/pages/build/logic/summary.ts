import { ALL_MISSION_DEFS, MISSIONS } from "../content";
import { projectStatus } from "../labels";
import { cadence, roundHours } from "./cadence";
import { HOUR_MS, RULES } from "./constants";
import { approvedIdsOf, lockInfo, type MissionProgress } from "./missions";
import { effectiveHours, isActiveShip, shipChecklist } from "./ship";
import type { JournalEntry, Project, Ship, TrackName } from "./types";

// Pure summary of the Build tabs for the Overview, Profile and Achievements pages. The hook in ../summary.ts feeds
// it the saved preview state.

export interface BuildSummary {
  projects: { id: string; name: string; track: TrackName; visibility: "public" | "private"; status: string; hoursLogged: number }[];
  approvedShips: number;
  journalEntries: number;
  hoursLogged: number;
  journalsDue: number;
  reviewsDone: number;
  reviewsOwed: number;
  missionsDone: number;
  missionsTotal: number;
  nextActions: { label: string; href: string }[];
}

export interface SummaryInput {
  projects: readonly Project[];
  journals: readonly JournalEntry[];
  ships: readonly Ship[];
  reviewsDone: number;
  missions: readonly MissionProgress[];
  /** Preview time. Pass 0 before the clock is ready and time-based prompts are skipped. */
  now: number;
}

type NextAction = BuildSummary["nextActions"][number];

interface ProjectRow {
  project: Project;
  entries: JournalEntry[];
  projectShips: Ship[];
  hours: number;
  state: ReturnType<typeof cadence>;
}

function projectRows(input: SummaryInput): ProjectRow[] {
  return input.projects.map((project) => {
    const entries = input.journals.filter((e) => e.projectId === project.id);
    const hours = effectiveHours(project);
    return {
      project,
      entries,
      projectShips: input.ships.filter((s) => s.projectId === project.id),
      hours,
      state: cadence(hours, entries),
    };
  });
}

function journalActions(due: readonly ProjectRow[]): NextAction[] {
  return due.map((r) => ({
    label: `Write a journal entry for ${r.project.name}: ${r.state.uncovered} h since your last one`,
    href: "/journals",
  }));
}

function flagWindowAction(ship: Ship, now: number): NextAction[] {
  if (ship.state !== "flag_window" || !ship.snapshot || now >= ship.snapshot.windowEndsAt) return [];
  const hours = roundHours((ship.snapshot.windowEndsAt - now) / HOUR_MS);
  return [{ label: `Read the reviews on ${ship.projectName}: the flag window closes in ${hours} h`, href: "/reviews" }];
}

function flagWindowActions(ships: readonly Ship[], now: number): NextAction[] {
  if (!(now > 0)) return [];
  return ships.flatMap((ship) => flagWindowAction(ship, now));
}

function submitAction(r: ProjectRow): NextAction[] {
  if (r.projectShips.some(isActiveShip)) return [];
  const checklist = shipChecklist({ project: r.project, entries: r.entries, priorShips: r.projectShips, aiUse: ["declared at submit"] });
  if (!checklist.canSubmit) return [];
  return [{ label: `Submit ${r.project.name} for review: it passes every ship check`, href: "/projects" }];
}

function reviewAction(reviewsOwed: number, hasProjects: boolean): NextAction[] {
  if (reviewsOwed <= 0 || !hasProjects) return [];
  return [{ label: `Review a ship: ${reviewsOwed} review${reviewsOwed === 1 ? "" : "s"} owed before payout`, href: "/reviews" }];
}

function missionAction(missions: readonly MissionProgress[], approvedIds: readonly string[]): NextAction[] {
  const next = MISSIONS.find((m) => !missions.some((p) => p.missionId === m.id) && !lockInfo(m, approvedIds).locked);
  return next ? [{ label: `Start the mission "${next.title}"`, href: "/missions" }] : [];
}

const FIRST_PROJECT_ACTION: NextAction = { label: "Create your first project", href: "/projects" };

function summaryProject(r: ProjectRow): BuildSummary["projects"][number] {
  return {
    id: r.project.id,
    name: r.project.name,
    track: r.project.track,
    visibility: r.project.visibility,
    status: projectStatus(r.projectShips),
    hoursLogged: r.hours,
  };
}

export function computeBuildSummary(input: SummaryInput): BuildSummary {
  const { projects, journals, ships, missions, now } = input;
  const rows = projectRows(input);
  const due = rows.filter((r) => r.state.due).sort((a, b) => b.state.uncovered - a.state.uncovered);
  const approvedIds = approvedIdsOf(missions);
  const reviewsOwed = Math.max(0, RULES.reviewsOwed - input.reviewsDone);

  const actions = [
    ...journalActions(due),
    ...flagWindowActions(ships, now),
    ...rows.flatMap(submitAction),
    ...reviewAction(reviewsOwed, projects.length > 0),
    ...missionAction(missions, approvedIds),
  ];
  if (projects.length === 0) actions.unshift(FIRST_PROJECT_ACTION);

  return {
    projects: rows.map(summaryProject),
    approvedShips: ships.filter((s) => s.state === "paid").length,
    journalEntries: journals.length,
    hoursLogged: roundHours(rows.reduce((sum, r) => sum + r.hours, 0)),
    journalsDue: due.length,
    reviewsDone: input.reviewsDone,
    reviewsOwed,
    missionsDone: ALL_MISSION_DEFS.filter((d) => approvedIds.includes(d.id)).length,
    missionsTotal: ALL_MISSION_DEFS.length,
    nextActions: actions.slice(0, 4),
  };
}
