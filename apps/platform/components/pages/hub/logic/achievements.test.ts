import { describe, expect, test } from "bun:test";
import {
  CATALOG,
  CONTRIBUTOR_ID,
  applyEarned,
  buildFacts,
  earnedMessage,
  earnedNames,
  evaluate,
  filterRows,
  newlyMet,
  normalizeEarned,
  rewardLabel,
  type AchievementFacts,
} from "./achievements";
import { makeBuild, makeCommunityA, makeGear, makeSeasons } from "./fixtures";

const project = (id: string, track: "Tools" | "Systems" | "Compute" | "Hardware" = "Tools") => ({
  id,
  name: id,
  track,
  visibility: "public" as const,
  status: "Draft",
  hoursLogged: 0,
});

function facts(over: Partial<Parameters<typeof buildFacts>[0]> = {}): AchievementFacts {
  return buildFacts({ build: makeBuild(), community: makeCommunityA(), seasons: makeSeasons(), gear: makeGear(), contributorApproved: false, ...over });
}

describe("catalog", () => {
  test("ids are unique and every entry is well formed", () => {
    const ids = CATALOG.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of CATALOG) {
      expect(def.target).toBeGreaterThan(0);
      expect(def.name.length).toBeGreaterThan(0);
      expect(["Common", "Uncommon", "Rare"]).toContain(def.rarity);
    }
  });

  test("only the plan-defined achievement carries Ore, and it is +50", () => {
    const withOre = CATALOG.filter((d) => d.oreReward > 0);
    expect(withOre.map((d) => d.id)).toEqual([CONTRIBUTOR_ID]);
    expect(withOre[0].oreReward).toBe(50);
    expect(rewardLabel(withOre[0])).toBe("+50 Ore, once");
    expect(rewardLabel(CATALOG[0])).toBe("No Ore reward");
  });
});

describe("criteria", () => {
  const met = (over: Partial<Parameters<typeof buildFacts>[0]>) => newlyMet(evaluate(facts(over), {}));

  test("a fresh builder has earned nothing", () => {
    expect(met({})).toEqual([]);
  });

  test("first project, first journal, first review, first ship", () => {
    const got = met({ build: makeBuild({ projects: [project("a")], journalEntries: 1, reviewsDone: 1, approvedShips: 1 }) });
    expect(got).toEqual(expect.arrayContaining(["first-project", "first-journal", "first-review", "first-ship", "start-tools"]));
    expect(got).not.toContain("journal-10");
    expect(got).not.toContain("reviews-8");
  });

  test("thresholds are exact: 10 journal entries, 8 reviews, 20 hours", () => {
    expect(met({ build: makeBuild({ journalEntries: 9, reviewsDone: 7, hoursLogged: 19.5 }) })).not.toEqual(expect.arrayContaining(["journal-10"]));
    const at = met({ build: makeBuild({ journalEntries: 10, reviewsDone: 8, hoursLogged: 20 }) });
    expect(at).toEqual(expect.arrayContaining(["journal-10", "reviews-8", "hours-20"]));
  });

  test("track achievements need a project in that track", () => {
    const got = met({ build: makeBuild({ projects: [project("h", "Hardware")] }) });
    expect(got).toContain("start-hardware");
    expect(got).not.toContain("start-tools");
  });

  test("gear, community and season facts", () => {
    const got = met({
      gear: makeGear({ wishlistCount: 1, ordersTotal: 1, collectiblesOwned: 1, referralsQualified: 1 }),
      community: makeCommunityA({ friends: 1, ideasPosted: 1, showAndTellPosts: 1 }),
      seasons: makeSeasons({ streakWeeks: 4, eventsRsvped: 1 }),
    });
    expect(got).toEqual(expect.arrayContaining(["first-wish", "first-order", "first-collectible", "first-referral", "first-friend", "first-idea", "first-show", "streak-4", "first-event"]));
  });

  test("a certificate alone counts as joining an event, and a 3-week streak does not earn the 4-week one", () => {
    expect(met({ seasons: makeSeasons({ certificates: 1, streakWeeks: 3 }) })).toEqual(["first-event"]);
  });

  test("the outside contribution needs an approved claim", () => {
    expect(met({ contributorApproved: false })).not.toContain(CONTRIBUTOR_ID);
    expect(met({ contributorApproved: true })).toEqual([CONTRIBUTOR_ID]);
  });

  test("progress is capped at the target", () => {
    const rows = evaluate(facts({ build: makeBuild({ journalEntries: 99 }) }), {});
    const row = rows.find((r) => r.def.id === "journal-10");
    expect(row?.value).toBe(10);
    expect(row?.met).toBe(true);
  });
});

describe("earned once", () => {
  test("applyEarned stamps new ids and never changes an existing date", () => {
    const first = applyEarned({}, ["first-project"], "2026-10-20T10:00:00.000Z");
    const second = applyEarned(first, ["first-project", "first-journal"], "2026-10-21T10:00:00.000Z");
    expect(second["first-project"]).toBe("2026-10-20T10:00:00.000Z");
    expect(second["first-journal"]).toBe("2026-10-21T10:00:00.000Z");
  });

  test("an achievement does not un-earn when its criterion stops being met", () => {
    const earned = applyEarned({}, ["first-project"], "2026-10-20T10:00:00.000Z");
    const rows = evaluate(facts({ build: makeBuild({ projects: [] }) }), earned);
    const row = rows.find((r) => r.def.id === "first-project");
    expect(row?.earned).toBe(true);
    expect(row?.met).toBe(false);
    expect(row?.earnedAt).toBe("2026-10-20T10:00:00.000Z");
    expect(newlyMet(rows)).not.toContain("first-project");
  });

  test("an earned achievement is not reported as newly met again", () => {
    const f = facts({ build: makeBuild({ projects: [project("a")] }) });
    const earned = applyEarned({}, newlyMet(evaluate(f, {})), "2026-10-20T10:00:00.000Z");
    expect(newlyMet(evaluate(f, earned))).toEqual([]);
  });

  test("normalizeEarned drops unknown ids and non-string dates", () => {
    expect(normalizeEarned({ "first-project": "2026-10-20T10:00:00.000Z", nope: "x", "first-journal": 5 })).toEqual({ "first-project": "2026-10-20T10:00:00.000Z" });
    expect(normalizeEarned("junk")).toEqual({});
  });
});

describe("filters and messages", () => {
  const f = facts({ build: makeBuild({ projects: [project("a")] }) });
  const earned = applyEarned({}, newlyMet(evaluate(f, {})), "2026-10-20T10:00:00.000Z");
  const rows = evaluate(f, earned);

  test("status and track filters", () => {
    expect(filterRows(rows, "earned", "all").every((r) => r.earned)).toBe(true);
    expect(filterRows(rows, "locked", "all").every((r) => !r.earned)).toBe(true);
    expect(filterRows(rows, "all", "Tools").map((r) => r.def.id)).toEqual(["start-tools"]);
    expect(filterRows(rows, "all", "all")).toHaveLength(CATALOG.length);
  });

  test("earnedNames lists names newest first", () => {
    expect(earnedNames(rows)).toContain("First project");
  });

  test("one notification covers a batch", () => {
    expect(earnedMessage([])).toBeNull();
    expect(earnedMessage(["first-project"])?.title).toBe("Achievement earned: First project");
    expect(earnedMessage(["first-project", "first-journal"])?.title).toBe("2 achievements earned");
  });
});
