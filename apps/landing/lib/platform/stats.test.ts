import { describe, expect, test } from "bun:test";
import {
  buildOverview,
  buildTracks,
  countDistinct,
  LEADERBOARD_SIZE,
  LEADERBOARD_STORED,
  rankLeaderboard,
  SNAPSHOT_KINDS,
  snapshotDay,
  windowStartDay,
} from "./stats";

describe("snapshotDay and windowStartDay", () => {
  test("the snapshot day is the UTC day", () => {
    expect(snapshotDay(new Date("2026-11-18T23:59:59.000Z"))).toBe("2026-11-18");
    expect(snapshotDay(new Date("2026-11-19T00:00:00.000Z"))).toBe("2026-11-19");
  });

  test("a 7 day window ends on the day and starts 6 days before", () => {
    expect(windowStartDay("2026-11-18", 7)).toBe("2026-11-12");
    expect(windowStartDay("2026-03-02", 2)).toBe("2026-03-01");
    expect(windowStartDay("2026-11-18", 1)).toBe("2026-11-18");
  });
});

describe("snapshot kinds", () => {
  test("exactly the four kinds the plan lists", () => {
    expect([...SNAPSHOT_KINDS]).toEqual(["overview", "tracks", "leaderboard-week", "leaderboard-all"]);
  });

  test("the snapshot keeps more rows than the API serves, so hidden people cannot shorten the list", () => {
    expect(LEADERBOARD_SIZE).toBe(50);
    expect(LEADERBOARD_STORED).toBeGreaterThan(LEADERBOARD_SIZE);
  });
});

describe("buildOverview", () => {
  test("counts only, hours in whole hours to two decimals", () => {
    expect(buildOverview({ totalBuilders: 12, activeBuilders: 5, hoursLogged: 9000, projectsShipped: 3 })).toEqual({
      totalBuilders: 12,
      activeBuilders: 5,
      hoursLogged: 2.5,
      projectsShipped: 3,
    });
  });

  test("never negative, never fractional counts", () => {
    expect(buildOverview({ totalBuilders: -1, activeBuilders: 2.9, hoursLogged: -5, projectsShipped: 1.2 })).toEqual({
      totalBuilders: 0,
      activeBuilders: 2,
      hoursLogged: 0,
      projectsShipped: 1,
    });
  });

  test("has no personal fields", () => {
    const overview = buildOverview({ totalBuilders: 1, activeBuilders: 1, hoursLogged: 1, projectsShipped: 1 });
    expect(Object.keys(overview).sort()).toEqual(["activeBuilders", "hoursLogged", "projectsShipped", "totalBuilders"]);
  });
});

describe("buildTracks", () => {
  test("every track in order, zero filled, unknown tracks ignored", () => {
    const out = buildTracks([
      { track: "Systems", seconds: 7200, builders: 2 },
      { track: "Nope", seconds: 99999, builders: 9 },
    ]);
    expect(out).toEqual([
      { track: "Tools", hours: 0, builders: 0 },
      { track: "Systems", hours: 2, builders: 2 },
      { track: "Compute", hours: 0, builders: 0 },
      { track: "Hardware", hours: 0, builders: 0 },
    ]);
  });
});

describe("rankLeaderboard", () => {
  const visible = new Map([
    ["p1", "ada"],
    ["p2", "grace"],
    ["p3", "linus"],
  ]);

  test("sorts by hours, numbers from 1, and gives the handle and hours only", () => {
    const ranked = rankLeaderboard(
      [
        { personId: "p1", seconds: 3600 },
        { personId: "p2", seconds: 7200 },
      ],
      visible,
    );
    expect(ranked).toEqual([
      { rank: 1, personId: "p2", handle: "grace", hours: 2 },
      { rank: 2, personId: "p1", handle: "ada", hours: 1 },
    ]);
  });

  test("a person who is not visible never appears and never takes a place", () => {
    const ranked = rankLeaderboard(
      [
        { personId: "hidden", seconds: 999999 },
        { personId: "p1", seconds: 60 },
      ],
      visible,
    );
    expect(ranked.map((r) => r.handle)).toEqual(["ada"]);
    expect(ranked[0].rank).toBe(1);
  });

  test("ties break by handle, and people with no hours are left out", () => {
    const ranked = rankLeaderboard(
      [
        { personId: "p3", seconds: 3600 },
        { personId: "p1", seconds: 3600 },
        { personId: "p2", seconds: 0 },
      ],
      visible,
    );
    expect(ranked.map((r) => r.handle)).toEqual(["ada", "linus"]);
  });

  test("the list is capped (50 by default) and the cap can be passed in", () => {
    const many = new Map<string, string>();
    const rows = [];
    for (let i = 0; i < 80; i++) {
      many.set(`p${i}`, `builder${String(i).padStart(2, "0")}`);
      rows.push({ personId: `p${i}`, seconds: (i + 1) * 60 });
    }
    expect(rankLeaderboard(rows, many)).toHaveLength(50);
    expect(rankLeaderboard(rows, many, 3)).toHaveLength(3);
    expect(rankLeaderboard(rows, many)[0].handle).toBe("builder79");
  });
});

describe("countDistinct", () => {
  test("counts each person once", () => {
    expect(countDistinct(["a", "b", "a"])).toBe(2);
    expect(countDistinct([])).toBe(0);
  });
});
