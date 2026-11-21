import { describe, expect, test } from "bun:test";
import { canBookmark, checkBookmarkLimit, MAX_BOOKMARKS, toggleOutcome } from "./bookmarks";

const viewer = { id: "me" };
const project = (over: Partial<{ ownerId: string; status: string; ownerBanned: boolean }> = {}) => ({
  ownerId: "maker", status: "approved", ...over,
});

describe("canBookmark", () => {
  test("a project of someone else", () => {
    expect(canBookmark({ viewer, project: project() })).toEqual({ ok: true });
  });
  test("status spelling is normalised", () => {
    expect(canBookmark({ viewer, project: project({ status: " Approved " }) }).ok).toBe(true);
  });
  test("drafts, logging and review states can be saved too", () => {
    for (const status of ["draft", "logging", "submitted", "in-review", "needs_changes"]) {
      expect(canBookmark({ viewer, project: project({ status }) }).ok).toBe(true);
    }
  });
  test("a banned project is not visible", () => {
    const r = canBookmark({ viewer, project: project({ status: "banned" }) });
    expect(r.ok ? "ok" : r.code).toBe("not-visible");
  });
  test("a banned owner", () => {
    const r = canBookmark({ viewer, project: project({ ownerBanned: true }) });
    expect(r.ok ? "ok" : r.code).toBe("banned-owner");
  });
  test("your own project is allowed in any state", () => {
    expect(canBookmark({ viewer, project: project({ ownerId: "me", status: "draft" }) }).ok).toBe(true);
  });
  test("reasons never reveal why", () => {
    const r = canBookmark({ viewer, project: project({ status: "banned" }) });
    expect(r.ok ? "" : r.reason).toBe("That project was not found.");
  });
});

describe("limit", () => {
  test("cap value", () => expect(MAX_BOOKMARKS).toBe(200));
  test("below, at and above the cap", () => {
    expect(checkBookmarkLimit(199).ok).toBe(true);
    expect(checkBookmarkLimit(200).ok).toBe(false);
    expect(checkBookmarkLimit(500).ok).toBe(false);
  });
  test("toggleOutcome", () => {
    expect(toggleOutcome(false, 0)).toBe("add");
    expect(toggleOutcome(true, 0)).toBe("remove");
    expect(toggleOutcome(true, 200)).toBe("remove");
    expect(toggleOutcome(false, 200)).toBe("limit");
  });
});
