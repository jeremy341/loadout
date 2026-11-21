import { describe, expect, it } from "bun:test";
import { journalOpen } from "./journal";
import { trackLocked } from "./projects";
import { builderMove, canUnsubmit, canonicalStatus, isLocked, lockedReason, nextStatuses, RESERVED_REVIEWER_MOVES, SHIP_STATUSES } from "./ship";

describe("isLocked", () => {
  it("is open for draft, logging and needs-changes", () => {
    for (const status of ["draft", "logging", "needs-changes", "needs_changes", "Draft"]) expect(isLocked(status)).toBe(false);
  });
  it("is locked for every other status", () => {
    for (const status of ["submitted", "in-review", "in_review", "second-pass", "approved", "banned"]) expect(isLocked(status)).toBe(true);
  });
  it("fails closed for a status nobody knows", () => {
    expect(isLocked("rejected")).toBe(true);
    expect(isLocked("")).toBe(true);
  });
  it("is the same rule as the track lock and the journal lock", () => {
    for (const status of [...SHIP_STATUSES, "needs_changes", "in_review", "weird"]) {
      expect(trackLocked(status)).toBe(isLocked(status));
      expect(journalOpen(status)).toBe(!isLocked(status));
    }
  });
});

describe("nextStatuses for the builder", () => {
  it("sends a draft, a logging or a sent-back project to submitted", () => {
    for (const status of ["draft", "logging", "needs-changes", "needs_changes"]) expect(nextStatuses(status, "builder")).toEqual(["submitted"]);
  });
  it("lets a submitted project go back to draft", () => {
    expect(nextStatuses("submitted", "builder")).toEqual(["draft"]);
  });
  it("lets an approved project reopen for an update and nothing else", () => {
    expect(nextStatuses("approved", "builder")).toEqual(["draft"]);
  });
  it("gives the builder no move once a reviewer has it, or after a ban", () => {
    for (const status of ["in-review", "second-pass", "banned", "mystery"]) expect(nextStatuses(status, "builder")).toEqual([]);
  });
  it("grants the reviewer nothing here", () => {
    for (const status of SHIP_STATUSES) expect(nextStatuses(status, "reviewer")).toEqual([]);
  });
});

describe("builderMove", () => {
  it("names each allowed move", () => {
    expect(builderMove("draft", "submitted")).toBe("submit");
    expect(builderMove("logging", "submitted")).toBe("submit");
    expect(builderMove("needs-changes", "submitted")).toBe("resubmit");
    expect(builderMove("submitted", "draft")).toBe("unsubmit");
    expect(builderMove("approved", "draft")).toBe("update");
  });
  it("refuses everything else", () => {
    expect(builderMove("draft", "approved")).toBeNull();
    expect(builderMove("submitted", "approved")).toBeNull();
    expect(builderMove("in-review", "draft")).toBeNull();
    expect(builderMove("approved", "submitted")).toBeNull();
    expect(builderMove("banned", "draft")).toBeNull();
  });
});

describe("unsubmit and reserved moves", () => {
  it("unsubmit only while plain submitted", () => {
    expect(canUnsubmit("submitted")).toBe(true);
    for (const status of ["draft", "in-review", "second-pass", "needs-changes", "approved", "banned"]) expect(canUnsubmit(status)).toBe(false);
  });
  it("lists reviewer moves between known statuses and none start from a builder state", () => {
    for (const move of RESERVED_REVIEWER_MOVES) {
      expect(SHIP_STATUSES).toContain(move.from);
      expect(SHIP_STATUSES).toContain(move.to);
      expect(["draft", "logging", "needs-changes", "approved", "banned"]).not.toContain(move.from);
    }
  });
});

describe("canonicalStatus and lockedReason", () => {
  it("folds case and underscores", () => {
    expect(canonicalStatus(" In_Review ")).toBe("in-review");
  });
  it("explains every locked state and nothing open", () => {
    for (const status of SHIP_STATUSES) expect(lockedReason(status) === null).toBe(!isLocked(status));
    expect(lockedReason("banned")).toBe("This project was banned. Ask support.");
  });
});
