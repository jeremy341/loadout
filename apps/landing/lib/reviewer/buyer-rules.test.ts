import { describe, expect, test } from "bun:test";
import { buyerDetailsVisible, isOwnPurchase } from "./buyer-rules";

describe("buyer details rule", () => {
  test("owners and the claiming fulfiller see buyer details; nobody else does", () => {
    expect(buyerDetailsVisible({ isOwner: true, claimedByViewer: false })).toBe(true);
    expect(buyerDetailsVisible({ isOwner: false, claimedByViewer: true })).toBe(true);
    expect(buyerDetailsVisible({ isOwner: false, claimedByViewer: false })).toBe(false);
  });

  test("a purchase is never its own viewer's, and an empty buyer never matches", () => {
    expect(isOwnPurchase("person-1", "person-1")).toBe(true);
    expect(isOwnPurchase(" person-1 ", "person-1")).toBe(true);
    expect(isOwnPurchase("person-2", "person-1")).toBe(false);
    expect(isOwnPurchase("", "")).toBe(false);
    expect(isOwnPurchase(null, "")).toBe(false);
    expect(isOwnPurchase(undefined, "person-1")).toBe(false);
  });
});
