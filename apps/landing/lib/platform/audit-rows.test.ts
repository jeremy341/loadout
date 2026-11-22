import { describe, expect, test } from "bun:test";
import { auditReason, collaboratorAuditInput, REVIEW_AUDIT_PREFIX, REVIEW_AUDIT_VERBS, reviewAuditInput } from "./audit";

describe("reviewAuditInput", () => {
  test("uses the review. action prefix the history view reads, and targets the project", () => {
    const input = reviewAuditInput({ actorId: "r1", projectId: "ship-1", verb: "verdict", reason: "Approved after review." });
    expect(input).toEqual({
      actorId: "r1",
      action: "review.verdict",
      targetType: "project",
      targetId: "ship-1",
      reason: "Approved after review.",
      before: undefined,
      after: undefined,
    });
    expect(input.action.startsWith(REVIEW_AUDIT_PREFIX)).toBe(true);
  });

  test("every verb the review desk writes maps to a review. action", () => {
    for (const verb of REVIEW_AUDIT_VERBS) {
      const input = reviewAuditInput({ actorId: "r1", projectId: "p", verb, reason: "note" });
      expect(input.action).toBe(`review.${verb}`);
    }
  });

  test("keeps before and after snapshots", () => {
    const input = reviewAuditInput({ actorId: "r1", projectId: "p", verb: "hold", reason: "Waiting on a link.", before: { heldBy: null }, after: { held: true } });
    expect(input.before).toEqual({ heldBy: null });
    expect(input.after).toEqual({ held: true });
  });
});

describe("auditReason", () => {
  test("an empty or missing note is stored as (no note)", () => {
    expect(auditReason("")).toBe("(no note)");
    expect(auditReason("   ")).toBe("(no note)");
    expect(auditReason(undefined)).toBe("(no note)");
    expect(auditReason(null)).toBe("(no note)");
  });

  test("the reason is capped at 500 characters, as AuditEvent storage expects", () => {
    expect(auditReason("x".repeat(800)).length).toBe(500);
  });
});

describe("collaboratorAuditInput", () => {
  test("uses the collaborator. action names the existing rows already store", () => {
    const input = collaboratorAuditInput({ actorId: "o1", projectId: "p1", verb: "remove", reason: "Left the project.", after: { handle: "a" } });
    expect(input).toEqual({
      actorId: "o1",
      action: "collaborator.remove",
      targetType: "project",
      targetId: "p1",
      reason: "Left the project.",
      after: { handle: "a" },
    });
  });

  test("invite, accept and decline each get their own action", () => {
    expect(collaboratorAuditInput({ actorId: "o", projectId: "p", verb: "invite", reason: "Invited a builder." }).action).toBe("collaborator.invite");
    expect(collaboratorAuditInput({ actorId: "c", projectId: "p", verb: "accept", reason: "Joined the project." }).action).toBe("collaborator.accept");
    expect(collaboratorAuditInput({ actorId: "c", projectId: "p", verb: "decline", reason: "Declined the invite." }).action).toBe("collaborator.decline");
  });
});
