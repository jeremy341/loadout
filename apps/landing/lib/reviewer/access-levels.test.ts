import { describe, expect, test } from "bun:test";
import { canFlagship, canReviewShip, landingFor, resolveAccess, satisfies, type Requirement, type ReviewerAccess } from "./access";

// Every level of the role model against every requirement. The levels are Pixl's, in LOADOUT words.
const OWNERS = ["owner@loadout.test"];

type Level = { name: string; roles: string[]; email: string; passes: string[] };

const ALL = ["owner", "reviewer", "second_pass", "helper", "fulfiller", "staff", "integrity", "edit_submission", "ai_draft"];

const LEVELS: Level[] = [
  { name: "owner", roles: [], email: "owner@loadout.test", passes: ALL },
  { name: "owner with no_review", roles: ["no_review"], email: "owner@loadout.test", passes: ALL },
  { name: "reviewer", roles: ["reviewer"], email: "a@loadout.test", passes: ["reviewer", "staff"] },
  { name: "final reviewer", roles: ["reviewer", "second_pass"], email: "b@loadout.test", passes: ["reviewer", "second_pass", "staff", "integrity", "edit_submission"] },
  { name: "hardware-only reviewer", roles: ["reviewer", "reviewer_hardware_only"], email: "c@loadout.test", passes: ["reviewer", "staff"] },
  { name: "software-only reviewer", roles: ["reviewer", "reviewer_software_only"], email: "d@loadout.test", passes: ["reviewer", "staff"] },
  {
    name: "reviewer with edit, draft and full queue",
    roles: ["reviewer", "edit_submission", "ai_draft", "full_queue"],
    email: "e@loadout.test",
    passes: ["reviewer", "staff", "edit_submission", "ai_draft"],
  },
  { name: "integrity reviewer", roles: ["fraud_review"], email: "f@loadout.test", passes: ["staff", "integrity"] },
  { name: "helper", roles: ["helper"], email: "g@loadout.test", passes: ["helper", "staff"] },
  { name: "fulfiller", roles: ["fulfiller"], email: "h@loadout.test", passes: ["fulfiller", "staff"] },
  { name: "helper and fulfiller", roles: ["helper", "fulfiller"], email: "i@loadout.test", passes: ["helper", "fulfiller", "staff"] },
  { name: "builder", roles: [], email: "j@loadout.test", passes: [] },
  { name: "nobody (unknown grants only)", roles: ["staff", "admin", "owner", "super_admin"], email: "k@loadout.test", passes: [] },
];

const REQUIREMENTS: { label: string; req: Requirement }[] = [
  { label: "owner", req: "owner" },
  { label: "reviewer", req: "reviewer" },
  { label: "second_pass", req: { review: "second_pass" } },
  { label: "helper", req: "helper" },
  { label: "fulfiller", req: "fulfiller" },
  { label: "staff", req: "staff" },
  { label: "integrity", req: { review: "fraud" } },
  { label: "edit_submission", req: { review: "edit_submission" } },
  { label: "ai_draft", req: { review: "ai_draft" } },
];

const resolve = (roles: string[], email = "x@loadout.test") => resolveAccess({ id: "p", email }, { ownerEmails: OWNERS, roles });
const need = (roles: string[], email?: string): ReviewerAccess => {
  const access = resolve(roles, email);
  if (!access) throw new Error("expected access");
  return access;
};

describe("every level against every requirement", () => {
  for (const level of LEVELS) {
    test(level.name, () => {
      const resolved = resolve(level.roles, level.email);
      if (level.passes.length === 0) {
        expect(resolved).toBeNull();
        return;
      }
      expect(resolved).not.toBeNull();
      const passed = REQUIREMENTS.filter((item) => satisfies(resolved as ReviewerAccess, item.req)).map((item) => item.label);
      expect(passed.sort()).toEqual([...level.passes].sort());
    });
  }
});

describe("the flags each level carries", () => {
  const flags = (roles: string[], email = "x@loadout.test") => {
    const a = need(roles, email);
    return { review: a.isReviewer, second: a.canSecondPass, edit: a.canEditSubmission, draft: a.canAiDraft, full: a.canOpenFullQueue, fraud: a.canFraudReview, queues: a.reviewQueues };
  };

  test("markers only work on a reviewer; alone they grant nothing", () => {
    for (const marker of ["second_pass", "edit_submission", "ai_draft", "full_queue", "reviewer_hardware_only", "no_review"]) {
      expect(resolve([marker])).toBeNull();
    }
    expect(flags(["reviewer", "ai_draft"])).toMatchObject({ review: true, draft: true, edit: false, full: false });
    expect(flags(["reviewer", "edit_submission"])).toMatchObject({ edit: true, draft: false });
    expect(flags(["reviewer", "full_queue"])).toMatchObject({ full: true });
    expect(flags(["reviewer"])).toMatchObject({ edit: false, draft: false, full: false, fraud: false });
  });

  test("a final reviewer may edit and sees the integrity tab without the markers", () => {
    expect(flags(["reviewer", "second_pass"])).toMatchObject({ second: true, edit: true, fraud: true, draft: false, full: false });
  });

  test("an owner has every right, and no_review only takes away reviewing", () => {
    expect(flags([], "owner@loadout.test")).toMatchObject({ review: true, second: true, edit: true, draft: true, full: true, fraud: true });
    expect(flags(["no_review"], "owner@loadout.test")).toMatchObject({ review: false, second: false, draft: true, full: true, fraud: true });
  });

  test("the integrity reviewer has the integrity tab and nothing of the review desk", () => {
    expect(flags(["fraud_review"])).toMatchObject({ review: false, second: false, edit: false, fraud: true });
  });

  test("a reviewer who also holds fraud_review keeps both", () => {
    expect(flags(["reviewer", "fraud_review"])).toMatchObject({ review: true, fraud: true });
  });

  test("queue markers set the scope", () => {
    expect(flags(["reviewer", "reviewer_hardware_only"]).queues).toBe("hardware");
    expect(flags(["reviewer", "reviewer_software_only"]).queues).toBe("software");
    expect(flags(["reviewer"]).queues).toBe("both");
  });
});

describe("landing rule", () => {
  const land = (roles: string[], email?: string) => landingFor(need(roles, email));
  test("each level lands on its own page", () => {
    expect(land([], "owner@loadout.test")).toBe("/");
    expect(land(["no_review"], "owner@loadout.test")).toBe("/");
    expect(land(["reviewer"])).toBe("/review");
    expect(land(["reviewer", "second_pass"])).toBe("/review");
    expect(land(["fraud_review"])).toBe("/review/fraud-reviews");
    expect(land(["helper"])).toBe("/tickets");
    expect(land(["fulfiller"])).toBe("/fulfillment");
    expect(land(["helper", "fulfiller"])).toBe("/tickets");
  });
});

describe("canReviewShip and canFlagship", () => {
  const hardware = { kind: "hardware" };
  const software = { kind: "software" };

  test("queue-limited reviewers only review their own queue", () => {
    expect(canReviewShip(need(["reviewer", "reviewer_hardware_only"]), hardware)).toBe(true);
    expect(canReviewShip(need(["reviewer", "reviewer_hardware_only"]), software)).toBe(false);
    expect(canReviewShip(need(["reviewer", "reviewer_software_only"]), software)).toBe(true);
    expect(canReviewShip(need(["reviewer", "reviewer_software_only"]), hardware)).toBe(false);
    expect(canReviewShip(need(["reviewer"]), hardware)).toBe(true);
    expect(canReviewShip(need(["reviewer"]), software)).toBe(true);
  });

  test("nobody reviews or flags their own ship, owners included", () => {
    const owner = need([], "owner@loadout.test");
    expect(canReviewShip(owner, software)).toBe(true);
    expect(canReviewShip(owner, { kind: "software", own: true })).toBe(false);
    expect(canReviewShip(need(["reviewer"]), { kind: "software", own: true })).toBe(false);
    expect(canFlagship(owner, { kind: "software", own: true })).toBe(false);
  });

  test("an owner with no_review, an integrity reviewer, helpers and fulfillers review nothing", () => {
    expect(canReviewShip(need(["no_review"], "owner@loadout.test"), software)).toBe(false);
    for (const roles of [["fraud_review"], ["helper"], ["fulfiller"]]) expect(canReviewShip(need(roles), software)).toBe(false);
  });

  test("flagship follows the same rule as a verdict", () => {
    expect(canFlagship(need(["reviewer"]), software)).toBe(true);
    expect(canFlagship(need(["reviewer", "reviewer_hardware_only"]), software)).toBe(false);
    expect(canFlagship(need(["fraud_review"]), software)).toBe(false);
  });
});
