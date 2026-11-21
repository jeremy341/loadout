import { describe, expect, test } from "bun:test";
import type { ReviewerAccess } from "../reviewer/access";
import {
  banExpiry,
  isBanActive,
  reporterVisibleToSubject,
  canMoveProposal,
  canMoveReport,
  checkReportInput,
  gateBlock,
  gateConfirmBan,
  gateDecideReport,
  gateDirectBan,
  gateOverturnBan,
  gateProposeBan,
  gateRecordViolation,
  gateWithdrawBan,
  isRepeatOffender,
  isRuleKind,
  numericIdFor,
  proposalPageStatus,
  proposalStoredStatus,
  reportPageStatus,
  reportStoredStatus,
  stillBanned,
  usesSampleRows,
  REPORT_DETAIL_MIN,
} from "./moderation-rules";

// A signed-in person with the given standing. Only the fields the gates read are set.
function actor(personId: string, flags: Partial<Pick<ReviewerAccess, "isOwner" | "isReviewer" | "canSecondPass">> = {}) {
  return { personId, isOwner: false, isReviewer: false, canSecondPass: false, ...flags };
}
const OWNER = actor("owner-1", { isOwner: true, isReviewer: true, canSecondPass: true });
const FINAL = actor("final-1", { isReviewer: true, canSecondPass: true });
const REVIEWER = actor("rev-1", { isReviewer: true });
const BUILDER = actor("builder-1");

describe("status transitions", () => {
  test("an open report can be actioned or dismissed, and a decided one cannot move", () => {
    expect(canMoveReport("open", "actioned")).toBe(true);
    expect(canMoveReport("open", "dismissed")).toBe(true);
    expect(canMoveReport("actioned", "open")).toBe(false);
    expect(canMoveReport("dismissed", "actioned")).toBe(false);
    expect(canMoveReport("open", "resolved")).toBe(false);
  });

  test("an open ban proposal can be confirmed or overturned, and a decided one cannot move", () => {
    expect(canMoveProposal("open", "confirmed")).toBe(true);
    expect(canMoveProposal("open", "overturned")).toBe(true);
    expect(canMoveProposal("confirmed", "overturned")).toBe(false);
    expect(canMoveProposal("overturned", "open")).toBe(false);
  });

  test("the Pixl words map both ways", () => {
    expect(reportPageStatus("actioned")).toBe("resolved");
    expect(reportPageStatus("dismissed")).toBe("dismissed");
    expect(reportPageStatus("open")).toBe("open");
    expect(reportStoredStatus("resolved")).toBe("actioned");
    expect(reportStoredStatus("bogus")).toBeNull();
    expect(proposalPageStatus("open")).toBe("pending");
    expect(proposalPageStatus("overturned")).toBe("rejected");
    expect(proposalPageStatus("confirmed")).toBe("confirmed");
    expect(proposalStoredStatus("pending")).toBe("open");
    expect(proposalStoredStatus("rejected")).toBe("overturned");
    expect(proposalStoredStatus("nonsense")).toBeNull();
  });
});

describe("repeat offenders and open bans", () => {
  test("three reports against one person flags them, two do not", () => {
    expect(isRepeatOffender(2)).toBe(false);
    expect(isRepeatOffender(3)).toBe(true);
    expect(isRepeatOffender(9)).toBe(true);
  });

  test("a person stays banned while any ban is open", () => {
    expect(stillBanned(0)).toBe(false);
    expect(stillBanned(1)).toBe(true);
  });
});

describe("who may confirm, overturn and propose", () => {
  test("only an owner confirms a ban, and a final reviewer is refused", () => {
    expect(gateConfirmBan(OWNER, { proposedById: "rev-1", subjectIds: [], subjectIsOwner: false }).ok).toBe(true);
    const finalReviewer = gateConfirmBan(FINAL, { proposedById: "rev-1", subjectIds: [], subjectIsOwner: false });
    expect(finalReviewer.ok).toBe(false);
  });

  test("the proposer cannot confirm, even as an owner", () => {
    const own = gateConfirmBan(OWNER, { proposedById: "owner-1", subjectIds: [], subjectIsOwner: false });
    expect(own.ok).toBe(false);
    if (!own.ok) expect(own.message).toContain("different owner");
  });

  test("an owner can never be confirmed into a ban, whoever proposed it", () => {
    const blocked = gateConfirmBan(OWNER, { proposedById: "rev-1", subjectIds: [], subjectIsOwner: true });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toBe("An owner can't be banned from the site.");
  });

  test("nobody decides on the person's own ban or a project they own", () => {
    const self = gateConfirmBan(OWNER, { proposedById: "rev-1", subjectIds: ["owner-1"], subjectIsOwner: false });
    expect(self.ok).toBe(false);
    expect(gateOverturnBan(FINAL, { proposedById: "rev-1", subjectIds: ["final-1"] }).ok).toBe(false);
  });

  test("overturning is open to a second-pass reviewer or an owner, never the proposer", () => {
    expect(gateOverturnBan(FINAL, { proposedById: "rev-1", subjectIds: [] }).ok).toBe(true);
    expect(gateOverturnBan(OWNER, { proposedById: "rev-1", subjectIds: [] }).ok).toBe(true);
    expect(gateOverturnBan(REVIEWER, { proposedById: "other", subjectIds: [] }).ok).toBe(false);
    expect(gateOverturnBan(FINAL, { proposedById: "final-1", subjectIds: [] }).ok).toBe(false);
  });

  test("only the proposer may withdraw a proposal", () => {
    expect(gateWithdrawBan(REVIEWER, "rev-1").ok).toBe(true);
    expect(gateWithdrawBan(OWNER, "rev-1").ok).toBe(false);
  });

  test("a reviewer or an owner may propose a ban, a builder may not, and nobody proposes on themselves", () => {
    expect(gateProposeBan(REVIEWER, "builder-1").ok).toBe(true);
    expect(gateProposeBan(OWNER, "builder-1").ok).toBe(true);
    expect(gateProposeBan(BUILDER, "builder-2").ok).toBe(false);
    expect(gateProposeBan(REVIEWER, "rev-1").ok).toBe(false);
    expect(gateProposeBan(null, "builder-1").ok).toBe(false);
  });

  test("a direct ban is an owner's act and an owner cannot be banned", () => {
    expect(gateDirectBan(OWNER, { id: "builder-1", isOwner: false }).ok).toBe(true);
    expect(gateDirectBan(FINAL, { id: "builder-1", isOwner: false }).ok).toBe(false);
    expect(gateDirectBan(OWNER, { id: "other-owner", isOwner: true }).ok).toBe(false);
    expect(gateDirectBan(OWNER, { id: "owner-1", isOwner: true }).ok).toBe(false);
  });

  test("deciding reports is owner only, recording violations is reviewer or owner", () => {
    expect(gateDecideReport(OWNER).ok).toBe(true);
    expect(gateDecideReport(FINAL).ok).toBe(false);
    expect(gateRecordViolation(REVIEWER).ok).toBe(true);
    expect(gateRecordViolation(BUILDER).ok).toBe(false);
  });

  test("a block is between two different people", () => {
    expect(gateBlock("a", "b").ok).toBe(true);
    expect(gateBlock("a", "a").ok).toBe(false);
    expect(gateBlock("", "b").ok).toBe(false);
  });
});

describe("report input", () => {
  const base = { reporterId: "builder-1", targetType: "project", targetId: "proj-1", reason: "Kindness", detail: "A long enough note here." };

  test("a valid report is trimmed and checked", () => {
    const result = checkReportInput({ ...base, detail: "   A long enough note here.   " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.detail).toBe("A long enough note here.");
  });

  test("the rule must be one of the owner's six", () => {
    expect(isRuleKind("Fair play")).toBe(true);
    expect(isRuleKind("Vibes")).toBe(false);
    expect(checkReportInput({ ...base, reason: "Vibes" }).ok).toBe(false);
  });

  test("the target type must be a project or a journal entry", () => {
    expect(checkReportInput({ ...base, targetType: "chat" }).ok).toBe(false);
    expect(checkReportInput({ ...base, targetType: "journal" }).ok).toBe(true);
  });

  test("a short note is refused, and so is a report with no reporter", () => {
    expect(checkReportInput({ ...base, detail: "short" }).ok).toBe(false);
    expect("short".length).toBeLessThan(REPORT_DETAIL_MIN);
    expect(checkReportInput({ ...base, reporterId: "" }).ok).toBe(false);
  });
});

describe("the development fallback", () => {
  test("sample rows show only in development, and only when the database is missing or the table is empty", () => {
    expect(usesSampleRows({ nodeEnv: "development", databaseConfigured: true, tableEmpty: true })).toBe(true);
    expect(usesSampleRows({ nodeEnv: "development", databaseConfigured: false, tableEmpty: false })).toBe(true);
    expect(usesSampleRows({ nodeEnv: "development", databaseConfigured: true, tableEmpty: false })).toBe(false);
  });

  test("production never shows sample rows, even when the table is empty", () => {
    expect(usesSampleRows({ nodeEnv: "production", databaseConfigured: true, tableEmpty: true })).toBe(false);
    expect(usesSampleRows({ nodeEnv: "production", databaseConfigured: false, tableEmpty: true })).toBe(false);
  });
});

describe("numeric ids", () => {
  test("the same id gives the same number in every call, different kinds differ", () => {
    expect(numericIdFor("ban", "cmabc123")).toBe(numericIdFor("ban", "cmabc123"));
    expect(numericIdFor("ban", "cmabc123")).not.toBe(numericIdFor("report", "cmabc123"));
  });

  test("the number is a positive safe integer", () => {
    const n = numericIdFor("proposal", "cmxyz");
    expect(Number.isSafeInteger(n)).toBe(true);
    expect(n).toBeGreaterThan(0);
  });
});

describe("ban length and expiry", () => {
  const now = new Date("2026-11-18T12:00:00.000Z");
  const DAY = 24 * 60 * 60 * 1000;

  test("a length in days ends that many days from now; no length or zero is open-ended", () => {
    expect(banExpiry(7, now)?.getTime()).toBe(now.getTime() + 7 * DAY);
    expect(banExpiry(1, now)?.getTime()).toBe(now.getTime() + DAY);
    expect(banExpiry(null, now)).toBeNull();
    expect(banExpiry(0, now)).toBeNull();
  });

  test("a ban is active only while not lifted and its end is still ahead (or there is none)", () => {
    const later = new Date(now.getTime() + DAY);
    expect(isBanActive({ liftedAt: null, expiresAt: null }, now)).toBe(true);
    expect(isBanActive({ liftedAt: null, expiresAt: later }, now)).toBe(true);
    expect(isBanActive({ liftedAt: null, expiresAt: now }, now)).toBe(false);
    expect(isBanActive({ liftedAt: null, expiresAt: new Date(now.getTime() - 1) }, now)).toBe(false);
    expect(isBanActive({ liftedAt: now, expiresAt: null }, now)).toBe(false);
  });

  test("the expiry can come as text (the sample rows keep ISO strings)", () => {
    expect(isBanActive({ liftedAt: null, expiresAt: new Date(now.getTime() + DAY).toISOString() }, now)).toBe(true);
    expect(isBanActive({ liftedAt: null, expiresAt: new Date(now.getTime() - DAY).toISOString() }, now)).toBe(false);
  });
});

describe("reporter visibility", () => {
  test("an anonymous report is never shown to the person reported", () => {
    expect(reporterVisibleToSubject({ anonymous: true })).toBe(false);
    expect(reporterVisibleToSubject({ anonymous: false })).toBe(true);
  });
});
