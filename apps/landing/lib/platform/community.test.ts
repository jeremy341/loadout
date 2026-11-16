import { describe, expect, test } from "bun:test";
import {
  BUILDERS,
  COMMUNITY_TABS,
  depthLabel,
  eraStages,
  filterIdeas,
  findIdea,
  findSession,
  goalPercent,
  GOALS,
  IDEAS,
  ideasHref,
  isCommunityTabCurrent,
  latestNews,
  leaderboardHref,
  leaderboardRows,
  NEWS,
  parseIdeasQuery,
  parseLeaderboardQuery,
  pastSessions,
  rankRows,
  SESSIONS,
  sortIdeas,
  topIdeas,
  upcomingSessions,
} from "./community";
import { TRACKS } from "./progress";

describe("tabs", () => {
  test("the Overview is current only on its own address", () => {
    expect(isCommunityTabCurrent("/dashboard/community", "/dashboard/community")).toBe(true);
    expect(isCommunityTabCurrent("/dashboard/community/ideas", "/dashboard/community")).toBe(false);
  });

  test("a tab owns the pages below it and nothing that only shares its prefix", () => {
    expect(isCommunityTabCurrent("/dashboard/community/ideas/pin-a-project", "/dashboard/community/ideas")).toBe(true);
    expect(isCommunityTabCurrent("/dashboard/community/ideas-extra", "/dashboard/community/ideas")).toBe(false);
  });

  test("the six tabs are in order", () => {
    expect(COMMUNITY_TABS.map((tab) => tab.label)).toEqual(["Overview", "Show & Tell", "Ideas", "News", "Leaderboard", "Goals", "Events"]);
  });
});

describe("era stages", () => {
  test("one stage is current, those before it are earlier and those after are later", () => {
    const stages = eraStages(1);
    expect(stages.map((stage) => stage.state)).toEqual(["earlier", "current", "later", "later", "later"]);
    expect(stages[1].name).toBe("Electrification");
  });
});

describe("rankRows", () => {
  test("equal hours share a rank and the next rank is skipped", () => {
    const rows = rankRows([
      { handle: "c", hours: 5 },
      { handle: "a", hours: 9 },
      { handle: "b", hours: 5 },
      { handle: "d", hours: 2 },
    ]);
    expect(rows.map((row) => [row.handle, row.rank])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 2],
      ["d", 4],
    ]);
    expect(rows.map((row) => row.tied)).toEqual([false, true, true, false]);
  });

  test("a three-way tie at the top", () => {
    expect(rankRows([{ handle: "x", hours: 4 }, { handle: "y", hours: 4 }, { handle: "z", hours: 4 }]).map((row) => row.rank)).toEqual([1, 1, 1]);
  });

  test("builders with no hours are left out, and an empty list is empty", () => {
    expect(rankRows([{ handle: "a", hours: 0 }])).toEqual([]);
    expect(rankRows([])).toEqual([]);
  });
});

describe("leaderboard", () => {
  test("the fixtures never report fewer hours all time than in a week", () => {
    for (const builder of BUILDERS) {
      for (const track of TRACKS) expect(builder.allTime[track]).toBeGreaterThanOrEqual(builder.weekly[track]);
    }
  });

  test("overall adds the four tracks", () => {
    const rows = leaderboardRows({ range: "weekly", track: null });
    expect(rows[0]).toMatchObject({ handle: "mothvector", hours: 16, rank: 1 });
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 2, 4, 4, 6, 6, 8]);
  });

  test("a single track ranks only that track, with ties", () => {
    const rows = leaderboardRows({ range: "weekly", track: "Hardware" });
    expect(rows.map((row) => [row.handle, row.hours, row.rank])).toEqual([
      ["brasskettle", 9, 1],
      ["picopilgrim", 9, 1],
      ["tinwren", 3, 3],
      ["lathelark", 2, 4],
    ]);
  });

  test("every track has rows in both ranges", () => {
    for (const range of ["weekly", "all-time"] as const) {
      for (const track of TRACKS) expect(leaderboardRows({ range, track }).length).toBeGreaterThan(0);
    }
  });

  test("the query reads a range and a track, and ignores anything unknown", () => {
    expect(parseLeaderboardQuery({})).toEqual({ range: "weekly", track: null });
    expect(parseLeaderboardQuery({ range: "all-time", track: "Systems" })).toEqual({ range: "all-time", track: "Systems" });
    expect(parseLeaderboardQuery({ range: "forever", track: "art" })).toEqual({ range: "weekly", track: null });
    expect(parseLeaderboardQuery({ range: ["all-time", "weekly"], track: ["tools"] })).toEqual({ range: "all-time", track: "Tools" });
  });

  test("the address leaves out the defaults", () => {
    expect(leaderboardHref({ range: "weekly", track: null })).toBe("/dashboard/community/leaderboard");
    expect(leaderboardHref({ range: "all-time", track: "Compute" })).toBe("/dashboard/community/leaderboard?track=compute&range=all-time");
  });

  test("depth is one metre for each approved hour", () => {
    expect(depthLabel("all-time", 96)).toBe("-96 M");
    expect(depthLabel("weekly", 7)).toBe("7 M deeper");
  });
});

describe("ideas", () => {
  test("the query reads a status and a sort, and ignores anything unknown", () => {
    expect(parseIdeasQuery({})).toEqual({ status: null, sort: "top" });
    expect(parseIdeasQuery({ status: "Planned", sort: "newest" })).toEqual({ status: "Planned", sort: "newest" });
    expect(parseIdeasQuery({ status: "shop", sort: "random" })).toEqual({ status: null, sort: "top" });
  });

  test("the address leaves out the defaults", () => {
    expect(ideasHref({ status: null, sort: "top" })).toBe("/dashboard/community/ideas");
    expect(ideasHref({ status: "Built", sort: "newest" })).toBe("/dashboard/community/ideas?status=built&sort=newest");
  });

  test("filtering by status keeps only that status", () => {
    expect(filterIdeas(IDEAS, "Declined").every((idea) => idea.status === "Declined")).toBe(true);
    expect(filterIdeas(IDEAS, null)).toHaveLength(IDEAS.length);
  });

  test("most votes first, and equal votes go to the newer idea", () => {
    const top = sortIdeas(IDEAS, "top");
    expect(top[0].id).toBe("era-build-alongs");
    const tied = top.filter((idea) => idea.votes === 17).map((idea) => idea.id);
    expect(tied).toEqual(["random-project", "depth-in-metres"]);
  });

  test("newest sorts by recency", () => {
    expect(sortIdeas(IDEAS, "newest")[0].id).toBe("pin-a-project");
  });

  test("sorting does not change the list it was given", () => {
    const before = IDEAS.map((idea) => idea.id);
    sortIdeas(IDEAS, "top");
    expect(IDEAS.map((idea) => idea.id)).toEqual(before);
  });

  test("the preview leaves out declined ideas", () => {
    expect(topIdeas(10).some((idea) => idea.status === "Declined")).toBe(false);
    expect(topIdeas(3)).toHaveLength(3);
  });

  test("an unknown idea is not found", () => {
    expect(findIdea("nope")).toBeUndefined();
    expect(findIdea("pin-a-project")?.title).toContain("Pin");
  });

  test("no idea is a shop suggestion", () => {
    const text = IDEAS.map((idea) => `${idea.title} ${idea.summary} ${idea.body}`).join(" ");
    expect(/\b(shop|catalog|catalogue|prize|prizes|store)\b/i.test(text)).toBe(false);
  });
});

describe("news and sessions", () => {
  test("news is newest first and a preview is cut to the count", () => {
    expect(latestNews(3)).toHaveLength(3);
    expect(latestNews(3)[0].order).toBe(1);
    expect(latestNews(99)).toHaveLength(NEWS.length);
  });

  test("no news item states a date or a price", () => {
    const text = NEWS.map((item) => `${item.title} ${item.summary}`).join(" ");
    expect(/[$€£]|\b(20\d\d|January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(text)).toBe(false);
  });

  test("past sessions run newest first and upcoming ones run in order", () => {
    expect(pastSessions().map((session) => session.number)).toEqual([3, 2, 1]);
    expect(upcomingSessions().map((session) => session.number)).toEqual([4, 5]);
  });

  test("an upcoming session lists no showcases", () => {
    expect(upcomingSessions().every((session) => session.showcases.length === 0)).toBe(true);
    expect(findSession("nope")).toBeUndefined();
    expect(SESSIONS.map((session) => session.id)).toContain("session-2");
  });
});

describe("goalPercent", () => {
  test("rounds down so a goal is never shown complete early", () => {
    expect(goalPercent(1999, 2000)).toBe(99);
    expect(goalPercent(1240, 2000)).toBe(62);
    expect(goalPercent(2000, 2000)).toBe(100);
  });

  test("is clamped and safe for a missing target", () => {
    expect(goalPercent(5000, 2000)).toBe(100);
    expect(goalPercent(-3, 10)).toBe(0);
    expect(goalPercent(4, 0)).toBe(0);
    expect(goalPercent(Number.NaN, 10)).toBe(0);
  });

  test("every goal fixture sits between zero and its target", () => {
    for (const goal of GOALS) {
      expect(goal.target).toBeGreaterThan(0);
      expect(goal.value).toBeGreaterThanOrEqual(0);
      expect(goal.value).toBeLessThanOrEqual(goal.target);
    }
  });
});
