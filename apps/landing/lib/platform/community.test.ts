import { describe, expect, test } from "bun:test";
import {
  BUILDERS,
  COMMUNITY_TABS,
  depthLabel,
  EVENT_STATUS_LABELS,
  eventStatus,
  goalPercent,
  goalValueText,
  IDEAS,
  ideasHref,
  isCommunityTabCurrent,
  isRsvpOpen,
  leaderboardHref,
  parseLeaderboardRange,
  parseIdeasQuery,
  pastSessions,
  rankRows,
  rsvpCountText,
  SESSIONS,
  sortIdeas,
  topIdeas,
  upcomingSessions,
  visibleSnapshotRows,
  eraBannerText,
  eraProgress,
  eraStages,
  ERA_BONUS_PERCENT,
  ERA_MIN_DAYS,
  GOALS,
  isEraReady,
  makeEraState,
  SAMPLE_ERA,
  filterIdeas,
  findIdea,
  findSession,
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

  test("the seven tabs are in order", () => {
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

describe("sample Era state", () => {
  test("is typed sample data: stage, points, one threshold, days open and the minimum", () => {
    expect(SAMPLE_ERA.name).toBe("Electrification");
    expect(SAMPLE_ERA.stageIndex).toBe(1);
    expect(SAMPLE_ERA.points).toBe(1240);
    expect(SAMPLE_ERA.threshold).toBe(2000);
    expect(SAMPLE_ERA.daysOpen).toBe(9);
    expect(SAMPLE_ERA.minDays).toBe(ERA_MIN_DAYS);
    expect(SAMPLE_ERA.ready).toBe(false);
    expect(ERA_BONUS_PERCENT).toBe(10);
  });

  test("ready needs the threshold and the 14 days together", () => {
    expect(isEraReady({ points: 2000, threshold: 2000, daysOpen: 14, minDays: 14 })).toBe(true);
    expect(isEraReady({ points: 2400, threshold: 2000, daysOpen: 13, minDays: 14 })).toBe(false);
    expect(isEraReady({ points: 1999, threshold: 2000, daysOpen: 30, minDays: 14 })).toBe(false);
    expect(isEraReady({ points: 5, threshold: 0, daysOpen: 30, minDays: 14 })).toBe(false);
  });

  test("makeEraState names the Era from its stage and sets the ready flag", () => {
    const state = makeEraState({ stageIndex: 2, points: 3000, threshold: 3000, daysOpen: 20, minDays: 14, previousClosedPoints: 2000, viewerPoints: 0 });
    expect(state.name).toBe("Computing");
    expect(state.ready).toBe(true);
  });
});

describe("eraProgress", () => {
  test("the sample is building: 62 percent, 760 to go, 5 days left, previous and next stages", () => {
    const era = eraProgress(SAMPLE_ERA);
    expect(era.percent).toBe(62);
    expect(era.pointsText).toBe("1,240 of 2,000 Era Points");
    expect(era.remaining).toBe(760);
    expect(era.daysLeft).toBe(5);
    expect(era.daysCapped).toBe(9);
    expect(era.status).toBe("building");
    expect(era.statusLabel).toBe("Building");
    expect(era.statusText).toContain("The owner confirms the advance");
    expect([era.previous, era.current, era.next]).toEqual(["Steam", "Electrification", "Computing"]);
    expect([era.stageNumber, era.stageCount]).toEqual([2, 5]);
  });

  test("the percentage never reads 100 until the threshold is met", () => {
    expect(eraProgress({ ...SAMPLE_ERA, points: 1999 }).percent).toBe(99);
    expect(eraProgress({ ...SAMPLE_ERA, points: 2000 }).percent).toBe(100);
  });

  test("threshold met before the days have passed waits for the days", () => {
    const era = eraProgress({ ...SAMPLE_ERA, points: 2100, daysOpen: 13 });
    expect(era.status).toBe("threshold-met");
    expect(era.statusLabel).toBe("Threshold met");
    expect(era.statusText).toContain("1 more day");
  });

  test("14 days passed but points short keeps building and says what is missing", () => {
    const era = eraProgress({ ...SAMPLE_ERA, daysOpen: 20 });
    expect(era.status).toBe("days-passed");
    expect(era.daysLeft).toBe(0);
    expect(era.daysCapped).toBe(14);
    expect(era.statusText).toContain("760 more Era Points");
  });

  test("both met is READY TO ADVANCE and the owner confirms; it never says a timer advances it", () => {
    const era = eraProgress({ ...SAMPLE_ERA, points: 2000, daysOpen: 14 });
    expect(era.status).toBe("ready");
    expect(era.statusLabel).toBe("Ready to advance");
    expect(era.statusText).toContain("The owner confirms the advance");
    expect(era.statusText).toContain("not happen on a timer");
  });

  test("the first and last Era have no earlier or later stage", () => {
    const first = eraProgress(makeEraState({ stageIndex: 0, points: 0, threshold: 1000, daysOpen: 0, minDays: 14, previousClosedPoints: null, viewerPoints: 0 }));
    expect(first.previous).toBeNull();
    expect(first.next).toBe("Electrification");
    const last = eraProgress(makeEraState({ stageIndex: 4, points: 0, threshold: 1000, daysOpen: 0, minDays: 14, previousClosedPoints: 900, viewerPoints: 0 }));
    expect(last.next).toBeNull();
    expect(last.previous).toBe("Networks");
  });

  test("the banner text is one short line", () => {
    expect(eraBannerText()).toBe("Electrification Era: 1,240 of 2,000 Era Points, 62%");
  });
});

describe("Era copy", () => {
  test("the Era goal says Era Points, not approved hours, and names the owner", () => {
    const goal = GOALS.find((entry) => entry.id === "era-threshold");
    expect(goal?.text).toContain("Era Points");
    expect(goal?.text).not.toMatch(/approved hours/i);
    expect(goal?.text).toContain("owner confirms");
    expect(goal?.unit).toBe("Era Points");
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
  // The hours themselves come from the nightly snapshot; these tests are the display rules only.
  test("the two windows are week and all, and an unknown one reads as the week", () => {
    expect(parseLeaderboardRange(undefined)).toBe("week");
    expect(parseLeaderboardRange("all")).toBe("all");
    expect(parseLeaderboardRange("week")).toBe("week");
    expect(parseLeaderboardRange("forever")).toBe("week");
    expect(parseLeaderboardRange(["all", "week"])).toBe("all");
  });

  test("the address leaves the default window out", () => {
    expect(leaderboardHref("week")).toBe("/dashboard/community/leaderboard");
    expect(leaderboardHref("all")).toBe("/dashboard/community/leaderboard?range=all");
  });

  test("depth is one metre for each approved hour", () => {
    expect(depthLabel("all", 96)).toBe("96 M");
    expect(depthLabel("week", 7)).toBe("7 M deeper");
  });

  test("the reviewer fulfilment fixtures never report fewer hours all time than in a week", () => {
    for (const builder of BUILDERS) {
      for (const track of TRACKS) expect(builder.allTime[track]).toBeGreaterThanOrEqual(builder.weekly[track]);
    }
  });

  test("a hidden person in the stored snapshot does not take a served place", () => {
    // The snapshot is written nightly; someone in it may have turned stats off since. The snapshot stores more rows
    // than are served precisely so the served list stays full.
    const stored = [
      { personId: "hidden", hours: 10 },
      { personId: "a", hours: 9 },
      { personId: "b", hours: 8 },
    ];
    const visible = new Map([["a", "Ada"], ["b", "Bo"]]);
    expect(visibleSnapshotRows(stored, visible, 2).map((row) => row.handle)).toEqual(["Ada", "Bo"]);
  });

  test("the served list is capped after hidden people are removed", () => {
    const stored = [
      { personId: "hidden", hours: 10 },
      { personId: "a", hours: 9 },
      { personId: "b", hours: 8 },
      { personId: "c", hours: 7 },
    ];
    const visible = new Map([["a", "Ada"], ["b", "Bo"], ["c", "Cy"]]);
    expect(visibleSnapshotRows(stored, visible, 2).map((row) => row.handle)).toEqual(["Ada", "Bo"]);
  });
});

describe("events", () => {
  const base = { startsAt: new Date("2027-03-10T18:00:00.000Z"), endsAt: new Date("2027-03-10T20:00:00.000Z"), stoppedAt: null } as const;
  const before = new Date("2027-03-09T12:00:00.000Z");
  const during = new Date("2027-03-10T19:00:00.000Z");
  const after = new Date("2027-03-11T12:00:00.000Z");

  test("an event is upcoming, then live, then ended", () => {
    expect(eventStatus(base, before)).toBe("upcoming");
    expect(eventStatus(base, during)).toBe("live");
    expect(eventStatus(base, after)).toBe("ended");
  });

  test("a stopped event reads as stopped whatever the clock says, and never takes an RSVP", () => {
    const stopped = { ...base, stoppedAt: new Date("2027-03-09T00:00:00.000Z") };
    expect(eventStatus(stopped, during)).toBe("stopped");
    expect(isRsvpOpen(stopped, during)).toBe(false);
    expect(EVENT_STATUS_LABELS.stopped).toBe("Stopped");
  });

  test("RSVP is open from the start until the end, and an event with no end stays open until stopped", () => {
    expect(isRsvpOpen(base, before)).toBe(true);
    expect(isRsvpOpen(base, during)).toBe(true);
    expect(isRsvpOpen(base, after)).toBe(false);
    const endless = { ...base, endsAt: null };
    expect(isRsvpOpen(endless, after)).toBe(true);
  });

  test("the count reads honestly at every number", () => {
    expect(rsvpCountText(0)).toBe("No builders going yet");
    expect(rsvpCountText(1)).toBe("1 builder going");
    expect(rsvpCountText(12)).toBe("12 builders going");
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

describe("sessions", () => {
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

describe("goal figures", () => {
  test("rounds down so a goal is never shown complete early", () => {
    expect(goalPercent(1999, 2000)).toBe(99);
    expect(goalPercent(1240, 2000)).toBe(62);
    expect(goalPercent(2000, 2000)).toBe(100);
  });

  test("a whole-number percentage is not rounded down by floating point", () => {
    // 29 / 100 * 100 is 28.999999999999996 in binary floating point; the bar must still read 29%.
    expect(goalPercent(29, 100)).toBe(29);
    expect(goalPercent(57, 100)).toBe(57);
    expect(goalPercent(58, 100)).toBe(58);
  });

  test("is clamped and safe for a missing target or a bad figure", () => {
    expect(goalPercent(5000, 2000)).toBe(100);
    expect(goalPercent(-3, 10)).toBe(0);
    expect(goalPercent(4, 0)).toBe(0);
    expect(goalPercent(Number.NaN, 10)).toBe(0);
  });

  test("the words carry the staff-written figures, formatted for reading", () => {
    expect(goalValueText({ current: 1240, target: 2000 })).toBe("1,240 of 2,000");
    expect(goalValueText({ current: 3, target: 4 })).toBe("3 of 4");
  });
});
