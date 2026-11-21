import { describe, expect, test } from "bun:test";
import { TRACKS } from "./progress";
import {
  CHANGE_REASON_LABELS,
  REVIEW_MACROS,
  acceptShare,
  fillMacro,
  trackLockedFor,
  unlocksTrack,
  ageLabel,
  approvedMinutes,
  auditsForShip,
  bomGaps,
  bomTotals,
  builderView,
  canAccessKind,
  canMove,
  canReview,
  clampKind,
  claimedByOther,
  codedLabel,
  countsTotal,
  creditFor,
  decisionsBy,
  deskStage,
  deskViewer,
  filterAudits,
  filterLog,
  filterReviewType,
  filterShips,
  formatAverage,
  formatDuration,
  formatHours,
  formatSeconds,
  hardwareFacts,
  hasCurrentFirstPass,
  hoursLine,
  hoursSplit,
  inFinalStage,
  inQueue,
  isCodeDump,
  isDecided,
  isOwnShip,
  isRushed,
  journaledMinutes,
  journalsExpected,
  keptMinutes,
  listFor,
  lockFor,
  lockLabel,
  logHref,
  neighbours,
  nextStatuses,
  openFor,
  paginate,
  parseLogQuery,
  parsePage,
  parseReviewQuery,
  parseReviewTypeFilter,
  pipelineSteps,
  QUEUE_PAGE_SIZE,
  queueView,
  recentAudits,
  REVIEW_AUDITS,
  REVIEW_LOG,
  REVIEW_SHIPS,
  REVIEW_STATUSES,
  REVIEW_TYPE_FILTERS,
  reviewedRows,
  reviewerById,
  reviewerHandle,
  reviewerRows,
  reviewersFor,
  REVIEWERS,
  reviewHref,
  reviewTypeGroup,
  shipById,
  shipHref,
  sortShips,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  stageRows,
  summarizeWindow,
  tabCounts,
  teamTotals,
  trackedMinutes,
  typeChips,
  typeHref,
  undisclosedAiCommits,
  VALIDITY_CHECKS,
  VERDICT_WINDOWS,
  waitHours,
  type DeskViewer,
  type ReviewShip,
  type ReviewStatus,
} from "./review";

const ship = (id: string): ReviewShip => {
  const found = shipById(id);
  if (!found) throw new Error(`no ship ${id}`);
  return found;
};

const viewer = (over: Partial<DeskViewer> = {}): DeskViewer => ({ isOwner: false, canSecondPass: false, reviewQueues: "both", reviewer: "tamsin", builder: "ploughshare", ...over });

describe("status model", () => {
  test("a waiting ship can only be claimed", () => {
    expect(nextStatuses("waiting")).toEqual(["claimed"]);
  });

  test("a first pass passes a ship to Second pass, proposes a ban, or sends it back to the builder", () => {
    expect(canMove("claimed", "second-pass")).toBe(true);
    expect(canMove("claimed", "proposed-ban")).toBe(true);
    expect(canMove("claimed", "needs-changes")).toBe(true);
    // A first pass never approves or bans outright.
    expect(canMove("claimed", "approved")).toBe(false);
    expect(canMove("claimed", "banned")).toBe(false);
  });

  test("a final reviewer decides in Second pass and in Proposed ban; only the builder reopens needs changes", () => {
    for (const to of ["approved", "needs-changes", "banned"] as const) {
      expect(canMove("second-pass", to)).toBe(true);
      expect(canMove("proposed-ban", to)).toBe(true);
    }
    expect(nextStatuses("needs-changes")).toEqual(["waiting"]);
  });

  test("approved and banned are final", () => {
    expect(nextStatuses("approved")).toEqual([]);
    expect(nextStatuses("banned")).toEqual([]);
  });

  test("the second pass is a status and there is no other final stage", () => {
    expect(REVIEW_STATUSES as readonly string[]).toContain("second-pass");
    expect(REVIEW_STATUSES as readonly string[]).not.toContain("spot-check");
    expect(REVIEW_STATUSES).toHaveLength(7);
  });

  test("every move names a real status and never loops onto itself", () => {
    for (const status of REVIEW_STATUSES) {
      for (const next of STATUS_TRANSITIONS[status]) {
        expect(REVIEW_STATUSES).toContain(next);
        expect(next).not.toBe(status);
      }
    }
  });

  test("the queue is waiting and claimed; the final stages are Second pass and Proposed ban; verdicts are approved and needs changes", () => {
    expect(REVIEW_STATUSES.filter(inQueue)).toEqual(["waiting", "claimed"]);
    expect(REVIEW_STATUSES.filter(inFinalStage)).toEqual(["second-pass", "proposed-ban"]);
    expect(REVIEW_STATUSES.filter(isDecided)).toEqual(["approved", "needs-changes"]);
    expect(STATUS_LABELS["proposed-ban"]).toBe("Ban proposed");
  });

  test("the desk stage follows the status", () => {
    expect(deskStage({ status: "waiting" })).toBe("first-pass");
    expect(deskStage({ status: "second-pass" })).toBe("second-pass");
    expect(deskStage({ status: "proposed-ban" })).toBe("final-pass");
  });
});

describe("review query", () => {
  test("an empty address is the software queue, every type, page 1", () => {
    expect(parseReviewQuery({})).toEqual({ kind: "software", type: "all", page: 1 });
  });

  test("kind and type are read in any case", () => {
    expect(parseReviewQuery({ kind: "HARDWARE", type: " Web " })).toEqual({ kind: "hardware", type: "web", page: 1 });
  });

  test("unknown values fall back to the default view", () => {
    expect(parseReviewQuery({ kind: "firmware", type: "spreadsheet", page: "abc" })).toEqual({ kind: "software", type: "all", page: 1 });
  });

  test("a repeated parameter uses its first value", () => {
    expect(parseReviewQuery({ kind: ["hardware", "software"], type: ["cad", "web"] })).toEqual({ kind: "hardware", type: "cad", page: 1 });
  });

  test("a page is a whole number from 1", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  test("the default view is /review and others keep only what differs, as Pixl does", () => {
    expect(reviewHref({ kind: "software", type: "all", page: 1 })).toBe("/review");
    expect(reviewHref({ kind: "hardware", type: "all", page: 1 })).toBe("/review?kind=hardware");
    expect(reviewHref({ kind: "hardware", type: "cad", page: 2 })).toBe("/review?kind=hardware&type=cad&page=2");
    expect(reviewHref({ kind: "software", type: "web", page: 1 })).toBe("/review?type=web");
  });

  test("an address round-trips", () => {
    const query = { kind: "hardware", type: "cad", page: 2 } as const;
    const read = (href: string) => parseReviewQuery(Object.fromEntries(new URL(href, "https://x.test").searchParams));
    expect(read(reviewHref(query))).toEqual(query);
  });

  test("a type chip keeps the queue and drops the page", () => {
    expect(typeHref("hardware", "cad")).toBe("/review?kind=hardware&type=cad");
    expect(typeHref("software", "all")).toBe("/review");
  });

  test("a reviewer limited to one queue is held to it", () => {
    expect(clampKind("both", "hardware")).toBe("hardware");
    expect(clampKind("software", "hardware")).toBe("software");
    expect(clampKind("hardware", "software")).toBe("hardware");
  });
});

describe("project types", () => {
  test("the filter list is Pixl's, All types first", () => {
    expect(REVIEW_TYPE_FILTERS.map((item) => item.id)).toEqual(["all", "games", "web", "desktop", "python", "mobile", "hardware", "cad", "other"]);
  });

  test("types fall into their groups and a game is always a game", () => {
    expect(reviewTypeGroup("linux")).toBe("desktop");
    expect(reviewTypeGroup("cross_platform")).toBe("desktop");
    expect(reviewTypeGroup("android")).toBe("mobile");
    expect(reviewTypeGroup("cad")).toBe("cad");
    expect(reviewTypeGroup("web", true)).toBe("games");
    expect(reviewTypeGroup(null)).toBe("other");
  });

  test("an unknown filter reads as all", () => {
    expect(parseReviewTypeFilter("nope")).toBe("all");
    expect(parseReviewTypeFilter(undefined)).toBe("all");
    expect(parseReviewTypeFilter("web")).toBe("web");
  });

  test("filtering by type narrows the rows and leaves the input alone", () => {
    const rows = filterShips(REVIEW_SHIPS, { kind: "software", statuses: ["waiting", "claimed"] });
    const games = filterReviewType(rows, "games");
    expect(games.length).toBeGreaterThan(0);
    expect(games.every((row) => row.isGame)).toBe(true);
    expect(filterReviewType(rows, "all")).toHaveLength(rows.length);
  });

  test("chips show types with ships, and All types, Games and the chosen type even when empty", () => {
    const rows = filterShips(REVIEW_SHIPS, { kind: "software", statuses: ["waiting", "claimed"] });
    const ids = typeChips(rows, "all").map((chip) => chip.id);
    expect(ids).toContain("all");
    expect(ids).toContain("games");
    expect(ids).not.toContain("mobile");
    expect(typeChips(rows, "mobile").map((chip) => chip.id)).toContain("mobile");
    expect(typeChips(rows, "all")[0].count).toBe(rows.length);
  });
});

describe("the queue", () => {
  test("the software queue holds waiting and claimed software ships only, longest wait first", () => {
    const view = queueView(REVIEW_SHIPS, { kind: "software", type: "all", page: 1 });
    expect(view.total).toBeGreaterThan(0);
    for (const row of view.page.items) {
      expect(row.kind).toBe("software");
      expect(inQueue(row.status)).toBe(true);
    }
    const waits = view.page.items.map(waitHours);
    expect(waits).toEqual([...waits].sort((a, b) => b - a));
  });

  test("a queue page holds fifteen", () => {
    expect(QUEUE_PAGE_SIZE).toBe(15);
    const rows = Array.from({ length: 31 }, (_, i) => i);
    expect(paginate(rows, 1, QUEUE_PAGE_SIZE).items).toHaveLength(15);
    expect(paginate(rows, 3, QUEUE_PAGE_SIZE).items).toHaveLength(1);
    expect(paginate(rows, 9, QUEUE_PAGE_SIZE).page).toBe(3);
  });

  test("a type filter narrows the queue and its count follows", () => {
    const all = queueView(REVIEW_SHIPS, { kind: "software", type: "all", page: 1 });
    const python = queueView(REVIEW_SHIPS, { kind: "software", type: "python", page: 1 });
    expect(python.total).toBeLessThan(all.total);
    expect(python.page.items.every((row) => row.projectType === "python")).toBe(true);
    // The chips still count the whole queue, so you can switch type.
    expect(python.chips[0].count).toBe(all.total);
  });

  test("a reship waits from the first time it was sent in; an update waits from this ship", () => {
    const reship = ship("sh-2047");
    expect(waitHours(reship)).toBe(310);
    expect(reship.submittedHoursAgo).toBeLessThan(waitHours(reship));
    const update = ship("sh-2046");
    expect(update.update).toBeDefined();
    expect(waitHours(update)).toBe(update.submittedHoursAgo);
    expect(waitHours({ submittedHoursAgo: 5, firstShippedHoursAgo: 90 })).toBe(90);
  });

  test("a tie keeps a stable order and sorting does not change the input", () => {
    const rows = filterShips(REVIEW_SHIPS, { statuses: ["waiting"] });
    const copy = [...rows];
    const sorted = sortShips(rows);
    expect(rows).toEqual(copy);
    expect(sortShips([...sorted].reverse()).map((row) => row.id)).toEqual(sorted.map((row) => row.id));
  });

  test("the tab counts follow the stages", () => {
    const counts = tabCounts(REVIEW_SHIPS);
    expect(counts.pending).toBe(filterShips(REVIEW_SHIPS, { statuses: ["waiting", "claimed"] }).length);
    expect(counts.secondPass).toBe(stageRows(REVIEW_SHIPS, "second-pass").length);
    expect(counts.proposedBans).toBe(stageRows(REVIEW_SHIPS, "proposed-ban").length);
    expect(counts.proposedBans).toBeGreaterThan(0);
  });

  test("Reviewed holds approved and needs-changes ships, newest verdict first, and never a banned one", () => {
    const rows = reviewedRows(REVIEW_SHIPS);
    expect(rows.every((row) => row.status === "approved" || row.status === "needs-changes")).toBe(true);
    const ages = rows.map((row) => row.decision?.hoursAgo ?? 0);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
  });

  test("the First pass column shows only for ships past the first pass", () => {
    expect(hasCurrentFirstPass(ship("sh-2041"))).toBe(false);
    expect(hasCurrentFirstPass(ship("sh-2049"))).toBe(true);
    expect(hasCurrentFirstPass(ship("sh-2051"))).toBe(true);
  });
});

describe("locks, claims and the viewer", () => {
  test("a reserved row is locked for everyone but the assignee and owners", () => {
    const reserved = ship("sh-2047");
    expect(lockFor(reserved, viewer())).toEqual({ assignee: "saltmarsh", hoursLeft: 36 });
    expect(lockFor(reserved, viewer({ reviewer: "saltmarsh" }))).toBeNull();
    expect(lockFor(reserved, viewer({ isOwner: true }))).toBeNull();
    expect(lockFor(ship("sh-2041"), viewer())).toBeNull();
    expect(lockLabel({ assignee: "saltmarsh", hoursLeft: 36 })).toBe("Reserved for @saltmarsh, 36h left");
  });

  test("an expired reservation is not a lock, and a lock only applies in the first pass", () => {
    expect(lockFor({ status: "waiting", reserved: { reviewer: "saltmarsh", hoursLeft: 0 } }, viewer())).toBeNull();
    expect(lockFor({ status: "second-pass", reserved: { reviewer: "saltmarsh", hoursLeft: 10 } }, viewer())).toBeNull();
  });

  test("another reviewer's claim is named, your own is not", () => {
    expect(claimedByOther(ship("sh-2045"), viewer({ reviewer: "bellwether" }))).toBe("tamsin");
    expect(claimedByOther(ship("sh-2045"), viewer({ reviewer: "tamsin" }))).toBeNull();
    expect(claimedByOther(ship("sh-2041"), viewer())).toBeNull();
  });

  test("your own and a collaborator's ships are yours", () => {
    expect(isOwnShip(ship("sh-2043"), viewer())).toBe(true);
    expect(isOwnShip(ship("sh-2041"), viewer())).toBe(false);
    expect(isOwnShip(ship("sh-2048"), viewer({ builder: "tinwren" }))).toBe(true);
    expect(isOwnShip(ship("sh-2043"), viewer({ builder: "" }))).toBe(false);
  });

  test("the local test accounts stand in for sample people, and anyone else for nobody", () => {
    const access = { isOwner: true, canSecondPass: true, reviewQueues: "both" as const };
    expect(deskViewer(access, "Test owner").builder).toBe("kestrel42");
    expect(deskViewer(access, "Someone else")).toMatchObject({ reviewer: "", builder: "" });
  });

  test("a first-pass reviewer can review a queue ship but not their own", () => {
    expect(canReview(ship("sh-2041"), viewer())).toBe(true);
    expect(canReview(ship("sh-2043"), viewer())).toBe(false);
  });

  test("a restricted reviewer cannot review the other queue", () => {
    expect(canReview(ship("sh-2041"), viewer({ reviewQueues: "hardware" }))).toBe(false);
    expect(canReview(ship("sh-2042"), viewer({ reviewQueues: "hardware" }))).toBe(true);
  });

  test("Second pass needs an owner or a final reviewer, and never your own project", () => {
    const spot = ship("sh-2049");
    expect(canReview(spot, viewer())).toBe(false);
    expect(canReview(spot, viewer({ canSecondPass: true }))).toBe(true);
    expect(canReview(spot, viewer({ isOwner: true, builder: "ostler" }))).toBe(false);
  });

  test("a ship on hold, a banned ship and a decided ship cannot be reviewed", () => {
    expect(ship("sh-2050").hold).toBeDefined();
    expect(canReview(ship("sh-2050"), viewer({ isOwner: true }))).toBe(false);
    expect(canReview(ship("sh-2057"), viewer({ isOwner: true }))).toBe(false);
    expect(canReview(ship("sh-2051"), viewer({ isOwner: true }))).toBe(false);
  });

  test("a proposed ban can be decided by a final reviewer", () => {
    expect(canReview(ship("sh-2056"), viewer({ canSecondPass: true }))).toBe(true);
    expect(canReview(ship("sh-2056"), viewer())).toBe(false);
  });
});

describe("desk lists", () => {
  test("each status goes back to the list it came from", () => {
    expect(listFor({ status: "waiting", kind: "software" })).toEqual({ href: "/review", label: "Review queue" });
    expect(listFor({ status: "claimed", kind: "hardware" }).href).toBe("/review?kind=hardware");
    expect(listFor({ status: "second-pass", kind: "software" }).href).toBe("/review/second-pass");
    expect(listFor({ status: "proposed-ban", kind: "software" }).href).toBe("/review/proposed-bans");
    expect(listFor({ status: "approved", kind: "software" }).href).toBe("/review/reviewed");
    expect(listFor({ status: "needs-changes", kind: "hardware" }).href).toBe("/review/reviewed");
  });

  test("a ship's desk is /review/<id>", () => {
    expect(shipHref("sh-2041")).toBe("/review/sh-2041");
  });

  test("previous and next walk the same list, skipping locked rows", () => {
    const owner = viewer({ isOwner: true, reviewer: "bellwether" });
    const near = neighbours(REVIEW_SHIPS, ship("sh-2041"), owner);
    expect(near.index).toBeGreaterThanOrEqual(0);
    expect(near.total).toBeGreaterThan(1);
    const plain = viewer();
    const withLock = neighbours(REVIEW_SHIPS, ship("sh-2041"), plain);
    expect(withLock.total).toBe(near.total - 1);
  });

  test("a ship outside the list is not in it", () => {
    expect(neighbours(REVIEW_SHIPS, ship("sh-2051"), viewer({ isOwner: true })).index).toBe(-1);
    const near = neighbours(REVIEW_SHIPS, ship("sh-2049"), viewer({ canSecondPass: true }));
    expect(near.total).toBe(stageRows(REVIEW_SHIPS, "second-pass").length);
  });
});

describe("time", () => {
  test("durations read in hours and minutes", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(180)).toBe("3h");
    expect(formatDuration(134)).toBe("2h 14m");
  });

  test("hours keep one decimal at most", () => {
    expect(formatHours(1920)).toBe("32 H");
    expect(formatHours(1890)).toBe("31.5 H");
  });

  test("seconds on a review, and Pixl's average form", () => {
    expect(formatSeconds(0)).toBe("none");
    expect(formatSeconds(245)).toBe("4m 05s");
    expect(formatAverage(0)).toBe("-");
    expect(formatAverage(45)).toBe("45s");
    expect(formatAverage(900)).toBe("15m");
    expect(formatAverage(5400)).toBe("1.5h");
    expect(isRushed(40)).toBe(true);
    expect(isRushed(0)).toBe(false);
    expect(isRushed(60)).toBe(false);
  });

  test("an age switches from hours to days after two days", () => {
    expect(ageLabel(0.4)).toBe("under 1h");
    expect(ageLabel(18)).toBe("18h");
    expect(ageLabel(47.9)).toBe("47h");
    expect(ageLabel(48)).toBe("2d");
  });

  test("one journal entry is expected for every eight hours, and at least one", () => {
    expect(journalsExpected(60)).toBe(1);
    expect(journalsExpected(16 * 60)).toBe(2);
  });

  test("reviewer actions on journaled time", () => {
    expect(keptMinutes({ day: "x", minutes: 60, text: "" })).toBeNull();
    expect(keptMinutes({ day: "x", minutes: 60, text: "", action: "approve-all" })).toBe(60);
    expect(keptMinutes({ day: "x", minutes: 60, text: "", action: "partial", keptMinutes: 30 })).toBe(30);
    expect(keptMinutes({ day: "x", minutes: 60, text: "", action: "partial", keptMinutes: 90 })).toBe(60);
    expect(keptMinutes({ day: "x", minutes: 60, text: "", action: "clarify" })).toBe(0);
    expect(keptMinutes({ day: "x", minutes: 60, text: "", action: "reject" })).toBe(0);
  });

  test("approved time is known only when every entry has an action", () => {
    expect(approvedMinutes(ship("sh-2041"))).toBeNull();
    expect(approvedMinutes(ship("sh-2051"))).toBe(1620);
    expect(approvedMinutes(ship("sh-2049"))).toBe(1020);
  });

  test("tracked against journaled time splits as a share of the total", () => {
    const split = hoursSplit(ship("sh-2041"));
    expect(split.tracked).toBe(1980);
    expect(split.journaled).toBe(1920);
    expect(split.trackedPercent).toBe(51);
  });

  test("credit follows Ore and depth: 10 Ore per approved hour, 10 Ore = $4.35, 1 m per hour", () => {
    expect(creditFor(600)).toEqual({ hours: 10, ore: 100, usd: 43.5, depth: 10 });
    expect(creditFor(0)).toEqual({ hours: 0, ore: 0, usd: 0, depth: 0 });
  });

  test("credit uses the one rules version: hours to 0.1, then Ore rounded up", () => {
    expect(creditFor(100)).toMatchObject({ hours: 1.7, ore: 17, depth: 1.7 });
    expect(creditFor(2)).toMatchObject({ hours: 0, ore: 0 });
    expect(creditFor(3)).toMatchObject({ hours: 0.1, ore: 1 });
    // hours * 60 float noise must not change the answer
    expect(creditFor(0.7 * 60).ore).toBe(7);
    expect(creditFor(Number.NaN)).toEqual({ hours: 0, ore: 0, usd: 0, depth: 0 });
  });
});

describe("the one track", () => {
  test("a ship is locked unless the builder was asked for changes", () => {
    expect(trackLockedFor("waiting")).toBe(true);
    expect(trackLockedFor("claimed")).toBe(true);
    expect(trackLockedFor("second-pass")).toBe(true);
    expect(trackLockedFor("approved")).toBe(true);
    expect(trackLockedFor("banned")).toBe(true);
    expect(trackLockedFor("needs-changes")).toBe(false);
  });

  test("only a needs-changes decision with the track reason unlocks the track", () => {
    expect(unlocksTrack({ outcome: "needs-changes", reasonCode: "track" })).toBe(true);
    expect(unlocksTrack({ outcome: "needs-changes", reasonCode: "readme" })).toBe(false);
    expect(unlocksTrack({ outcome: "needs-changes" })).toBe(false);
    expect(unlocksTrack({ outcome: "approved", reasonCode: "track" })).toBe(false);
    expect(unlocksTrack(undefined)).toBe(false);
  });

  test("the sample ship sent back for its track unlocks it", () => {
    expect(unlocksTrack(ship("sh-2054").decision)).toBe(true);
    expect(CHANGE_REASON_LABELS.track).toBe("Does not fit the track");
  });

  test("the /track macro exists and names the ship's track", () => {
    const macro = REVIEW_MACROS.find((item) => item.trigger === "/track");
    expect(macro?.label).toBe("Does not fit the track");
    const text = fillMacro(macro?.text ?? "", { track: "Systems" });
    expect(text).toContain("the Systems track");
    expect(text).not.toContain("{track}");
  });

  test("fillMacro leaves text without a placeholder alone", () => {
    expect(fillMacro("No placeholder here.", { track: "Tools" })).toBe("No placeholder here.");
  });
});

describe("audits and the log", () => {
  test("a log address keeps only a real reviewer and a page after the first", () => {
    expect(parseLogQuery({ reviewer: "ORRERY", page: "2" })).toEqual({ reviewer: "orrery", page: 2 });
    expect(parseLogQuery({ reviewer: "nobody" })).toEqual({ reviewer: null, page: 1 });
    expect(logHref({ reviewer: null, page: 1 })).toBe("/review/log");
    expect(logHref({ reviewer: "orrery", page: 2 })).toBe("/review/log?reviewer=orrery&page=2");
  });

  test("filtering by reviewer keeps only their entries", () => {
    expect(filterAudits(REVIEW_AUDITS, "orrery").every((item) => item.reviewer === "orrery")).toBe(true);
    expect(filterAudits(REVIEW_AUDITS, null)).toHaveLength(REVIEW_AUDITS.length);
    expect(filterLog(REVIEW_LOG, "orrery").every((item) => item.reviewer === "orrery")).toBe(true);
  });

  test("a ship's past reviews are its audits, newest first", () => {
    const rows = auditsForShip("sh-2049");
    expect(rows).toHaveLength(1);
    expect(rows[0].verdict).toBe("first_pass_approved");
    expect(auditsForShip("sh-2041")).toEqual([]);
    const ages = auditsForShip("sh-2051").map((item) => item.hoursAgo);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
  });

  test("Recently reviewed by you is your latest five, newest first, and nothing for nobody", () => {
    const mine = recentAudits("bellwether");
    expect(mine.length).toBeLessThanOrEqual(5);
    expect(mine.every((item) => item.reviewer === "bellwether")).toBe(true);
    expect(recentAudits("")).toEqual([]);
  });

  test("the hours line reads as logged, lowered, or none", () => {
    expect(hoursLine({ claimedMinutes: 600, approvedMinutes: 600 })).toBe("10h credited as logged");
    expect(hoursLine({ claimedMinutes: 600, approvedMinutes: 480 })).toBe("hours 10h to 8h");
    expect(hoursLine({ claimedMinutes: 600, approvedMinutes: null })).toBe("no hours credited");
  });

  test("decisions leave out claims and releases", () => {
    const mine = decisionsBy(REVIEW_LOG, "tamsin");
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((item) => item.action !== "claimed" && item.action !== "released")).toBe(true);
  });

  test("the log is newest first and names real ships and reviewers", () => {
    const ages = REVIEW_LOG.map((item) => item.hoursAgo);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
    for (const item of REVIEW_LOG) {
      expect(shipById(item.ship)).not.toBeNull();
      expect(reviewerById(item.reviewer)).not.toBeNull();
    }
    expect(reviewerHandle("tamsin")).toBe("tamsin");
    expect(reviewerHandle(null)).toBe("nobody");
  });

  test("every audit is in the log under the same reviewer and ship", () => {
    for (const item of REVIEW_AUDITS) {
      const entry = REVIEW_LOG.find((row) => row.id === item.id);
      expect(entry?.reviewer).toBe(item.reviewer);
      expect(entry?.ship).toBe(item.ship);
    }
  });
});

describe("stats", () => {
  test("a reviewer's approved and sent-back add up to their all-time count, and the windows add up to the totals", () => {
    for (const item of REVIEWERS) {
      expect(item.accepted + item.rejected).toBe(item.allTime);
      expect(countsTotal(item.verdicts.all)).toBe(item.allTime);
      expect(countsTotal(item.verdicts.week)).toBe(item.thisWeek);
    }
  });

  test("the windows nest: day inside week inside month inside all time", () => {
    for (const item of REVIEWERS) {
      for (const key of ["approved", "firstPass", "changes", "rejected"] as const) {
        expect(item.verdicts.day[key]).toBeLessThanOrEqual(item.verdicts.week[key]);
        expect(item.verdicts.week[key]).toBeLessThanOrEqual(item.verdicts.month[key]);
        expect(item.verdicts.month[key]).toBeLessThanOrEqual(item.verdicts.all[key]);
      }
    }
  });

  test("only final reviewers give final approvals", () => {
    for (const item of REVIEWERS) {
      if (!item.secondPass) expect(item.verdicts.all.approved).toBe(0);
    }
  });

  test("a window counts the reviewers who gave a verdict, most reviews first", () => {
    const all = summarizeWindow(REVIEWERS, "all");
    expect(all.reviewers).toBe(REVIEWERS.length);
    expect(countsTotal(all.counts)).toBe(teamTotals(REVIEWERS).allTime);
    const counts = all.reviewerList.map((item) => item.reviews);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    const day = summarizeWindow(REVIEWERS, "day");
    expect(day.reviewers).toBeLessThan(all.reviewers);
    expect(VERDICT_WINDOWS.map((item) => item.key)).toEqual(["all", "day", "week", "month"]);
  });

  test("the table is most reviews first with ties by handle", () => {
    const rows = reviewerRows(REVIEWERS);
    const totals = rows.map((row) => row.total);
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
    expect(rows[0].approved).toBe(REVIEWERS.find((item) => item.id === rows[0].id)?.verdicts.all.approved);
  });

  test("the approve share is a whole percent and zero with no decisions", () => {
    expect(acceptShare({ accepted: 0, rejected: 0 })).toBe(0);
    expect(acceptShare({ accepted: 1, rejected: 2 })).toBe(33);
  });

  test("team totals add the reviewers and weight the average time by reviews", () => {
    const totals = teamTotals([
      { ...REVIEWERS[0], allTime: 10, thisWeek: 1, accepted: 8, rejected: 2, avgSeconds: 100 },
      { ...REVIEWERS[1], allTime: 30, thisWeek: 2, accepted: 20, rejected: 10, avgSeconds: 200 },
    ]);
    expect(totals).toEqual({ thisWeek: 3, allTime: 40, accepted: 28, rejected: 12, avgSeconds: 175 });
  });

  test("access covers a kind when it is that kind or both", () => {
    expect(canAccessKind({ access: "both" }, "hardware")).toBe(true);
    expect(canAccessKind({ access: "software" }, "hardware")).toBe(false);
    expect(reviewersFor("hardware").every((item) => item.access !== "software")).toBe(true);
  });

  test("a final reviewer can open Second pass and Proposed ban ships; a plain one cannot", () => {
    const final = REVIEWERS.find((item) => item.id === "orrery")!;
    const plain = REVIEWERS.find((item) => item.id === "fenwick")!;
    expect(openFor(final, REVIEW_SHIPS).some((item) => inFinalStage(item.status))).toBe(true);
    expect(openFor(plain, REVIEW_SHIPS).every((item) => inQueue(item.status))).toBe(true);
    expect(openFor(plain, REVIEW_SHIPS).every((item) => item.kind === "hardware")).toBe(true);
  });
});

describe("commits and the desk", () => {
  test("a large commit with almost no tracked time is a paste", () => {
    expect(isCodeDump({ additions: 3000, codedMinutes: 2 })).toBe(true);
    expect(isCodeDump({ additions: 150, codedMinutes: 0 })).toBe(false);
    expect(isCodeDump({ additions: 300, codedMinutes: 120 })).toBe(false);
    expect(isCodeDump({ additions: 3000, codedMinutes: null })).toBe(false);
  });

  test("coded time reads ~0m, minutes or hours", () => {
    expect(codedLabel(1)).toEqual({ text: "~0m coded", none: true });
    expect(codedLabel(45)).toEqual({ text: "45m coded", none: false });
    expect(codedLabel(90)).toEqual({ text: "1.5h coded", none: false });
  });

  test("commits signed by an AI tool matter only when AI was not declared", () => {
    expect(undisclosedAiCommits(ship("sh-2046"))).toBe(1);
    expect(undisclosedAiCommits(ship("sh-2049"))).toBe(0);
    expect(undisclosedAiCommits(ship("sh-2041"))).toBe(0);
  });

  test("the pipeline follows the ship", () => {
    expect(pipelineSteps(ship("sh-2041")).map((step) => step.state)).toEqual(["done", "current", "upcoming", "upcoming"]);
    expect(pipelineSteps(ship("sh-2049")).map((step) => step.state)).toEqual(["done", "done", "current", "upcoming"]);
    expect(pipelineSteps(ship("sh-2051")).map((step) => step.state)).toEqual(["done", "done", "done", "done"]);
  });

  test("builder details are only on file for a first-pass reviewer, and the address shows only at the final stages", () => {
    const first = builderView({ isOwner: false, canSecondPass: false }, ship("sh-2041"));
    expect(first).toMatchObject({ privileged: false, name: "on file", country: "on file", address: null });
    expect(first.age).toBe(String(ship("sh-2041").builderAge));
    expect(builderView({ isOwner: true, canSecondPass: true }, ship("sh-2041")).address).toBeNull();
    expect(builderView({ isOwner: true, canSecondPass: true }, ship("sh-2049")).address).not.toBeNull();
  });
});

describe("sample data holds together", () => {
  test("ids are unique", () => {
    expect(new Set(REVIEW_SHIPS.map((item) => item.id)).size).toBe(REVIEW_SHIPS.length);
    expect(new Set(REVIEW_AUDITS.map((item) => item.id)).size).toBe(REVIEW_AUDITS.length);
    expect(new Set(REVIEW_LOG.map((item) => item.id)).size).toBe(REVIEW_LOG.length);
  });

  test("the sample has all four tracks, both kinds and every status", () => {
    const tracks = new Set(REVIEW_SHIPS.map((item) => item.track));
    for (const track of TRACKS) expect(tracks.has(track)).toBe(true);
    expect(new Set(REVIEW_SHIPS.map((item) => item.kind)).size).toBe(2);
    const statuses = new Set<ReviewStatus>(REVIEW_SHIPS.map((item) => item.status));
    for (const status of REVIEW_STATUSES) expect(statuses.has(status)).toBe(true);
  });

  test("every ship has exactly one track", () => {
    for (const item of REVIEW_SHIPS) expect(TRACKS).toContain(item.track);
  });

  test("software ships carry Hackatime and hardware ships carry Lapse, a bill of materials and design files", () => {
    for (const item of REVIEW_SHIPS) {
      if (item.kind === "software") expect(item.evidence.source).toBe("hackatime");
      else {
        expect(item.evidence.source).toBe("lapse");
        if (item.evidence.source === "lapse") {
          expect(item.evidence.bom.length).toBeGreaterThan(0);
          expect(item.evidence.designFiles.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test("no tracked minute is assigned twice: journals never exceed tracked time", () => {
    for (const item of REVIEW_SHIPS) expect(journaledMinutes(item)).toBeLessThanOrEqual(trackedMinutes(item));
  });

  test("a claimant exists only on a claimed ship and is a reviewer who can take it", () => {
    for (const item of REVIEW_SHIPS) {
      if (item.status !== "claimed") {
        expect(item.claimedBy).toBeNull();
        continue;
      }
      const reviewer = reviewerById(item.claimedBy ?? "");
      expect(reviewer).not.toBeNull();
      expect(canAccessKind(reviewer!, item.kind)).toBe(true);
    }
  });

  test("a verdict ship has a decision, and a final-stage ship has a first pass", () => {
    for (const item of REVIEW_SHIPS) {
      if (item.status === "approved" || item.status === "needs-changes") expect(item.decision).toBeDefined();
      else expect(item.decision).toBeUndefined();
      if (inFinalStage(item.status)) expect(item.firstPass).toBeDefined();
    }
  });

  test("a proposed ban was proposed by a reviewer who is not a final reviewer's owner, with no hours credited", () => {
    const proposed = ship("sh-2056");
    expect(proposed.firstPass?.verdict).toBe("banned");
    expect(proposed.firstPass?.minutes).toBeNull();
    expect(ship("sh-2057").ban).toBeDefined();
  });

  test("a final approval was given by a final reviewer who is not the first-pass reviewer", () => {
    for (const item of REVIEW_SHIPS) {
      if (item.status !== "approved" || !item.decision || !item.firstPass) continue;
      expect(reviewerById(item.decision.by)?.secondPass).toBe(true);
      expect(item.decision.by).not.toBe(item.firstPass.by);
    }
  });

  test("the first-pass credit matches the actions on the journals", () => {
    for (const item of REVIEW_SHIPS) {
      if (!inFinalStage(item.status) || item.firstPass?.minutes == null) continue;
      expect(approvedMinutes(item)).toBe(item.firstPass.minutes);
    }
  });

  test("every audit names a real ship and reviewer, and a verdict ship's audits include its decision", () => {
    for (const item of REVIEW_AUDITS) {
      expect(shipById(item.ship)).not.toBeNull();
      expect(reviewerById(item.reviewer)).not.toBeNull();
    }
    for (const item of REVIEW_SHIPS) {
      if (item.status !== "approved" || !item.decision) continue;
      expect(auditsForShip(item.id).some((audit) => audit.verdict === "approved" && audit.reviewer === item.decision?.by)).toBe(true);
    }
  });

  test("a locked ship is a waiting one with a past needs-changes by the same reviewer", () => {
    const reserved = ship("sh-2047");
    expect(reserved.status).toBe("waiting");
    expect(auditsForShip(reserved.id).some((audit) => audit.verdict === "needs_changes" && audit.reviewer === reserved.reserved?.reviewer)).toBe(true);
  });

  test("the validity checks follow Stage 1 of the plan, in its order", () => {
    expect(VALIDITY_CHECKS.map((check) => check.id)).toEqual(["exists", "works", "hours", "journals", "duplicates", "ai", "copied", "spam", "links", "evidence"]);
  });

  test("every ship has commits, and software commits carry tracked time", () => {
    for (const item of REVIEW_SHIPS) {
      expect(item.commits.length).toBeGreaterThan(0);
      if (item.kind === "software") expect(item.commits.every((commit) => commit.codedMinutes !== null)).toBe(true);
    }
  });
});

describe("hardware", () => {
  const lines = [
    { part: "A", qty: 2, source: "Shop One" },
    { part: "B", qty: 3, source: " shop one " },
    { part: "C", qty: 1, source: "Shop Two" },
  ];

  test("a bill of materials adds up lines, parts and distinct sources ignoring case and spacing", () => {
    expect(bomTotals(lines)).toEqual({ lines: 3, parts: 6, sources: 2 });
  });

  test("gaps are lines with no source or a quantity that is not a whole number from 1", () => {
    expect(bomGaps(lines)).toEqual([]);
    expect(bomGaps([{ part: "X", qty: 1, source: "" }, { part: "Y", qty: 0, source: "s" }, { part: "Z", qty: 1.5, source: "s" }])).toHaveLength(3);
  });

  test("hardware facts exist for a hardware ship and not for software", () => {
    expect(hardwareFacts(ship("sh-2041"))).toBeNull();
    const facts = hardwareFacts(ship("sh-2042"));
    expect(facts?.recordings).toBe(4);
    expect(facts?.bom.lines).toBe(4);
    expect(facts?.designFiles).toBe(3);
  });

  test("every claimed hardware ship is held by a reviewer with hardware access", () => {
    for (const item of REVIEW_SHIPS) {
      if (item.kind === "hardware" && item.claimedBy) expect(canAccessKind(reviewerById(item.claimedBy)!, "hardware")).toBe(true);
    }
  });
});
