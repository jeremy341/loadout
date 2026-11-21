import { describe, expect, test } from "bun:test";
import { parseDuration, parsePoll } from "./parse";
import { countVotes, formatResults, pollText } from "./poll";
import { createScheduler, type Timers } from "./scheduler";
import { fakeLog, job } from "../_testkit";

describe("parseDuration", () => {
  test("reads seconds, minutes, hours and combinations", () => {
    expect(parseDuration("90s")).toEqual({ ms: 90_000 });
    expect(parseDuration("10min")).toEqual({ ms: 600_000 });
    expect(parseDuration("2h")).toEqual({ ms: 7_200_000 });
    expect(parseDuration("1h30min")).toEqual({ ms: 5_400_000 });
    expect(parseDuration("1h 30min 15s")).toEqual({ ms: 5_415_000 });
    expect(parseDuration("10MIN")).toEqual({ ms: 600_000 });
  });

  test("bounds are one second to 24 hours", () => {
    expect(parseDuration("1s")).toEqual({ ms: 1000 });
    expect(parseDuration("24h")).toEqual({ ms: 86_400_000 });
    expect(parseDuration("0s")).toEqual({ error: "too_short" });
    expect(parseDuration("25h")).toEqual({ error: "too_long" });
  });

  test("rejects empty and unitless input", () => {
    expect(parseDuration("  ")).toEqual({ error: "empty" });
    expect(parseDuration("10")).toEqual({ error: "format" });
    expect(parseDuration("soon")).toEqual({ error: "format" });
    expect(parseDuration("10m")).toEqual({ error: "format" });
    expect(parseDuration("1h30")).toEqual({ error: "format" });
  });
});

describe("parsePoll", () => {
  test("reads question and options", () => {
    expect(parsePoll("Pizza; Yes, No")).toEqual({ question: "Pizza", options: ["Yes", "No"] });
  });

  test("a trailing duration closes the poll and is not an option", () => {
    expect(parsePoll("Pizza?; Yes, No, Maybe, 10min")).toEqual({ question: "Pizza?", options: ["Yes", "No", "Maybe"], durationMs: 600_000 });
    expect(parsePoll("Pizza?; Yes, No, 10min,")).toEqual({ question: "Pizza?", options: ["Yes", "No"], durationMs: 600_000 });
  });

  test("option and count limits", () => {
    expect(parsePoll("Q; A")).toEqual({ error: "too_few_options" });
    const nine = Array.from({ length: 9 }, (_, i) => `o${i}`).join(", ");
    expect(parsePoll(`Q; ${nine}`)).toMatchObject({ options: expect.any(Array) });
    const ten = Array.from({ length: 10 }, (_, i) => `o${i}`).join(", ");
    expect(parsePoll(`Q; ${ten}`)).toEqual({ error: "too_many_options" });
  });

  test("question rules", () => {
    expect("error" in parsePoll("A; B, C")).toBe(false);
    expect(parsePoll("no separator here")).toEqual({ error: "no_question" });
    expect(parsePoll("; A, B")).toEqual({ error: "no_question" });
    expect(parsePoll("")).toEqual({ error: "empty" });
    expect(parsePoll(`${"q".repeat(281)}; A, B`)).toEqual({ error: "question_too_long" });
    expect("error" in parsePoll(`${"q".repeat(280)}; A, B`)).toBe(false);
  });
});

describe("poll results", () => {
  test("the bot's own seed reaction is not a vote", () => {
    expect(countVotes({ name: "one", count: 3, users: ["UBOT", "U1", "U2"] }, "UBOT")).toBe(2);
    expect(countVotes({ name: "one", count: 2 }, "UBOT")).toBe(1);
    expect(countVotes(undefined, "UBOT")).toBe(0);
  });

  test("text", () => {
    expect(pollText("Pizza?", ["Yes", "No"])).toContain("1. Yes\n2. No");
    expect(formatResults("Pizza?", ["Yes", "No"], [2, 1])).toBe("Poll closed: Pizza?\n1. Yes: 2 votes\n2. No: 1 vote");
  });
});

describe("scheduler", () => {
  test("runs a job when its timer fires, and a past job runs at once", async () => {
    const fired: string[] = [];
    const pendingFns: (() => void)[] = [];
    const timers: Timers = {
      now: () => Date.parse("2026-11-18T12:00:00.000Z"),
      setTimer: (fn) => {
        pendingFns.push(fn);
        return pendingFns.length;
      },
      clearTimer: () => {},
    };
    const scheduler = createScheduler({
      run: async (j) => {
        fired.push(j.id);
      },
      timers,
      log: fakeLog(),
    });
    scheduler.schedule(job({ kind: "reminder", id: "later", runAt: "2026-11-18T12:10:00.000Z" }));
    scheduler.schedule(job({ kind: "reminder", id: "past", runAt: "2026-11-18T11:00:00.000Z" }));
    expect(scheduler.pending()).toBe(2);
    pendingFns[1]?.();
    await Promise.resolve();
    expect(fired).toEqual(["past"]);
    pendingFns[0]?.();
    await Promise.resolve();
    expect(fired).toEqual(["past", "later"]);
  });

  test("a cancelled job is cleared", () => {
    const cleared: unknown[] = [];
    const scheduler = createScheduler({
      run: async () => {},
      timers: { now: () => 0, setTimer: () => "h1", clearTimer: (h) => cleared.push(h) },
      log: fakeLog(),
    });
    scheduler.schedule(job({ kind: "countdown", id: "c1", runAt: "1970-01-01T00:00:10.000Z" }));
    scheduler.cancel("c1");
    expect(cleared).toEqual(["h1"]);
    expect(scheduler.pending()).toBe(0);
  });
});
