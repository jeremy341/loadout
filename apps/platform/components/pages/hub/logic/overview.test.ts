import { describe, expect, test } from "bun:test";
import type { OreEntry } from "../../../../lib/ore-ledger";
import type { PreviewNotification } from "../../../../lib/notifications";
import { makeBuild, makeCommunityA, makeGear, makeSeasons } from "./fixtures";
import { deriveNextActions, mergeActivity, normalizeOnboarding, onboardingItems, onboardingProgress, oreText } from "./overview";

const project = { id: "p", name: "P", track: "Tools" as const, visibility: "public" as const, status: "Draft", hoursLogged: 0 };

describe("first-run checklist", () => {
  test("nothing is ticked for an empty account", () => {
    const items = onboardingItems(makeBuild(), makeGear());
    expect(items.map((i) => i.id)).toEqual(["project", "journal", "review", "wishlist"]);
    expect(items.some((i) => i.done)).toBe(false);
    expect(onboardingProgress(items)).toEqual({ done: 0, total: 4, complete: false });
  });

  test("each step ticks from the matching summary", () => {
    const only = (build: Partial<Parameters<typeof makeBuild>[0]>, gear: Partial<Parameters<typeof makeGear>[0]> = {}) =>
      onboardingItems(makeBuild(build), makeGear(gear))
        .filter((i) => i.done)
        .map((i) => i.id);
    expect(only({ projects: [project] })).toEqual(["project"]);
    expect(only({ journalEntries: 2 })).toEqual(["journal"]);
    expect(only({ reviewsDone: 1 })).toEqual(["review"]);
    expect(only({}, { wishlistCount: 1 })).toEqual(["wishlist"]);
  });

  test("complete when all four are done", () => {
    const items = onboardingItems(makeBuild({ projects: [project], journalEntries: 1, reviewsDone: 1 }), makeGear({ wishlistCount: 1 }));
    expect(onboardingProgress(items).complete).toBe(true);
  });

  test("every step links to its tab", () => {
    expect(onboardingItems(makeBuild(), makeGear()).map((i) => i.href)).toEqual(["/projects", "/journals", "/reviews", "/wishlist"]);
  });

  test("the dismissed flag survives normalisation and garbage does not", () => {
    expect(normalizeOnboarding({ dismissed: true })).toEqual({ dismissed: true });
    expect(normalizeOnboarding({ dismissed: "yes" })).toEqual({ dismissed: false });
    expect(normalizeOnboarding(null)).toEqual({ dismissed: false });
  });
});

describe("next actions", () => {
  const base = { build: makeBuild(), community: makeCommunityA(), seasons: makeSeasons(), gear: makeGear(), unread: 0, bioEmpty: false };

  test("nothing to do gives an empty list", () => {
    expect(deriveNextActions(base)).toEqual([]);
  });

  test("Build prompts come first, then the Hub's own", () => {
    const actions = deriveNextActions({
      ...base,
      build: makeBuild({ nextActions: [{ label: "Create your first project", href: "/projects" }] }),
      unread: 2,
      community: makeCommunityA({ pendingRequests: 1 }),
      seasons: makeSeasons({ eventsRsvped: 1 }),
      gear: makeGear({ referralsTotal: 3, referralsQualified: 1, wishlistAffordable: 2, ordersOpen: 1 }),
      bioEmpty: true,
    });
    expect(actions[0].label).toBe("Create your first project");
    expect(actions.map((a) => a.href)).toEqual(["/projects", "/notifications", "/friends", "/events", "/referrals", "/wishlist", "/orders", "/profile"]);
    expect(actions.find((a) => a.href === "/notifications")?.label).toBe("Read your 2 unread notifications");
    expect(actions.find((a) => a.href === "/referrals")?.label).toBe("Follow up 2 referrals that have not qualified yet");
  });

  test("singular wording and the cap of eight", () => {
    const one = deriveNextActions({ ...base, unread: 1 });
    expect(one[0].label).toBe("Read your 1 unread notification");
    const many = deriveNextActions({
      ...base,
      build: makeBuild({ nextActions: Array.from({ length: 4 }, (_, i) => ({ label: `a${i}`, href: "/projects" })) }),
      unread: 1,
      community: makeCommunityA({ pendingRequests: 1 }),
      seasons: makeSeasons({ eventsRsvped: 1 }),
      gear: makeGear({ referralsTotal: 1, wishlistAffordable: 1, ordersOpen: 1 }),
      bioEmpty: true,
    });
    expect(many).toHaveLength(8);
  });

  test("a duplicate label is shown once", () => {
    const actions = deriveNextActions({ ...base, build: makeBuild({ nextActions: [{ label: "Add a bio to your profile", href: "/profile" }] }), bioEmpty: true });
    expect(actions).toHaveLength(1);
  });
});

describe("recent activity", () => {
  const ledger: OreEntry[] = [
    { id: "o1", amount: 120, reason: "Sample opening balance", source: "preview", at: "2026-10-01T09:00:00.000Z" },
    { id: "o2", amount: -40, reason: "Order", source: "shop", at: "2026-10-18T09:00:00.000Z" },
  ];
  const community = [{ text: "Posted the idea", href: "/ideas", at: "2026-10-19T09:00:00.000Z" }];
  const notifications: PreviewNotification[] = [{ id: "n1", kind: "system", title: "Welcome", at: "2026-10-20T08:00:00.000Z", read: false }];

  test("merges three sources newest first", () => {
    const merged = mergeActivity({ ledger, community, notifications });
    expect(merged.map((m) => m.source)).toEqual(["notification", "community", "ore", "ore"]);
    expect(merged[0]).toMatchObject({ text: "Welcome", href: "/notifications" });
    expect(merged[2]).toMatchObject({ text: "Spent 40 Ore: Order", href: "/orders" });
    expect(merged[3].href).toBeNull();
  });

  test("never more than the limit (8 by default)", () => {
    const lots: OreEntry[] = Array.from({ length: 30 }, (_, i) => ({ id: `o${i}`, amount: 1, reason: "x", source: "preview", at: `2026-10-${String(1 + (i % 28)).padStart(2, "0")}T00:00:00.000Z` }));
    expect(mergeActivity({ ledger: lots, community, notifications })).toHaveLength(8);
    expect(mergeActivity({ ledger: lots, community: [], notifications: [] }, 3)).toHaveLength(3);
  });

  test("ore text reads naturally", () => {
    expect(oreText({ amount: 1250, reason: "Award" })).toBe("Earned 1,250 Ore: Award");
  });
});
