import { describe, expect, test } from "bun:test";
import { REVIEWERS } from "@/lib/platform/review";
import {
  BAN_PROPOSALS,
  BANS,
  banCounts,
  banEndHoursAgo,
  banEndText,
  banStartText,
  bansHref,
  banState,
  canDecide,
  filterBans,
  banLog,
  bansFor,
  moderationLogFor,
  removedProjects,
  reporterNote,
  reportsFiledBy,
  revealsReporter,
  BAN_LENGTH_OPTIONS,
  BAN_TABS,
  VIOLATIONS_PAGE_SIZE,
  filterReports,
  filterViolations,
  isRepeatTarget,
  lengthLabel,
  parseBansQuery,
  parseReportsQuery,
  parseViolationsQuery,
  pendingProposals,
  playerHref,
  relatedReports,
  REMOVED,
  REPORTS,
  reportById,
  reportCounts,
  reportsHref,
  RULES,
  ruleLabel,
  sampleDate,
  since,
  sortReports,
  VIOLATIONS,
  violationCount,
  violationRuleCounts,
  violationsFor,
  violationsHref,
  type Ban,
} from "./moderation";

const ban = (over: Partial<Ban>): Ban => ({ id: "b", handle: "x", reason: "r", hoursAgo: 100, days: 7, proposedBy: "a", approvedBy: "b", ...over });
const staff = new Set(REVIEWERS.map((reviewer) => reviewer.handle));

describe("sample dates", () => {
  test("now is 6 Nov 2026 and earlier moments count back from it", () => {
    expect(sampleDate(0)).toBe("6 Nov 2026");
    expect(sampleDate(24)).toBe("5 Nov 2026");
    expect(sampleDate(24 * 7)).toBe("30 Oct 2026");
    expect(sampleDate(24 * 30)).toBe("7 Oct 2026");
  });

  test("a negative number is a date still to come", () => {
    expect(sampleDate(-24 * 5)).toBe("11 Nov 2026");
  });

  test("ages read as hours under two days and days after", () => {
    expect(since(0.5)).toBe("under 1h");
    expect(since(47)).toBe("47h");
    expect(since(48)).toBe("2d");
    expect(since(250)).toBe("10d");
  });
});

describe("reports", () => {
  test("an empty address is the open reports, page 1; anything unknown falls back to that", () => {
    expect(parseReportsQuery({})).toEqual({ status: "open", page: 1 });
    expect(parseReportsQuery({ status: "banana", page: "-3" })).toEqual({ status: "open", page: 1 });
    expect(parseReportsQuery({ status: "RESOLVED", page: "2" })).toEqual({ status: "resolved", page: 2 });
    expect(parseReportsQuery({ status: ["dismissed", "all"] })).toEqual({ status: "dismissed", page: 1 });
  });

  test("the default view has no query and an address round-trips", () => {
    expect(reportsHref({ status: "open", page: 1 })).toBe("/reports");
    expect(reportsHref({ status: "all", page: 2 })).toBe("/reports?status=all&page=2");
    const query = { status: "dismissed", page: 2 } as const;
    expect(parseReportsQuery(Object.fromEntries(new URL(reportsHref(query), "https://x.test").searchParams))).toEqual(query);
  });

  test("open reports come first, oldest first; closed ones follow, newest first", () => {
    const rows = sortReports(REPORTS);
    const open = rows.filter((row) => row.status === "open");
    expect(rows.slice(0, open.length)).toEqual(open);
    expect(open.map((row) => row.hoursAgo)).toEqual([...open.map((row) => row.hoursAgo)].sort((a, b) => b - a));
    const closed = rows.slice(open.length);
    expect(closed.every((row) => row.status !== "open")).toBe(true);
    expect(closed.map((row) => row.hoursAgo)).toEqual([...closed.map((row) => row.hoursAgo)].sort((a, b) => a - b));
  });

  test("the filter keeps one status and All keeps everything", () => {
    expect(filterReports(REPORTS, "open").every((row) => row.status === "open")).toBe(true);
    expect(filterReports(REPORTS, "all")).toHaveLength(REPORTS.length);
  });

  test("the counts add up", () => {
    const counts = reportCounts();
    expect(counts.open + counts.resolved + counts.dismissed).toBe(counts.all);
    expect(counts.all).toBe(REPORTS.length);
  });

  test("a person who is the subject of three reports is flagged", () => {
    expect(isRepeatTarget("wick")).toBe(true);
    expect(isRepeatTarget("cairn")).toBe(false);
  });

  test("related reports are the others about the same person, newest first, without the report itself", () => {
    const report = reportById("rp-307")!;
    const related = relatedReports(report);
    expect(related.map((row) => row.id)).toEqual(["rp-311", "rp-304", "rp-302"]);
    expect(related.some((row) => row.id === report.id)).toBe(false);
  });

  test("an unknown report id is null", () => {
    expect(reportById("rp-0")).toBeNull();
  });

  test("a handled report has a handler, an open one does not", () => {
    for (const row of REPORTS) {
      expect(row.handled !== undefined).toBe(row.status !== "open");
      if (row.handled) expect(row.handled.hoursAgo).toBeLessThanOrEqual(row.hoursAgo);
    }
  });

  test("a dismissed report ends with no further action", () => {
    for (const row of REPORTS.filter((item) => item.status === "dismissed")) expect(row.handled?.outcome).toBe("no-action");
  });
});

describe("violations", () => {
  test("the address reads the rule, the search and the page", () => {
    expect(parseViolationsQuery({})).toEqual({ rule: null, q: "", page: 1 });
    expect(parseViolationsQuery({ rule: "KIND", q: "  wick ", page: "2" })).toEqual({ rule: "kind", q: "wick", page: 2 });
    expect(parseViolationsQuery({ rule: "chat", page: "x" })).toEqual({ rule: null, q: "", page: 1 });
  });

  test("a long search is cut", () => {
    expect(parseViolationsQuery({ q: "a".repeat(200) }).q).toHaveLength(40);
  });

  test("the default view has no query and an address round-trips", () => {
    expect(violationsHref({ rule: null, q: "", page: 1 })).toBe("/violations");
    const query = { rule: "private", q: "nib", page: 2 } as const;
    expect(violationsHref(query)).toBe("/violations?rule=private&q=nib&page=2");
    expect(parseViolationsQuery(Object.fromEntries(new URL(violationsHref(query), "https://x.test").searchParams))).toEqual(query);
  });

  test("filtering by rule and by handle, newest first", () => {
    const kind = filterViolations(VIOLATIONS, { rule: "kind", q: "" });
    expect(kind.every((row) => row.rule === "kind")).toBe(true);
    expect(kind.map((row) => row.hoursAgo)).toEqual([...kind.map((row) => row.hoursAgo)].sort((a, b) => a - b));
    expect(filterViolations(VIOLATIONS, { rule: null, q: "@WICK" }).every((row) => row.handle === "wick")).toBe(true);
    expect(filterViolations(VIOLATIONS, { rule: "spam", q: "nib" })).toEqual([]);
  });

  test("the search also finds words in the note", () => {
    expect(filterViolations(VIOLATIONS, { rule: null, q: "README" }).map((row) => row.handle)).toEqual(["halyard"]);
  });

  test("a player's violations are newest first and counted", () => {
    expect(violationsFor("wick").map((row) => row.id)).toEqual(["v-115", "v-113", "v-110"]);
    expect(violationCount("wick")).toBe(3);
    expect(violationCount("nobody")).toBe(0);
  });

  test("the rule counts cover every violation", () => {
    const counts = violationRuleCounts();
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(VIOLATIONS.length);
    expect(Object.keys(counts).sort()).toEqual(RULES.map((rule) => rule.id).sort());
  });

  test("a linked report exists and is about the same person", () => {
    for (const row of VIOLATIONS.filter((item) => item.reportId)) {
      const report = reportById(row.reportId!);
      expect(report).not.toBeNull();
      expect(report!.target.owner).toBe(row.handle);
    }
  });

  test("rule labels read plainly", () => {
    expect(ruleLabel("kind")).toBe("Be kind to other builders");
    expect(ruleLabel("other")).toBe("Something else");
  });
});

describe("proposed bans", () => {
  test("the one who proposed a ban cannot decide it, whatever the case", () => {
    const proposal = { proposedBy: "tamsin" };
    expect(canDecide(proposal, "tamsin")).toBe(false);
    expect(canDecide(proposal, " Tamsin ")).toBe(false);
    expect(canDecide(proposal, "bellwether")).toBe(true);
  });

  test("the longest waiting is first", () => {
    const rows = pendingProposals();
    expect(rows.map((row) => row.hoursAgo)).toEqual([...rows.map((row) => row.hoursAgo)].sort((a, b) => b - a));
  });

  test("a proposal names real evidence about the same person", () => {
    for (const proposal of BAN_PROPOSALS) {
      expect(proposal.violationIds.length).toBeGreaterThan(0);
      for (const id of proposal.violationIds) {
        const violation = VIOLATIONS.find((row) => row.id === id);
        expect(violation?.handle).toBe(proposal.handle);
      }
      for (const id of proposal.reportIds) expect(reportById(id)?.target.owner).toBe(proposal.handle);
    }
  });

  test("lengths read as days or no end date", () => {
    expect(lengthLabel(null)).toBe("No end date");
    expect(lengthLabel(1)).toBe("1 day");
    expect(lengthLabel(14)).toBe("14 days");
  });
});

describe("bans", () => {
  test("a ban is active until its days are over; one without days stays active", () => {
    expect(banState(ban({ hoursAgo: 100, days: 7 }))).toBe("active");
    expect(banState(ban({ hoursAgo: 24 * 7, days: 7 }))).toBe("expired");
    expect(banState(ban({ hoursAgo: 5000, days: null }))).toBe("active");
  });

  test("a lifted ban is lifted even when its time has run out too", () => {
    expect(banState(ban({ hoursAgo: 5000, days: 7, lifted: { by: "x", hoursAgo: 10, note: "n" } }))).toBe("lifted");
  });

  test("the end date follows from the start and the days", () => {
    expect(banEndHoursAgo(ban({ hoursAgo: 216, days: 14 }))).toBe(-120);
    expect(banEndHoursAgo(ban({ days: null }))).toBeNull();
    expect(banEndText(ban({ hoursAgo: 216, days: 14 }))).toBe("Ends 11 Nov 2026");
    expect(banEndText(ban({ hoursAgo: 504, days: 7 }))).toBe("Ended 23 Oct 2026");
    expect(banEndText(ban({ days: null }))).toBe("No end date set");
    expect(banEndText(ban({ hoursAgo: 720, days: 30, lifted: { by: "x", hoursAgo: 480, note: "n" } }))).toBe("Lifted 17 Oct 2026");
  });

  test("the start line names the date and the length", () => {
    expect(banStartText(ban({ hoursAgo: 216, days: 14 }))).toBe("Banned 28 Oct 2026 for 14 days");
    expect(banStartText(ban({ hoursAgo: 288, days: null }))).toBe("Banned 25 Oct 2026");
  });

  test("the address reads the tab, the status and the page", () => {
    expect(parseBansQuery({})).toEqual({ tab: "bans", status: "all", page: 1 });
    expect(parseBansQuery({ status: "LIFTED", page: "3" })).toEqual({ tab: "bans", status: "lifted", page: 3 });
    expect(parseBansQuery({ tab: "Proposed", status: "gone" })).toEqual({ tab: "proposed", status: "all", page: 1 });
    expect(bansHref({ tab: "bans", status: "all", page: 1 })).toBe("/bans");
    expect(bansHref({ tab: "bans", status: "active", page: 2 })).toBe("/bans?status=active&page=2");
    expect(bansHref({ tab: "log", status: "active", page: 2 })).toBe("/bans?tab=log&page=2");
    expect(bansHref({ tab: "proposed", status: "all", page: 1 })).toBe("/bans?tab=proposed");
    expect(BAN_TABS).toEqual(["bans", "proposed", "log"]);
  });

  test("the ban log has an entry for each ban and each lift, newest first", () => {
    const log = banLog();
    expect(log).toHaveLength(BANS.length + BANS.filter((item) => item.lifted).length);
    for (let i = 1; i < log.length; i += 1) expect(log[i].hoursAgo).toBeGreaterThanOrEqual(log[i - 1].hoursAgo);
    const lift = log.find((entry) => entry.action === "lift");
    expect(lift?.handle).toBe("quill");
    expect(bansFor("quill")).toHaveLength(1);
  });

  test("the ban forms offer a no end date length", () => {
    expect(BAN_LENGTH_OPTIONS.map((item) => item.value)).toContain("0");
  });

  test("the filter keeps one state, newest first, and All keeps every ban", () => {
    const active = filterBans(BANS, "active");
    expect(active.every((row) => banState(row) === "active")).toBe(true);
    expect(active.map((row) => row.hoursAgo)).toEqual([...active.map((row) => row.hoursAgo)].sort((a, b) => a - b));
    expect(filterBans(BANS, "all")).toHaveLength(BANS.length);
  });

  test("the counts add up and the sample shows every state", () => {
    const counts = banCounts();
    expect(counts.active + counts.lifted + counts.expired).toBe(counts.all);
    expect(counts.active).toBeGreaterThan(0);
    expect(counts.lifted).toBeGreaterThan(0);
    expect(counts.expired).toBeGreaterThan(0);
  });

  test("two different staff members decided each ban, and a lift comes after the ban", () => {
    for (const row of BANS) {
      expect(row.proposedBy).not.toBe(row.approvedBy);
      if (row.lifted) expect(row.lifted.hoursAgo).toBeLessThan(row.hoursAgo);
    }
  });
});

describe("removed projects and the moderation log", () => {
  test("removed projects are the project rows of the record, newest first", () => {
    const rows = removedProjects();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.kind === "project")).toBe(true);
    expect(rows.map((row) => row.hoursAgo)).toEqual([...rows.map((row) => row.hoursAgo)].sort((a, b) => a - b));
  });

  test("a linked report exists and matches the removed item", () => {
    for (const row of REMOVED.filter((item) => item.reportId)) {
      const report = reportById(row.reportId!);
      expect(report?.target.title).toBe(row.title);
      expect(report?.target.owner).toBe(row.owner);
    }
  });

  test("a player's log holds each recorded violation and each lift, newest first", () => {
    const log = moderationLogFor("quill");
    expect(log.map((entry) => entry.kind)).toEqual(["lift", "ban"]);
    expect(moderationLogFor("kestrel42")).toEqual([]);
    const wick = moderationLogFor("wick");
    expect(wick).toHaveLength(violationCount("wick"));
  });
});

describe("anonymous reporters", () => {
  test("a reporter who asked to stay anonymous is hidden until they have filed three reports", () => {
    const hidden = REPORTS.find((report) => report.anonymous && reportsFiledBy(report.reporter) < 3)!;
    expect(revealsReporter(hidden)).toBe(false);
    expect(reporterNote(hidden)).toBe("Name hidden by the reporter.");
    const serial = REPORTS.find((report) => report.anonymous && reportsFiledBy(report.reporter) >= 3)!;
    expect(revealsReporter(serial)).toBe(true);
    expect(reporterNote(serial)).toContain("shown because they have filed");
    const open = REPORTS.find((report) => !report.anonymous && reportsFiledBy(report.reporter) < 3)!;
    expect(revealsReporter(open)).toBe(true);
    expect(reporterNote(open)).toBeNull();
  });

  test("violations page by twenty", () => {
    expect(VIOLATIONS_PAGE_SIZE).toBe(20);
  });
});

describe("the sample", () => {
  test("every staff handle is one of the reviewer sample's", () => {
    for (const row of REPORTS) if (row.handled) expect(staff.has(row.handled.by)).toBe(true);
    for (const row of VIOLATIONS) expect(staff.has(row.by)).toBe(true);
    for (const row of BAN_PROPOSALS) expect(staff.has(row.proposedBy)).toBe(true);
    for (const row of BANS) {
      expect(staff.has(row.proposedBy)).toBe(true);
      expect(staff.has(row.approvedBy)).toBe(true);
    }
    for (const row of REMOVED) expect(staff.has(row.by)).toBe(true);
  });

  test("ids are unique inside each list", () => {
    for (const list of [REPORTS, VIOLATIONS, BAN_PROPOSALS, BANS, REMOVED]) expect(new Set(list.map((row) => row.id)).size).toBe(list.length);
  });

  test("a player page is the handle under /players", () => {
    expect(playerHref("wick")).toBe("/players/wick");
  });
});
