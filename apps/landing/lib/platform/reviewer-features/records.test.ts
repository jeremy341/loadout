import { describe, expect, test } from "bun:test";
import { checkAgeException, checkErasureRequest, ERASURE_SCOPE } from "./admin-rules";
import { checkBanProposal, canDecideBanProposal, decideBanProposal, type BanProposal } from "./proposed-bans";
import { countOutcomes, reviewerPayOre, verdictAnnouncement } from "./records";
import { guidelineGate, requiredReadMs, MAX_READ_MS, MIN_READ_MS } from "./guidelines";
import { draftKey, readDraft, shouldAutosave, DRAFT_SAVE_INTERVAL_MS } from "./drafts";

const proposal: BanProposal = {
  id: "p1",
  builderId: "b1",
  proposerId: "r1",
  reason: "Repeated copied work across three ships.",
  status: "pending",
  decidedBy: null,
  decidedAt: null,
};

describe("proposed bans", () => {
  test("a reviewer proposes with a reason, and not on themselves", () => {
    expect(checkBanProposal({ reason: "Repeated copied work across three ships.", proposerRole: "reviewer", proposerId: "r1", builderId: "b1" }).ok).toBe(true);
    expect(checkBanProposal({ reason: "Repeated copied work across three ships.", proposerRole: "reviewer", proposerId: "b1", builderId: "b1" }).ok).toBe(false);
    expect(checkBanProposal({ reason: "short", proposerRole: "reviewer", proposerId: "r1", builderId: "b1" }).ok).toBe(false);
  });

  test("only an owner decides, and never the proposer", () => {
    expect(canDecideBanProposal({ actorId: "r2", actorRole: "reviewer", proposal })).toMatchObject({ code: "not-owner" });
    expect(canDecideBanProposal({ actorId: "r1", actorRole: "owner", proposal })).toMatchObject({ code: "self-decision" });
    expect(canDecideBanProposal({ actorId: "o1", actorRole: "owner", proposal })).toEqual({ ok: true });
  });

  test("the builder is told privately only when a ban is approved", () => {
    const approved = decideBanProposal({ actorId: "o1", actorRole: "owner", proposal, decision: "approve", now: 1 });
    expect(approved).toMatchObject({ ok: true, builderNotice: true, proposal: { status: "approved", decidedBy: "o1" } });
    const declined = decideBanProposal({ actorId: "o1", actorRole: "owner", proposal, decision: "decline", now: 1 });
    expect(declined).toMatchObject({ ok: true, builderNotice: false, proposal: { status: "declined" } });
  });

  test("a decided proposal cannot be decided again", () => {
    const decided = { ...proposal, status: "approved" as const };
    expect(canDecideBanProposal({ actorId: "o1", actorRole: "owner", proposal: decided })).toMatchObject({ code: "not-pending" });
  });
});

describe("records", () => {
  test("only the four outcomes are announced or counted; bans stay private", () => {
    expect(verdictAnnouncement({ outcome: "banned", projectName: "X", projectPath: "/projects/x" })).toEqual({ channel: "none" });
    expect(verdictAnnouncement({ outcome: "approved", projectName: "Tiny   Tool", projectPath: "/projects/tiny-tool" })).toEqual({
      channel: "community",
      text: "Tiny Tool was approved. /projects/tiny-tool",
    });
    expect(verdictAnnouncement({ outcome: "housekeeping", projectName: "X", projectPath: "/projects/x" })).toEqual({ channel: "none" });
  });

  test("an announcement never links outside a project path", () => {
    expect(verdictAnnouncement({ outcome: "approved", projectName: "X", projectPath: "https://evil.example" })).toEqual({ channel: "none" });
  });

  test("stats count outcomes per reviewer and day and skip housekeeping", () => {
    const t = Date.UTC(2026, 10, 20, 12);
    const { totals, byReviewerDay } = countOutcomes(
      [
        { reviewerId: "r1", outcome: "approved", at: t },
        { reviewerId: "r1", outcome: "needs-changes", at: t },
        { reviewerId: "r1", outcome: "housekeeping", at: t },
        { reviewerId: "r2", outcome: "banned", at: t + 1000 },
      ],
      { fromMs: t - 1, toMs: t + 10_000 },
    );
    expect(totals).toEqual({ approved: 1, "needs-changes": 1, rejected: 0, banned: 1 });
    expect(byReviewerDay.r1["2026-11-20"]).toEqual({ approved: 1, "needs-changes": 1, rejected: 0, banned: 0 });
  });

  test("pay is 2 Ore for approval or ban, 1 for changes, and unsettled for rejection", () => {
    expect(reviewerPayOre("approved")).toBe(2);
    expect(reviewerPayOre("banned")).toBe(2);
    expect(reviewerPayOre("needs-changes")).toBe(1);
    expect(reviewerPayOre("rejected")).toBeNull();
  });
});

describe("guidelines gate", () => {
  test("read time scales with length and is clamped", () => {
    expect(requiredReadMs(0)).toBe(MIN_READ_MS);
    expect(requiredReadMs(200)).toBe(60_000);
    expect(requiredReadMs(1_000_000)).toBe(MAX_READ_MS);
  });

  test("confirm waits for the time and a new version forces a re-read", () => {
    expect(guidelineGate({ acceptedVersion: 2, currentVersion: 2, dwellMs: 60_000, wordCount: 200 })).toMatchObject({ canConfirm: true, needsReread: false });
    expect(guidelineGate({ acceptedVersion: 2, currentVersion: 3, dwellMs: 60_000, wordCount: 200 })).toMatchObject({ canConfirm: true, needsReread: true });
    expect(guidelineGate({ acceptedVersion: null, currentVersion: 1, dwellMs: 10_000, wordCount: 200 })).toMatchObject({ canConfirm: false, remainingMs: 50_000 });
  });
});

describe("owner-only rules", () => {
  test("erasure needs an owner and the exact confirmation", () => {
    expect(checkErasureRequest({ actorRole: "reviewer", builderId: "b1", confirmText: "ERASE b1" }).ok).toBe(false);
    expect(checkErasureRequest({ actorRole: "owner", builderId: "b1", confirmText: "erase b1" }).ok).toBe(false);
    const ok = checkErasureRequest({ actorRole: "owner", builderId: "b1", confirmText: "ERASE b1" });
    expect(ok).toEqual({ ok: true, scope: ERASURE_SCOPE });
  });

  test("age exceptions need an owner and a justification", () => {
    expect(checkAgeException({ actorRole: "reviewer", builderId: "b1", justification: "x".repeat(30) }).ok).toBe(false);
    expect(checkAgeException({ actorRole: "owner", builderId: "b1", justification: "short" }).ok).toBe(false);
    expect(checkAgeException({ actorRole: "owner", builderId: "b1", justification: "Verified by a guardian in the programme's own records." }).ok).toBe(true);
  });
});

describe("draft autosave", () => {
  test("saves a changed draft no more often than the interval", () => {
    expect(shouldAutosave({ text: "a", savedText: "", lastSavedAt: null, now: 0 })).toBe(true);
    expect(shouldAutosave({ text: "ab", savedText: "a", lastSavedAt: 0, now: DRAFT_SAVE_INTERVAL_MS - 1 })).toBe(false);
    expect(shouldAutosave({ text: "ab", savedText: "a", lastSavedAt: 0, now: DRAFT_SAVE_INTERVAL_MS })).toBe(true);
    expect(shouldAutosave({ text: "a", savedText: "a", lastSavedAt: 0, now: 99999 })).toBe(false);
  });

  test("a draft restores only for the same ship version and when not stale", () => {
    const raw = JSON.stringify({ text: "Looks fine.", savedAt: 1000, shipVersion: 2 });
    expect(readDraft(raw, { shipVersion: 2, now: 2000 })).toEqual({ text: "Looks fine.", savedAt: 1000 });
    expect(readDraft(raw, { shipVersion: 3, now: 2000 })).toBeNull();
    expect(readDraft("not json", { shipVersion: 2, now: 2000 })).toBeNull();
    expect(readDraft(raw, { shipVersion: 2, now: 1000 + 8 * 24 * 60 * 60 * 1000 })).toBeNull();
  });

  test("draft keys are scoped to the reviewer and ship", () => {
    expect(draftKey("r1", "s1")).not.toBe(draftKey("r2", "s1"));
  });
});
