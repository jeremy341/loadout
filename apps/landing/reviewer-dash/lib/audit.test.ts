import { describe, expect, test } from "bun:test";
import { toAuditEvent } from "./audit";

describe("guard audit mapping", () => {
  test("writes a real AuditEvent shape with the result and request context", () => {
    const row = toAuditEvent(
      { action: "api.tickets.reply", result: "denied", slackId: "U123", target: "1794759095.100006", meta: { reason: "role" } },
      { ip: "203.0.113.4", userAgent: "test-agent" },
    );
    expect(row.action).toBe("guard.api.tickets.reply");
    expect(row.actorId).toBe("U123");
    expect(row.targetType).toBe("Guard");
    expect(row.targetId).toBe("1794759095.100006");
    expect(row.reason).toBe("result=denied");
    expect(row.after).toMatchObject({ result: "denied", actorType: "staff", slackId: "U123", ip: "203.0.113.4", userAgent: "test-agent" });
  });

  test("anonymous callers get a stable actor id", () => {
    const row = toAuditEvent({ action: "page.review", result: "error" }, { ip: null, userAgent: null });
    expect(row.actorId).toBe("anonymous:anonymous");
    expect(row.targetId).toBe("");
  });
});
