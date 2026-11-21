import { describe, expect, test } from "bun:test";
import { resolveAccess, type ReviewerAccess } from "./access";
import { navCounts } from "./counts";

const who = (email: string, roles: string[]): ReviewerAccess => {
  const access = resolveAccess({ id: email, email }, { ownerEmails: ["owner@loadout.test"], roles });
  if (!access) throw new Error("expected access");
  return access;
};

describe("nav counts", () => {
  test("an owner has all four badges", () => {
    const counts = navCounts(who("owner@loadout.test", []));
    for (const href of ["/review", "/reports", "/tickets", "/fulfilment"]) expect(counts[href]).toBeGreaterThan(0);
  });

  test("a reviewer has only the review badge", () => {
    const counts = navCounts(who("r@loadout.test", ["reviewer"]));
    expect(counts["/review"]).toBeGreaterThan(0);
    expect(counts["/reports"]).toBe(0);
    expect(counts["/tickets"]).toBe(0);
    expect(counts["/fulfilment"]).toBe(0);
  });

  test("a one-queue reviewer counts only their queue", () => {
    const both = navCounts(who("r@loadout.test", ["reviewer"]))["/review"];
    const hardware = navCounts(who("h@loadout.test", ["reviewer", "reviewer_hardware_only"]))["/review"];
    const software = navCounts(who("s@loadout.test", ["reviewer", "reviewer_software_only"]))["/review"];
    expect(hardware + software).toBe(both);
  });

  test("a helper and a fulfiller each have their own badge only", () => {
    const helper = navCounts(who("h@loadout.test", ["helper"]));
    expect(helper["/tickets"]).toBeGreaterThan(0);
    expect(helper["/fulfilment"]).toBe(0);
    expect(helper["/review"]).toBe(0);
    const fulfiller = navCounts(who("f@loadout.test", ["fulfiller"]));
    expect(fulfiller["/fulfilment"]).toBeGreaterThan(0);
    expect(fulfiller["/tickets"]).toBe(0);
  });
});
