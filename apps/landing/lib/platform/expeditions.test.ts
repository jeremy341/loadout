import { describe, expect, test } from "bun:test";
import { TRACKS } from "./progress";
import {
  approvedHoursFromMinutes,
  canEquipExpedition,
  hoursToFinish,
  progressWithEquips,
  stepsFromHours,
  countByTrack,
  EXPEDITIONS_PAGE_SIZE,
  EXPEDITIONS_QUERY_MAX,
  expeditionsHref,
  filterMissions,
  isDone,
  MISSION_STATUSES,
  missionById,
  missionStatus,
  nextAction,
  pageMissions,
  MISSIONS,
  parseExpeditionsQuery,
  rewardLine,
  sortByState,
  statusCounts,
  SAMPLE_PROGRESS,
  stepsDone,
  stepsLabel,
  stepState,
  unmetPrerequisites,
  type ExpeditionsQuery,
  type Mission,
} from "./expeditions";

const mission = (id: string) => missionById(id) as Mission;
const everything: ExpeditionsQuery = { q: "", track: null, page: 1 };

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

  test("a non-finite count is treated as zero, so labels and next actions stay valid", () => {
    // benchmarked has no prerequisite, so nextAction reaches the step lookup a NaN count used to crash.
    const open = mission("benchmarked");
    const bad = { benchmarked: Number.NaN };
    expect(stepsDone(open, bad)).toBe(0);
    expect(stepsLabel(open, bad)).toBe("0 of 4 steps");
    expect(isDone(open, bad)).toBe(false);
    expect(nextAction(open, bad)).toEqual({ kind: "step", number: 1, total: 4, title: "Choose a workload", detail: "Pick a computation you can run many times, such as a sort, a render or an inference.", started: false });
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
  test("an empty address shows everything on page 1", () => {
    expect(parseExpeditionsQuery({})).toEqual(everything);
  });

  test("reads the search, the track and the page", () => {
    expect(parseExpeditionsQuery({ q: "  bare   metal ", track: "Hardware", page: "2" })).toEqual({ q: "bare metal", track: "Hardware", page: 2 });
  });

  test("unknown values are ignored and a repeated one uses the first", () => {
    expect(parseExpeditionsQuery({ track: "art", page: "0" })).toEqual(everything);
    expect(parseExpeditionsQuery({ page: "abc" })).toEqual(everything);
    expect(parseExpeditionsQuery({ track: ["tools", "systems"], page: ["2", "3"] })).toEqual({ q: "", track: "Tools", page: 2 });
  });

  test("a long search is cut", () => {
    expect(parseExpeditionsQuery({ q: "a".repeat(500) }).q).toHaveLength(EXPEDITIONS_QUERY_MAX);
  });

  test("the default view has no query and page 1 is never written", () => {
    expect(expeditionsHref()).toBe("/dashboard/shop/expeditions");
    expect(expeditionsHref(everything)).toBe("/dashboard/shop/expeditions");
    expect(expeditionsHref({ track: "Systems" })).toBe("/dashboard/shop/expeditions?track=systems");
    expect(expeditionsHref({ q: "pcb", track: "Tools", page: 2 })).toBe("/dashboard/shop/expeditions?q=pcb&track=tools&page=2");
    expect(expeditionsHref({ page: 1 })).toBe("/dashboard/shop/expeditions");
  });
});

describe("search, sort and pages", () => {
  test("filters by track", () => {
    expect(filterMissions(MISSIONS, { q: "", track: "Tools" }).map((entry) => entry.id)).toEqual(["first-tool", "profile-it", "toolmaker"]);
  });

  test("search matches a name, a line, a level or a step title, and every word must match", () => {
    expect(filterMissions(MISSIONS, { q: "bare metal", track: null }).map((entry) => entry.id)).toEqual(["bare-metal"]);
    expect(filterMissions(MISSIONS, { q: "hot spot", track: null }).map((entry) => entry.id)).toEqual(["profile-it"]);
    expect(filterMissions(MISSIONS, { q: "advanced", track: null }).map((entry) => entry.id)).toEqual(["bare-metal"]);
    expect(filterMissions(MISSIONS, { q: "bare zebra", track: null })).toEqual([]);
  });

  test("track and search combine", () => {
    expect(filterMissions(MISSIONS, { q: "first", track: "Hardware" }).map((entry) => entry.id)).toEqual(["first-circuit", "first-pcb"]);
    expect(filterMissions(MISSIONS, { q: "first", track: "Compute" })).toEqual([]);
  });

  test("open work comes first, then available, locked and done, in catalog order", () => {
    const sorted = sortByState(MISSIONS, SAMPLE_PROGRESS);
    expect(sorted).toHaveLength(MISSIONS.length);
    expect(sorted.map((entry) => entry.id)).toEqual([
      "profile-it", "packet-pusher", "first-circuit",
      "toolmaker", "benchmarked",
      "bare-metal", "local-brain", "first-pcb",
      "first-tool", "serve-it",
    ]);
  });

  test("status is judged against the whole catalog, not the filtered list", () => {
    // local-brain needs benchmarked, which a Compute-only list still contains, but a Hardware-only list does not.
    const subset = filterMissions(MISSIONS, { q: "", track: "Compute" });
    expect(sortByState(subset, SAMPLE_PROGRESS).map((entry) => entry.id)).toEqual(["benchmarked", "local-brain"]);
    const alone = filterMissions(MISSIONS, { q: "run a model", track: null });
    expect(missionStatus(alone[0] as Mission, SAMPLE_PROGRESS, MISSIONS)).toBe("locked");
  });

  test("pages hold six, a page past the end shows the last, and an empty list is one empty page", () => {
    const sorted = sortByState(MISSIONS, SAMPLE_PROGRESS);
    const one = pageMissions(sorted, 1);
    expect([one.items.length, one.pages, one.total, one.page]).toEqual([EXPEDITIONS_PAGE_SIZE, 2, 10, 1]);
    const two = pageMissions(sorted, 2);
    expect(two.items).toHaveLength(4);
    expect(pageMissions(sorted, 9).page).toBe(2);
    expect(pageMissions(sorted, -4).page).toBe(1);
    expect(pageMissions([], 3)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
  });

  test("counts missions per state and per track", () => {
    expect(statusCounts(MISSIONS, SAMPLE_PROGRESS)).toEqual({ "in-progress": 3, available: 2, locked: 3, done: 2 });
    expect(countByTrack(MISSIONS)).toEqual({ Tools: 3, Systems: 3, Compute: 2, Hardware: 2 });
  });
});

describe("next action", () => {
  test("points at the step to work on", () => {
    expect(nextAction(mission("profile-it"), SAMPLE_PROGRESS)).toEqual({
      kind: "step",
      number: 3,
      total: 4,
      title: "Find the hot spot",
      detail: "Use a profiler to name the one place most of the time goes.",
      started: true,
    });
  });

  test("an untouched mission starts at step 1", () => {
    const next = nextAction(mission("toolmaker"), SAMPLE_PROGRESS);
    expect(next.kind === "step" && [next.number, next.started]).toEqual([1, false]);
  });

  test("a locked mission names what to finish first, an unknown id by its id", () => {
    expect(nextAction(mission("bare-metal"), SAMPLE_PROGRESS)).toEqual({ kind: "locked", blockers: [{ id: "packet-pusher", name: "Speak a protocol" }] });
    const broken: Mission = { ...mission("toolmaker"), prerequisites: ["no-such-mission"] };
    expect(nextAction(broken, SAMPLE_PROGRESS, MISSIONS)).toEqual({ kind: "locked", blockers: [{ id: "no-such-mission", name: "no-such-mission" }] });
  });

  test("a finished mission has nothing next", () => {
    expect(nextAction(mission("first-tool"), SAMPLE_PROGRESS)).toEqual({ kind: "done" });
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

describe("equipping an expedition", () => {
  const toolmaker = missionById("toolmaker")!; // Tools, 10 hours, 4 steps, needs first-tool (done in the sample)
  const bare = missionById("bare-metal")!; // Systems, locked behind packet-pusher
  const done = missionById("first-tool")!; // Tools, finished in the sample
  const mine = { id: "p1", ownerId: "me", track: "Tools" };
  const base = { viewerId: "me", project: mine, progress: SAMPLE_PROGRESS, onProject: [] as string[], elsewhere: [] as string[] };

  test("approved hours are whole hours from approved minutes", () => {
    expect(approvedHoursFromMinutes(0)).toBe(0);
    expect(approvedHoursFromMinutes(119)).toBe(1);
    expect(approvedHoursFromMinutes(600)).toBe(10);
    expect(approvedHoursFromMinutes(-5)).toBe(0);
    expect(approvedHoursFromMinutes(Number.NaN)).toBe(0);
  });

  test("steps share the mission hours evenly and stop at the last step", () => {
    expect(stepsFromHours(toolmaker, 0)).toBe(0);
    expect(stepsFromHours(toolmaker, 2)).toBe(0);
    expect(stepsFromHours(toolmaker, 3)).toBe(1);
    expect(stepsFromHours(toolmaker, 5)).toBe(2);
    expect(stepsFromHours(toolmaker, 10)).toBe(4);
    expect(stepsFromHours(toolmaker, 400)).toBe(4);
    expect(stepsFromHours(toolmaker, -3)).toBe(0);
    expect(hoursToFinish(toolmaker, 4)).toBe(6);
    expect(hoursToFinish(toolmaker, 99)).toBe(0);
  });

  test("an open expedition in the project's track can be equipped by the owner", () => {
    expect(canEquipExpedition({ ...base, mission: toolmaker })).toEqual({ ok: true });
  });

  test("only the owner can equip", () => {
    const verdict = canEquipExpedition({ ...base, mission: toolmaker, project: { ...mine, ownerId: "someone" } });
    expect(verdict).toMatchObject({ ok: false, code: "not-your-project" });
  });

  test("the expedition must be in the project's track", () => {
    expect(canEquipExpedition({ ...base, mission: toolmaker, project: { ...mine, track: "Systems" } })).toMatchObject({ ok: false, code: "wrong-track" });
    expect(canEquipExpedition({ ...base, mission: toolmaker, project: { ...mine, track: null } })).toMatchObject({ ok: false, code: "wrong-track" });
  });

  test("a locked expedition names what to finish first", () => {
    const verdict = canEquipExpedition({ ...base, mission: bare, project: { ...mine, track: "Systems" } });
    expect(verdict).toMatchObject({ ok: false, code: "locked" });
    expect(verdict.ok ? "" : verdict.reason).toContain("Speak a protocol");
  });

  test("a finished expedition cannot be equipped again", () => {
    expect(canEquipExpedition({ ...base, mission: done })).toMatchObject({ ok: false, code: "finished" });
  });

  test("a project carries one unfinished expedition at a time, and finished ones do not block", () => {
    const busy = canEquipExpedition({ ...base, mission: toolmaker, onProject: ["profile-it"] });
    expect(busy).toMatchObject({ ok: false, code: "project-busy" });
    expect(busy.ok ? "" : busy.reason).toContain("Profile before you optimise");
    expect(canEquipExpedition({ ...base, mission: toolmaker, onProject: ["first-tool"] })).toEqual({ ok: true });
  });

  test("the same expedition cannot sit on two projects", () => {
    expect(canEquipExpedition({ ...base, mission: toolmaker, elsewhere: ["toolmaker"] })).toMatchObject({ ok: false, code: "elsewhere" });
  });

  test("an unknown expedition is refused", () => {
    expect(canEquipExpedition({ ...base, mission: null })).toMatchObject({ ok: false, code: "no-expedition" });
  });

  test("progress comes from the equipped project's approved hours, in the right track only", () => {
    const rows = [{ expeditionId: "toolmaker", projectTrack: "Tools", approvedMinutes: 300 }];
    expect(progressWithEquips(SAMPLE_PROGRESS, rows).toolmaker).toBe(2);
    expect(progressWithEquips(SAMPLE_PROGRESS, [{ ...rows[0]!, projectTrack: "Systems" }]).toolmaker).toBeUndefined();
    expect(progressWithEquips(SAMPLE_PROGRESS, [{ ...rows[0]!, approvedMinutes: 59 }]).toolmaker).toBe(0);
    expect(progressWithEquips(SAMPLE_PROGRESS, [{ ...rows[0]!, approvedMinutes: 6000 }]).toolmaker).toBe(4);
  });

  test("equipped hours never lower a number already reached", () => {
    const rows = [{ expeditionId: "profile-it", projectTrack: "Tools", approvedMinutes: 60 }];
    expect(progressWithEquips(SAMPLE_PROGRESS, rows)["profile-it"]).toBe(2);
  });

  test("finishing an equipped expedition opens what it unlocks and stops it being equipped again", () => {
    const progress = progressWithEquips({}, [{ expeditionId: "first-tool", projectTrack: "Tools", approvedMinutes: 360 }]);
    expect(isDone(done, progress)).toBe(true);
    expect(missionStatus(toolmaker, progress)).toBe("available");
    expect(canEquipExpedition({ ...base, progress, mission: done, onProject: ["first-tool"] })).toMatchObject({ ok: false, code: "finished" });
  });

  test("an unknown expedition id in a row is ignored", () => {
    expect(progressWithEquips({}, [{ expeditionId: "nope", projectTrack: "Tools", approvedMinutes: 6000 }])).toEqual({});
  });
});
