import { describe, expect, test } from "bun:test";
import { checkHourCorrection, checkVerdict, summarizeJournalDecisions } from "./journal-verdict";

describe("checkHourCorrection", () => {
  const base = { assignedMinutes: 120, reason: "The second hour was a repeat of the first." };

  test("accepts a lower whole number with a reason", () => {
    expect(checkHourCorrection({ ...base, correctedMinutes: 60 })).toEqual({ ok: true, reason: base.reason });
  });

  test("refuses fractions, negatives and strings", () => {
    expect(checkHourCorrection({ ...base, correctedMinutes: 12.5 }).ok).toBe(false);
    expect(checkHourCorrection({ ...base, correctedMinutes: -1 }).ok).toBe(false);
    expect(checkHourCorrection({ ...base, correctedMinutes: "60" }).ok).toBe(false);
  });

  test("refuses to raise hours above what was logged", () => {
    expect(checkHourCorrection({ ...base, correctedMinutes: 121 })).toMatchObject({ ok: false });
  });

  test("refuses a correction that changes nothing", () => {
    expect(checkHourCorrection({ ...base, correctedMinutes: 120 })).toMatchObject({ ok: false });
  });

  test("needs a reason of the right length", () => {
    expect(checkHourCorrection({ ...base, correctedMinutes: 60, reason: "short" }).ok).toBe(false);
    expect(checkHourCorrection({ ...base, correctedMinutes: 60, reason: "x".repeat(281) }).ok).toBe(false);
  });
});

describe("summarizeJournalDecisions and checkVerdict", () => {
  const entries = [
    { entryId: "a", assignedMinutes: 60, approvedMinutes: 60 },
    { entryId: "b", assignedMinutes: 30, approvedMinutes: 20 },
  ];

  test("a fully decided set can be approved", () => {
    const summary = summarizeJournalDecisions(entries);
    expect(summary).toMatchObject({ complete: true, approvedMinutes: 80, approvable: true });
    expect(checkVerdict({ verdict: "approved", summary })).toEqual({ ok: true });
  });

  test("an undecided entry blocks approval but not needs-changes", () => {
    const summary = summarizeJournalDecisions([...entries, { entryId: "c", assignedMinutes: 10, approvedMinutes: null }]);
    expect(summary.undecidedIds).toEqual(["c"]);
    expect(checkVerdict({ verdict: "approved", summary }).ok).toBe(false);
    expect(checkVerdict({ verdict: "needs-changes", summary })).toEqual({ ok: true });
  });

  test("an approved amount above the logged minutes blocks approval", () => {
    const summary = summarizeJournalDecisions([{ entryId: "a", assignedMinutes: 10, approvedMinutes: 11 }]);
    expect(summary.overAssignedIds).toEqual(["a"]);
    expect(checkVerdict({ verdict: "approved", summary }).ok).toBe(false);
  });

  test("an empty journal cannot be approved", () => {
    const summary = summarizeJournalDecisions([]);
    expect(checkVerdict({ verdict: "approved", summary }).ok).toBe(false);
  });

  test("an unknown verdict is refused", () => {
    expect(checkVerdict({ verdict: "banned", summary: summarizeJournalDecisions(entries) }).ok).toBe(false);
  });
});
