import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import * as realDb from "@/lib/platform/db";

type OrderFixture = {
  id: string;
  number: string;
  status: string;
  totalOre: number;
  region: string | null;
  createdAt: Date;
  trackingNumber: string | null;
  carrier: string | null;
  lines: { option: string; quantity: number; item: { name: string } }[];
  events: { status: string; at: Date; actorId: string | null }[];
  commitments: { fulfiller: { person: { displayName: string; slackId: string | null } } }[];
  person: { id: string; displayName: string; handle: string | null; slackId: string | null };
};

let orders: OrderFixture[] = [];

const findMany = mock(async ({ skip = 0, take = 50 }: { skip?: number; take?: number }) =>
  orders.slice(skip, skip + take),
);
const client = { shopOrder: { findMany } };

mock.module("@/lib/platform/db", () => ({
  ...realDb,
  databaseConfigured: () => true,
  db: () => client as never,
}));
afterAll(() => mock.restore());

const { listShopOrders } = await import("./live-ops");

function order(index: number, status = "placed", claimedBy?: string): OrderFixture {
  return {
    id: `order-${index}`,
    number: `LO-${1000 + index}`,
    status,
    totalOre: 100,
    region: "Testland",
    createdAt: new Date(Date.UTC(2026, 10, 24) - index * 1000),
    trackingNumber: null,
    carrier: null,
    lines: [{ option: "Large", quantity: 1, item: { name: "Test jacket" } }],
    events: [],
    commitments: claimedBy
      ? [{ fulfiller: { person: { displayName: "Test fulfiller", slackId: claimedBy } } }]
      : [],
    person: { id: `person-${index}`, displayName: "Private Buyer", handle: "private-handle", slackId: "private-slack" },
  };
}

beforeEach(() => {
  orders = [];
  findMany.mockClear();
});

describe("live fulfilment order listing", () => {
  test("continues scanning until filtered rows fill the requested page", async () => {
    orders = [
      ...Array.from({ length: 240 }, (_, index) => order(index + 1, "packed")),
      ...Array.from({ length: 40 }, (_, index) => order(index + 241, "placed")),
    ];

    const result = await listShopOrders("pending", 10, { offset: 5 });

    expect(result.map((row) => row.id)).toEqual(Array.from({ length: 10 }, (_, index) => 1246 + index));
    expect(findMany.mock.calls.length).toBeGreaterThan(1);
  });

  test("applies offset after filtering the complete matching set", async () => {
    orders = Array.from({ length: 402 }, (_, index) => order(index + 1));

    const result = await listShopOrders(undefined, 201, { offset: 200 });

    expect(result).toHaveLength(201);
    expect(result[0]?.id).toBe(1201);
    expect(result.at(-1)?.id).toBe(1401);
  });

  test("matches packed and delivered tabs to their Pixl-shaped row statuses", async () => {
    orders = [order(1, "packed"), order(2, "delivered")];

    expect((await listShopOrders("packed")).map((row) => row.status)).toEqual(["credited"]);
    expect((await listShopOrders("delivered")).map((row) => row.status)).toEqual(["done"]);
  });

  test("does not let a fulfiller search unclaimed orders by private buyer identity", async () => {
    orders = [order(1)];

    expect(await listShopOrders(undefined, 10, { viewerSlack: "fulfiller", search: "Private Buyer" })).toEqual([]);
    expect(await listShopOrders(undefined, 10, { viewerSlack: "fulfiller", search: "private-handle" })).toEqual([]);
    expect(await listShopOrders(undefined, 10, { viewerSlack: "fulfiller", search: "private-slack" })).toEqual([]);
  });

  test("allows private buyer search for the assigned fulfiller and owner", async () => {
    orders = [order(1, "placed", "fulfiller")];

    expect(await listShopOrders(undefined, 10, { viewerSlack: "fulfiller", search: "Private Buyer" })).toHaveLength(1);
    expect(await listShopOrders(undefined, 10, { allowPrivateNames: true, search: "private-handle" })).toHaveLength(1);
  });
});
