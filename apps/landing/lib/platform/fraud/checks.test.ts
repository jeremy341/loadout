import { describe, expect, test } from "bun:test";
import { canTransition, clampSummary, FRAUD_STATUSES, latestPerKind, recordCheck, SUMMARY_MAX, type CheckRow, type CheckStore } from "./checks";

const at = (minute: number) => new Date(Date.UTC(2026, 10, 19, 10, minute));
const row = (kind: string, status: string, minute: number): CheckRow => ({ id: `${kind}-${minute}`, projectId: "p1", kind, status, score: null, summary: null, detail: null, checkedAt: at(minute) });

describe("canTransition", () => {
  test("a check may start pending or with an answer, never dismissed", () => {
    for (const to of ["pending", "cleared", "flagged", "error"] as const) expect(canTransition(null, to)).toBe(true);
    expect(canTransition(null, "dismissed")).toBe(false);
  });
  test("any answer may follow pending, and so may another pending (a re-ship while the first is unscored)", () => {
    expect(canTransition("pending", "pending")).toBe(true);
    for (const to of ["cleared", "flagged", "error"] as const) expect(canTransition("pending", to)).toBe(true);
    expect(canTransition("pending", "dismissed")).toBe(false);
  });
  test("a finished check may be asked again", () => {
    for (const from of ["cleared", "flagged", "error", "dismissed"] as const) expect(canTransition(from, "pending")).toBe(true);
  });
  test("only a flagged or failed row can be dismissed", () => {
    expect(canTransition("flagged", "dismissed")).toBe(true);
    expect(canTransition("error", "dismissed")).toBe(true);
    expect(canTransition("cleared", "dismissed")).toBe(false);
  });
  test("every status is covered", () => {
    expect(FRAUD_STATUSES.length).toBe(5);
  });
});

describe("latestPerKind", () => {
  test("keeps the newest row of each kind, in kind order", () => {
    const rows = [row("robert", "pending", 1), row("double-dip", "cleared", 5), row("robert", "flagged", 9), row("precheck", "cleared", 3)];
    expect(latestPerKind(rows).map((r) => `${r.kind}:${r.status}`)).toEqual(["precheck:cleared", "robert:flagged", "double-dip:cleared"]);
  });
});

describe("clampSummary", () => {
  test("collapses whitespace and shortens to the limit", () => {
    expect(clampSummary("a \n  b")).toBe("a b");
    expect(clampSummary("x".repeat(500)).length).toBe(SUMMARY_MAX);
  });
});

// A fake of the two Prisma calls recordCheck makes, holding rows in memory, newest last.
function fakeStore(initial: CheckRow[] = []) {
  const rows = [...initial];
  const store = {
    fraudCheck: {
      findFirst: async ({ where }: { where: { projectId: string; kind: string } }) => [...rows].reverse().find((r) => r.projectId === where.projectId && r.kind === where.kind) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const created = { id: `r${rows.length}`, projectId: String(data.projectId), kind: String(data.kind), status: String(data.status), score: (data.score as number | null) ?? null, summary: (data.summary as string | null) ?? null, detail: data.detail ?? null, checkedAt: at(rows.length + 20) };
        rows.push(created);
        return created;
      },
    },
  };
  return { store: store as unknown as CheckStore, rows };
}

describe("recordCheck", () => {
  test("appends rows and never rewrites an earlier one", async () => {
    const { store, rows } = fakeStore();
    const pending = await recordCheck({ projectId: "p1", kind: "robert", status: "pending", summary: "Sent" }, store);
    const scored = await recordCheck({ projectId: "p1", kind: "robert", status: "flagged", score: 3, summary: "Scored 3" }, store);
    expect(pending.ok && scored.ok).toBe(true);
    expect(rows.map((r) => r.status)).toEqual(["pending", "flagged"]);
  });
  test("refuses an unknown kind, an unknown status and a bad score", async () => {
    const { store, rows } = fakeStore();
    expect(await recordCheck({ projectId: "p1", kind: "bogus" as never, status: "pending" }, store)).toEqual({ ok: false, reason: "unknown_kind" });
    expect(await recordCheck({ projectId: "p1", kind: "robert", status: "bogus" as never }, store)).toEqual({ ok: false, reason: "unknown_status" });
    expect(await recordCheck({ projectId: "p1", kind: "robert", status: "cleared", score: 101 }, store)).toEqual({ ok: false, reason: "bad_score" });
    expect(rows.length).toBe(0);
  });
  test("accepts a second pending row, and refuses a dismissal of a clear row or of a pending one", async () => {
    const { store, rows } = fakeStore([row("robert", "pending", 1), row("precheck", "cleared", 1)]);
    expect((await recordCheck({ projectId: "p1", kind: "robert", status: "pending" }, store)).ok).toBe(true);
    expect(rows.length).toBe(3);
    expect(await recordCheck({ projectId: "p1", kind: "precheck", status: "dismissed" }, store)).toEqual({ ok: false, reason: "bad_transition" });
    expect(await recordCheck({ projectId: "p1", kind: "robert", status: "dismissed" }, store)).toEqual({ ok: false, reason: "bad_transition" });
  });
});
