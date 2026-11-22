// Shop orders in the database. Server only (uses the database). The rules are in shop-rules.ts; this file runs them in transactions.
//   placeOrder({ personId, lines, useRequisition?, region?, approved })  -> PlaceResult
//   advanceOrder(orderId, actorId, next)                                 -> Result; placed -> packed -> shipped -> delivered only
//   shipOrder(orderId, actorId, { trackingNumber, carrier?, supplier? })  -> Result; packed -> shipped, records the tracking
//   cancelOrder(orderId, personId)                                       placed only: restocks and refunds the stored total
//   listOrdersFor(personId)                                              OrderRow[], newest first; cancelled orders included with cancelled: true
//   orderForPerson(personId, id)                                         OrderRow | null; id is the number in lower case ("lo-1101")
//   isActivePerson(personId)                                             false for a missing or banned person
//
// `approved` is the person's approved hours per track. The caller must derive it on the server (sampleApprovedHours() until real
// hours exist), never from form input. Prices are always re-read from the catalog: a line's price is never taken from the client.
//
// Caller checks: advanceOrder must only be called from a staff or fulfilment action (the actor is recorded, not checked here).
//
// Concurrency: each transaction first locks the Person row, so one person's balance check and ledger debit cannot interleave with
// another order from them. Stock is taken with a guarded update (stock >= quantity) that must match exactly one row. An order number
// that collides with a concurrent insert fails the unique index; the transaction is retried, and nothing from it is kept.
import type { Prisma } from "../generated/prisma/client";
import { recordAudit } from "./audit";
import { db } from "./db";
import { balances, checkLedgerEntry } from "./ledger";
import type { OrderStatus } from "./orders";
import type { Track } from "./progress";
import { requisitionsAvailable, requisitionsEarned } from "./requisitions";
import { shopItemById, type TrackHours } from "./shop";
import {
  checkAdvance,
  checkCancel,
  checkRegion,
  checkShipment,
  mergeRequestLines,
  nextOrderNumber,
  orderRowFromDb,
  priceOrder,
  shopItemFromRow,
  stockNeeds,
  usedFromRows,
  type MergedLine,
  type OrderRefusal,
  type OrderRequestLine,
  type OrderRow,
  type PricingItem,
} from "./shop-rules";

export type Result = { ok: true } | { ok: false; message: string };

export type PlaceInput = {
  personId: string;
  lines: readonly OrderRequestLine[];
  useRequisition?: Track;
  region?: string | null;
  approved: TrackHours;
};

export type PlaceResult = { ok: true; orderId: string; number: string; totalOre: number } | { ok: false; refusal: OrderRefusal };

// Thrown inside a transaction to roll it back, then turned into a refusal outside it.
class Refused extends Error {
  constructor(readonly refusal: OrderRefusal) {
    super(refusal.message);
  }
}

const MAX_ATTEMPTS = 3;

export async function isActivePerson(personId: string): Promise<boolean> {
  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  return Boolean(person) && !person?.bannedAt;
}

// Locks one Person row for the rest of the transaction.
async function lockPerson(tx: Prisma.TransactionClient, personId: string): Promise<{ bannedAt: Date | null } | null> {
  await tx.$queryRaw`SELECT "id" FROM "Person" WHERE "id" = ${personId} FOR UPDATE`;
  return tx.person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
}

export async function placeOrder(input: PlaceInput): Promise<PlaceResult> {
  const request = mergeRequestLines(input.lines);
  if (!request.ok) return request;
  const region = checkRegion(input.region);
  if (!region.ok) return region;

  for (let attempt = 1; ; attempt += 1) {
    try {
      const placed = await db().$transaction((tx) => placeInTx(tx, input, request.value, region.value), { timeout: 15_000 });
      return { ok: true, ...placed };
    } catch (error) {
      if (error instanceof Refused) return { ok: false, refusal: error.refusal };
      if (isUniqueViolation(error) && attempt < MAX_ATTEMPTS) continue;
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

async function placeInTx(
  tx: Prisma.TransactionClient,
  input: PlaceInput,
  lines: readonly MergedLine[],
  region: string | null,
): Promise<{ orderId: string; number: string; totalOre: number }> {
  const person = await lockPerson(tx, input.personId);
  if (!person || person.bannedAt) throw new Refused({ code: "person_unavailable", message: "This account cannot order right now." });

  const rows = await tx.shopItem.findMany({ where: { id: { in: lines.map((line) => line.itemId) } }, include: { stock: true } });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const items: PricingItem[] = lines.map((line) => {
    const row = byId.get(line.itemId);
    if (!row) throw new Refused({ code: "unknown_item", message: "That item is not in the shop.", itemId: line.itemId });
    const stock = row.stock.find((entry) => entry.option === line.option);
    return {
      item: shopItemFromRow(row, shopItemById(row.id)),
      option: line.option,
      quantity: line.quantity,
      stock: stock ? stock.stock : null,
      active: row.active,
    };
  });

  const used = await tx.requisitionUse.findMany({
    where: { personId: input.personId, OR: [{ orderId: null }, { order: { status: { not: "cancelled" } } }] },
    select: { track: true },
  });
  const available = requisitionsAvailable(requisitionsEarned(input.approved), usedFromRows(used));

  const groups = await tx.ledgerEntry.groupBy({ by: ["status"], where: { personId: input.personId }, _sum: { amountOre: true } });
  const confirmedOre = balances(groups.map((group) => ({ status: group.status, amountOre: group._sum.amountOre ?? 0 }))).confirmed;

  const priced = priceOrder({ items, approved: input.approved, available, requisitionTrack: input.useRequisition ?? null, confirmedOre });
  if (!priced.ok) throw new Refused(priced.refusal);

  for (const need of stockNeeds(priced.value.lines)) {
    const taken = await tx.shopOptionStock.updateMany({
      where: { itemId: need.itemId, option: need.option, stock: { gte: need.quantity } },
      data: { stock: { decrement: need.quantity } },
    });
    if (taken.count !== 1) throw new Refused({ code: "out_of_stock", message: "That item just sold out.", itemId: need.itemId });
  }

  const existing = await tx.shopOrder.findMany({ select: { number: true } });
  const number = nextOrderNumber(existing.map((row) => row.number));
  const now = new Date();

  const order = await tx.shopOrder.create({
    data: {
      number,
      personId: input.personId,
      status: "placed",
      totalOre: priced.value.totalOre,
      region,
      lines: {
        create: priced.value.lines.map((line) => ({ itemId: line.itemId, option: line.option, quantity: line.quantity, unitOre: line.unitOre })),
      },
      events: { create: { status: "placed", actorId: input.personId, at: now } },
      ...(priced.value.requisitionTrack ? { requisitions: { create: { personId: input.personId, track: priced.value.requisitionTrack } } } : {}),
    },
    select: { id: true, number: true, totalOre: true },
  });

  const entry = checkLedgerEntry({ amountOre: -order.totalOre, status: "confirmed", kind: "shop_purchase", reason: `Order ${number}` });
  if (!entry.ok) throw new Error(entry.message);
  await tx.ledgerEntry.create({
    data: {
      personId: input.personId,
      amountOre: entry.entry.amountOre,
      status: entry.entry.status,
      kind: entry.entry.kind,
      reason: entry.entry.reason,
      confirmedAt: now,
    },
  });

  await recordAudit(tx, {
    actorId: input.personId,
    action: "shop.order.placed",
    targetType: "ShopOrder",
    targetId: order.id,
    reason: `Placed order ${number}.`,
    after: {
      number,
      totalOre: order.totalOre,
      requisition: priced.value.requisitionTrack ?? "none",
      lines: priced.value.lines.map((line) => ({ itemId: line.itemId, option: line.option, quantity: line.quantity, unitOre: line.unitOre })),
    },
  });

  return { orderId: order.id, number: order.number, totalOre: order.totalOre };
}

// Moves an order one step on, guarded so a double submit cannot move it twice.
export async function advanceOrder(orderId: string, actorId: string, next: OrderStatus): Promise<Result> {
  return db().$transaction(async (tx): Promise<Result> => {
    const order = await tx.shopOrder.findUnique({ where: { id: orderId }, select: { number: true, status: true } });
    if (!order) return { ok: false, message: "That order does not exist." };
    const verdict = checkAdvance(order.status, next);
    if (!verdict.ok) return verdict;

    const moved = await tx.shopOrder.updateMany({ where: { id: orderId, status: order.status }, data: { status: next } });
    if (moved.count !== 1) return { ok: false, message: "The order changed while you were looking. Reload and try again." };

    await tx.orderStatusEvent.create({ data: { orderId, status: next, actorId } });
    await recordAudit(tx, {
      actorId,
      action: "shop.order.advanced",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: `Order ${order.number} moved from ${order.status} to ${next}.`,
      before: { status: order.status },
      after: { status: next },
    });
    return { ok: true };
  });
}

// Moves an order to shipped and records how it left: the tracking number, the carrier and the supplier. One transaction, so a
// shipped order always has its tracking row, and the compare-and-set on the status stops two fulfillers shipping the same parcel
// twice. The tracking number is required (checkShipment).
export async function shipOrder(
  orderId: string,
  actorId: string,
  input: { trackingNumber: unknown; carrier?: unknown; supplier?: unknown },
): Promise<Result> {
  const checked = checkShipment(input);
  if (!checked.ok) return { ok: false, message: checked.message };
  const shipment = checked.value;

  return db().$transaction(async (tx): Promise<Result> => {
    const order = await tx.shopOrder.findUnique({ where: { id: orderId }, select: { number: true, status: true } });
    if (!order) return { ok: false, message: "That order does not exist." };
    const verdict = checkAdvance(order.status, "shipped");
    if (!verdict.ok) return verdict;

    const moved = await tx.shopOrder.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: "shipped", shippedById: actorId, ...shipment },
    });
    if (moved.count !== 1) return { ok: false, message: "The order changed while you were looking. Reload and try again." };

    await tx.orderStatusEvent.create({ data: { orderId, status: "shipped", actorId } });
    await recordAudit(tx, {
      actorId,
      action: "shop.order.shipped",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: `Order ${order.number} shipped with tracking ${shipment.trackingNumber}.`,
      before: { status: order.status },
      after: { status: "shipped", trackingNumber: shipment.trackingNumber, carrier: shipment.carrier, supplier: shipment.supplier },
    });
    return { ok: true };
  });
}

// A builder cancels their own order while it is placed. Stock goes back and the stored total is refunded as a positive ledger
// entry. The requisition row stays linked to the order; availability ignores requisitions whose order is cancelled, so it can be spent again.
export async function cancelOrder(orderId: string, personId: string): Promise<Result> {
  return db().$transaction(async (tx): Promise<Result> => {
    const person = await lockPerson(tx, personId);
    if (!person || person.bannedAt) return { ok: false, message: "This account cannot change orders right now." };

    const order = await tx.shopOrder.findFirst({ where: { id: orderId, personId }, include: { lines: true } });
    if (!order) return { ok: false, message: "That order does not exist." };
    const verdict = checkCancel(order.status);
    if (!verdict.ok) return verdict;

    const moved = await tx.shopOrder.updateMany({ where: { id: orderId, status: "placed" }, data: { status: "cancelled" } });
    if (moved.count !== 1) return { ok: false, message: "The order changed while you were looking. Reload and try again." };

    for (const need of stockNeeds(order.lines)) {
      await tx.shopOptionStock.updateMany({
        where: { itemId: need.itemId, option: need.option },
        data: { stock: { increment: need.quantity } },
      });
    }

    const entry = checkLedgerEntry({ amountOre: order.totalOre, status: "confirmed", kind: "shop_refund", reason: `Refund for cancelled order ${order.number}` });
    if (!entry.ok) throw new Error(entry.message);
    await tx.ledgerEntry.create({
      data: { personId, amountOre: entry.entry.amountOre, status: entry.entry.status, kind: entry.entry.kind, reason: entry.entry.reason, confirmedAt: new Date() },
    });

    await tx.orderStatusEvent.create({ data: { orderId, status: "cancelled", actorId: personId } });
    await recordAudit(tx, {
      actorId: personId,
      action: "shop.order.cancelled",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: `Cancelled order ${order.number} while it was placed.`,
      before: { status: "placed" },
      after: { status: "cancelled", refundOre: order.totalOre },
    });
    return { ok: true };
  });
}

const ORDER_INCLUDE = { lines: true, events: true } as const;

export async function listOrdersFor(personId: string): Promise<OrderRow[]> {
  if (!(await isActivePerson(personId))) return [];
  const rows = await db().shopOrder.findMany({
    where: { personId },
    include: ORDER_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(orderRowFromDb);
}

// The id the pages use is the order number in lower case. A cuid is not accepted.
export async function orderForPerson(personId: string, id: string): Promise<OrderRow | null> {
  if (!(await isActivePerson(personId))) return null;
  const number = id.trim().toUpperCase();
  if (!/^LO-\d+$/.test(number)) return null;
  const row = await db().shopOrder.findFirst({ where: { personId, number }, include: ORDER_INCLUDE });
  return row ? orderRowFromDb(row) : null;
}
