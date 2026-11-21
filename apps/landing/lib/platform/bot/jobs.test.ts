import { describe, expect, test } from "bun:test";
import { checkPayload, checkRunAt, hasRoom, isJobKind, JOB_MAX_PENDING, PAYLOAD_MAX_CHARS } from "./jobs";

const NOW = new Date("2026-11-18T12:00:00.000Z");
const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();

describe("checkRunAt", () => {
  test("between one second and 24 hours ahead is accepted", () => {
    expect(checkRunAt(at(1000), NOW).ok).toBe(true);
    expect(checkRunAt(at(86_400_000), NOW).ok).toBe(true);
    expect(checkRunAt(at(60 * 60 * 1000), NOW).ok).toBe(true);
  });

  test("less than one second, or more than 24 hours, is refused", () => {
    expect(checkRunAt(at(999), NOW).ok).toBe(false);
    expect(checkRunAt(at(-5000), NOW).ok).toBe(false);
    expect(checkRunAt(at(86_400_001), NOW).ok).toBe(false);
  });

  test("a value that is not an ISO time is refused", () => {
    expect(checkRunAt("soon", NOW).ok).toBe(false);
    expect(checkRunAt(12345, NOW).ok).toBe(false);
  });

  test("a valid time comes back as a Date", () => {
    const result = checkRunAt(at(60_000), NOW);
    expect(result.ok && result.value.getTime()).toBe(NOW.getTime() + 60_000);
  });
});

describe("hasRoom (pending limits per owner)", () => {
  test("20 reminders, 5 countdowns", () => {
    expect(JOB_MAX_PENDING.reminder).toBe(20);
    expect(JOB_MAX_PENDING.countdown).toBe(5);
  });

  test("the 20th reminder is refused only when 20 are already pending", () => {
    expect(hasRoom("reminder", 19)).toBe(true);
    expect(hasRoom("reminder", 20)).toBe(false);
  });

  test("the 5th countdown is refused only when 5 are already pending", () => {
    expect(hasRoom("countdown", 4)).toBe(true);
    expect(hasRoom("countdown", 5)).toBe(false);
  });
});

describe("isJobKind and checkPayload", () => {
  test("the three kinds", () => {
    expect(isJobKind("reminder")).toBe(true);
    expect(isJobKind("countdown")).toBe(true);
    expect(isJobKind("poll")).toBe(true);
    expect(isJobKind("cron")).toBe(false);
  });

  test("a payload is a plain object and at most 2000 characters", () => {
    expect(checkPayload({ text: "tea" })).toEqual({ ok: true, value: { text: "tea" } });
    expect(checkPayload(undefined)).toEqual({ ok: true, value: {} });
    expect(checkPayload([]).ok).toBe(false);
    expect(checkPayload({ text: "x".repeat(PAYLOAD_MAX_CHARS) }).ok).toBe(false);
  });
});
