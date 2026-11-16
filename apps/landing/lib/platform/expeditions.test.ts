import { describe, expect, test } from "bun:test";
import { TRACKS } from "./progress";
import {
  countByTrack,
  expeditionsHref,
  filterMissions,
  groupByStatus,
  isDone,
  MISSION_STATUSES,
  missionById,
  missionStatus,
  MISSIONS,
  parseExpeditionsQuery,
  rewardLine,
  SAMPLE_PROGRESS,
  stepsDone,
  stepsLabel,
  stepState,
  unmetPrerequisites,
  type ExpeditionsQuery,
  type Mission,
} from "./expeditions";

const mission = (id: string) => missionById(id) as Mission;
const everything: ExpeditionsQuery = { track: null, status: null };

describe("fixture", () => {
  test("ten missions with unique ids, covering all four tracks", () => {
    expect(MISSIONS).toHaveLength(10);
    expect(new Set(MISSIONS.map((entry) => entry.id)).size).toBe(MISSIONS.length);
    for (const track of TRACKS) expect(MISSIONS.some((entry) => entry.track === track)).toBe(true);
  });

  test("every prerequisite names a real mission and there is no cycle", () => {
    for (const entry of MISSIONS) {
      for (const id of entry.prerequisites) {
        expect(missionById(id)).not.toBeNull();
        expect(id).not.toBe(entry.id);
      }
    }
    // Following prerequisites from any mission always ends, so the order of the catalog is a valid order of play.
    const seen = new Set<string>();
    for (const entry of MISSIONS) {
      for (const id of entry.prerequisites) expect(seen.has(id)).toBe(true);
      seen.add(entry.id);
    }
  });

  test("every mission has steps, a submission list and a reward", () => {
    for (const entry of MISSIONS) {
      expect(entry.steps.length).toBeGreaterThan(0);
      expect(entry.submission.length).toBeGreaterThan(0);
      expect(entry.reward.ore !== undefined || Boolean(entry.reward.achievement)).toBe(true);
    }
  });

  test("the sample progress only names real missions and never passes the step count", () => {
    for (const [id, done] of Object.entries(SAMPLE_PROGRESS)) {
      expect(done).toBeLessThanOrEqual(mission(id).steps.length);
    }
  });

  test("the sample shows every status", () => {
    const seen = new Set(MISSIONS.map((entry) => missionStatus(entry, SAMPLE_PROGRESS)));
    for (const status of MISSION_STATUSES) expect(seen.has(status)).toBe(true);
  });
});

describe("step progress", () => {
  test("counts the done steps and writes them out", () => {
    expect(stepsDone(mission("profile-it"), SAMPLE_PROGRESS)).toBe(2);
    expect(stepsLabel(mission("profile-it"), SAMPLE_PROGRESS)).toBe("2 of 4 steps");
    expect(stepsLabel(mission("toolmaker"), SAMPLE_PROGRESS)).toBe("0 of 4 steps");
  });

  test("a number outside the range is clamped", () => {
    expect(stepsDone(mission("first-tool"), { "first-tool": 99 })).toBe(5);
    expect(stepsDone(mission("first-tool"), { "first-tool": -3 })).toBe(0);
    expect(stepsDone(mission("first-tool"), { "first-tool": 2.9 })).toBe(2);
  });

  test("a mission is done when every step is", () => {
    expect(isDone(mission("first-tool"), SAMPLE_PROGRESS)).toBe(true);
    expect(isDone(mission("profile-it"), SAMPLE_PROGRESS)).toBe(false);
  });
});

describe("status and prerequisites", () => {
  test("derives each status from the steps and the prerequisites", () => {
    expect(missionStatus(mission("first-tool"), SAMPLE_PROGRESS)).toBe("done");
    expect(missionStatus(mission("profile-it"), SAMPLE_PROGRESS)).toBe("in-progress");
    expect(missionStatus(mission("toolmaker"), SAMPLE_PROGRESS)).toBe("available");
    expect(missionStatus(mission("bare-metal"), SAMPLE_PROGRESS)).toBe("locked");
  });

  test("a prerequisite that is not finished locks the mission", () => {
    expect(unmetPrerequisites(mission("first-pcb"), SAMPLE_PROGRESS)).toEqual(["first-circuit"]);
    expect(missionStatus(mission("first-pcb"), SAMPLE_PROGRESS)).toBe("locked");
  });

  test("finishing the prerequisite opens the mission", () => {
    const progress = { ...SAMPLE_PROGRESS, "first-circuit": 4 };
    expect(unmetPrerequisites(mission("first-pcb"), progress)).toEqual([]);
    expect(missionStatus(mission("first-pcb"), progress)).toBe("available");
  });

  test("an unknown prerequisite keeps a mission locked", () => {
    const broken: Mission = { ...mission("toolmaker"), prerequisites: ["no-such-mission"] };
    expect(unmetPrerequisites(broken, SAMPLE_PROGRESS, MISSIONS)).toEqual(["no-such-mission"]);
    expect(missionStatus(broken, SAMPLE_PROGRESS, MISSIONS)).toBe("locked");
  });

  test("finished work stays done even if its prerequisite is open", () => {
    const progress = { "first-pcb": 5 };
    expect(missionStatus(mission("first-pcb"), progress)).toBe("done");
  });

  test("steps are done, then one is current, then the rest wait", () => {
    const profile = mission("profile-it");
    expect([0, 1, 2, 3].map((index) => stepState(profile, SAMPLE_PROGRESS, index))).toEqual(["done", "done", "current", "todo"]);
  });

  test("nothing is current while the mission is locked", () => {
    const locked = mission("bare-metal");
    expect([0, 1, 2, 3, 4].map((index) => stepState(locked, SAMPLE_PROGRESS, index))).toEqual(["todo", "todo", "todo", "todo", "todo"]);
  });
});

describe("query", () => {
  test("an empty address shows everything", () => {
    expect(parseExpeditionsQuery({})).toEqual(everything);
  });

  test("reads the track and the status, in any case", () => {
    expect(parseExpeditionsQuery({ track: "Hardware", status: "In-Progress" })).toEqual({ track: "Hardware", status: "in-progress" });
  });

  test("unknown values are ignored and a repeated one uses the first", () => {
    expect(parseExpeditionsQuery({ track: "art", status: "finished" })).toEqual(everything);
    expect(parseExpeditionsQuery({ track: ["tools", "systems"], status: ["done", "locked"] })).toEqual({ track: "Tools", status: "done" });
  });

  test("the default view has no query and a filtered view keeps both parts", () => {
    expect(expeditionsHref(everything)).toBe("/dashboard/expeditions");
    expect(expeditionsHref({ track: "Systems", status: null })).toBe("/dashboard/expeditions?track=systems");
    expect(expeditionsHref({ track: "Tools", status: "locked" })).toBe("/dashboard/expeditions?track=tools&status=locked");
  });
});

describe("filter and group", () => {
  test("filters by track", () => {
    const shown = filterMissions(MISSIONS, { track: "Tools", status: null }, SAMPLE_PROGRESS);
    expect(shown.map((entry) => entry.id)).toEqual(["first-tool", "profile-it", "toolmaker"]);
  });

  test("filters by status", () => {
    const shown = filterMissions(MISSIONS, { track: null, status: "locked" }, SAMPLE_PROGRESS);
    expect(shown.map((entry) => entry.id)).toEqual(["bare-metal", "local-brain", "first-pcb"]);
  });

  test("track and status combine", () => {
    const shown = filterMissions(MISSIONS, { track: "Hardware", status: "in-progress" }, SAMPLE_PROGRESS);
    expect(shown.map((entry) => entry.id)).toEqual(["first-circuit"]);
    expect(filterMissions(MISSIONS, { track: "Compute", status: "done" }, SAMPLE_PROGRESS)).toEqual([]);
  });

  test("groups follow the status order and leave out empty groups", () => {
    const groups = groupByStatus(MISSIONS, SAMPLE_PROGRESS);
    expect(groups.map((group) => group.status)).toEqual(["in-progress", "available", "locked", "done"]);
    expect(groups.reduce((sum, group) => sum + group.missions.length, 0)).toBe(MISSIONS.length);
    const onlyCompute = groupByStatus(filterMissions(MISSIONS, { track: "Compute", status: null }, SAMPLE_PROGRESS), SAMPLE_PROGRESS);
    expect(onlyCompute.map((group) => group.status)).toEqual(["available", "locked"]);
  });

  test("status is judged against the whole catalog, not the filtered list", () => {
    // first-pcb needs first-circuit, which a Hardware-only list still contains, but a Compute-only list does not.
    const subset = filterMissions(MISSIONS, { track: "Compute", status: null }, SAMPLE_PROGRESS);
    expect(groupByStatus(subset, SAMPLE_PROGRESS).find((group) => group.status === "locked")?.missions.map((entry) => entry.id)).toEqual(["local-brain"]);
  });

  test("counts missions per track", () => {
    expect(countByTrack(MISSIONS)).toEqual({ Tools: 3, Systems: 3, Compute: 2, Hardware: 2 });
  });
});

describe("reward line", () => {
  test("joins Ore and an achievement", () => {
    expect(rewardLine({ ore: 40, achievement: "CLOCKED" })).toBe("40 Ore and CLOCKED");
  });

  test("either part alone, or a plain note when none is set", () => {
    expect(rewardLine({ ore: 30 })).toBe("30 Ore");
    expect(rewardLine({ achievement: "TOOLMAKER" })).toBe("TOOLMAKER");
    expect(rewardLine({})).toBe("No reward set");
  });
});
