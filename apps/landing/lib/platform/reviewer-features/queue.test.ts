import { describe, expect, test } from "bun:test";
import { assignmentState, ASSIGNMENT_WINDOW_MS, canReviewAssigned } from "./assignment";
import { checkHoldReason, filterShips, queueHealth, queueWaitMs, queueWaitStart, resolveQueueFilter, WAIT_AGED_MS, type QueueShip } from "./queue";
import { checkNoteBody, checkNoteImage, authorColour, NOTE_COLOURS, NOTE_IMAGES_MAX, NOTE_MAX } from "./notes";
import { pipelineStrip } from "./pipeline";
import { resubmitNotice } from "./resubmit";

const day = 24 * 60 * 60 * 1000;

describe("assignment window", () => {
  test("no assignment is the common queue", () => {
    expect(assignmentState({ assignedReviewerId: null, reshippedAt: null, now: 0 })).toEqual({ holderId: null, returnsAt: null, returned: false });
  });

  test("an assignment before the re-ship holds with no clock", () => {
    expect(assignmentState({ assignedReviewerId: "r1", reshippedAt: null, now: 99 * day })).toMatchObject({ holderId: "r1", returnsAt: null });
  });

  test("after a re-ship the assignee has three days, then it returns", () => {
    const reshippedAt = 10 * day;
    expect(assignmentState({ assignedReviewerId: "r1", reshippedAt, now: reshippedAt + ASSIGNMENT_WINDOW_MS - 1 })).toMatchObject({ holderId: "r1", returned: false });
    expect(assignmentState({ assignedReviewerId: "r1", reshippedAt, now: reshippedAt + ASSIGNMENT_WINDOW_MS })).toEqual({
      holderId: null,
      returnsAt: reshippedAt + ASSIGNMENT_WINDOW_MS,
      returned: true,
    });
  });

  test("only the assignee may review inside the window", () => {
    expect(canReviewAssigned({ reviewerId: "r2", assignedReviewerId: "r1", reshippedAt: 0, now: 1 })).toMatchObject({ ok: false, code: "assigned-to-other" });
    expect(canReviewAssigned({ reviewerId: "r1", assignedReviewerId: "r1", reshippedAt: 0, now: 1 })).toEqual({ ok: true });
    expect(canReviewAssigned({ reviewerId: "r2", assignedReviewerId: "r1", reshippedAt: 0, now: 4 * day })).toEqual({ ok: true });
  });
});

describe("queue wait", () => {
  test("the wait counts from the first ship", () => {
    expect(queueWaitStart({ firstShippedAt: 5, approvedAt: null, updatedAt: null })).toBe(5);
    expect(queueWaitMs({ firstShippedAt: 5, approvedAt: null, updatedAt: null }, 25)).toBe(20);
  });

  test("an update to an approved project starts a new wait", () => {
    expect(queueWaitStart({ firstShippedAt: 5, approvedAt: 10, updatedAt: 30 })).toBe(30);
    expect(queueWaitStart({ firstShippedAt: 5, approvedAt: 10, updatedAt: 8 })).toBe(5);
  });

  test("the wait never goes negative", () => {
    expect(queueWaitMs({ firstShippedAt: 50, approvedAt: null, updatedAt: null }, 10)).toBe(0);
  });
});

describe("queue health and filters", () => {
  const ships: QueueShip[] = [
    { id: "old", type: "software", firstShippedAt: 0, approvedAt: null, updatedAt: null, held: false },
    { id: "new", type: "hardware", firstShippedAt: 8 * day, approvedAt: null, updatedAt: null, held: false },
    { id: "held", type: "software", firstShippedAt: 8 * day, approvedAt: null, updatedAt: null, held: true },
  ];

  test("health counts queued ships by type, flags aged ones and lists holds", () => {
    const now = 8 * day;
    const health = queueHealth(ships, now);
    expect(health.total).toBe(2);
    expect(health.byType).toEqual({ software: 1, hardware: 1 });
    expect(health.aged).toEqual(["old"]);
    expect(health.heldIds).toEqual(["held"]);
    expect(queueWaitMs(ships[0], now)).toBeGreaterThanOrEqual(WAIT_AGED_MS);
  });

  test("a reviewer limited to one queue is held to it", () => {
    expect(resolveQueueFilter({ requested: "all", reviewerLimitedTo: "hardware" })).toEqual({ filter: "hardware", forced: true });
    expect(resolveQueueFilter({ requested: "software", reviewerLimitedTo: "hardware" })).toEqual({ filter: "hardware", forced: true });
  });

  test("an unknown or missing filter falls back to all", () => {
    expect(resolveQueueFilter({ requested: "nope", reviewerLimitedTo: null })).toEqual({ filter: "all", forced: false });
    expect(resolveQueueFilter({ requested: undefined, reviewerLimitedTo: null })).toEqual({ filter: "all", forced: false });
  });

  test("filterShips narrows by type", () => {
    expect(filterShips(ships, "hardware").map((s) => s.id)).toEqual(["new"]);
    expect(filterShips(ships, "all")).toHaveLength(3);
  });

  test("hold reasons need a useful length", () => {
    expect(checkHoldReason("ok").ok).toBe(false);
    expect(checkHoldReason("Waiting for the builder to confirm the hardware.")).toMatchObject({ ok: true });
  });
});

describe("notes", () => {
  test("bodies keep line breaks and drop control characters", () => {
    expect(checkNoteBody("line one\u0007\n\nline two")).toEqual({ ok: true, body: "line one \n\nline two" });
  });

  test("empty and oversized bodies are refused", () => {
    expect(checkNoteBody("   ").ok).toBe(false);
    expect(checkNoteBody("x".repeat(NOTE_MAX + 1)).ok).toBe(false);
  });

  test("images need a known type, a size and a free slot", () => {
    expect(checkNoteImage({ type: "image/png", bytes: 1000, count: 0 })).toEqual({ ok: true });
    expect(checkNoteImage({ type: "image/gif", bytes: 1000, count: 0 }).ok).toBe(false);
    expect(checkNoteImage({ type: "image/png", bytes: 6 * 1024 * 1024, count: 0 }).ok).toBe(false);
    expect(checkNoteImage({ type: "image/png", bytes: 1000, count: NOTE_IMAGES_MAX }).ok).toBe(false);
  });

  test("author colours are stable and drawn from the palette", () => {
    expect(authorColour("reviewer-1")).toBe(authorColour("reviewer-1"));
    expect(NOTE_COLOURS).toContain(authorColour("reviewer-2"));
  });
});

describe("pipeline strip", () => {
  test("a submitted ship that is not claimed is current at the first stage", () => {
    const strip = pipelineStrip({ submitted: true, claimed: false, verdict: null, hoursRecorded: false });
    expect(strip.map((s) => s.state)).toEqual(["current", "todo", "todo", "todo"]);
  });

  test("a verdict makes earlier stages done", () => {
    const strip = pipelineStrip({ submitted: true, claimed: true, verdict: "approved", hoursRecorded: false });
    expect(strip.map((s) => s.state)).toEqual(["done", "done", "current", "todo"]);
  });

  test("nothing submitted shows every stage to do", () => {
    const strip = pipelineStrip({ submitted: false, claimed: false, verdict: null, hoursRecorded: false });
    expect(strip.every((s) => s.state === "todo")).toBe(true);
  });
});

describe("resubmit notice", () => {
  test("sends once, to the reviewer who asked, after a re-ship", () => {
    const base = { requestedByReviewerId: "r1", requestedAt: 10, reshippedAt: 20, noticeSentAt: null };
    expect(resubmitNotice(base)).toMatchObject({ send: true, recipientId: "r1" });
    expect(resubmitNotice({ ...base, noticeSentAt: 21 })).toEqual({ send: false });
    expect(resubmitNotice({ ...base, reshippedAt: null })).toEqual({ send: false });
    expect(resubmitNotice({ ...base, requestedByReviewerId: null })).toEqual({ send: false });
  });
});
