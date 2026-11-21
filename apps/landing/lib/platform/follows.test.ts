import { describe, expect, test } from "bun:test";
import { canFollow, FOLLOW_LIST_MAX, followTitle, isFriend } from "./follows";

const target = { id: "other", handle: "ada", banned: false };

describe("canFollow", () => {
  test("a builder can follow another builder", () => {
    expect(canFollow({ viewerId: "me", target, blocked: false })).toEqual({ ok: true });
  });
  test("no self follow", () => {
    const result = canFollow({ viewerId: "other", target, blocked: false });
    expect(!result.ok && result.code).toBe("self");
  });
  test("a blocked builder reads as not found, not as blocked", () => {
    const result = canFollow({ viewerId: "me", target, blocked: true });
    expect(!result.ok && result.code).toBe("blocked");
    expect(!result.ok && result.reason).toBe("That builder was not found.");
  });
  test("a banned builder or one without a handle is not found", () => {
    expect(canFollow({ viewerId: "me", target: { ...target, banned: true }, blocked: false }).ok).toBe(false);
    expect(canFollow({ viewerId: "me", target: { ...target, handle: null }, blocked: false }).ok).toBe(false);
  });
});

describe("followTitle", () => {
  test("names the follower by handle", () => {
    expect(followTitle("ada")).toBe("ada followed you");
  });
  test("works without a handle", () => {
    expect(followTitle(null)).toBe("A builder followed you");
  });
});

describe("isFriend", () => {
  test("only mutual follows are friends", () => {
    expect(isFriend(true, true)).toBe(true);
    expect(isFriend(true, false)).toBe(false);
    expect(isFriend(false, true)).toBe(false);
  });
  test("the list cap is 200", () => {
    expect(FOLLOW_LIST_MAX).toBe(200);
  });
});
