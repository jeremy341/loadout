import { describe, expect, test } from "bun:test";
import { operationAuditState } from "../../app/(reviewer)/reviewer/operations/audit";

const at = new Date("2026-11-20T12:00:00Z");
const operation = {
  name: "Sample operation",
  startsAt: new Date("2026-11-20T10:00:00Z"),
  endsAt: new Date("2026-11-21T10:00:00Z"),
  pausedAt: null,
  endedAt: null,
};

describe("operationAuditState", () => {
  test("captures the status and every scheduling field", () => {
    expect(operationAuditState(operation, at)).toEqual({
      status: "Active",
      name: "Sample operation",
      startsAt: "2026-11-20T10:00:00.000Z",
      endsAt: "2026-11-21T10:00:00.000Z",
      pausedAt: null,
      endedAt: null,
      rateUsd: null,
    });
  });

  test("a paused operation records its pause time and status", () => {
    const paused = { ...operation, pausedAt: new Date("2026-11-20T11:00:00Z") };
    const state = operationAuditState(paused, at);
    expect(state.status).toBe("Paused");
    expect(state.pausedAt).toBe("2026-11-20T11:00:00.000Z");
  });

  test("a future operation is Scheduled and a rate is kept when present", () => {
    const scheduled = { ...operation, startsAt: new Date("2026-11-21T10:00:00Z"), rateUsd: 2.5 };
    const state = operationAuditState(scheduled, at);
    expect(state.status).toBe("Scheduled");
    expect(state.rateUsd).toBe(2.5);
  });
});
