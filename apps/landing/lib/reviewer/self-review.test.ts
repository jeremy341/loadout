import { describe, expect, test } from "bun:test";
import { canReview } from "../platform/review-rules";
import { resolveAccess, resolvePersonAccess, secondPassFromEnv, selfReviewExceptionIds, type SelfReviewGrant } from "./access";

const OWNERS = ["owner@loadout.test"];
const NOW = new Date("2026-11-22T12:00:00Z");
const LATER = new Date("2026-12-22T12:00:00Z");
const EARLIER = new Date("2026-10-22T12:00:00Z");

describe("second-pass override (LOADOUT_SECOND_PASS_EMAILS)", () => {
  test("parses the environment list like the owner list: comma separated, trimmed, lower-cased", () => {
    expect(secondPassFromEnv(" Final@Loadout.test , ,other@loadout.test ")).toEqual(["final@loadout.test", "other@loadout.test"]);
    expect(secondPassFromEnv(undefined)).toEqual([]);
  });

  test("a reviewer named in the override is a final reviewer, without the second_pass grant", () => {
    const access = resolveAccess(
      { id: "r1", email: "Final@Loadout.test" },
      { ownerEmails: OWNERS, roles: ["reviewer"], secondPassEmails: ["final@loadout.test"] },
    );
    expect(access?.isReviewer).toBe(true);
    expect(access?.canSecondPass).toBe(true);
  });

  test("the override never makes a reviewer: a person with no reviewer grant gets no second pass", () => {
    const access = resolveAccess({ id: "h1", email: "final@loadout.test" }, { ownerEmails: OWNERS, roles: ["helper"], secondPassEmails: ["final@loadout.test"] });
    expect(access?.isReviewer).toBe(false);
    expect(access?.canSecondPass).toBe(false);
  });

  test("no_review still wins over the override", () => {
    // A helper grant keeps the person in the site, so the review flags are visible.
    const access = resolveAccess(
      { id: "r1", email: "final@loadout.test" },
      { ownerEmails: OWNERS, roles: ["reviewer", "no_review", "helper"], secondPassEmails: ["final@loadout.test"] },
    );
    expect(access?.isReviewer).toBe(false);
    expect(access?.canSecondPass).toBe(false);
  });

  test("the second_pass grant still works with no override", () => {
    const access = resolvePersonAccess({ id: "r1", email: "r@loadout.test", roles: ["reviewer", "second_pass"] }, OWNERS, []);
    expect(access?.canSecondPass).toBe(true);
    const plain = resolvePersonAccess({ id: "r2", email: "r2@loadout.test", roles: ["reviewer"] }, OWNERS, []);
    expect(plain?.canSecondPass).toBe(false);
  });

  test("resolvePersonAccess reads the override by default, so every caller agrees", () => {
    const previous = process.env.LOADOUT_SECOND_PASS_EMAILS;
    process.env.LOADOUT_SECOND_PASS_EMAILS = "final@loadout.test";
    try {
      const access = resolvePersonAccess({ id: "r1", email: "final@loadout.test", roles: ["reviewer"] }, OWNERS);
      expect(access?.canSecondPass).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.LOADOUT_SECOND_PASS_EMAILS;
      else process.env.LOADOUT_SECOND_PASS_EMAILS = previous;
    }
  });
});

describe("selfReviewExceptionIds", () => {
  const grant = (personId: string, projectId: string | null, expiresAt: Date): SelfReviewGrant => ({ personId, projectId, expiresAt });

  test("an unexpired grant scoped to this project lifts self-review for that person", () => {
    expect(selfReviewExceptionIds([grant("p1", "ship-1", LATER)], "ship-1", NOW)).toEqual(["p1"]);
  });

  test("an expired grant, a grant on another project and a person-wide grant are all ignored", () => {
    const grants = [grant("expired", "ship-1", EARLIER), grant("other", "ship-2", LATER), grant("wide", null, LATER)];
    expect(selfReviewExceptionIds(grants, "ship-1", NOW)).toEqual([]);
  });

  test("duplicate grants for the same person count once", () => {
    expect(selfReviewExceptionIds([grant("p1", "ship-1", LATER), grant("p1", "ship-1", LATER)], "ship-1", NOW)).toEqual(["p1"]);
  });
});

describe("self-review with a SelfReviewException, through canReview", () => {
  test("a collaborator is blocked by default", () => {
    expect(canReview({ reviewerId: "c1", ownerId: "o1", collaboratorIds: ["c1"] })).toBe(false);
  });

  test("a pending invitee is blocked by default", () => {
    expect(canReview({ reviewerId: "i1", ownerId: "o1", pendingInviteIds: ["i1"] })).toBe(false);
  });

  test("an unrelated reviewer may review", () => {
    expect(canReview({ reviewerId: "r1", ownerId: "o1", collaboratorIds: ["c1"], pendingInviteIds: ["i1"] })).toBe(true);
  });
});
