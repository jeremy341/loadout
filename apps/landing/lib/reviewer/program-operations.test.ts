import { describe, expect, test } from "bun:test";
import { operationStatus, parseOperationDate } from "./program-operations";

describe("operations schedule", () => {
  const start = new Date("2026-11-19T12:00:00Z");
  const end = new Date("2026-11-19T14:00:00Z");
  const operation = { startsAt: start, endsAt: end, pausedAt: null, endedAt: null };

  test("uses an inclusive start and exclusive end", () => {
    expect(operationStatus(operation, new Date(start.getTime() - 1))).toBe("Scheduled");
    expect(operationStatus(operation, start)).toBe("Active");
    expect(operationStatus(operation, end)).toBe("Ended");
  });

  test("treats the end as final even if the operation was paused", () => {
    const paused = { ...operation, pausedAt: start };
    expect(operationStatus(paused, start)).toBe("Paused");
    expect(operationStatus(paused, end)).toBe("Ended");
    expect(operationStatus({ ...paused, endedAt: start }, start)).toBe("Ended");
  });

  test("parses UTC and rejects dates that JavaScript silently normalizes", () => {
    expect(parseOperationDate("2026-11-19T12:00")?.toISOString()).toBe(start.toISOString());
    for (const value of ["2026-02-30T12:00", "2026-11-19T24:00", "2026-11-19T12:00Z", null]) {
      expect(parseOperationDate(value)).toBeNull();
    }
  });
});
