import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import * as realDb from "../db";

// A tiny in-memory stand-in for the Prisma client. The conditional updateMany is evaluated against the same rules the
// database uses, so these tests prove the CAS actually guards the row rather than just checking the shape of the call.
type Row = { id: string; status: string; attempts: number; dedupeKey: string; nextAttemptAt?: Date; lastError?: string | null; sentAt?: Date | null };

let rows = new Map<string, Row>();
let calls: Array<Record<string, unknown>> = [];

function applyData(row: Row, data: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && typeof value === "object" && "increment" in value) {
      (row as unknown as Record<string, number>)[key] = ((row as unknown as Record<string, number>)[key] ?? 0) + Number((value as { increment: number }).increment);
    } else {
      (row as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  if (where.id !== undefined && row.id !== where.id) return false;
  if (where.attempts !== undefined && row.attempts !== where.attempts) return false;
  if (where.status !== undefined) {
    if (where.status !== null && typeof where.status === "object") {
      const not = (where.status as { not?: string }).not;
      if (not !== undefined && row.status === not) return false;
    } else if (row.status !== where.status) return false;
  }
  return true;
}

const client = {
  botOutbox: {
    findUnique: async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      calls.push({ kind: "update", where, data });
      const row = rows.get(where.id);
      if (!row) throw new Error("update on a missing row");
      applyData(row, data);
      return row;
    },
    updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      calls.push({ kind: "updateMany", where, data });
      const row = rows.get(String(where.id));
      if (!row || !matchesWhere(row, where)) return { count: 0 };
      applyData(row, data);
      return { count: 1 };
    },
  },
  ticketMessage: {
    updateMany: async (args: Record<string, unknown>) => {
      calls.push({ kind: "ticketMessage.updateMany", ...args });
      return { count: 1 };
    },
  },
  $transaction: async (fn: (tx: typeof client) => Promise<unknown>) => fn(client),
};

mock.module("../db", () => ({ ...realDb, db: () => client }));
afterAll(() => mock.restore());

const { ackOutbox, failOutbox } = await import("./outbox-data");

beforeEach(() => {
  rows = new Map();
  calls = [];
});

describe("ackOutbox", () => {
  test("a missing row is reported without any write", async () => {
    expect(await ackOutbox("missing", null)).toEqual({ ok: false, code: "not_found" });
    expect(calls).toEqual([]);
  });

  test("uses a conditional updateMany, never a bare update, and only the winner increments attempts", async () => {
    rows.set("o1", { id: "o1", status: "pending", attempts: 1, dedupeKey: "notice:kudos:p1:abc" });

    expect(await ackOutbox("o1", null)).toEqual({ ok: true });
    const writes = calls.filter((c) => c.kind === "updateMany");
    expect(writes).toHaveLength(1);
    expect(writes[0].where).toEqual({ id: "o1", status: { not: "sent" } });
    expect(writes[0].data).toMatchObject({ status: "sent", attempts: { increment: 1 } });
    expect(calls.some((c) => c.kind === "update")).toBe(false);
    expect(rows.get("o1")).toMatchObject({ status: "sent", attempts: 2 });

    // A second ack finds the row already sent, loses the CAS and cannot increment again.
    expect(await ackOutbox("o1", null)).toEqual({ ok: true });
    expect(calls.filter((c) => c.kind === "updateMany")).toHaveLength(2);
    expect(rows.get("o1")!.attempts).toBe(2);
  });

  test("stamps a ticket reply only when this ack actually won", async () => {
    rows.set("o2", { id: "o2", status: "pending", attempts: 1, dedupeKey: "ticket-reply:t1:m1" });
    await ackOutbox("o2", "1710000000.000123");
    expect(calls.filter((c) => c.kind === "ticketMessage.updateMany")).toHaveLength(1);
    expect(rows.get("o2")!.attempts).toBe(2);
  });
});

describe("failOutbox", () => {
  const now = new Date("2026-11-20T10:00:00.000Z");

  test("CAS-guards on status and the exact attempt count, so attempts are not lost", async () => {
    rows.set("f1", { id: "f1", status: "pending", attempts: 2, dedupeKey: "notice:x" });

    expect(await failOutbox("f1", "slack_error", false, now)).toEqual({ ok: true, status: "pending" });
    const writes = calls.filter((c) => c.kind === "updateMany");
    expect(writes).toHaveLength(1);
    expect(writes[0].where).toEqual({ id: "f1", status: "pending", attempts: 2 });
    expect(writes[0].data).toMatchObject({ status: "pending", attempts: 3, lastError: "slack_error" });
    expect(calls.some((c) => c.kind === "update")).toBe(false);
    expect(rows.get("f1")!.attempts).toBe(3);
    // The third failure waits 30 minutes (BACKOFF_MINUTES[2]).
    expect(rows.get("f1")!.nextAttemptAt!.getTime()).toBe(now.getTime() + 30 * 60_000);
  });

  test("a failure that loses the race re-reads and does not overwrite the newer attempt count", async () => {
    rows.set("f2", { id: "f2", status: "pending", attempts: 3, dedupeKey: "x" });
    let reads = 0;
    const originalFind = client.botOutbox.findUnique;
    const originalUpdateMany = client.botOutbox.updateMany;
    client.botOutbox.findUnique = async (args) => {
      reads += 1;
      return originalFind(args);
    };
    let stolen = false;
    client.botOutbox.updateMany = async (args) => {
      if (!stolen) {
        stolen = true;
        // A concurrent failure landed between our read and our CAS write: it moved attempts from 3 to 4, so our write loses.
        const row = rows.get(String(args.where.id));
        if (row) row.attempts = 4;
        calls.push({ kind: "updateMany", where: args.where, data: args.data, count: 0 });
        return { count: 0 };
      }
      return originalUpdateMany(args);
    };
    try {
      const result = await failOutbox("f2", "boom", false, now);
      expect(result).toEqual({ ok: true, status: "failed" });
      expect(reads).toBe(2);
      expect(rows.get("f2")!.attempts).toBe(5);
      expect(rows.get("f2")!.status).toBe("failed");
      const writes = calls.filter((c) => c.kind === "updateMany");
      expect(writes).toHaveLength(2);
      expect(writes[0].where).toMatchObject({ status: "pending", attempts: 3 });
      expect(writes[1].where).toMatchObject({ status: "pending", attempts: 4 });
    } finally {
      client.botOutbox.findUnique = originalFind;
      client.botOutbox.updateMany = originalUpdateMany;
    }
  });

  test("a failure after an ack cannot reset a sent row", async () => {
    rows.set("f3", { id: "f3", status: "sent", attempts: 5, dedupeKey: "x" });
    expect(await failOutbox("f3", "boom", true, now)).toEqual({ ok: true, status: "sent" });
    expect(calls.filter((c) => c.kind === "updateMany")).toHaveLength(0);
    expect(rows.get("f3")).toMatchObject({ status: "sent", attempts: 5 });
  });

  test("a missing row is reported without any write", async () => {
    expect(await failOutbox("missing", "boom", true, now)).toEqual({ ok: false, code: "not_found" });
    expect(calls).toEqual([]);
  });
});
