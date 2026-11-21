import { describe, expect, test } from "bun:test";
import { blockedPairs, canBlock } from "./blocks";

describe("canBlock", () => {
  test("a builder can block another builder", () => {
    expect(canBlock({ blockerId: "me", target: { id: "other", banned: false } })).toEqual({ ok: true });
  });
  test("no self block", () => {
    const result = canBlock({ blockerId: "me", target: { id: "me", banned: false } });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.code).toBe("self");
  });
  test("a banned builder reads as not found", () => {
    const result = canBlock({ blockerId: "me", target: { id: "other", banned: true } });
    expect(!result.ok && result.code).toBe("not-found");
  });
});

describe("blockedPairs", () => {
  test("gives both directions", () => {
    expect(blockedPairs("a", "b")).toEqual([
      { blockerId: "a", blockedId: "b" },
      { blockerId: "b", blockedId: "a" },
    ]);
  });
});
