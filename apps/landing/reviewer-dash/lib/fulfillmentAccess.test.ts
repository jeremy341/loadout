import { describe, expect, test } from "bun:test";
import { canPackOrder, canReassignOrder, fulfillmentAuditEntry, isOwnOrder } from "./fulfillmentAccess";
import type { FulfillmentViewer } from "./fulfillmentAccess";

const viewer = (slackId: string, isOwner = false): FulfillmentViewer => ({ isOwner, session: { slackId } });

describe("isOwnOrder", () => {
  test("matches the buyer's handle and ignores the owner flag", () => {
    expect(isOwnOrder({ player_slack: "buyer" }, "buyer")).toBe(true);
    expect(isOwnOrder({ player_slack: "buyer" }, "buyer", true)).toBe(true);
    expect(isOwnOrder({ player_slack: "buyer" }, "someone")).toBe(false);
  });

  test("an empty handle is never its own order", () => {
    expect(isOwnOrder({ player_slack: "" }, "")).toBe(false);
    expect(isOwnOrder({}, "buyer")).toBe(false);
  });
});

describe("canReassignOrder", () => {
  const other = { status: "claimed", player_slack: "buyer", claimed_by_slack: "filler" };

  test("an owner may take over someone else's claimed order", () => {
    expect(canReassignOrder(other, viewer("boss", true))).toBe(true);
  });

  test("an owner may not take over their own order, even when someone else claimed it", () => {
    expect(canReassignOrder(other, viewer("buyer", true))).toBe(false);
  });

  test("refuses non-owners and orders that are not open", () => {
    expect(canReassignOrder(other, viewer("filler"))).toBe(false);
    for (const status of ["pending", "done", "cancelled"]) {
      expect(canReassignOrder({ ...other, status }, viewer("boss", true))).toBe(false);
    }
  });
});

describe("canPackOrder", () => {
  const claimed = { status: "claimed", player_slack: "buyer", claimed_by_slack: "filler" };

  test("the claiming fulfiller may pack", () => {
    expect(canPackOrder(claimed, viewer("filler"))).toBe(true);
  });

  test("an owner who claimed their own order may not pack it", () => {
    expect(canPackOrder({ ...claimed, claimed_by_slack: "buyer" }, viewer("buyer", true))).toBe(false);
  });

  test("nobody else may pack, and not before it is claimed", () => {
    expect(canPackOrder(claimed, viewer("other"))).toBe(false);
    expect(canPackOrder({ ...claimed, status: "pending" }, viewer("filler"))).toBe(false);
  });
});

describe("fulfillmentAuditEntry", () => {
  test("records the server-derived actor, the order target and the result", () => {
    expect(fulfillmentAuditEntry("pack", "ok", "filler", 42)).toEqual({
      action: "fulfillment.pack",
      result: "ok",
      actorId: "filler",
      slackId: "filler",
      target: "order:42",
    });
  });

  test("a denial carries a short reason and no caller-supplied actor", () => {
    expect(fulfillmentAuditEntry("grant", "denied", "buyer", 7, "own_order")).toEqual({
      action: "fulfillment.grant",
      result: "denied",
      actorId: "buyer",
      slackId: "buyer",
      target: "order:7",
      meta: { reason: "own_order" },
    });
  });

  test("a reason is the only meta field, so no form value or buyer detail is copied", () => {
    const entry = fulfillmentAuditEntry("reassign", "denied", "buyer", 7, "own_order");
    expect(Object.keys(entry.meta ?? {})).toEqual(["reason"]);
    expect(JSON.stringify(entry)).not.toContain("attacker");
  });
});
