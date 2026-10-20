import { describe, expect, test } from "bun:test";
import { HOUR_MS } from "./constants";
import {
  applyPenalty,
  applyShipAction,
  awardKey,
  createShip,
  effectiveHours,
  evaluateShip,
  flagWindowOpen,
  lockReadiness,
  payoutBlockers,
  registerRejectedFlag,
  shipChecklist,
  shippedHours,
  shouldCredit,
  stepIndexFor,
  stepperModel,
  stepperSummary,
  type ShipCtx,
} from "./ship";
import { sampleReview } from "./sample-review";
import type { Project, ReceivedReview, Ship } from "./types";

const H = HOUR_MS;

function project(over: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Proj",
    summary: "Does a thing.",
    capability: "",
    track: "Tools",
    researchMode: false,
    repoUrl: "https://github.com/you/proj",
    license: "MIT",
    visibility: "public",
    collaborators: "",
    createdAt: 0,
    trackerConnected: true,
    trackerHours: 12,
    allocatedHours: 12,
    bom: [],
    versions: [],
    ...over,
  };
}

function reviews(n: number, base = 7, start = 0): ReceivedReview[] {
  return Array.from({ length: n }, (_, i) => sampleReview({ shipId: "sh1", index: start + i, base, createdAt: 1000 + start + i }));
}

function ship(over: Partial<Ship> = {}): Ship {
  const s = createShip({ id: "sh1", project: project(), version: "v0.1", changes: "", aiUse: ["No AI"], newHours: 12, now: 0 });
  return { ...s, ...over };
}

function ctx(over: Partial<ShipCtx> = {}): ShipCtx {
  return { now: 100 * H, latestJournalAt: 0, reviewsDone: 8, penaltyPending: false, ...over };
}

describe("hours and checklist", () => {
  test("hours count only while the tracker is linked and never exceed the tracker", () => {
    expect(effectiveHours(project())).toBe(12);
    expect(effectiveHours(project({ trackerConnected: false }))).toBe(0);
    expect(effectiveHours(project({ allocatedHours: 20, trackerHours: 5 }))).toBe(5);
  });

  test("a complete software project passes every check", () => {
    const list = shipChecklist({ project: project(), entries: [{ hours: 8 }], priorShips: [], aiUse: ["No AI"] });
    expect(list.items.every((i) => i.pass)).toBe(true);
    expect(list.canSubmit).toBe(true);
    expect(list.newHours).toBe(12);
    expect(list.items.some((i) => i.id === "bom")).toBe(false);
  });

  test("each missing requirement fails its own item", () => {
    const run = (p: Project, entries = [{ hours: 8 }], ai = ["No AI"]) => shipChecklist({ project: p, entries, priorShips: [], aiUse: ai });
    const failing = (c: ReturnType<typeof run>) => c.items.filter((i) => !i.pass).map((i) => i.id);
    expect(failing(run(project({ license: "" })))).toEqual(["source"]);
    expect(failing(run(project({ repoUrl: "" })))).toEqual(["source"]);
    expect(failing(run(project({ trackerConnected: false })))).toContain("tracker");
    expect(failing(run(project({ summary: "  " })))).toEqual(["summary"]);
    expect(failing(run(project(), [{ hours: 8 }], []))).toEqual(["ai"]);
    expect(failing(run(project(), []))).toEqual(["journals"]);
    expect(run(project({ license: "" })).canSubmit).toBe(false);
  });

  test("journals fail when eight uncovered hours have built up", () => {
    const c = shipChecklist({ project: project({ allocatedHours: 12 }), entries: [{ hours: 3 }], priorShips: [], aiUse: ["No AI"] });
    expect(c.items.find((i) => i.id === "journals")?.pass).toBe(false);
    const ok = shipChecklist({ project: project({ allocatedHours: 12 }), entries: [{ hours: 5 }], priorShips: [], aiUse: ["No AI"] });
    expect(ok.items.find((i) => i.id === "journals")?.pass).toBe(true);
  });

  test("a hardware ship needs a complete bill of materials", () => {
    const hw = project({ track: "Hardware" });
    const none = shipChecklist({ project: hw, entries: [{ hours: 8 }], priorShips: [], aiUse: ["No AI"] });
    expect(none.items.find((i) => i.id === "bom")?.pass).toBe(false);
    expect(none.canSubmit).toBe(false);
    const withBom = shipChecklist({
      project: { ...hw, bom: [{ id: "1", part: "ESP32", qty: 1, unitCost: 5, link: "vendor" }] },
      entries: [{ hours: 8 }],
      priorShips: [],
      aiUse: ["No AI"],
    });
    expect(withBom.canSubmit).toBe(true);
  });

  test("a repeat ship needs five new hours and rejected hours are reusable", () => {
    const prior = [{ state: "paid" as const, submittedHours: 10 }];
    expect(shippedHours(prior)).toBe(10);
    const tooFew = shipChecklist({ project: project({ allocatedHours: 12, trackerHours: 12 }), entries: [{ hours: 8 }], priorShips: prior, aiUse: ["No AI"] });
    expect(tooFew.items.find((i) => i.id === "hours")?.pass).toBe(false);
    const enough = shipChecklist({ project: project({ allocatedHours: 16, trackerHours: 16 }), entries: [{ hours: 12 }], priorShips: prior, aiUse: ["No AI"] });
    expect(enough.items.find((i) => i.id === "hours")?.pass).toBe(true);
    expect(enough.newHours).toBe(6);
    expect(shippedHours([{ state: "rejected", submittedHours: 10 }])).toBe(0);
  });
});

describe("team check", () => {
  test("only valid transitions are allowed", () => {
    const s = ship();
    expect(applyShipAction(s, { type: "approve", approvedHours: 5 }, ctx()).error).not.toBeNull();
    const picked = applyShipAction(s, { type: "pickup" }, ctx());
    expect(picked.ship.state).toBe("team_check");
    expect(applyShipAction(picked.ship, { type: "pickup" }, ctx()).error).not.toBeNull();
  });
  test("approval takes partial hours but not more than were submitted", () => {
    const inCheck = ship({ state: "team_check" });
    expect(applyShipAction(inCheck, { type: "approve", approvedHours: 13 }, ctx()).error).not.toBeNull();
    expect(applyShipAction(inCheck, { type: "approve", approvedHours: 0 }, ctx()).error).not.toBeNull();
    const ok = applyShipAction(inCheck, { type: "approve", approvedHours: 10.5 }, ctx());
    expect(ok.ship.state).toBe("peer_review");
    expect(ok.ship.approvedHours).toBe(10.5);
  });
  test("changes requested can be resubmitted; rejected is final", () => {
    const inCheck = ship({ state: "team_check" });
    const changes = applyShipAction(inCheck, { type: "requestChanges", note: "Add a README" }, ctx());
    expect(changes.ship.state).toBe("changes_requested");
    const again = applyShipAction(changes.ship, { type: "resubmit" }, ctx({ now: 5 }));
    expect(again.ship.state).toBe("submitted");
    expect(again.ship.submittedAt).toBe(5);
    const rejected = applyShipAction(inCheck, { type: "reject", note: "Not a fit" }, ctx());
    expect(rejected.ship.state).toBe("rejected");
    expect(applyShipAction(rejected.ship, { type: "resubmit" }, ctx()).error).not.toBeNull();
  });
});

describe("award lock needs 12 countable reviews and a 24 hour old journal", () => {
  const base = () => ship({ state: "peer_review", approvedHours: 12 });

  test("eleven reviews are not enough", () => {
    const s = { ...base(), reviews: reviews(11) };
    expect(lockReadiness(s, ctx()).ready).toBe(false);
    expect(evaluateShip(s, ctx()).ship.state).toBe("peer_review");
  });

  test("twelve reviews with a journal under 24 hours old do not lock", () => {
    const s = { ...base(), reviews: reviews(12) };
    const result = evaluateShip(s, ctx({ latestJournalAt: 100 * H - 23 * H }));
    expect(result.ship.state).toBe("peer_review");
    expect(result.events).toEqual([]);
  });

  test("a ship with no journal entry never locks", () => {
    const s = { ...base(), reviews: reviews(12) };
    expect(evaluateShip(s, ctx({ latestJournalAt: null })).ship.state).toBe("peer_review");
  });

  test("both gates met locks a snapshot and opens the flag window", () => {
    const s = { ...base(), reviews: reviews(12) };
    const result = evaluateShip(s, ctx({ latestJournalAt: 100 * H - 24 * H }));
    expect(result.ship.state).toBe("flag_window");
    expect(result.ship.snapshot?.id).toBe("s1");
    expect(result.ship.snapshot?.windowEndsAt).toBe(100 * H + 24 * H);
    expect(result.events[0]).toMatchObject({ type: "locked", snapshotId: "s1" });
  });

  test("reviews beyond the twelfth are not in the snapshot", () => {
    const s = { ...base(), reviews: reviews(14) };
    const result = evaluateShip(s, ctx());
    expect(result.ship.snapshot?.reviewIds).toHaveLength(12);
  });
});

describe("flag window, payout and penalty", () => {
  function locked(now = 100 * H): Ship {
    const s = ship({ state: "peer_review", approvedHours: 12, reviews: reviews(12) });
    return evaluateShip(s, ctx({ now })).ship;
  }

  test("payout waits for the 24 hour flag window", () => {
    const s = locked();
    expect(flagWindowOpen(s, 100 * H + 23 * H)).toBe(true);
    expect(payoutBlockers(s, ctx({ now: 100 * H + 23 * H })).length).toBeGreaterThan(0);
    expect(evaluateShip(s, ctx({ now: 100 * H + 23 * H })).ship.state).toBe("flag_window");
    expect(flagWindowOpen(s, 100 * H + 24 * H)).toBe(false);
  });

  test("after the window the ship is paid once, with a payout keyed by ship and snapshot", () => {
    const s = locked();
    const done = evaluateShip(s, ctx({ now: 100 * H + 24 * H }));
    expect(done.ship.state).toBe("paid");
    expect(done.ship.payout?.key).toBe(awardKey("sh1", "s1"));
    expect(done.ship.payout?.net).toBe(done.ship.payout?.gross);
    const paidEvent = done.events.find((e) => e.type === "paid");
    expect(paidEvent).toBeDefined();
    // Evaluating a paid ship again produces nothing: it can never pay twice.
    const again = evaluateShip(done.ship, ctx({ now: 500 * H }));
    expect(again.events).toEqual([]);
    expect(again.ship).toBe(done.ship);
  });

  test("an owed review duty holds payout even after the window closes", () => {
    const s = locked();
    const held = evaluateShip(s, ctx({ now: 130 * H, reviewsDone: 5 }));
    expect(held.ship.state).toBe("flag_window");
    expect(payoutBlockers(held.ship, ctx({ now: 130 * H, reviewsDone: 5 })).join(" ")).toContain("3 more reviews");
    expect(evaluateShip(held.ship, ctx({ now: 130 * H, reviewsDone: 8 })).ship.state).toBe("paid");
  });

  test("a flag can be raised only inside the window and only on a counted review", () => {
    const s = locked();
    const reviewId = s.snapshot!.reviewIds[0];
    expect(applyShipAction(s, { type: "flag", flagId: "f1", reviewId, reason: "Unfair" }, ctx({ now: 100 * H + 25 * H })).error).not.toBeNull();
    expect(applyShipAction(s, { type: "flag", flagId: "f1", reviewId: "nope", reason: "Unfair" }, ctx({ now: 101 * H })).error).not.toBeNull();
    expect(applyShipAction(s, { type: "flag", flagId: "f1", reviewId, reason: "   " }, ctx({ now: 101 * H })).error).not.toBeNull();
    const flagged = applyShipAction(s, { type: "flag", flagId: "f1", reviewId, reason: "Unfair" }, ctx({ now: 101 * H }));
    expect(flagged.error).toBeNull();
    expect(applyShipAction(flagged.ship, { type: "flag", flagId: "f2", reviewId, reason: "Again" }, ctx({ now: 102 * H })).error).not.toBeNull();
  });

  test("a pending flag holds payout past the end of the window", () => {
    const s = locked();
    const reviewId = s.snapshot!.reviewIds[0];
    const flagged = applyShipAction(s, { type: "flag", flagId: "f1", reviewId, reason: "Unfair" }, ctx({ now: 101 * H })).ship;
    const later = evaluateShip(flagged, ctx({ now: 200 * H }));
    expect(later.ship.state).toBe("flag_window");
    expect(payoutBlockers(later.ship, ctx({ now: 200 * H })).join(" ")).toContain("pending flag");
  });

  test("a rejected flag releases payout and reports the rejection time", () => {
    const s = locked();
    const reviewId = s.snapshot!.reviewIds[0];
    const flagged = applyShipAction(s, { type: "flag", flagId: "f1", reviewId, reason: "Unfair" }, ctx({ now: 101 * H })).ship;
    const resolved = applyShipAction(flagged, { type: "resolveFlag", flagId: "f1", outcome: "rejected" }, ctx({ now: 102 * H }));
    expect(resolved.events).toEqual([{ type: "flag_rejected", at: 102 * H }]);
    expect(evaluateShip(resolved.ship, ctx({ now: 130 * H })).ship.state).toBe("paid");
  });

  test("an upheld flag discards the review, needs a replacement, then takes a new snapshot with a new award key", () => {
    const s = locked();
    const reviewId = s.snapshot!.reviewIds[0];
    const flagged = applyShipAction(s, { type: "flag", flagId: "f1", reviewId, reason: "Unfair" }, ctx({ now: 101 * H })).ship;
    const upheld = applyShipAction(flagged, { type: "resolveFlag", flagId: "f1", outcome: "upheld" }, ctx({ now: 102 * H })).ship;
    expect(upheld.state).toBe("peer_review");
    expect(upheld.snapshot).toBeNull();
    expect(upheld.reviews.find((r) => r.id === reviewId)?.discarded).toBe(true);
    // Eleven countable reviews: nothing locks.
    expect(evaluateShip(upheld, ctx({ now: 103 * H })).ship.state).toBe("peer_review");
    const replaced = applyShipAction(upheld, { type: "addReview", review: reviews(1, 7, 50)[0] }, ctx({ now: 104 * H })).ship;
    const relocked = evaluateShip(replaced, ctx({ now: 104 * H })).ship;
    expect(relocked.state).toBe("flag_window");
    expect(relocked.snapshot?.id).toBe("s2");
    expect(relocked.snapshot?.windowEndsAt).toBe(104 * H + 24 * H);
    const paid = evaluateShip(relocked, ctx({ now: 129 * H })).ship;
    expect(paid.payout?.key).toBe(awardKey("sh1", "s2"));
    expect(paid.payout?.key).not.toBe(awardKey("sh1", "s1"));
  });

  test("the pending penalty takes 5 percent of the final payout, once", () => {
    expect(applyPenalty(200, true)).toEqual({ penalty: 10, net: 190 });
    expect(applyPenalty(200, false)).toEqual({ penalty: 0, net: 200 });
    const s = locked();
    const paid = evaluateShip(s, ctx({ now: 130 * H, penaltyPending: true }));
    const event = paid.events.find((e) => e.type === "paid");
    expect(event).toMatchObject({ penaltyApplied: true });
    expect(paid.ship.payout!.net).toBe(paid.ship.payout!.gross - paid.ship.payout!.penalty);
  });

  test("a Great Signal claim can lift the ceiling before the lock but not after", () => {
    const s = ship({ state: "peer_review", approvedHours: 12, reviews: reviews(12, 9) });
    const normal = evaluateShip(s, ctx()).ship.snapshot!.multiplier;
    const great = evaluateShip({ ...s, great: true }, ctx()).ship.snapshot!.multiplier;
    expect(great).toBeGreaterThan(normal);
    const lockedShip = locked();
    expect(applyShipAction(lockedShip, { type: "setGreat", value: true }, ctx()).error).not.toBeNull();
  });
});

describe("idempotent award key", () => {
  test("the same ship and snapshot never credit twice", () => {
    const key = awardKey("sh1", "s1");
    expect(shouldCredit([], key)).toBe(true);
    expect(shouldCredit([key], key)).toBe(false);
    expect(shouldCredit([key], awardKey("sh1", "s2"))).toBe(true);
    expect(shouldCredit([key], awardKey("sh2", "s1"))).toBe(true);
  });
});

describe("three rejected flags within ten hours", () => {
  test("two rejections do not trigger it", () => {
    let log: number[] = [];
    let r = registerRejectedFlag(log, 0);
    log = r.log;
    r = registerRejectedFlag(log, 1 * H);
    expect(r.triggered).toBe(false);
    expect(r.log).toHaveLength(2);
  });
  test("the third within ten hours triggers it and resets the count", () => {
    let r = registerRejectedFlag([], 0);
    r = registerRejectedFlag(r.log, 4 * H);
    r = registerRejectedFlag(r.log, 10 * H);
    expect(r.triggered).toBe(true);
    expect(r.log).toEqual([]);
  });
  test("an old rejection falls out of the ten hour window", () => {
    let r = registerRejectedFlag([], 0);
    r = registerRejectedFlag(r.log, 4 * H);
    r = registerRejectedFlag(r.log, 10 * H + 1);
    expect(r.triggered).toBe(false);
    expect(r.log).toHaveLength(2);
  });
});

describe("stepper", () => {
  const c = { now: 100 * H, latestJournalAt: 0 };
  test("no ship is the draft step", () => {
    const model = stepperModel(null, c);
    expect(model[0].status).toBe("current");
    expect(model.slice(1).every((s) => s.status === "todo")).toBe(true);
    expect(stepIndexFor(null)).toBe(0);
  });
  test("peer review shows its n of 12 count", () => {
    const model = stepperModel(ship({ state: "peer_review", approvedHours: 5, reviews: reviews(5) }), c);
    expect(model[3]).toMatchObject({ status: "current", detail: "5 of 12 countable reviews" });
    expect(model[2].status).toBe("done");
    expect(stepperSummary(model)).toContain("Step 4 of 7");
  });
  test("the lock step is done while the flag window is current", () => {
    const locked = evaluateShip(ship({ state: "peer_review", approvedHours: 5, reviews: reviews(12) }), ctx()).ship;
    const model = stepperModel(locked, c);
    expect(model[4].status).toBe("done");
    expect(model[5].status).toBe("current");
    expect(model[6].status).toBe("todo");
  });
  test("paid completes every step and a rejected ship stops at the team check", () => {
    const paid = stepperModel(ship({ state: "paid", payout: { key: "k", gross: 10, penalty: 0, net: 10, paidAt: 1 } }), c);
    expect(paid.every((s) => s.status === "done")).toBe(true);
    expect(stepperSummary(paid)).toContain("All 7 steps complete");
    const stopped = stepperModel(ship({ state: "rejected" }), c);
    expect(stopped[2].status).toBe("blocked");
    expect(stopped[3].status).toBe("todo");
  });
});
