import { describe, expect, test } from "bun:test";
import { SEED_JOURNALS, SEED_PROJECTS } from "../data";
import { computeBuildSummary } from "./summary";
import type { MissionProgress } from "./missions";
import type { Ship } from "./types";

const NOW = Date.UTC(2026, 9, 25, 12, 0, 0);
const H = 3_600_000;

function base() {
  return { projects: SEED_PROJECTS, journals: SEED_JOURNALS, ships: [] as Ship[], reviewsDone: 0, missions: [] as MissionProgress[], now: NOW };
}

describe("build summary", () => {
  test("counts the seed state", () => {
    const s = computeBuildSummary(base());
    expect(s.projects).toHaveLength(2);
    expect(s.projects[0]).toMatchObject({ name: "Sample: ring-buffer logger", track: "Systems", visibility: "public", status: "Draft", hoursLogged: 14 });
    expect(s.journalEntries).toBe(2);
    expect(s.hoursLogged).toBe(14);
    expect(s.journalsDue).toBe(0);
    expect(s.approvedShips).toBe(0);
    expect(s.reviewsOwed).toBe(8);
    expect(s.missionsDone).toBe(0);
    expect(s.missionsTotal).toBeGreaterThan(6);
  });

  test("a project with eight uncovered hours is due and leads the prompts", () => {
    const projects = SEED_PROJECTS.map((p) => (p.id === "seed_project_logger" ? { ...p, trackerHours: 19, allocatedHours: 19 } : p));
    const s = computeBuildSummary({ ...base(), projects });
    expect(s.journalsDue).toBe(1);
    expect(s.nextActions[0].label).toBe("Write a journal entry for Sample: ring-buffer logger: 10 h since your last one");
    expect(s.nextActions[0].href).toBe("/journals");
  });

  test("owed reviews fall as reviews are done and never go below zero", () => {
    expect(computeBuildSummary({ ...base(), reviewsDone: 3 }).reviewsOwed).toBe(5);
    expect(computeBuildSummary({ ...base(), reviewsDone: 12 }).reviewsOwed).toBe(0);
    expect(computeBuildSummary({ ...base(), reviewsDone: 12 }).nextActions.some((a) => a.label.startsWith("Review a ship"))).toBe(false);
  });

  test("prompts are at most four, and each has a platform path", () => {
    const s = computeBuildSummary(base());
    expect(s.nextActions.length).toBeLessThanOrEqual(4);
    for (const action of s.nextActions) expect(action.href.startsWith("/")).toBe(true);
  });

  test("no projects asks for the first one", () => {
    const s = computeBuildSummary({ ...base(), projects: [], journals: [] });
    expect(s.nextActions[0]).toEqual({ label: "Create your first project", href: "/projects" });
  });

  test("a ready project is offered for submission", () => {
    const projects = SEED_PROJECTS.map((p) => (p.id === "seed_project_logger" ? { ...p, trackerHours: 9, allocatedHours: 9 } : p));
    const s = computeBuildSummary({ ...base(), projects });
    expect(s.nextActions.some((a) => a.label.startsWith("Submit Sample: ring-buffer logger"))).toBe(true);
  });

  test("approved missions and paid ships are counted", () => {
    const missions: MissionProgress[] = [{ missionId: "m-first-journal", status: "approved", checkedStepIds: [], text: "", url: "", startedAt: 0 }];
    const ship = { id: "s", projectId: "seed_project_logger", projectName: "X", version: "v1", state: "paid" } as Ship;
    const s = computeBuildSummary({ ...base(), missions, ships: [ship] });
    expect(s.missionsDone).toBe(1);
    expect(s.approvedShips).toBe(1);
    expect(s.projects[0].status).toBe("Paid");
    // The next mission offered is one that is now unlocked.
    expect(s.nextActions.some((a) => a.label.includes("Start the mission"))).toBe(true);
  });

  test("a ship in its flag window prompts you to read the reviews", () => {
    const ship = { id: "s", projectId: "seed_project_logger", projectName: "Logger", version: "v1", state: "flag_window", snapshot: { windowEndsAt: NOW + 5 * H } } as unknown as Ship;
    const s = computeBuildSummary({ ...base(), ships: [ship] });
    expect(s.nextActions.some((a) => a.label === "Read the reviews on Logger: the flag window closes in 5 h")).toBe(true);
  });
});
