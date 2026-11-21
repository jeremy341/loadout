import { describe, expect, test } from "bun:test";
import { reviewerById, shipById } from "../../platform/review";
import { announcement, ANNOUNCE_KINDS, PRIVATE_LINE } from "./records-announce";
import { checkException, MIN_JUSTIFICATION } from "./records-age";
import { LOCAL_SENTENCE, STUB_SENTENCE } from "./records-copy";
import { confirmationMatches, ERASURE_SAMPLE_HANDLE, erasurePlan, isValidHandle } from "./records-erasure";
import { AGE_EXCEPTIONS, ANNOUNCE_SAMPLES, PERK_REVIEWERS } from "./records-fixtures";
import { PAY_PER_REVIEW, perkLine, perkProgress, PERK_MILESTONES } from "./records-perks";

describe("fixtures", () => {
  test("every ship and reviewer key is real", () => {
    for (const item of ANNOUNCE_SAMPLES) expect(shipById(item.ship), item.ship).not.toBeNull();
    for (const item of AGE_EXCEPTIONS) {
      const ship = shipById(item.ship);
      expect(ship, item.ship).not.toBeNull();
      expect(ship?.builder, `${item.id} builder`).toBe(item.handle);
    }
    for (const id of PERK_REVIEWERS) expect(reviewerById(id), id).not.toBeNull();
  });

  test("every announcement kind has a sample and ids are unique", () => {
    expect(ANNOUNCE_SAMPLES.map((item) => item.kind).sort()).toEqual([...ANNOUNCE_KINDS].sort());
    expect(new Set(AGE_EXCEPTIONS.map((item) => item.id)).size).toBe(AGE_EXCEPTIONS.length);
  });

  test("the fixed sentences are the brief's words", () => {
    expect(LOCAL_SENTENCE).toBe("Sample data. Changes stay in this browser and are not sent anywhere.");
    expect(STUB_SENTENCE).toBe("Opens with the review service. Nothing here is saved.");
  });
});

describe("perks", () => {
  test("pay per review is not set and every perk is not set", () => {
    expect(PAY_PER_REVIEW).toBe("Not set");
    for (const milestone of PERK_MILESTONES) expect(milestone.perk).toBe("Not set");
  });

  test("progress is counted in reviews", () => {
    const none = perkProgress(0);
    expect(none.next?.reviews).toBe(10);
    expect(none.percentToNext).toBe(0);
    const mid = perkProgress(17);
    expect(mid.rows.map((row) => row.state)).toEqual(["reached", "next", "ahead", "ahead"]);
    expect(mid.next?.remaining).toBe(8);
    expect(mid.percentToNext).toBe(47);
    expect(perkLine(mid)).toBe("17 reviews. 8 more to reviewer perk 2.");
    const done = perkProgress(500);
    expect(done.allReached).toBe(true);
    expect(done.percentToNext).toBe(100);
  });
});

describe("announcements", () => {
  const base = { title: "Sample ship", builder: "sample_builder", track: "Tools" };
  test("a ban is private and says so", () => {
    const ban = announcement({ ...base, kind: "banned" });
    expect(ban.posted).toBe(false);
    expect(ban.footnote).toBe("Sent privately. Not posted.");
    expect(ban.footnote).toBe(PRIVATE_LINE);
  });
  test("approved and needs changes are previews of a post", () => {
    const approved = announcement({ ...base, kind: "approved", hours: "12h" });
    expect(approved.posted).toBe(true);
    expect(approved.text).toContain("12h");
    expect(announcement({ ...base, kind: "needs-changes" }).footnote).toBeNull();
  });
});

describe("erasure", () => {
  test("the plan names the person and lists every area once", () => {
    const plan = erasurePlan(`@${ERASURE_SAMPLE_HANDLE}`);
    expect(new Set(plan.map((item) => item.id)).size).toBe(plan.length);
    expect(plan[0].detail).toContain(`@${ERASURE_SAMPLE_HANDLE}`);
  });
  test("confirming needs the handle", () => {
    expect(confirmationMatches("", ERASURE_SAMPLE_HANDLE)).toBe(false);
    expect(confirmationMatches("sample", ERASURE_SAMPLE_HANDLE)).toBe(false);
    expect(confirmationMatches(" @Sample_Builder ", ERASURE_SAMPLE_HANDLE)).toBe(true);
    expect(isValidHandle(ERASURE_SAMPLE_HANDLE)).toBe(true);
    expect(isValidHandle("no spaces")).toBe(false);
  });
});

describe("age exceptions", () => {
  test("each fixture has a justification long enough to pass the check", () => {
    for (const item of AGE_EXCEPTIONS) expect(item.justification.length).toBeGreaterThanOrEqual(MIN_JUSTIFICATION);
  });
  test("adding needs a new handle and a justification", () => {
    expect(checkException({ handle: "newhandle", justification: "Short." }).ok).toBe(false);
    expect(checkException({ handle: "ostler", justification: "x".repeat(40) }, AGE_EXCEPTIONS).ok).toBe(false);
    expect(checkException({ handle: "newhandle", justification: "x".repeat(40) }, AGE_EXCEPTIONS)).toEqual({ ok: true });
  });
});
