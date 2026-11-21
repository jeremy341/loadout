import { describe, expect, test } from "bun:test";
import { firstPassOverdue, OUTBOX_STUCK_MINUTES, QUEUE_OVERDUE_HOURS } from "./jobs/queue-health";

// A fake clock: 2026-11-19T12:00:00.000Z.
const T0 = Date.UTC(2026, 10, 19, 12, 0, 0);
const ago = (ms: number) => new Date(T0 - ms);
const HOUR = 3_600_000;

// assignmentWindow gives a re-ship 72 hours (lib/platform/review-rules.ts); queue-health's own threshold is 48 hours,
// so a locked assignment runs longer than the plain wait does.
const WINDOW = 72 * HOUR;

describe("firstPassOverdue (the first-pass queue's alarm figure)", () => {
  test("a fresh ship is not overdue", () => {
    expect(firstPassOverdue({ submittedAt: ago(HOUR), reshippedAt: null, assignedTo: null }, new Date(T0))).toBe(false);
  });

  test("a queued ship past the threshold with nobody on it is overdue", () => {
    expect(
      firstPassOverdue({ submittedAt: ago(QUEUE_OVERDUE_HOURS * HOUR + 1), reshippedAt: null, assignedTo: null }, new Date(T0)),
    ).toBe(true);
  });

  test("exactly on the threshold counts as overdue: attention is owed, not grilled for", () => {
    expect(
      firstPassOverdue({ submittedAt: ago(QUEUE_OVERDUE_HOURS * HOUR), reshippedAt: null, assignedTo: null }, new Date(T0)),
    ).toBe(true);
  });

  test("a ship with no submittedAt is never overdue", () => {
    expect(firstPassOverdue({ submittedAt: null, reshippedAt: null, assignedTo: null }, new Date(T0))).toBe(false);
  });

  test("a re-ship locked to its reviewer inside the assignment window is not overdue", () => {
    expect(
      firstPassOverdue(
        { submittedAt: ago(QUEUE_OVERDUE_HOURS * HOUR + 1), reshippedAt: ago(HOUR), assignedTo: "reviewer" },
        new Date(T0),
      ),
    ).toBe(false);
  });

  test("the same assigned ship is overdue once its 72 hour window has closed", () => {
    expect(
      firstPassOverdue(
        { submittedAt: ago(QUEUE_OVERDUE_HOURS * HOUR + WINDOW + 1), reshippedAt: ago(WINDOW + 1), assignedTo: "reviewer" },
        new Date(T0),
      ),
    ).toBe(true);
  });

  test("an assigned ship with no re-ship time is not overdue: the desk's assignmentView reads it as a kept assignment", () => {
    expect(
      firstPassOverdue({ submittedAt: ago(QUEUE_OVERDUE_HOURS * HOUR + 1), reshippedAt: null, assignedTo: "reviewer" }, new Date(T0)),
    ).toBe(false);
  });
});

describe("the thresholds", () => {
  test("the queue alarm is 48 hours, the outbox stuck window past the whole backoff is 30 minutes", () => {
    expect(QUEUE_OVERDUE_HOURS).toBe(48);
    expect(OUTBOX_STUCK_MINUTES).toBe(30);
  });
});
