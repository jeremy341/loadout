import { describe, expect, test } from "bun:test";
import { cadence, journalGate, latestEntryAt, maxEntryHours, uncoveredHours } from "./cadence";

const H = 3_600_000;

describe("journal cadence (one entry per eight hours)", () => {
  test("uncovered hours are logged hours minus covered hours, never negative", () => {
    expect(uncoveredHours(9.5, [{ hours: 4 }, { hours: 1.5 }])).toBe(4);
    expect(uncoveredHours(2, [{ hours: 5 }])).toBe(0);
    expect(uncoveredHours(0, [])).toBe(0);
  });
  test("an entry is not due at 7.99 hours and is due at exactly 8", () => {
    expect(cadence(7.99, []).due).toBe(false);
    expect(cadence(8, []).due).toBe(true);
    expect(cadence(8, [{ hours: 0.5 }]).due).toBe(false);
  });
  test("reports the hours left before an entry is due", () => {
    expect(cadence(5.5, []).hoursUntilDue).toBe(2.5);
    expect(cadence(12, []).hoursUntilDue).toBe(0);
  });
  test("writing an entry that covers the hours clears the due state", () => {
    expect(cadence(9.5, []).due).toBe(true);
    expect(cadence(9.5, [{ hours: 9.5 }]).due).toBe(false);
  });
  test("an entry cannot claim hours another entry already covers", () => {
    const entries = [
      { id: "a", hours: 4 },
      { id: "b", hours: 2 },
    ];
    expect(maxEntryHours(10, entries)).toBe(4);
    expect(maxEntryHours(10, entries, "b")).toBe(6);
  });
});

describe("24-hour journal-age gate", () => {
  test("no entry means the gate is not met", () => {
    expect(journalGate(null, 1000 * H).met).toBe(false);
    expect(journalGate(null, 1000 * H).hasEntry).toBe(false);
  });
  test("23 hours 59 minutes fails and exactly 24 hours passes", () => {
    const entry = 100 * H;
    expect(journalGate(entry, entry + 24 * H - 60_000).met).toBe(false);
    expect(journalGate(entry, entry + 24 * H).met).toBe(true);
  });
  test("reports hours since and hours left", () => {
    const gate = journalGate(0, 6 * H);
    expect(gate.hoursSince).toBe(6);
    expect(gate.hoursLeft).toBe(18);
    expect(gate.readyAt).toBe(24 * H);
  });
  test("latest entry time is the maximum, not the last in the list", () => {
    expect(latestEntryAt([{ at: 5 }, { at: 9 }, { at: 2 }])).toBe(9);
    expect(latestEntryAt([])).toBeNull();
  });
});
