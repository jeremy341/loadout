import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import * as realDb from "../db";

// In-memory stand-in for the Prisma client. It records the order of the lock, count and create so the test proves the quota
// check and the insert happen together inside one transaction, not as two racy statements on the shared client.
let pending = 0;
let calls: string[] = [];
let lockKeys: string[] = [];
let created: Array<Record<string, unknown>> = [];
let transactions = 0;

const client = {
  $transaction: async (fn: (tx: typeof client) => Promise<unknown>) => {
    transactions += 1;
    return fn(client);
  },
  $executeRaw: (_strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push("lock");
    lockKeys.push(String(values[0]));
    return Promise.resolve(0);
  },
  botJob: {
    count: async () => {
      calls.push("count");
      return pending;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      calls.push("create");
      const row = { id: `j${created.length + 1}`, ...data };
      created.push(row);
      pending += 1;
      return row;
    },
    findMany: async () => [],
    findUnique: async () => null,
    update: async () => ({}),
  },
};

mock.module("../db", () => ({ ...realDb, db: () => client }));
afterAll(() => mock.restore());

const { createJob } = await import("./jobs-data");

beforeEach(() => {
  pending = 0;
  calls = [];
  lockKeys = [];
  created = [];
  transactions = 0;
});

describe("createJob quota", () => {
  const runAt = new Date("2026-11-21T10:00:00.000Z");

  test("locks, counts and creates inside one transaction, with a key scoped to owner and kind", async () => {
    pending = 19; // one below the reminder limit of 20
    const result = await createJob({ kind: "reminder", ownerSlackId: "U123", runAt, payload: { text: "hi" } });

    expect(result.ok).toBe(true);
    expect(transactions).toBe(1);
    expect(calls).toEqual(["lock", "count", "create"]);
    expect(lockKeys).toEqual(["bot-job:U123:reminder"]);
    expect(pending).toBe(20);
    if (result.ok) expect(result.job).toMatchObject({ kind: "reminder", ownerSlackId: "U123", runAt: runAt.toISOString() });
  });

  test("a full quota creates nothing and never reaches the insert", async () => {
    pending = 5; // the countdown limit
    const result = await createJob({ kind: "countdown", ownerSlackId: "U123", runAt, payload: {} });

    expect(result).toEqual({ ok: false, code: "limit" });
    expect(transactions).toBe(1);
    expect(calls).toEqual(["lock", "count"]);
    expect(created).toEqual([]);
    expect(pending).toBe(5);
  });

  test("the lock key separates owners and kinds so their quotas are independent", async () => {
    pending = 0;
    await createJob({ kind: "reminder", ownerSlackId: "U1", runAt, payload: {} });
    await createJob({ kind: "poll", ownerSlackId: "U1", runAt, payload: {} });
    await createJob({ kind: "reminder", ownerSlackId: "U2", runAt, payload: {} });
    expect(lockKeys).toEqual(["bot-job:U1:reminder", "bot-job:U1:poll", "bot-job:U2:reminder"]);
  });
});
