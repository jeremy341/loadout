import { describe, expect, test } from "bun:test";
import {
  canSeeBuyerDetails,
  idsFromEnv,
  isOwnOrCollaborator,
  isOwnOrder,
  landingFor,
  proposedBanDecision,
  queueAllows,
  resolveAccess,
  resolvePersonAccess,
  reviewQueueScopeFor,
  satisfies,
  staffRolesOnly,
  type ReviewerAccess,
} from "./access";

const OWNERS = ["owner@loadout.test"];
const person = (email: string, id = "p1") => ({ id, email });
const access = (email: string, roles: string[], id = "p1"): ReviewerAccess => {
  const result = resolveAccess(person(email, id), { ownerEmails: OWNERS, roles });
  if (!result) throw new Error("expected access");
  return result;
};

describe("resolveAccess", () => {
  test("a person with no role has no access", () => {
    expect(resolveAccess(person("someone@loadout.test"), { ownerEmails: OWNERS, roles: [] })).toBeNull();
  });

  test("the old staff grant and unknown values grant nothing", () => {
    expect(resolveAccess(person("someone@loadout.test"), { ownerEmails: OWNERS, roles: ["staff", "admin", "owner"] })).toBeNull();
  });

  test("an owner comes only from the environment list, case-insensitively", () => {
    expect(access("OWNER@loadout.test", []).isOwner).toBe(true);
    // A role value called owner in the database is not an owner.
    expect(resolveAccess(person("x@loadout.test"), { ownerEmails: OWNERS, roles: ["owner"] })).toBeNull();
    expect(resolveAccess(person("owner@loadout.test"), { ownerEmails: [], roles: [] })).toBeNull();
  });

  test("an owner is a reviewer, helper, fulfiller and final reviewer", () => {
    const owner = access("owner@loadout.test", []);
    expect(owner).toMatchObject({ isOwner: true, isReviewer: true, isHelper: true, isFulfiller: true, canSecondPass: true, reviewQueues: "both" });
  });

  test("a reviewer reviews and nothing else", () => {
    const reviewer = access("r@loadout.test", ["reviewer"]);
    expect(reviewer).toMatchObject({ isOwner: false, isReviewer: true, isHelper: false, isFulfiller: false, canSecondPass: false });
  });

  test("second_pass is a marker on a reviewer, not a role of its own", () => {
    expect(access("r@loadout.test", ["reviewer", "second_pass"]).canSecondPass).toBe(true);
    expect(resolveAccess(person("r@loadout.test"), { ownerEmails: OWNERS, roles: ["second_pass"] })).toBeNull();
  });

  test("no_review takes reviewing away, even from an owner, but not their other rights", () => {
    const blocked = access("owner@loadout.test", ["no_review"]);
    expect(blocked.isReviewer).toBe(false);
    expect(blocked.canSecondPass).toBe(false);
    expect(blocked.isOwner).toBe(true);
    expect(resolveAccess(person("r@loadout.test"), { ownerEmails: OWNERS, roles: ["reviewer", "no_review"] })).toBeNull();
  });

  test("helpers and fulfillers hold only their own queue", () => {
    const helper = access("h@loadout.test", ["helper"]);
    const fulfiller = access("f@loadout.test", ["fulfiller"]);
    expect(helper).toMatchObject({ isReviewer: false, isHelper: true, isFulfiller: false });
    expect(fulfiller).toMatchObject({ isReviewer: false, isHelper: false, isFulfiller: true });
  });
});

describe("resolvePersonAccess (the shared resolution for sessions and gates)", () => {
  test("is the same resolution getAccess and the superadmin/impersonation gates use", () => {
    const person = { id: "p1", email: "r@loadout.test", roles: ["reviewer", "second_pass"] };
    expect(resolvePersonAccess(person, OWNERS)).toEqual(resolveAccess(person, { ownerEmails: OWNERS, roles: person.roles }));
  });

  test("a removal written to RoleGrant revokes reviewer power here too", () => {
    const person = { id: "p1", email: "r@loadout.test", roles: ["reviewer"] };
    expect(resolvePersonAccess(person, OWNERS)).not.toBeNull();
    // removeReviewer deletes the grant (or adds no_review to an owner), so the next read sees no reviewer access.
    expect(resolvePersonAccess({ ...person, roles: [] }, OWNERS)).toBeNull();
    expect(resolvePersonAccess({ ...person, roles: ["no_review"] }, OWNERS)).toBeNull();
    const owner = { id: "o", email: "owner@loadout.test", roles: [] };
    expect(resolvePersonAccess(owner, OWNERS)?.isReviewer).toBe(true);
    expect(resolvePersonAccess({ ...owner, roles: ["no_review"] }, OWNERS)?.isReviewer).toBe(false);
  });

  test("the superadmin admin marker alone never grants reviewer power", () => {
    expect(resolvePersonAccess({ id: "a", email: "a@loadout.test", roles: ["admin"] }, OWNERS)).toBeNull();
  });
});

describe("gates", () => {
  const reviewer = access("r@loadout.test", ["reviewer"]);
  const finalReviewer = access("fr@loadout.test", ["reviewer", "second_pass"]);
  const fulfiller = access("f@loadout.test", ["fulfiller"]);
  const helper = access("h@loadout.test", ["helper"]);
  const owner = access("owner@loadout.test", []);

  test("reviewers cannot open fulfilment, tickets or owner pages", () => {
    expect(satisfies(reviewer, "reviewer")).toBe(true);
    expect(satisfies(reviewer, "fulfiller")).toBe(false);
    expect(satisfies(reviewer, "helper")).toBe(false);
    expect(satisfies(reviewer, "owner")).toBe(false);
    expect(satisfies(reviewer, { review: "second_pass" })).toBe(false);
  });

  test("fulfillers and helpers cannot review", () => {
    expect(satisfies(fulfiller, "reviewer")).toBe(false);
    expect(satisfies(helper, "reviewer")).toBe(false);
    expect(satisfies(fulfiller, "fulfiller")).toBe(true);
    expect(satisfies(helper, "helper")).toBe(true);
  });

  test("final reviewers pass the second-pass gate but not owner pages", () => {
    expect(satisfies(finalReviewer, { review: "second_pass" })).toBe(true);
    expect(satisfies(finalReviewer, "owner")).toBe(false);
  });

  test("owners pass every gate, and any role passes staff", () => {
    for (const requirement of ["owner", "reviewer", "helper", "fulfiller", "staff", { review: "second_pass" }] as const) {
      expect(satisfies(owner, requirement)).toBe(true);
    }
    for (const holder of [reviewer, fulfiller, helper]) expect(satisfies(holder, "staff")).toBe(true);
  });

  test("each role lands on its own queue", () => {
    expect(landingFor(owner)).toBe("/");
    expect(landingFor(reviewer)).toBe("/review");
    expect(landingFor(helper)).toBe("/tickets");
    expect(landingFor(fulfiller)).toBe("/fulfillment");
  });
});

describe("queues", () => {
  test("a marker restricts a reviewer to one queue", () => {
    expect(reviewQueueScopeFor(["reviewer"])).toBe("both");
    expect(reviewQueueScopeFor(["reviewer", "reviewer_hardware_only"])).toBe("hardware");
    expect(reviewQueueScopeFor(["reviewer", "reviewer_software_only"])).toBe("software");
    expect(queueAllows("hardware", "hardware")).toBe(true);
    expect(queueAllows("hardware", "software")).toBe(false);
    expect(queueAllows("both", "software")).toBe(true);
    expect(queueAllows("software", null)).toBe(false);
  });
});

describe("environment and role lists", () => {
  test("idsFromEnv trims, lower-cases and drops blanks", () => {
    expect(idsFromEnv(" A@x.test, ,b@x.test ")).toEqual(["a@x.test", "b@x.test"]);
    expect(idsFromEnv(undefined)).toEqual([]);
  });

  test("staffRolesOnly keeps known values once", () => {
    expect(staffRolesOnly(["reviewer", "staff", "reviewer", "helper"])).toEqual(["reviewer", "helper"]);
    expect(staffRolesOnly(null)).toEqual([]);
  });
});

describe("self-review, ban proposals and buyer details", () => {
  test("nobody reviews their own or a collaborator's project", () => {
    expect(isOwnOrCollaborator(["me"], "me", [])).toBe(true);
    expect(isOwnOrCollaborator(["me"], "you", ["x", "me"])).toBe(true);
    expect(isOwnOrCollaborator(["me"], "you", ["x"])).toBe(false);
    expect(isOwnOrCollaborator([], "me", [])).toBe(false);
  });

  test("ban proposals: own project denied, a different reviewer decides, only an owner confirms a ban", () => {
    const owner = { isOwner: true, canSecondPass: true, personId: "o" };
    const final = { isOwner: false, canSecondPass: true, personId: "f" };
    const plain = { isOwner: false, canSecondPass: false, personId: "r" };
    expect(proposedBanDecision(owner, "ban", { own: true, proposedById: "x" }).kind).toBe("deny");
    expect(proposedBanDecision(plain, "ban", { own: false, proposedById: "x" }).kind).toBe("deny");
    expect(proposedBanDecision(final, "ban", { own: false, proposedById: "f" }).kind).toBe("deny");
    expect(proposedBanDecision(final, "ban", { own: false, proposedById: "x" }).kind).toBe("deny");
    expect(proposedBanDecision(final, "approved", { own: false, proposedById: "x" }).kind).toBe("reroute_to_pipeline");
    expect(proposedBanDecision(final, "needs_changes", { own: false, proposedById: "x" }).kind).toBe("needs_changes");
    expect(proposedBanDecision(owner, "ban", { own: false, proposedById: "x" }).kind).toBe("final");
  });

  test("buyer details only for the claiming fulfiller or an owner, and nobody fulfils their own order", () => {
    const order = { claimedById: "f1", buyerId: "b1" };
    expect(canSeeBuyerDetails(order, { isOwner: false, personId: "f1" })).toBe(true);
    expect(canSeeBuyerDetails(order, { isOwner: false, personId: "f2" })).toBe(false);
    expect(canSeeBuyerDetails(order, { isOwner: true, personId: "o" })).toBe(true);
    expect(canSeeBuyerDetails({ claimedById: null }, { isOwner: false, personId: "" })).toBe(false);
    expect(isOwnOrder(order, "b1")).toBe(true);
    expect(isOwnOrder(order, "f1")).toBe(false);
  });
});
