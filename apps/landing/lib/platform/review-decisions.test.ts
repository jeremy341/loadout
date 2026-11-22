import { describe, expect, it } from "bun:test";
import {
  authorizeShip,
  kindOfTrack,
  mayClaim,
  mayCorrect,
  mayDecideJournal,
  mayGiveVerdict,
  mayHold,
  mayRelease,
  mayUnship,
  mayAddNote,
  NOTE_STATUSES,
  reasonCodeOf,
  secondPassVerdictAllowed,
  stageOf,
  type ReviewActor,
  type ShipFacts,
} from "./review-decisions";

const NOW = new Date("2026-11-18T12:00:00Z");
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60_000);
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3_600_000);

const reviewer: ReviewActor = { id: "rev", isOwner: false, isReviewer: true, canSecondPass: false, reviewQueues: "both" };
const finalReviewer: ReviewActor = { ...reviewer, id: "fin", canSecondPass: true };
const owner: ReviewActor = { ...reviewer, id: "own", isOwner: true, canSecondPass: true };

const ship = (over: Partial<ShipFacts> = {}): ShipFacts => ({
  ownerId: "builder",
  kind: "software",
  status: "in-review",
  heldAt: null,
  heldBy: null,
  claimedBy: "rev",
  claimedAt: minutesAgo(2),
  claimHeartbeatAt: minutesAgo(1),
  triage: null,
  assignedTo: null,
  reshippedAt: null,
  proposedBanBy: null,
  collaboratorIds: [],
  pendingInviteIds: [],
  ...over,
});

describe("kindOfTrack and stageOf", () => {
  it("sends the Hardware track to the hardware queue", () => {
    expect(kindOfTrack("Hardware")).toBe("hardware");
    expect(kindOfTrack("Tools")).toBe("software");
    expect(kindOfTrack(null)).toBe("software");
  });
  it("reads the stage from the status, and a ban proposal from the second pass", () => {
    expect(stageOf({ status: "submitted", proposedBanBy: null })).toBe("queue");
    expect(stageOf({ status: "in-review", proposedBanBy: null })).toBe("first-pass");
    expect(stageOf({ status: "second-pass", proposedBanBy: null })).toBe("second-pass");
    expect(stageOf({ status: "second-pass", proposedBanBy: "rev" })).toBe("proposed-ban");
    for (const status of ["approved", "banned", "needs-changes", "draft"]) expect(stageOf({ status, proposedBanBy: null })).toBe("closed");
  });
});

describe("authorizeShip (Pixl authorizeProjectAction)", () => {
  it("needs a reviewer; an owner set to not review is not one", () => {
    expect(authorizeShip({ ...owner, isReviewer: false }, ship()).ok).toBe(false);
    expect(authorizeShip(reviewer, ship()).ok).toBe(true);
  });
  it("keeps a one-queue reviewer inside their queue", () => {
    expect(authorizeShip({ ...reviewer, reviewQueues: "hardware" }, ship({ kind: "software" })).ok).toBe(false);
    expect(authorizeShip({ ...reviewer, reviewQueues: "hardware" }, ship({ kind: "hardware" })).ok).toBe(true);
  });
  it("blocks the owner, every collaborator and every pending invite, owners of the site included", () => {
    expect(authorizeShip({ ...reviewer, id: "builder" }, ship()).ok).toBe(false);
    expect(authorizeShip({ ...owner, id: "builder" }, ship()).ok).toBe(false);
    expect(authorizeShip(reviewer, ship({ collaboratorIds: ["rev"] })).ok).toBe(false);
    expect(authorizeShip(reviewer, ship({ pendingInviteIds: ["rev"] })).ok).toBe(false);
  });
  it("lets the ship's own owner through only with allowOwn (the hold), never a collaborator", () => {
    expect(authorizeShip({ ...reviewer, id: "builder" }, ship(), { allowOwn: true }).ok).toBe(true);
    expect(authorizeShip(reviewer, ship({ collaboratorIds: ["rev"] }), { allowOwn: true }).ok).toBe(false);
    expect(authorizeShip(reviewer, ship({ pendingInviteIds: ["rev"] }), { allowOwn: true }).ok).toBe(false);
  });
});

describe("mayClaim", () => {
  it("claims a queue ship and a first-pass ship nobody holds", () => {
    const queued = mayClaim(reviewer, ship({ status: "submitted", claimedBy: null, claimedAt: null, claimHeartbeatAt: null }), NOW);
    expect(queued).toEqual({ ok: true, value: { stage: "queue" } });
    expect(mayClaim(reviewer, ship({ claimedBy: null, claimedAt: null, claimHeartbeatAt: null }), NOW).ok).toBe(true);
  });
  it("refuses while another reviewer's claim is alive, and takes over a lapsed one", () => {
    expect(mayClaim(reviewer, ship({ claimedBy: "other", claimedAt: minutesAgo(10), claimHeartbeatAt: minutesAgo(10) }), NOW).ok).toBe(false);
    expect(mayClaim(reviewer, ship({ claimedBy: "other", claimedAt: minutesAgo(40), claimHeartbeatAt: minutesAgo(30) }), NOW).ok).toBe(true);
  });
  it("refuses a held, banned or approved ship", () => {
    expect(mayClaim(reviewer, ship({ heldAt: NOW, heldBy: "x" }), NOW).ok).toBe(false);
    expect(mayClaim(reviewer, ship({ status: "approved" }), NOW).ok).toBe(false);
    expect(mayClaim(reviewer, ship({ status: "banned" }), NOW).ok).toBe(false);
  });
  it("reserves a re-shipped ship for the reviewer who asked for changes, for 72 hours, owners excepted", () => {
    const reserved = ship({ status: "submitted", assignedTo: "someone", reshippedAt: hoursAgo(10), claimedBy: null, claimedAt: null, claimHeartbeatAt: null });
    expect(mayClaim(reviewer, reserved, NOW).ok).toBe(false);
    expect(mayClaim({ ...reviewer, id: "someone" }, reserved, NOW).ok).toBe(true);
    expect(mayClaim(owner, reserved, NOW).ok).toBe(true);
    expect(mayClaim(reviewer, { ...reserved, reshippedAt: hoursAgo(72) }, NOW).ok).toBe(true);
    expect(mayClaim(reviewer, { ...reserved, reshippedAt: hoursAgo(71.9) }, NOW).ok).toBe(false);
  });
  it("gives the second pass to an owner or a final reviewer only", () => {
    const second = ship({ status: "second-pass", claimedBy: null, claimedAt: null, claimHeartbeatAt: null });
    expect(mayClaim(reviewer, second, NOW).ok).toBe(false);
    expect(mayClaim(finalReviewer, second, NOW).ok).toBe(true);
    expect(mayClaim(owner, second, NOW).ok).toBe(true);
  });
});

describe("secondPassVerdictAllowed (no triage gate)", () => {
  it("never blocks a verdict on a triage value", () => {
    for (const triage of [null, "not-fraud", "fraud"]) {
      for (const kind of ["approve", "needs_changes", "banned"] as const) {
        expect(secondPassVerdictAllowed(triage, kind).ok).toBe(true);
      }
    }
  });
});

describe("mayAddNote", () => {
  it("allows a note on a ship that has been submitted, up to approved", () => {
    for (const status of NOTE_STATUSES) expect(mayAddNote(reviewer, ship({ status })).ok).toBe(true);
  });
  it("refuses a draft, a banned project and an unknown status, so no audit-only note lands on them", () => {
    for (const status of ["draft", "banned", "logging", ""]) expect(mayAddNote(reviewer, ship({ status })).ok).toBe(false);
  });
  it("still needs a reviewer who is not the ship owner", () => {
    expect(mayAddNote({ ...reviewer, id: "builder" }, ship()).ok).toBe(false);
    expect(mayAddNote({ ...reviewer, isReviewer: false }, ship()).ok).toBe(false);
  });
});

describe("mayGiveVerdict, first pass", () => {
  it("needs the reviewer's own live claim", () => {
    expect(mayGiveVerdict(reviewer, ship(), "approve", NOW).ok).toBe(true);
    expect(mayGiveVerdict(reviewer, ship({ claimedBy: "other" }), "approve", NOW).ok).toBe(false);
    expect(mayGiveVerdict(reviewer, ship({ claimedAt: minutesAgo(31), claimHeartbeatAt: minutesAgo(31) }), "approve", NOW).ok).toBe(false);
    expect(mayGiveVerdict(reviewer, ship({ status: "submitted" }), "approve", NOW).ok).toBe(false);
  });
  it("turns a first-pass ban into a proposal and never a final decision", () => {
    expect(mayGiveVerdict(reviewer, ship(), "banned", NOW)).toEqual({ ok: true, value: { stage: "first-pass", final: false, proposal: true, reroute: false } });
    expect(mayGiveVerdict(reviewer, ship(), "approve", NOW)).toEqual({ ok: true, value: { stage: "first-pass", final: false, proposal: false, reroute: false } });
  });
  it("blocks every verdict while the ship is held, and on a ship you own", () => {
    for (const kind of ["approve", "needs_changes", "banned"] as const) expect(mayGiveVerdict(reviewer, ship({ heldAt: NOW, heldBy: "x" }), kind, NOW).ok).toBe(false);
    expect(mayGiveVerdict({ ...reviewer, id: "builder" }, ship({ claimedBy: "builder" }), "approve", NOW).ok).toBe(false);
  });
  it("respects the assignment window", () => {
    const reserved = ship({ assignedTo: "someone", reshippedAt: hoursAgo(5) });
    expect(mayGiveVerdict(reviewer, reserved, "approve", NOW).ok).toBe(false);
    expect(mayGiveVerdict(owner, { ...reserved, claimedBy: "own" }, "approve", NOW).ok).toBe(true);
  });
});

describe("mayGiveVerdict, second pass and proposed ban", () => {
  const second = (over: Partial<ShipFacts> = {}) => ship({ status: "second-pass", claimedBy: "fin", triage: "not-fraud", ...over });
  it("lets a final reviewer approve or ask for changes after a Not fraud triage, but not ban", () => {
    expect(mayGiveVerdict(finalReviewer, second(), "approve", NOW)).toEqual({ ok: true, value: { stage: "second-pass", final: true, proposal: false, reroute: false } });
    expect(mayGiveVerdict(finalReviewer, second(), "needs_changes", NOW).ok).toBe(true);
    expect(mayGiveVerdict(finalReviewer, second(), "banned", NOW)).toMatchObject({ ok: false, message: "Only an owner can confirm a ban." });
  });
  it("lets an owner confirm a ban", () => {
    expect(mayGiveVerdict(owner, second({ claimedBy: "own" }), "banned", NOW).ok).toBe(true);
  });
  it("refuses a plain reviewer in the second pass, but no longer blocks on a triage", () => {
    expect(mayGiveVerdict(reviewer, second({ claimedBy: "rev" }), "approve", NOW).ok).toBe(false);
    expect(mayGiveVerdict(finalReviewer, second({ triage: null }), "approve", NOW).ok).toBe(true);
    expect(mayGiveVerdict(finalReviewer, second({ triage: "fraud" }), "approve", NOW).ok).toBe(true);
  });
  const proposed = (over: Partial<ShipFacts> = {}) => second({ proposedBanBy: "rev", triage: null, ...over });
  it("keeps the proposer from confirming their own ban proposal, owners excepted (Pixl proposedBanDecision)", () => {
    expect(mayGiveVerdict({ ...finalReviewer, id: "rev" }, proposed({ claimedBy: "rev" }), "needs_changes", NOW).ok).toBe(false);
    expect(mayGiveVerdict(owner, proposed({ proposedBanBy: "own", claimedBy: "own" }), "banned", NOW).ok).toBe(true);
  });
  it("makes a ban proposal an owner's call; a final reviewer who disagrees sends it back into the pipeline", () => {
    expect(mayGiveVerdict(finalReviewer, proposed(), "banned", NOW)).toMatchObject({ ok: false, message: "Only an owner can confirm a ban." });
    expect(mayGiveVerdict(finalReviewer, proposed(), "approve", NOW)).toEqual({ ok: true, value: { stage: "proposed-ban", final: false, proposal: false, reroute: true } });
    expect(mayGiveVerdict(owner, proposed({ claimedBy: "own" }), "banned", NOW).ok).toBe(true);
    expect(mayGiveVerdict(finalReviewer, proposed(), "needs_changes", NOW).ok).toBe(true);
  });
});

describe("hold rules", () => {
  it("lets any reviewer hold with a reason, the ship's owner too, but not a collaborator or an invitee", () => {
    expect(mayHold(reviewer, ship(), "Waiting on the repo owner to answer.", NOW).ok).toBe(true);
    expect(mayHold({ ...reviewer, id: "builder" }, ship(), "I want to pause my own ship.", NOW).ok).toBe(true);
    expect(mayHold(reviewer, ship({ collaboratorIds: ["rev"] }), "reason", NOW).ok).toBe(false);
    expect(mayHold(reviewer, ship({ pendingInviteIds: ["rev"] }), "reason", NOW).ok).toBe(false);
    expect(mayHold(reviewer, ship(), "   ", NOW).ok).toBe(false);
  });
  it("does not overwrite another reviewer's hold, but an owner may", () => {
    const held = ship({ heldAt: hoursAgo(1), heldBy: "other", holdReason: "first" });
    expect(mayHold(reviewer, held, "second", NOW).ok).toBe(false);
    expect(mayHold(owner, held, "second", NOW).ok).toBe(true);
    expect(mayHold(reviewer, ship({ heldAt: hoursAgo(1), heldBy: "rev", holdReason: "mine" }), "updated", NOW).ok).toBe(true);
  });
  it("cuts the reason at 500 characters", () => {
    const held = mayHold(reviewer, ship(), "x".repeat(900), NOW);
    expect(held.ok && held.value.reason.length).toBe(500);
  });
  it("releases for the holder or an owner only", () => {
    const held = ship({ heldAt: hoursAgo(1), heldBy: "other", holdReason: "why" });
    expect(mayRelease(reviewer, held).ok).toBe(false);
    expect(mayRelease({ ...reviewer, id: "other" }, held).ok).toBe(true);
    expect(mayRelease(owner, held).ok).toBe(true);
    expect(mayRelease(owner, ship()).ok).toBe(false);
  });
});

describe("journal decisions, corrections and unship", () => {
  it("needs the live claim at either pass and no hold", () => {
    expect(mayDecideJournal(reviewer, ship(), NOW).ok).toBe(true);
    expect(mayDecideJournal(reviewer, ship({ claimedBy: "other" }), NOW).ok).toBe(false);
    expect(mayDecideJournal(reviewer, ship({ heldAt: NOW, heldBy: "x" }), NOW).ok).toBe(false);
    expect(mayDecideJournal(reviewer, ship({ status: "approved" }), NOW).ok).toBe(false);
    expect(mayDecideJournal(finalReviewer, ship({ status: "second-pass", claimedBy: "fin" }), NOW).ok).toBe(true);
    expect(mayDecideJournal(reviewer, ship({ status: "second-pass", claimedBy: "rev" }), NOW).ok).toBe(false);
  });
  it("corrects only an approved ship, for a final reviewer or an owner", () => {
    expect(mayCorrect(finalReviewer, ship({ status: "approved" })).ok).toBe(true);
    expect(mayCorrect(reviewer, ship({ status: "approved" })).ok).toBe(false);
    expect(mayCorrect(finalReviewer, ship()).ok).toBe(false);
    expect(mayCorrect({ ...finalReviewer, id: "builder" }, ship({ status: "approved" })).ok).toBe(false);
  });
  it("unships from fraud review, the second pass or approved, for an owner only", () => {
    for (const status of ["fraud-review", "second-pass", "approved"]) {
      expect(mayUnship(owner, ship({ status })).ok).toBe(true);
      expect(mayUnship(finalReviewer, ship({ status })).ok).toBe(false);
      expect(mayUnship({ ...owner, id: "builder" }, ship({ status })).ok).toBe(false);
    }
    expect(mayUnship(owner, ship({ status: "in-review" })).ok).toBe(false);
  });
});

describe("reasonCodeOf", () => {
  it("keeps the five reasons and defaults the rest to other", () => {
    for (const code of ["track", "readme", "hours", "ai", "other"]) expect(reasonCodeOf(code)).toBe(code);
    expect(reasonCodeOf("nope")).toBe("other");
    expect(reasonCodeOf(null)).toBe("other");
  });
});
