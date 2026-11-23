import { describe, expect, test } from "bun:test";
import { BUILDER_SHIP_FIELDS, builderReviewNotes, REVIEWER_ONLY_SHIP_FIELDS, redactShipForBuilder } from "./privacy";

// A reviewer payload with every kind of desk field filled in, as review-data.ts DeskShip carries it.
const reviewerPayload = (): Record<string, unknown> => ({
  id: "ship-1",
  seq: 1,
  title: "A ship",
  status: "second-pass",
  reviewNote: "Looks good, one tweak.",
  reviewReason: "Needs a clearer README.",
  owner: { id: "owner-1", displayName: "Owner", birthday: "2010-01-01", email: "owner@example.test" },
  journals: [{ id: "j1", reviewReason: "kept less", authorId: "owner-1" }],
  facts: { collaboratorIds: ["c1"], pendingInviteIds: ["i1"], heldBy: "r1" },
  selfReviewExceptionIds: ["c1"],
  triageNote: "internal triage",
  firstPassNote: "internal first pass",
  holdReason: "internal hold",
  proposedBanReason: "internal ban proposal",
  claimedBy: "r1",
  assignedTo: "r2",
  approvedMinutes: 120,
});

describe("redactShipForBuilder", () => {
  test("keeps only the builder whitelist", () => {
    const view = redactShipForBuilder(reviewerPayload());
    expect(Object.keys(view).every((key) => BUILDER_SHIP_FIELDS.includes(key))).toBe(true);
    expect(view.title).toBe("A ship");
    expect(view.reviewNote).toBe("Looks good, one tweak.");
  });

  test("no reviewer-only field reaches a builder", () => {
    const view = redactShipForBuilder(reviewerPayload());
    for (const field of REVIEWER_ONLY_SHIP_FIELDS) {
      expect(view).not.toHaveProperty(field);
    }
    expect(JSON.stringify(view)).not.toContain("email");
    expect(JSON.stringify(view)).not.toContain("birthday");
  });

  test("the whitelist and the reviewer-only list do not overlap", () => {
    const overlap = BUILDER_SHIP_FIELDS.filter((field) => REVIEWER_ONLY_SHIP_FIELDS.includes(field));
    expect(overlap).toEqual([]);
  });
});

describe("builderReviewNotes", () => {
  const ship = { ownerId: "owner-1", reviewNote: "note", reviewReason: "reason" };

  test("the owner of the ship sees their own notes", () => {
    expect(builderReviewNotes(ship, "owner-1")).toEqual({ reviewNote: "note", reviewReason: "reason" });
  });

  test("anyone else sees nothing", () => {
    expect(builderReviewNotes(ship, "someone-else")).toEqual({});
    expect(builderReviewNotes(ship, "")).toEqual({});
  });

  test("it reads the owner from an owner object too", () => {
    expect(builderReviewNotes({ owner: { id: "owner-1" }, reviewNote: "n", reviewReason: null }, "owner-1")).toEqual({ reviewNote: "n", reviewReason: null });
  });
});
