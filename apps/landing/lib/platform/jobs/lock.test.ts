import { describe, expect, test } from "bun:test";
import { holdsLock, LOCK_MINUTES, LOCK_MS, lockHolds, lockReleaseAt } from "./lock";

// A fake clock: 2026-11-19T12:00:00.000Z.
const T0 = Date.UTC(2026, 10, 19, 12, 0, 0);
const started = (ms: number) => new Date(T0 - ms);

describe("lockHolds (a running row holds for ten minutes)", () => {
  test("a run started one minute ago holds", () => {
    expect(lockHolds(started(60_000), new Date(T0))).toBe(true);
  });

  test("a run started just under ten minutes ago still holds", () => {
    expect(lockHolds(started(LOCK_MS - 1), new Date(T0))).toBe(true);
  });

  test("a run started exactly ten minutes ago does not hold: the window is 'less than'", () => {
    expect(lockHolds(started(LOCK_MS), new Date(T0))).toBe(false);
  });

  test("a run started eleven minutes ago does not hold, so a crashed run cannot wedge a job forever", () => {
    expect(lockHolds(started(LOCK_MS + 60_000), new Date(T0))).toBe(false);
  });

  test("a row with a future start holds: a broken clock must fail closed", () => {
    expect(lockHolds(started(-60_000), new Date(T0))).toBe(true);
  });

  test("the window is ten minutes", () => {
    expect(LOCK_MINUTES).toBe(10);
    expect(LOCK_MS).toBe(10 * 60_000);
  });
});

describe("holdsLock (any holding row refuses a fresh start)", () => {
  const now = new Date(T0);

  test("no rows at all means no lock", () => {
    expect(holdsLock([], now)).toBe(false);
  });

  test("one fresh running row means locked", () => {
    expect(holdsLock([{ startedAt: started(30_000) }], now)).toBe(true);
  });

  test("a stale row alone does not lock", () => {
    expect(holdsLock([{ startedAt: started(LOCK_MS + 1) }], now)).toBe(false);
  });

  test("a fresh row among stale ones still locks", () => {
    expect(holdsLock([{ startedAt: started(LOCK_MS + 5) }, { startedAt: started(120_000) }], now)).toBe(true);
  });
});

describe("lockReleaseAt (when it is safe to try again)", () => {
  test("is the start plus the ten minute window", () => {
    const at = new Date(T0 - 60_000);
    expect(lockReleaseAt(at).getTime()).toBe(at.getTime() + LOCK_MS);
  });
});
