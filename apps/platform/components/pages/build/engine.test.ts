import { beforeEach, describe, expect, test } from "bun:test";
import { clock, resetTestState, store } from "./test-support.test";
import { SEED_PROJECTS } from "./data";
import { oreBalance } from "../../../lib/ore-ledger";
import type { OreEntry } from "../../../lib/ore-ledger";
import type { PreviewNotification } from "../../../lib/notifications";

// Integration tests for the side-effecting engine: ship submission, the whole pipeline, the one-time Ore credit,
// the flag penalty and mission rewards. The preview store and the clock are replaced by in-memory versions.

const H = 3_600_000;

const { KEYS, SEED_JOURNALS } = await import("./data");
const engine = await import("./engine");
const { ALL_MISSION_DEFS } = await import("./content");
const { RULES } = await import("./logic/constants");
const { awardKey } = await import("./logic/ship");

const ledger = () => (store.get("ore-ledger") as OreEntry[] | undefined) ?? [];
const notes = () => (store.get("notifications") as PreviewNotification[] | undefined) ?? [];
const ships = () => (store.get(KEYS.ships) as import("./logic/types").Ship[] | undefined) ?? [];
const award = (id: string) => ledger().filter((entry) => entry.source === "award" && entry.reason.includes(id));

beforeEach(() => {
  resetTestState();
  store.set("ore-ledger", [{ id: "seed_1", amount: 120, reason: "Sample opening balance", source: "preview", at: "2026-10-01T09:00:00.000Z" }]);
});

/** Submits a ship for the seed software project, which has 14 h allocated and 9 h covered by journals. */
function submitLogger(): string {
  // Cover the remaining hours so the 8 hour rule passes, as a builder would before shipping.
  const journals = [...SEED_JOURNALS, { id: "j3", projectId: "seed_project_logger", title: "Benchmarks", body: "Added a benchmark.", hours: 5, tags: [], isPublic: true, at: clock.now - 30 * H }];
  store.set(KEYS.journals, journals);
  const result = engine.submitShip({ projectId: "seed_project_logger", version: "v0.1", changes: "", aiUse: ["No AI"] });
  if (!result.ok) throw new Error(result.errors.join(" "));
  return result.ship.id;
}

function walkToPeerReview(shipId: string) {
  expect(engine.dispatchShip(shipId, { type: "pickup" })).toBeNull();
  expect(engine.dispatchShip(shipId, { type: "approve", approvedHours: 10 })).toBeNull();
}

describe("submitting a ship", () => {
  test("is refused with reasons while a check fails", () => {
    const result = engine.submitShip({ projectId: "seed_project_pad", version: "", changes: "", aiUse: ["No AI"] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(2);
    expect(ships()).toHaveLength(0);
  });

  test("is refused without an AI declaration", () => {
    const result = engine.submitShip({ projectId: "seed_project_logger", version: "v0.1", changes: "", aiUse: [] });
    expect(result.ok).toBe(false);
  });

  test("works once, and a second ship cannot start while one is in progress", () => {
    const id = submitLogger();
    expect(ships()[0]).toMatchObject({ id, state: "submitted", submittedHours: 14 });
    expect(notes().some((n) => n.title.startsWith("Ship submitted"))).toBe(true);
    const again = engine.submitShip({ projectId: "seed_project_logger", version: "v0.2", changes: "", aiUse: ["No AI"] });
    expect(again.ok).toBe(false);
  });
});

describe("the full pipeline pays exactly once", () => {
  test("12 reviews, the 24 hour journal gate, the flag window and the review duty, then a single credit", () => {
    const id = submitLogger();
    const before = oreBalance(ledger());
    expect(before).toBe(120);
    walkToPeerReview(id);

    // Twelve reviews but the latest journal is only 30 hours old at submit, so move to a fresh entry to test the gate.
    store.set(KEYS.journals, [...(store.get(KEYS.journals) as unknown[]), { id: "j4", projectId: "seed_project_logger", title: "Fresh", body: "Fresh entry.", hours: 0, tags: [], isPublic: true, at: clock.now - 2 * H }]);
    expect(engine.addSampleReviews(id, 12, 8)).toEqual({ added: 12, error: null });
    expect(ships()[0].state).toBe("peer_review");

    clock.now += 22 * H; // 24 h after the fresh entry
    engine.settleShips();
    expect(ships()[0].state).toBe("flag_window");
    expect(ships()[0].snapshot?.id).toBe("s1");

    // The window is open and the review duty is not done, so nothing is paid.
    clock.now += 25 * H;
    engine.settleShips();
    expect(ships()[0].state).toBe("flag_window");
    expect(award("Sample: ring-buffer logger")).toHaveLength(0);

    engine.applyDutyShortcut();
    expect(ships()[0].state).toBe("paid");
    const first = award("Sample: ring-buffer logger");
    expect(first).toHaveLength(1);
    expect(first[0].amount).toBe(ships()[0].payout?.net);
    expect(store.get(KEYS.awards)).toContain(awardKey(id, "s1"));

    // Settling again, or re-running the shortcut, never credits twice.
    engine.settleShips();
    engine.settleShips();
    engine.applyDutyShortcut();
    expect(award("Sample: ring-buffer logger")).toHaveLength(1);
    expect(oreBalance(ledger())).toBe(before + (first[0].amount as number));
    expect(notes().filter((n) => n.title.endsWith("was paid"))).toHaveLength(1);
  });

  test("the credit helper is idempotent per key", () => {
    expect(engine.creditOnce("k1", 40, "test", "award")).toBe(true);
    expect(engine.creditOnce("k1", 40, "test", "award")).toBe(false);
    expect(engine.creditOnce("k2", 40, "test", "award")).toBe(true);
    expect(ledger().filter((e) => e.reason === "test")).toHaveLength(2);
  });

  test("an upheld flag voids the snapshot and the replacement snapshot pays under a new key", () => {
    const id = submitLogger();
    walkToPeerReview(id);
    store.set(KEYS.journals, [...(store.get(KEYS.journals) as unknown[]), { id: "j4", projectId: "seed_project_logger", title: "Fresh", body: "Fresh entry.", hours: 0, tags: [], isPublic: true, at: clock.now - 30 * H }]);
    engine.applyDutyShortcut();
    engine.addSampleReviews(id, 12, 7);
    expect(ships()[0].state).toBe("flag_window");
    const reviewId = ships()[0].snapshot!.reviewIds[0];
    expect(engine.dispatchShip(id, { type: "flag", flagId: "f1", reviewId, reason: "This ignores my benchmarks." })).toBeNull();
    expect(engine.dispatchShip(id, { type: "resolveFlag", flagId: "f1", outcome: "upheld" })).toBeNull();
    expect(ships()[0].state).toBe("peer_review");
    expect(engine.addSampleReviews(id, 1, 7).added).toBe(1);
    expect(ships()[0].snapshot?.id).toBe("s2");
    clock.now += 25 * H;
    engine.settleShips();
    expect(ships()[0].state).toBe("paid");
    expect(ships()[0].payout?.key).toBe(awardKey(id, "s2"));
    expect(award("Sample: ring-buffer logger")).toHaveLength(1);
  });
});

describe("repeated false flags", () => {
  test("three rejected flags within ten hours cost 5 percent of the next payout, once", () => {
    store.set(KEYS.penalty, { rejectedAt: [clock.now - 3 * H, clock.now - 2 * H], pending: false });
    const id = submitLogger();
    walkToPeerReview(id);
    store.set(KEYS.journals, [...(store.get(KEYS.journals) as unknown[]), { id: "j4", projectId: "seed_project_logger", title: "Fresh", body: "Fresh entry.", hours: 0, tags: [], isPublic: true, at: clock.now - 30 * H }]);
    engine.addSampleReviews(id, 12, 8);
    const reviewId = ships()[0].snapshot!.reviewIds[0];
    engine.dispatchShip(id, { type: "flag", flagId: "f1", reviewId, reason: "Unfair score for my documentation." });
    engine.dispatchShip(id, { type: "resolveFlag", flagId: "f1", outcome: "rejected" });
    expect((store.get(KEYS.penalty) as { pending: boolean }).pending).toBe(true);
    expect(notes().some((n) => n.title === "Penalty on your next payout")).toBe(true);

    clock.now += 25 * H;
    engine.applyDutyShortcut();
    const ship = ships()[0];
    expect(ship.state).toBe("paid");
    expect(ship.payout!.penalty).toBeGreaterThan(0);
    expect(ship.payout!.penalty).toBe(Math.round(ship.payout!.gross * 0.05));
    expect((store.get(KEYS.penalty) as { pending: boolean }).pending).toBe(false);
  });
});

describe("hours, journals and notifications", () => {
  test("logging tracker hours needs a connected tracker and raises a journal-due notice once", () => {
    expect(engine.logTrackerHours("seed_project_pad", 3)).toContain("Connect");
    store.set(KEYS.projects, SEED_PROJECTS.map((p) => (p.id === "seed_project_logger" ? { ...p, trackerHours: 20, allocatedHours: 20 } : p)));
    engine.checkJournalDue("seed_project_logger");
    engine.checkJournalDue("seed_project_logger");
    expect(notes().filter((n) => n.kind === "journal")).toHaveLength(1);
    expect(engine.logTrackerHours("seed_project_logger", 0)).not.toBeNull();
    expect(engine.logTrackerHours("seed_project_logger", 2)).toBeNull();
    const logger = (store.get(KEYS.projects) as typeof SEED_PROJECTS).find((p) => p.id === "seed_project_logger");
    expect(logger?.allocatedHours).toBe(22);
  });

  test("deleting a project removes its journals and ships but leaves the Ore ledger alone", () => {
    const id = submitLogger();
    engine.creditOnce("keep", 10, "kept", "award");
    engine.deleteProject("seed_project_logger");
    expect((store.get(KEYS.projects) as unknown[]).length).toBe(1);
    expect((store.get(KEYS.journals) as unknown[]).length).toBe(0);
    expect(ships().find((s) => s.id === id)).toBeUndefined();
    expect(ledger().some((e) => e.reason === "kept")).toBe(true);
  });
});

describe("missions", () => {
  const first = ALL_MISSION_DEFS.find((d) => d.id === "m-first-journal")!;
  const second = ALL_MISSION_DEFS.find((d) => d.id === "m-open-source")!;

  test("a locked mission cannot start until its prerequisite is approved", () => {
    expect(engine.startMission(second)).toContain("prerequisite");
    expect(engine.startMission(first)).toBeNull();
    expect(engine.startMission(second)).toContain("prerequisite");
  });

  test("the whole flow ends in one reward and unlocks the next mission", () => {
    engine.startMission(first);
    engine.updateMissionDraft(first.id, { checkedStepIds: first.steps.map((s) => s.id), text: "Wrote my first entry." });
    expect(engine.moveMission(first, "approve")).not.toBeNull();
    expect(engine.moveMission(first, "submit")).toBeNull();
    // Edits are ignored once submitted.
    engine.updateMissionDraft(first.id, { text: "changed after submit" });
    expect((store.get(KEYS.missions) as { text: string }[])[0].text).toBe("Wrote my first entry.");
    expect(engine.moveMission(first, "pickup")).toBeNull();
    expect(engine.moveMission(first, "requestChanges", "Add detail")).toBeNull();
    expect((store.get(KEYS.missions) as { status: string }[])[0].status).toBe("needs_changes");
    expect(engine.moveMission(first, "submit")).toBeNull();
    expect(engine.moveMission(first, "pickup")).toBeNull();
    expect(engine.moveMission(first, "approve")).toBeNull();
    expect(ledger().filter((e) => e.source === "mission")).toHaveLength(1);
    expect(engine.moveMission(first, "approve")).not.toBeNull();
    expect(ledger().filter((e) => e.source === "mission")).toHaveLength(1);
    expect(engine.startMission(second)).toBeNull();
  });
});

describe("rules in the engine match the plans", () => {
  test("constants used by the pipeline", () => {
    expect(RULES.reviewsPerShip).toBe(12);
    expect(RULES.reviewsOwed).toBe(8);
    expect(RULES.flagWindowHours).toBe(24);
    expect(RULES.journalAgeHours).toBe(24);
    expect(RULES.penaltyPercent).toBe(5);
    expect(RULES.penaltyRejectedFlags).toBe(3);
    expect(RULES.penaltyWindowHours).toBe(10);
    expect(RULES.journalEveryHours).toBe(8);
    expect(RULES.minReasonWords).toBe(10);
  });
});
