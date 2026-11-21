import { describe, expect, test } from "bun:test";
import { canSendGrant, isGrantOrder } from "./fulfillmentGrant";

const viewer = (slackId: string, isOwner = false) => ({ isOwner, session: { slackId } });
const grant = { status: "claimed", is_grant: true, player_slack: "buyer", claimed_by_slack: "filler" };

describe("canSendGrant", () => {
  test("the claiming fulfiller may send a claimed grant", () => {
    expect(canSendGrant(grant, viewer("filler"))).toBe(true);
  });

  test("an owner who claimed their own grant may not send it", () => {
    expect(canSendGrant({ ...grant, claimed_by_slack: "buyer" }, viewer("buyer", true))).toBe(false);
  });

  test("refuses a grant claimed by someone else, a non-grant, and a wrong stage", () => {
    expect(canSendGrant(grant, viewer("other"))).toBe(false);
    expect(canSendGrant({ ...grant, is_grant: false }, viewer("filler"))).toBe(false);
    expect(canSendGrant({ ...grant, status: "pending" }, viewer("filler"))).toBe(false);
  });

  test("an item_category grant is recognised too", () => {
    expect(isGrantOrder({ item_category: "grants" })).toBe(true);
    expect(canSendGrant({ ...grant, is_grant: false, item_category: "grants" }, viewer("filler"))).toBe(true);
  });
});
