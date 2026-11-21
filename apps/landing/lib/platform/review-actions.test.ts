// Focused tests for the review desk's database actions. The actions are "use server", so the database, the session and the
// single-ship loader are mocked here and the writes they attempt are inspected. Every assertion is about a defect fix: the
// Person-row lock before a balance read, the guarded assignment columns, the audit row, or the server-side audit-note gate.
import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { buildAuditNote } from "@/reviewer-dash/lib/auditNote";

type Call = { name: string; args: unknown[] };
const calls: Call[] = [];
const record = (name: string, args: unknown[]) => { calls.push({ name, args }); };
const call = (name: string) => calls.find((entry) => entry.name === name);
const callsOf = (name: string) => calls.filter((entry) => entry.name === name);
const indexOf = (name: string) => calls.findIndex((entry) => entry.name === name);

let ship: Record<string, unknown>;
let viewer: Record<string, unknown>;

const revalidatePath = mock(() => {});
mock.module("next/cache", () => ({ revalidatePath }));

const tx: Record<string, unknown> = {
  $queryRaw: mock(async (strings: TemplateStringsArray, ...values: unknown[]) => { record("$queryRaw", [strings.join("?"), ...values]); return []; }),
  project: {
    updateMany: mock(async (args: unknown) => { record("project.updateMany", [args]); return { count: 1 }; }),
    count: mock(async (args: unknown) => { record("project.count", [args]); return 1; }),
  },
  journalEntry: { updateMany: mock(async (args: unknown) => { record("journalEntry.updateMany", [args]); return { count: 1 }; }) },
  ledgerEntry: {
    aggregate: mock(async (args: unknown) => { record("ledgerEntry.aggregate", [args]); return { _sum: { amountOre: 0 } }; }),
    create: mock(async (args: unknown) => { record("ledgerEntry.create", [args]); return {}; }),
  },
  auditEvent: { create: mock(async (args: unknown) => { record("auditEvent.create", [args]); return {}; }) },
  $transaction: mock(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
};
const realDb = await import("./db");
const realSession = await import("./session");
const realReviewData = await import("./review-data");

mock.module("./db", () => ({ ...realDb, db: () => tx as never }));

const requireAccess = mock(async () => viewer);
mock.module("./session", () => ({ ...realSession, requireAccess }));
mock.module("./review-data", () => ({
  ...realReviewData,
  loadDeskShip: mock(async () => ship),
  minutesOf: (hours: number) => Math.round(hours * 60),
}));

// Bun's module mocks are process-wide: restore them after this file so sibling tests import the real session/db modules.
afterAll(() => mock.restore());

const A = await import("./review-actions");
const IDLE = { status: "idle" } as const;
const REASON = "Owner decision after checking the evidence on the project and the ledger.";

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms);

function makeViewer(over: Record<string, unknown> = {}) {
  return {
    id: "rev",
    displayName: "Rev",
    access: { isOwner: false, isReviewer: true, canSecondPass: false, reviewQueues: "both" },
    ...over,
  };
}

function makeShip(over: Record<string, unknown> = {}) {
  const journals = [
    { id: "j1", seq: 1, title: "Journal", body: "Work", hours: 10, minutes: 600, status: "logged", reviewAction: "approve-all", keptMinutes: 600, reviewReason: null, authorId: "builder", createdAt: ago(60_000) },
  ];
  const facts = {
    ownerId: "builder", kind: "software", status: "in-review", heldAt: null, heldBy: null,
    claimedBy: "rev", claimedAt: ago(2 * 60_000), claimHeartbeatAt: ago(60_000), triage: null,
    assignedTo: null, reshippedAt: null, proposedBanBy: null, collaboratorIds: [], pendingInviteIds: [],
  };
  return {
    id: "p1", seq: 100001, title: "A ship", description: null, track: "Tools", kind: "software",
    status: "in-review", repoUrl: null, demoUrl: null, isUpdate: false, changeNote: null, resubmitCount: 0,
    createdAt: ago(86_400_000), submittedAt: ago(60 * 60_000), firstShippedAt: ago(60 * 60_000), reshippedAt: null,
    approvedMinutes: 0, reviewNote: null, reviewReason: null, bannedAt: null, firstPassBy: null, firstPassAt: null,
    firstPassNote: null, firstPassMinutes: null, triage: null, triageBy: null, triageNote: null, triageAt: null,
    heldAt: null, heldBy: null, holdReason: null, assignedTo: null, assignmentRemindedAt: null,
    proposedBanBy: null, proposedBanReason: null,
    owner: { id: "builder", displayName: "Builder", birthday: null },
    journals, claimedMinutes: 600, facts,
    ...over,
    // Keep the facts in sync with the top-level columns the guarded writes compare.
    facts: { ...facts, ...(over.facts as Record<string, unknown> ?? {}) },
  };
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  fd.set("ship", "100001");
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function auditActions(): string[] {
  return callsOf("auditEvent.create").map((entry) => String((entry.args[0] as { data: { action: string } }).data.action));
}

function fullAuditNote(over: Partial<Record<"TECHNICAL FEATURES" | "DEFLATION REASON" | "AGE JUSTIFICATION" | "NOTES", string>> = {}): string {
  return buildAuditNote({
    "TECHNICAL FEATURES": "a concrete description of the features I checked",
    "DEFLATION REASON": "I lowered the hours because the commits were not descriptive",
    "AGE JUSTIFICATION": "The builder was under 19 when they shipped and is older now; an owner decides",
    NOTES: "Originality and technical depth were checked against the repo and demo",
    ...over,
  });
}

beforeEach(() => {
  calls.length = 0;
  ship = makeShip();
  viewer = makeViewer();
  revalidatePath.mockClear();
  (tx.$queryRaw as ReturnType<typeof mock>).mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => { record("$queryRaw", [strings.join("?"), ...values]); return []; });
  (tx.project.updateMany as { mockImplementation: (fn: (args: unknown) => Promise<unknown>) => void }).mockImplementation(async (args: unknown) => { record("project.updateMany", [args]); return { count: 1 }; });
  (tx.ledgerEntry.aggregate as { mockImplementation: (fn: (args: unknown) => Promise<unknown>) => void }).mockImplementation(async (args: unknown) => { record("ledgerEntry.aggregate", [args]); return { _sum: { amountOre: 0 } }; });
  requireAccess.mockImplementation(async () => viewer);
});

describe("claim, pick up, release and heartbeat", () => {
  it("claimShip guards on the assignment columns and writes an audit row", async () => {
    ship = makeShip({ facts: { claimedBy: null, claimedAt: null, claimHeartbeatAt: null } });
    const result = await A.claimShip(IDLE, form({}));
    expect(result.status).toBe("saved");
    const where = (call("project.updateMany")?.args[0] as { where: Record<string, unknown> }).where;
    expect(where).toHaveProperty("assignedTo", null);
    expect(where).toHaveProperty("reshippedAt", null);
    expect(auditActions()).toContain("review.claim");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("pickUpShip guards on the assignment columns and writes an audit row", async () => {
    ship = makeShip({ status: "submitted", facts: { status: "submitted", claimedBy: null, claimedAt: null, claimHeartbeatAt: null } });
    const result = await A.pickUpShip(IDLE, form({}));
    expect(result.status).toBe("saved");
    const where = (call("project.updateMany")?.args[0] as { where: Record<string, unknown> }).where;
    expect(where).toHaveProperty("assignedTo", null);
    expect(where).toHaveProperty("reshippedAt", null);
    expect(auditActions()).toContain("review.pickup");
  });

  it("heartbeat guards on the assignment columns, revalidates and writes an audit row", async () => {
    const result = await A.heartbeat(IDLE, form({}));
    expect(result.status).toBe("saved");
    const where = (call("project.updateMany")?.args[0] as { where: Record<string, unknown> }).where;
    expect(where).toHaveProperty("assignedTo", null);
    expect(where).toHaveProperty("reshippedAt", null);
    expect(auditActions()).toContain("review.heartbeat");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("releaseClaim writes an audit row", async () => {
    const result = await A.releaseClaim(IDLE, form({}));
    expect(result.status).toBe("saved");
    expect(auditActions()).toContain("review.release_claim");
  });
});

describe("journal decisions", () => {
  it("decideJournal writes an audit row", async () => {
    const result = await A.decideJournal(IDLE, form({ journalId: "j1", hours: "4", action: "partial" }));
    // 4h of 10h needs a reason, so give one and retry.
    expect(result.status).toBe("error");
    calls.length = 0;
    const ok = await A.decideJournal(IDLE, form({ journalId: "j1", hours: "4", action: "partial", reason: "The last hours were not verifiable from the commits." }));
    expect(ok.status).toBe("saved");
    expect(auditActions()).toContain("review.journal");
  });
});

describe("clawback balance reads", () => {
  it("unshipProject takes the Person-row lock before reading the confirmed balance", async () => {
    ship = makeShip({ status: "approved", approvedMinutes: 600, facts: { status: "approved" } });
    viewer = makeViewer({ access: { isOwner: true, isReviewer: true, canSecondPass: true, reviewQueues: "both" } });
    (tx.ledgerEntry.aggregate as { mockImplementation: (fn: (args: unknown) => Promise<unknown>) => void }).mockImplementation(async (args: unknown) => {
      record("ledgerEntry.aggregate", [args]);
      const where = (args as { where: { personId?: string; projectId?: string; status: string } }).where;
      return { _sum: { amountOre: where.status === "confirmed" && !where.projectId ? 120 : 100 } };
    });
    const result = await A.unshipProject(IDLE, form({ reason: REASON }));
    expect(result.status).toBe("saved");
    const lock = call("$queryRaw");
    expect(lock).toBeDefined();
    expect(String(lock?.args[0])).toContain("Person");
    expect(String(lock?.args[0])).toContain("FOR UPDATE");
    expect(lock?.args).toContain("builder");
    const balanceRead = callsOf("ledgerEntry.aggregate").find((entry) => {
      const where = (entry.args[0] as { where: { personId?: string; projectId?: string; status: string } }).where;
      return where.status === "confirmed" && !where.projectId;
    });
    expect(balanceRead).toBeDefined();
    expect(indexOf("$queryRaw")).toBeLessThan(calls.indexOf(balanceRead!));
  });

  it("correctApprovedHours clamps a clawback to the confirmed balance and records the shortfall", async () => {
    ship = makeShip({ status: "approved", approvedMinutes: 600, facts: { status: "approved" } });
    viewer = makeViewer({ access: { isOwner: true, isReviewer: true, canSecondPass: true, reviewQueues: "both" } });
    (tx.ledgerEntry.aggregate as { mockImplementation: (fn: (args: unknown) => Promise<unknown>) => void }).mockImplementation(async (args: unknown) => {
      record("ledgerEntry.aggregate", [args]);
      const where = (args as { where: { personId?: string; status: string } }).where;
      return { _sum: { amountOre: where.status === "confirmed" ? 40 : 0 } };
    });
    // 600 approved minutes are 100 Ore; 60 minutes are 10 Ore; the -90 Ore clawback is capped at a 40 Ore balance.
    const result = await A.correctApprovedHours(IDLE, form({ hours: "1", reason: REASON }));
    expect(result.status).toBe("saved");
    const created = (call("ledgerEntry.create")?.args[0] as { data: { amountOre: number; reason: string } }).data;
    expect(created.amountOre).toBe(-40);
    expect(created.reason).toContain("50 Ore already spent");
    const after = (call("auditEvent.create")?.args[0] as { data: { after: { shortfallOre: number; deltaOre: number } } }).data.after;
    expect(after.shortfallOre).toBe(50);
    expect(after.deltaOre).toBe(-40);
    expect(result.message).toContain("50 Ore was already spent");
    expect(indexOf("$queryRaw")).toBeLessThan(indexOf("ledgerEntry.create"));
  });

  it("correctApprovedHours leaves an upward correction unchanged", async () => {
    ship = makeShip({ status: "approved", approvedMinutes: 60, claimedMinutes: 60, facts: { status: "approved" } });
    viewer = makeViewer({ access: { isOwner: true, isReviewer: true, canSecondPass: true, reviewQueues: "both" } });
    const result = await A.correctApprovedHours(IDLE, form({ hours: "2", reason: REASON }));
    expect(result.status).toBe("saved");
    const created = (call("ledgerEntry.create")?.args[0] as { data: { amountOre: number } }).data;
    expect(created.amountOre).toBe(10);
    expect(result.message).toContain("Paid 10 Ore");
  });
});

describe("reviewVerdict audit-note validation", () => {
  function verdictShip(over: Record<string, unknown> = {}) {
    return makeShip({
      status: "second-pass",
      facts: { status: "second-pass", triage: "not-fraud" },
      triage: "not-fraud",
      ...over,
    });
  }
  function verdictForm(auditNote: string): FormData {
    return form({ verdict: "approve", note: "Approved after reviewing the repo and demo.", auditNote });
  }

  beforeEach(() => {
    viewer = makeViewer({ access: { isOwner: false, isReviewer: true, canSecondPass: true, reviewQueues: "both" } });
  });

  it("saves an approval with every required section", async () => {
    ship = verdictShip();
    const result = await A.reviewVerdict(IDLE, verdictForm(fullAuditNote()));
    expect(result.status).toBe("saved");
    expect(auditActions()).toContain("review.verdict");
  });

  it("refuses a note missing the technical features or the additional notes", async () => {
    ship = verdictShip();
    const missingFeatures = await A.reviewVerdict(IDLE, verdictForm(fullAuditNote({ "TECHNICAL FEATURES": "" })));
    expect(missingFeatures).toMatchObject({ status: "error", field: "technicalFeatures" });
    calls.length = 0;
    const missingNotes = await A.reviewVerdict(IDLE, verdictForm(fullAuditNote({ NOTES: "" })));
    expect(missingNotes).toMatchObject({ status: "error", field: "notes" });
  });

  it("refuses a deflated approval without a deflation reason, derived from the kept minutes", async () => {
    const journal = makeShip().journals[0] as Record<string, unknown>;
    ship = verdictShip({ journals: [{ ...journal, reviewAction: "partial", keptMinutes: 300 }] });
    const result = await A.reviewVerdict(IDLE, verdictForm(fullAuditNote({ "DEFLATION REASON": "" })));
    expect(result).toMatchObject({ status: "error", field: "deflationReason" });
  });

  it("refuses a note missing the age justification when the builder turned 19 since shipping", async () => {
    // The 19th birthday was 5 days ago; the ship was 10 days ago, so the builder was 18 at shipping and 19 at review.
    const birthday = new Date(NOW);
    birthday.setUTCFullYear(birthday.getUTCFullYear() - 19);
    birthday.setUTCDate(birthday.getUTCDate() - 5);
    ship = verdictShip({
      owner: { id: "builder", displayName: "Builder", birthday },
      firstShippedAt: new Date(NOW - 10 * 86_400_000),
    });
    const missing = await A.reviewVerdict(IDLE, verdictForm(fullAuditNote({ "AGE JUSTIFICATION": "" })));
    expect(missing).toMatchObject({ status: "error", field: "ageJustification" });
    calls.length = 0;
    const saved = await A.reviewVerdict(IDLE, verdictForm(fullAuditNote()));
    expect(saved.status).toBe("saved");
  });
});
