import { describe, expect, test } from "bun:test";
import { QUEST_DEFS } from "../data";
import { fromDateInput } from "./dates";
import {
  completionKey,
  countAction,
  newlyCompleted,
  questProgress,
  sumJournalHours,
  validateContribution,
  type Contribution,
  type ContributionInput,
  type QuestContext,
} from "./quests";
import { weekWindow } from "./windows";

const utc = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h);
const c = (type: Contribution["type"], qty: number, m: number, d: number, extra: Partial<Contribution> = {}): Contribution => ({
  id: `${type}${m}${d}${qty}`,
  type,
  qty,
  track: "Tools",
  at: new Date(utc(2026, m, d)).toISOString(),
  ...extra,
});
const def = (id: string) => {
  const found = QUEST_DEFS.find((q) => q.id === id);
  if (!found) throw new Error(`missing quest ${id}`);
  return found;
};
const ctx = (contributions: Contribution[], streakCurrent = 0): QuestContext => ({
  contributions,
  window: { start: utc(2026, 10, 5, 0), end: utc(2026, 11, 2, 0) },
  streakCurrent,
});

describe("counting", () => {
  test("only counts the action type inside the window", () => {
    const log = [c("review", 2, 10, 6), c("review", 1, 9, 30), c("ship", 1, 10, 7), c("review", 3, 11, 2)];
    expect(countAction(log, "review", ctx(log).window)).toBe(2);
    expect(countAction(log, "review", null)).toBe(6);
  });

  test("journal hours", () => {
    const log = [c("journal", 2, 10, 6, { hours: 5.5 }), c("journal", 1, 10, 7), c("review", 1, 10, 7, { hours: 9 })];
    expect(sumJournalHours(log, null)).toBe(5.5);
    expect(sumJournalHours(log, weekWindow(utc(2026, 10, 20)))).toBe(0);
  });
});

describe("quest progress", () => {
  test("multi-step quest needs every step", () => {
    const quest = def("boot-sequence");
    expect(questProgress(quest, ctx([])).complete).toBe(false);
    const partial = questProgress(quest, ctx([c("journal", 1, 10, 6), c("review", 1, 10, 7)]));
    expect(partial).toMatchObject({ doneSteps: 2, totalSteps: 3, complete: false });
    expect(partial.pct).toBe(67);
    const full = questProgress(quest, ctx([c("journal", 1, 10, 6), c("review", 1, 10, 7), c("ship", 1, 10, 8)]));
    expect(full).toMatchObject({ doneSteps: 3, complete: true, pct: 100 });
  });

  test("a count step caps at its target and reports a fraction", () => {
    const quest = def("keep-a-log");
    const some = questProgress(quest, ctx([c("journal", 2, 10, 6)]));
    expect(some.steps[0]).toMatchObject({ value: 2, target: 5, done: false });
    expect(some.pct).toBe(40);
    const over = questProgress(quest, ctx([c("journal", 9, 10, 6)]));
    expect(over.steps[0]).toMatchObject({ value: 5, done: true });
    expect(over.complete).toBe(true);
  });

  test("log entries outside the Season do not count", () => {
    const quest = def("pay-it-back");
    expect(questProgress(quest, ctx([c("review", 4, 9, 20)])).complete).toBe(false);
  });

  test("the streak quest follows the current streak", () => {
    const quest = def("weekly-rhythm");
    expect(questProgress(quest, ctx([], 2)).complete).toBe(false);
    expect(questProgress(quest, ctx([], 3)).complete).toBe(true);
  });

  test("every Draft quest has at least one step and a unique id", () => {
    expect(new Set(QUEST_DEFS.map((q) => q.id)).size).toBe(QUEST_DEFS.length);
    for (const q of QUEST_DEFS) expect(q.steps.length).toBeGreaterThan(0);
  });
});

describe("completion", () => {
  test("lists quests completed by the log but not yet recorded", () => {
    const log = [c("review", 4, 10, 6)];
    const fresh = newlyCompleted(QUEST_DEFS, "S00", {}, ctx(log));
    expect(fresh.map((q) => q.id)).toEqual(["pay-it-back"]);
  });

  test("a recorded completion is not reported again, and is per Season", () => {
    const log = [c("review", 4, 10, 6)];
    const done = { [completionKey("S00", "pay-it-back")]: "2026-10-20T12:00:00.000Z" };
    expect(newlyCompleted(QUEST_DEFS, "S00", done, ctx(log))).toEqual([]);
    expect(newlyCompleted(QUEST_DEFS, "S01", done, ctx(log)).map((q) => q.id)).toEqual(["pay-it-back"]);
  });
});

describe("validating the Log work form", () => {
  const today = utc(2026, 10, 20, 0);
  const base: ContributionInput = { type: "ship", qty: "2", hours: "", track: "Tools", date: "2026-10-20", note: "" };

  test("accepts a good entry", () => {
    const r = validateContribution(base, today, fromDateInput);
    expect(r).toMatchObject({ ok: true, qty: 2, dateMs: today, note: "" });
  });

  test("quantity must be a whole number from 1 to 20", () => {
    for (const qty of ["", "0", "-1", "1.5", "21", "abc"]) {
      const r = validateContribution({ ...base, qty }, today, fromDateInput);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.qty).toBeTruthy();
    }
  });

  test("journal entries need hours with one decimal at most", () => {
    const journal: ContributionInput = { ...base, type: "journal" };
    const missing = validateContribution(journal, today, fromDateInput);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.errors.hours).toBeTruthy();
    for (const hours of ["0", "-2", "81", "2.55"]) expect(validateContribution({ ...journal, hours }, today, fromDateInput).ok).toBe(false);
    const ok = validateContribution({ ...journal, hours: "3.5" }, today, fromDateInput);
    expect(ok).toMatchObject({ ok: true, hours: 3.5 });
  });

  test("hours are ignored for ships and reviews", () => {
    const r = validateContribution({ ...base, hours: "999" }, today, fromDateInput);
    expect(r).toMatchObject({ ok: true, hours: undefined });
  });

  test("dates: real, not in the future, not too far back", () => {
    const bad = (date: string) => validateContribution({ ...base, date }, today, fromDateInput);
    expect(bad("2026-10-21").ok).toBe(false);
    expect(bad("2026-02-30").ok).toBe(false);
    expect(bad("nonsense").ok).toBe(false);
    expect(bad("2026-07-01").ok).toBe(false);
    expect(bad("2026-10-01").ok).toBe(true);
  });

  test("the note is trimmed and length limited", () => {
    expect(validateContribution({ ...base, note: "  hello  " }, today, fromDateInput)).toMatchObject({ ok: true, note: "hello" });
    expect(validateContribution({ ...base, note: "x".repeat(141) }, today, fromDateInput).ok).toBe(false);
  });
});
