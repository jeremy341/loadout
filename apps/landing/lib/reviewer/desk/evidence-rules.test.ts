import { describe, expect, test } from "bun:test";
import { REVIEW_SHIPS, shipById } from "@/lib/platform/review";
import { aiPanelView, checkedLabel, compareAi, safeAiResult } from "./evidence-ai";
import { dayToIso, daysFromJournals, findDoubleDips, normaliseAddress, overlap, type DipRecord } from "./evidence-doubledip";
import {
  AI_CHECK_FAILED,
  AI_CHECKS,
  COLLABORATOR_SHIPS,
  COMMIT_HOSTS,
  doubleDipFor,
  DOUBLE_DIP_SHIPS,
  evidenceSideTableKeys,
  PRECHECK_NOW,
  PRECHECK_RUNS,
  README_FULL_WORDS,
} from "./evidence-fixtures";
import { inPreCheckCount, newPreCheck, preCheckCounts, preCheckSteps, preCheckView, PRECHECK_TIMEOUT_MS, reducePreCheck } from "./evidence-precheck";


describe("side tables are keyed by real ships", () => {
  const real = new Set(REVIEW_SHIPS.map((ship) => ship.id));
  for (const [table, keys] of Object.entries(evidenceSideTableKeys())) {
    test(`every key of ${table} is a real ship`, () => {
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) expect(real.has(key)).toBe(true);
    });
  }

  test("the brief's ids are in the tables", () => {
    expect(Object.keys(COMMIT_HOSTS).sort()).toEqual(["sh-2041", "sh-2043", "sh-2045"]);
    expect(COMMIT_HOSTS["sh-2041"].host).toBe("github");
    expect(COMMIT_HOSTS["sh-2043"].host).toBe("codeberg");
    expect(COMMIT_HOSTS["sh-2045"].host).toBe("forgejo");
    expect([...DOUBLE_DIP_SHIPS]).toEqual(["sh-2043", "sh-2056"]);
    expect([...COLLABORATOR_SHIPS]).toEqual(["sh-2048"]);
    expect(Object.keys(AI_CHECKS).sort()).toEqual(["sh-2041", "sh-2049"]);
    expect(Object.keys(README_FULL_WORDS).length).toBeGreaterThan(0);
  });

  test("addresses in the samples are on example hosts and carry no real names", () => {
    const all = JSON.stringify([...Object.values(COMMIT_HOSTS), AI_CHECKS]);
    expect(all).not.toMatch(/https?:\/\//);
    for (const ship of REVIEW_SHIPS) expect(ship.source).toMatch(/\.example\//);
  });
});

describe("double dip", () => {
  const mine: DipRecord = { id: "s1", projectKey: "p1", program: "another-loadout", label: "mine", source: "git.example/a/b", demo: "a.example/demo", days: [{ day: "2026-10-01", minutes: 300 }] };
  const other = (patch: Partial<DipRecord>): DipRecord => ({ id: "o1", projectKey: "p2", program: "another-ysws", label: "theirs", source: null, demo: null, days: [], ...patch });

  test("addresses are compared after tidying", () => {
    expect(normaliseAddress("HTTPS://www.Git.Example/A/B.git/")).toBe("git.example/a/b");
    expect(normaliseAddress("git.example/a/b?x=1#y")).toBe("git.example/a/b");
    expect(normaliseAddress(" ")).toBeNull();
    expect(normaliseAddress(null)).toBeNull();
  });

  test("same repository, same demo and overlapping time are each found", () => {
    expect(findDoubleDips(mine, [other({ source: "https://git.example/A/B.git" })]).matches[0].kinds).toEqual(["same-repo"]);
    expect(findDoubleDips(mine, [other({ demo: "A.example/demo/" })]).matches[0].kinds).toEqual(["same-demo"]);
    const time = findDoubleDips(mine, [other({ days: [{ day: "2026-10-01", minutes: 200 }] })]);
    expect(time.matches[0].kinds).toEqual(["overlapping-time"]);
    expect(time.matches[0].detail).toContain("3h 20m");
  });

  test("small overlaps, other days and unrelated addresses do not match", () => {
    expect(findDoubleDips(mine, [other({ days: [{ day: "2026-10-01", minutes: 30 }] })]).matches).toEqual([]);
    expect(findDoubleDips(mine, [other({ days: [{ day: "2026-10-02", minutes: 500 }] })]).matches).toEqual([]);
    expect(findDoubleDips(mine, [other({ source: "git.example/a/other" })]).matches).toEqual([]);
    expect(findDoubleDips({ ...mine, source: null, demo: null }, [other({ source: null, demo: null })]).matches).toEqual([]);
  });

  test("the same project is not a double dip of itself", () => {
    expect(findDoubleDips(mine, [other({ projectKey: "p1", source: "git.example/a/b" })]).matches).toEqual([]);
    expect(findDoubleDips(mine, [other({ id: "s1", source: "git.example/a/b" })]).matches).toEqual([]);
  });

  test("overlap counts the smaller side of each shared day", () => {
    expect(overlap([{ day: "d1", minutes: 100 }, { day: "d2", minutes: 50 }], [{ day: "d1", minutes: 70 }, { day: "d2", minutes: 400 }, { day: "d3", minutes: 9 }])).toEqual({ days: 2, minutes: 120 });
    expect(overlap([], [])).toEqual({ days: 0, minutes: 0 });
  });

  test("another YSWS is named before another LOADOUT ship, more evidence first", () => {
    const result = findDoubleDips(mine, [other({ id: "z", program: "another-loadout", source: "git.example/a/b", demo: "a.example/demo" }), other({ id: "y", source: "git.example/a/b" })]);
    expect(result.program).toBe("another-ysws");
    expect(result.matches.map((m) => m.other.id)).toEqual(["z", "y"]);
    expect(findDoubleDips(mine, [other({ program: "another-loadout", source: "git.example/a/b" })]).program).toBe("another-loadout");
    expect(findDoubleDips(mine, []).program).toBeNull();
  });

  test("sh-2043 matches another YSWS and sh-2056 another LOADOUT ship; other ships match nothing", () => {
    expect(doubleDipFor("sh-2043")?.program).toBe("another-ysws");
    expect(doubleDipFor("sh-2043")?.matches[0].kinds).toEqual(["same-repo", "same-demo", "overlapping-time"]);
    expect(doubleDipFor("sh-2056")?.program).toBe("another-loadout");
    expect(doubleDipFor("sh-2056")?.matches[0].kinds).toEqual(["same-repo", "overlapping-time"]);
    for (const ship of REVIEW_SHIPS) {
      if (ship.id === "sh-2043" || ship.id === "sh-2056") continue;
      expect(doubleDipFor(ship.id)?.matches).toEqual([]);
    }
    expect(doubleDipFor("sh-0000")).toBeNull();
  });

  test("day labels become dates and journals become per-day minutes", () => {
    expect(dayToIso("14 Oct")).toBe("2026-10-14");
    expect(dayToIso("1 Nov")).toBe("2026-11-01");
    expect(dayToIso("someday")).toBeNull();
    expect(dayToIso("40 Oct")).toBeNull();
    expect(daysFromJournals([{ day: "14 Oct", minutes: 100 }, { day: "14 Oct", minutes: 20 }, { day: "bad", minutes: 5 }])).toEqual([{ day: "2026-10-14", minutes: 120 }]);
  });
});

describe("AI usage", () => {
  test("sample numbers read as a panel, with the check time in words", () => {
    const view = aiPanelView(shipById("sh-2041")!, AI_CHECKS["sh-2041"]);
    expect(view.state).toBe("ok");
    if (view.state !== "ok") return;
    expect(view.checked).toBe("checked 4 min ago");
    expect(view.comparison.state).toBe("matches");
    expect(view.flagged).toBe("1 of 6 commits looked model-written.");
    expect(view.undisclosed).toBeNull();
  });

  test("a much higher estimate than the declaration is a question", () => {
    const view = aiPanelView(shipById("sh-2049")!, AI_CHECKS["sh-2049"]);
    expect(view.state === "ok" && view.comparison.state).toBe("higher");
    expect(view.state === "ok" && view.comparison.sentence).toContain("23 points above");
  });

  test("commits signed by an AI tool with no declaration are named", () => {
    const ship = { ai: { percent: 0, uses: [], note: "" }, commits: [{ ai: true }, { ai: true }, {}] } as never;
    const view = aiPanelView(ship, AI_CHECKS["sh-2041"]);
    expect(view.state === "ok" && view.undisclosed).toBe("2 commits are signed by an AI tool and the builder declared no AI use.");
  });

  test("failure and nonsense become a quiet line and never throw", () => {
    const ship = shipById("sh-2041")!;
    for (const bad of [AI_CHECK_FAILED, undefined, null, "boom", 7, [], {}, { state: "ok" }, { state: "ok", checkedMinutesAgo: -1, commitsChecked: 1, commitsFlagged: 0, estimatedPercent: 5 }, { state: "ok", checkedMinutesAgo: 1, commitsChecked: 1, commitsFlagged: 5, estimatedPercent: 5 }, { state: "ok", checkedMinutesAgo: 1, commitsChecked: 1, commitsFlagged: 0, estimatedPercent: 140 }]) {
      const view = aiPanelView(ship, bad);
      expect(view.state).toBe("unavailable");
      expect(view.state === "unavailable" && view.line).toContain("not available");
      expect(view.state === "unavailable" && view.declaredLine).toContain("declared");
    }
    expect(safeAiResult({ state: "unavailable", reason: "x".repeat(500) })).toMatchObject({ state: "unavailable" });
  });

  test("the checked time reads in words", () => {
    expect(checkedLabel(0)).toBe("checked just now");
    expect(checkedLabel(4)).toBe("checked 4 min ago");
    expect(checkedLabel(59)).toBe("checked 59 min ago");
    expect(checkedLabel(125)).toBe("checked 2 h ago");
    expect(checkedLabel(60 * 72)).toBe("checked 3 days ago");
  });

  test("a lower estimate is not a concern", () => {
    expect(compareAi(40, 10)).toMatchObject({ state: "lower" });
    expect(compareAi(40, 50).state).toBe("matches");
    expect(compareAi(0, 11).state).toBe("higher");
  });
});

describe("pre-check", () => {
  const t0 = 1_000;

  test("the happy path: queued, running, passed", () => {
    const queued = newPreCheck(t0);
    const running = reducePreCheck(queued, { type: "start", at: t0 + 10 });
    const passed = reducePreCheck(running, { type: "pass", at: t0 + 5000 });
    expect([queued.state, running.state, passed.state]).toEqual(["queued", "running", "passed"]);
  });

  test("failing keeps the reason", () => {
    const run = reducePreCheck(reducePreCheck(newPreCheck(t0), { type: "start", at: t0 }), { type: "fail", at: t0 + 100, reason: "No README." });
    expect(run).toMatchObject({ state: "failed", reason: "No README." });
  });

  test("a check running for the timeout is timed out on the next look", () => {
    const running = reducePreCheck(newPreCheck(t0), { type: "start", at: t0 });
    expect(reducePreCheck(running, { type: "tick", at: t0 + PRECHECK_TIMEOUT_MS - 1 }).state).toBe("running");
    const timed = reducePreCheck(running, { type: "tick", at: t0 + PRECHECK_TIMEOUT_MS });
    expect(timed).toMatchObject({ state: "timed-out", endedAt: t0 + PRECHECK_TIMEOUT_MS });
  });

  test("a pass that arrives after the timeout is too late", () => {
    const running = reducePreCheck(newPreCheck(t0), { type: "start", at: t0 });
    expect(reducePreCheck(running, { type: "pass", at: t0 + PRECHECK_TIMEOUT_MS + 1 }).state).toBe("timed-out");
    expect(reducePreCheck(running, { type: "fail", at: t0 + PRECHECK_TIMEOUT_MS + 1, reason: "x" }).state).toBe("timed-out");
  });

  test("events that make no sense change nothing, and a custom timeout is respected", () => {
    const queued = newPreCheck(t0);
    expect(reducePreCheck(queued, { type: "pass", at: t0 })).toBe(queued);
    expect(reducePreCheck(queued, { type: "tick", at: t0 + 10 ** 9 })).toBe(queued);
    const running = reducePreCheck(queued, { type: "start", at: t0 });
    expect(reducePreCheck(running, { type: "start", at: t0 + 5 })).toBe(running);
    expect(reducePreCheck(running, { type: "requeue", at: t0 + 5 })).toBe(running);
    const passed = reducePreCheck(running, { type: "pass", at: t0 + 1 });
    expect(reducePreCheck(passed, { type: "fail", at: t0 + 2, reason: "x" })).toBe(passed);
    expect(reducePreCheck(passed, { type: "requeue", at: t0 + 2 })).toBe(passed);
    expect(reducePreCheck(running, { type: "tick", at: t0 + 1000 }, 1000).state).toBe("timed-out");
  });

  test("a failed or timed-out check can be queued again, and counts the attempt", () => {
    const failed = reducePreCheck(reducePreCheck(newPreCheck(t0), { type: "start", at: t0 }), { type: "fail", at: t0 + 1, reason: "x" });
    const again = reducePreCheck(failed, { type: "requeue", at: t0 + 50 });
    expect(again).toMatchObject({ state: "queued", attempt: 2, queuedAt: t0 + 50 });
    const timed = reducePreCheck(reducePreCheck(newPreCheck(t0), { type: "start", at: t0 }), { type: "tick", at: t0 + PRECHECK_TIMEOUT_MS });
    expect(reducePreCheck(timed, { type: "requeue", at: t0 + PRECHECK_TIMEOUT_MS + 1 }).state).toBe("queued");
  });

  test("the view says it in words and shows a stale run as timed out", () => {
    const running = reducePreCheck(newPreCheck(t0), { type: "start", at: t0 });
    const fresh = preCheckView(running, t0 + 30_000);
    expect(fresh).toMatchObject({ state: "running", label: "Running", inPreCheck: true, secondsLeft: PRECHECK_TIMEOUT_MS / 1000 - 30 });
    expect(fresh.sentence).toContain("Running for 30s");
    const stale = preCheckView(running, t0 + PRECHECK_TIMEOUT_MS + 5000);
    expect(stale).toMatchObject({ state: "timed-out", label: "Timed out", inPreCheck: false });
    expect(stale.sentence).toContain("no answer");
    expect(preCheckView(newPreCheck(t0), t0 + 45_000).sentence).toContain("45s so far");
  });

  test("steps mark one current step, with a word each", () => {
    expect(preCheckSteps({ state: "queued" }).map((s) => s.state)).toEqual(["current", "upcoming", "upcoming"]);
    expect(preCheckSteps({ state: "running" }).map((s) => s.state)).toEqual(["done", "current", "upcoming"]);
    expect(preCheckSteps({ state: "failed" })).toEqual([{ label: "Queued", state: "done" }, { label: "Running", state: "done" }, { label: "Failed", state: "current" }]);
    expect(preCheckSteps({ state: "timed-out" })[2].label).toBe("Timed out");
    expect(preCheckSteps({ state: "passed" })[2].label).toBe("Passed");
  });

  test("the samples cover every state, and counts feed queue health", () => {
    const states = Object.values(PRECHECK_RUNS).map((run) => preCheckView(run, PRECHECK_NOW).state);
    expect(new Set(states)).toEqual(new Set(["queued", "running", "passed", "failed", "timed-out"]));
    const counts = preCheckCounts(Object.values(PRECHECK_RUNS), PRECHECK_NOW);
    expect(counts).toEqual({ queued: 1, running: 1, passed: 1, failed: 1, "timed-out": 1 });
    expect(inPreCheckCount(Object.values(PRECHECK_RUNS), PRECHECK_NOW)).toBe(2);
    expect(inPreCheckCount([], PRECHECK_NOW)).toBe(0);
  });
});
