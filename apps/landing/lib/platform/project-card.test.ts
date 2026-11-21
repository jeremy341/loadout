import { describe, expect, test } from "bun:test";
import { cardFoot, projectCardModel } from "./project-card";

const none = { approved: 0, pending: 0 };

describe("projectCardModel tags", () => {
  test("a draft with a track has the track tag and the status tag, once each", () => {
    expect(projectCardModel({ id: "a", track: "Tools", status: "draft", hours: none, own: true }).tags).toEqual(["Tools", "Draft"]);
  });
  test("an approved project has no status tag", () => {
    expect(projectCardModel({ id: "a", track: "Hardware", status: "approved", hours: none, own: false }).tags).toEqual(["Hardware"]);
  });
  test("no track means no track tag", () => {
    expect(projectCardModel({ id: "a", track: null, status: "logging", hours: none, own: true }).tags).toEqual(["Logging"]);
    expect(projectCardModel({ id: "a", track: null, status: "approved", hours: none, own: true }).tags).toEqual([]);
  });
  test("each unapproved stage reads as one word group", () => {
    const tags = (status: string) => projectCardModel({ id: "a", track: null, status, hours: none, own: true }).tags;
    expect(tags("in-review")).toEqual(["In review"]);
    expect(tags("needs_changes")).toEqual(["Needs changes"]);
    expect(tags("Draft")).toEqual(["Draft"]);
  });
  test("there is never a Pinned, Approved or hours tag", () => {
    for (const status of ["draft", "logging", "in-review", "needs-changes", "approved"]) {
      const tags = projectCardModel({ id: "a", track: "Systems", status, hours: { approved: 3, pending: 1 }, own: true }).tags;
      expect(tags.some((tag) => /pinned|^approved$|\bH\b/i.test(tag))).toBe(false);
      expect(new Set(tags.map((tag) => tag.toLowerCase())).size).toBe(tags.length);
    }
  });
});

describe("projectCardModel foot", () => {
  test("one line with approved and pending hours", () => {
    expect(cardFoot({ approved: 12, pending: 2.5 })).toBe("12 H approved, 2.5 H pending");
    expect(projectCardModel({ id: "a", track: null, status: "draft", hours: none, own: false }).foot).toBe("0 H approved, 0 H pending");
  });
  test("long fractions are rounded to two places", () => {
    expect(cardFoot({ approved: 1.23456, pending: 0 })).toBe("1.23 H approved, 0 H pending");
  });
});

describe("projectCardModel link", () => {
  test("the owner opens the workspace page", () => {
    expect(projectCardModel({ id: "p1", track: null, status: "draft", hours: none, own: true }).href).toBe("/dashboard/projects/p1");
  });
  test("a visitor opens the public page", () => {
    expect(projectCardModel({ id: "p1", track: null, status: "draft", hours: none, own: false }).href).toBe("/dashboard/explore/p1");
  });
});
