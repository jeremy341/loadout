// Shop orders in the database. Server only (uses the database). The rules are in shop-rules.ts; this file runs them in transactions.
//   placeOrder({ personId, lines, useRequisition?, region?, approved })  -> PlaceResult
//   cancelOrder(orderId, personId)                                       buyer: placed only; restocks and refunds the stored total
//   listOrdersFor(personId) / orderForPerson(personId, id)               the buyer's rows; tracking is on each shipped row
//   isActivePerson(personId)                                             false for a missing or banned person
//
// Staff transitions. Each one runs in one transaction, locks the order row, checks the claim and the own-order rule, moves the status
// with a compare-and-set (updateMany where status = the status it read), and writes one audit row inside the same transaction.
//   resolveOrderId(ref)                                                  "LO-1101" (any case) or the row id -> { id, number } | null
//   packOrder(orderId, fulfillerId, { supplier?, costCents })            placed -> packed; the open claim holder only; not while flagged
//   shipOrder(orderId, fulfillerId, { trackingNumber, carrier?, supplier?, costCents? })
//                                                                        packed -> shipped; the claim holder only; settles the payout
//   grantOrder(orderId, fulfillerId, { grantRef, costCents? })           placed -> delivered in one step; settles the grant payout
//   advanceOrder(orderId, actorId, "delivered")                          owner: shipped -> delivered. Other steps have their own functions.
//   cancelOrderAsStaff(orderId, actorId, expectedStatus)                 owner: placed or packed -> cancelled; restocks; refunds through the ledger
//   flagOrder / clearOrderFlag                                           over-budget flag, kept as order status events
//   updateShipmentInfo(orderId, actorId, { expectedStatus, ... })        owner: corrects tracking, carrier, supplier, cost after packing
//   listStaffOrders()                                                    staff rows with the LOADOUT stage and Pixl's key for each
//
// `approved` is the person's approved hours per track. The caller must derive it on the server (sampleApprovedHours() until real
// hours exist), never from form input. Prices are always re-read from the catalog: a line's price is never taken from the client.
//
// Caller checks: the staff functions take the actor id from the server session, never from form input. The actor is checked against the
// claim (fulfiller functions) and the owner role is checked by the action that calls the owner functions.
//
// Storage notes (no new columns for the staging build): the real cost is written to the audit row only; a grant's reference is the
// tracking number with the carrier "Grant"; flags are OrderStatusEvent rows with status "flagged" or "flag_cleared".
//
// Concurrency: each placement and cancellation first locks the Person row, so one person's balance check and ledger debit cannot
// interleave with another order from them. Staff transitions lock the ShopOrder row. Stock is taken with a guarded update (stock >=
// quantity) that must match exactly one row. An order number that collides with a concurrent insert fails the unique index; the
// transaction is retried, and nothing from it is kept.
import type { Prisma } from "../generated/prisma/client";
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { balances, checkLedgerEntry, type LedgerKind } from "./ledger";
import type { OrderStatus } from "./orders";
import type { Track } from "./progress";
import { requisitionsAvailable, requisitionsEarned } from "./requisitions";
import { shopItemById, type TrackHours } from "./shop";
import {
  CHANGED_MESSAGE,
  checkAdvance,
  checkCancel,
  checkCostCents,
  checkFlaggable,
  checkGrantRef,
  checkRegion,
  checkShipment,
  checkShipmentEdit,
  checkStaffCancel,
  FLAG_CLEARED_STATUS,
  FLAG_STATUS,
  fulfilmentPayoutOre,
  GRANT_CARRIER,
  isFlaggedFromEvents,
  itemCountOf,
  mergeRequestLines,
  nextOrderNumber,
  OWN_ORDER_MESSAGE,
  orderRowFromDb,
  priceOrder,
  shopItemFromRow,
  stockNeeds,
  usedFromRows,
  fulfilmentStage,
  FULFILMENT_STAGE_LABELS,
  PIXL_STAGE_KEY,
  type FulfilmentStage,
  type MergedLine,
  type OrderRefusal,
  type OrderRequestLine,
  type OrderRow,
  type PricingItem,
} from "./shop-rules";

export type Result = { ok: true } | { ok: false; message: string; code?: string };

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
const no = (code: string, message: string): Result => ({ ok: false, code, message });

export async function isActivePerson(personId: string): Promise<boolean> {
  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  return Boolean(person) && !person?.bannedAt;
}

// Locks one Person row for the rest of the transaction.
async function lockPerson(tx: Prisma.TransactionClient, personId: string): Promise<{ bannedAt: Date | null } | null> {
  await tx.$queryRaw`SELECT "id" FROM "Person" WHERE "id" = ${personId} FOR UPDATE`;
  return tx.person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
}

// Locks one order row and reads what the staff transitions need. Null when the order does not exist.
async function lockedOrder(tx: Prisma.TransactionClient, orderId: string) {
  await tx.$queryRaw`SELECT "id" FROM "ShopOrder" WHERE "id" = ${orderId} FOR UPDATE`;
  return tx.shopOrder.findUnique({
    where: { id: orderId },
    select: { number: true, status: true, personId: true, totalOre: true, lines: { select: { itemId: true, option: true, quantity: true } } },
  });
}

async function hasOpenClaim(tx: Prisma.TransactionClient, orderId: string, fulfillerId: string): Promise<boolean> {
  return (await tx.fulfillmentCommitment.count({ where: { orderId, fulfillerId, doneAt: null } })) > 0;
}

// Appends one confirmed ledger entry. checkLedgerEntry validates the sign and the kind before the write.
async function appendLedger(tx: Prisma.TransactionClient, personId: string, input: { amountOre: number; kind: LedgerKind; reason: string }): Promise<void> {
  const entry = checkLedgerEntry({ amountOre: input.amountOre, status: "confirmed", kind: input.kind, reason: input.reason });
  if (!entry.ok) throw new Error(entry.message);
  await tx.ledgerEntry.create({
    data: {
      personId,
      amountOre: entry.entry.amountOre,
      status: entry.entry.status,
      kind: entry.entry.kind,
      reason: entry.entry.reason,
      confirmedAt: new Date(),
    },
  });
}

// Closes the fulfiller's open claim on an order once the order has left their hands.
async function closeClaim(tx: Prisma.TransactionClient, orderId: string, fulfillerId: string, at: Date): Promise<void> {
  await tx.fulfillmentCommitment.updateMany({ where: { orderId, fulfillerId, doneAt: null }, data: { doneAt: at } });
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

  await appendLedger(tx, input.personId, { amountOre: -order.totalOre, kind: "shop_purchase", reason: `Order ${number}` });

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

// Resolves the reference a form posts: an order number ("LO-1101", any case) or the row id. Null when there is no such order.
export async function resolveOrderId(ref: string): Promise<{ id: string; number: string } | null> {
  const text = ref.trim();
  if (!text) return null;
  const number = text.toUpperCase();
  const or: Prisma.ShopOrderWhereInput[] = [{ id: text }];
  if (/^LO-\d+$/.test(number)) or.push({ number });
  return db().shopOrder.findFirst({ where: { OR: or }, select: { id: true, number: true } });
}

// Owner: shipped -> delivered. Packing and shipping have their own functions, because they check the claim and record the shipment.
export async function advanceOrder(orderId: string, actorId: string, next: OrderStatus): Promise<Result> {
  if (next !== "delivered") return no("use_action", "Pack and ship orders with their own actions, so the claim and the tracking are recorded.");
  return db().$transaction(async (tx): Promise<Result> => {
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === actorId) return no("own_order", OWN_ORDER_MESSAGE);
    const verdict = checkAdvance(order.status, next);
    if (!verdict.ok) return no("wrong_status", verdict.message);

    const moved = await tx.shopOrder.updateMany({ where: { id: orderId, status: order.status }, data: { status: next } });
    if (moved.count !== 1) return no("changed", CHANGED_MESSAGE);

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

// Claimed -> packed. Only the fulfiller holding the open claim can pack, and not while the order is flagged over budget. The supplier
// (where it was bought) is recorded on the order; the real cost goes in the audit row.
export async function packOrder(
  orderId: string,
  fulfillerId: string,
  input: { supplier?: unknown; costCents: unknown },
): Promise<Result> {
  const cost = checkCostCents(input.costCents);
  if (!cost.ok) return no("cost_required", cost.message);
  const supplier = checkShipmentEdit({ supplier: input.supplier ?? "" });
  if (!supplier.ok) return no("bad_supplier", supplier.message);
  const supplierName = supplier.value.supplier ?? null;

  return db().$transaction(async (tx): Promise<Result> => {
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === fulfillerId) return no("own_order", OWN_ORDER_MESSAGE);
    if (!(await hasOpenClaim(tx, orderId, fulfillerId))) return no("not_claimer", "Only the fulfiller who claimed this order can pack it.");
    const events = await tx.orderStatusEvent.findMany({ where: { orderId, status: { in: [FLAG_STATUS, FLAG_CLEARED_STATUS] } }, select: { status: true, at: true } });
    if (isFlaggedFromEvents(events)) return no("flagged", "This order is flagged over budget. An owner must clear the flag before it is packed.");
    const verdict = checkAdvance(order.status, "packed");
    if (!verdict.ok) return no("wrong_status", verdict.message);

    const moved = await tx.shopOrder.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: "packed", ...(supplierName ? { supplier: supplierName } : {}) },
    });
    if (moved.count !== 1) return no("changed", CHANGED_MESSAGE);

    await tx.orderStatusEvent.create({ data: { orderId, status: "packed", actorId: fulfillerId } });
    await recordAudit(tx, {
      actorId: fulfillerId,
      action: "shop.order.packed",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: `Order ${order.number} packed.`,
      before: { status: order.status },
      after: { status: "packed", supplier: supplierName, costCents: cost.value },
    });
    return { ok: true };
  });
}

// Packed -> shipped. The claim holder records the tracking number (required), the carrier and the supplier, and is paid the shipment
// payout (2 Ore per item) in the same transaction. The compare-and-set on the status stops a double ship from paying twice.
export async function shipOrder(
  orderId: string,
  actorId: string,
  input: { trackingNumber: unknown; carrier?: unknown; supplier?: unknown; costCents?: unknown },
): Promise<Result> {
  const checked = checkShipment(input);
  if (!checked.ok) return no("bad_shipment", checked.message);
  const shipment = checked.value;
  const cost = input.costCents === undefined ? { ok: true as const, value: null } : checkCostCents(input.costCents);
  if (!cost.ok) return no("bad_cost", cost.message);

  return db().$transaction(async (tx): Promise<Result> => {
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === actorId) return no("own_order", OWN_ORDER_MESSAGE);
    if (!(await hasOpenClaim(tx, orderId, actorId))) return no("not_claimer", "Only the fulfiller who claimed this order can ship it.");
    const verdict = checkAdvance(order.status, "shipped");
    if (!verdict.ok) return no("wrong_status", verdict.message);

    const moved = await tx.shopOrder.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: "shipped",
        shippedById: actorId,
        trackingNumber: shipment.trackingNumber,
        ...(shipment.carrier ? { carrier: shipment.carrier } : {}),
        ...(shipment.supplier ? { supplier: shipment.supplier } : {}),
      },
    });
    if (moved.count !== 1) return no("changed", CHANGED_MESSAGE);

    const now = new Date();
    await tx.orderStatusEvent.create({ data: { orderId, status: "shipped", actorId, at: now } });
    await closeClaim(tx, orderId, actorId, now);

    const items = itemCountOf(order.lines);
    const payout = fulfilmentPayoutOre({ items, grant: false });
    if (payout > 0) await appendLedger(tx, actorId, { amountOre: payout, kind: "fulfilment_payout", reason: `Shipped ${order.number}, ${items} item${items === 1 ? "" : "s"}` });

    await recordAudit(tx, {
      actorId,
      action: "shop.order.shipped",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: `Order ${order.number} shipped with tracking ${shipment.trackingNumber}.`,
      before: { status: order.status },
      after: { status: "shipped", trackingNumber: shipment.trackingNumber, carrier: shipment.carrier, supplier: shipment.supplier, costCents: cost.value, payoutOre: payout },
    });
    return { ok: true };
  });
}

// A grant skips the item pipeline: placed -> delivered in one step, with the grant reference and the 1 Ore grant payout. The claim
// holder sends it, the same as a shipment.
export async function grantOrder(
  orderId: string,
  fulfillerId: string,
  input: { grantRef: unknown; costCents?: unknown },
): Promise<Result> {
  const ref = checkGrantRef(input.grantRef);
  if (!ref.ok) return no("ref_required", ref.message);
  const cost = input.costCents === undefined ? { ok: true as const, value: null } : checkCostCents(input.costCents);
  if (!cost.ok) return no("bad_cost", cost.message);

  return db().$transaction(async (tx): Promise<Result> => {
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === fulfillerId) return no("own_order", OWN_ORDER_MESSAGE);
    if (!(await hasOpenClaim(tx, orderId, fulfillerId))) return no("not_claimer", "Only the fulfiller who claimed this order can send the grant.");
    if (order.status !== "placed") return no("wrong_status", "Only a new or claimed order can be sent as a grant.");

    const moved = await tx.shopOrder.updateMany({
      where: { id: orderId, status: "placed" },
      data: { status: "delivered", trackingNumber: ref.value, carrier: GRANT_CARRIER, shippedById: fulfillerId },
    });
    if (moved.count !== 1) return no("changed", CHANGED_MESSAGE);

    const now = new Date();
    await tx.orderStatusEvent.create({ data: { orderId, status: "delivered", actorId: fulfillerId, at: now } });
    await closeClaim(tx, orderId, fulfillerId, now);

    const payout = fulfilmentPayoutOre({ items: 0, grant: true });
    await appendLedger(tx, fulfillerId, { amountOre: payout, kind: "fulfilment_payout", reason: `Grant for ${order.number}` });

    await recordAudit(tx, {
      actorId: fulfillerId,
      action: "shop.order.granted",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: `Grant sent for order ${order.number}.`,
      before: { status: "placed" },
      after: { status: "delivered", grantRef: ref.value, costCents: cost.value, payoutOre: payout },
    });
    return { ok: true };
  });
}

// A builder cancels their own order while it is placed. Stock goes back and the stored total is refunded as a positive ledger
// entry. The requisition row stays linked to the order; availability ignores requisitions whose order is cancelled, so it can be spent again.
export async function cancelOrder(orderId: string, personId: string): Promise<Result> {
  return db().$transaction(async (tx): Promise<Result> => {
    const person = await lockPerson(tx, personId);
    if (!person || person.bannedAt) return no("person_unavailable", "This account cannot change orders right now.");

    const order = await tx.shopOrder.findFirst({ where: { id: orderId, personId }, include: { lines: true } });
    if (!order) return no("not_found", "That order does not exist.");
    const verdict = checkCancel(order.status);
    if (!verdict.ok) return no("wrong_status", verdict.message);

    const moved = await tx.shopOrder.updateMany({ where: { id: orderId, status: "placed" }, data: { status: "cancelled" } });
    if (moved.count !== 1) return no("changed", CHANGED_MESSAGE);

    for (const need of stockNeeds(order.lines)) {
      await tx.shopOptionStock.updateMany({
        where: { itemId: need.itemId, option: need.option },
        data: { stock: { increment: need.quantity } },
      });
    }

    await appendLedger(tx, personId, { amountOre: order.totalOre, kind: "shop_refund", reason: `Refund for cancelled order ${order.number}` });

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

// Owner: cancel and refund before the order ships. Restocks every line, refunds the stored total through the ledger, closes any
// open claim, and refuses if the order has moved on from expectedStatus (a stale form cannot cancel a newer order).
export async function cancelOrderAsStaff(orderId: string, actorId: string, expectedStatus: string): Promise<Result> {
  const target = await db().shopOrder.findUnique({ where: { id: orderId }, select: { personId: true } });
  if (!target) return no("not_found", "That order does not exist.");

  return db().$transaction(async (tx): Promise<Result> => {
    await lockPerson(tx, target.personId);
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === actorId) return no("own_order", OWN_ORDER_MESSAGE);
    const verdict = checkStaffCancel(order.status);
    if (!verdict.ok) return no("wrong_status", verdict.message);
    if (expectedStatus !== order.status) return no("status_changed", "The order has moved on since the form was opened. Reload and check it first.");

    const moved = await tx.shopOrder.updateMany({ where: { id: orderId, status: order.status }, data: { status: "cancelled" } });
    if (moved.count !== 1) return no("changed", CHANGED_MESSAGE);

    for (const need of stockNeeds(order.lines)) {
      await tx.shopOptionStock.updateMany({ where: { itemId: need.itemId, option: need.option }, data: { stock: { increment: need.quantity } } });
    }

    const now = new Date();
    await appendLedger(tx, order.personId, { amountOre: order.totalOre, kind: "shop_refund", reason: `Refund for cancelled order ${order.number}` });
    await tx.fulfillmentCommitment.updateMany({ where: { orderId, doneAt: null }, data: { doneAt: now } });
    await tx.orderStatusEvent.create({ data: { orderId, status: "cancelled", actorId, at: now } });
    await recordAudit(tx, {
      actorId,
      action: "shop.order.cancelled_by_staff",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: `Owner cancelled order ${order.number} and refunded it through the ledger.`,
      before: { status: order.status },
      after: { status: "cancelled", refundOre: order.totalOre },
    });
    return { ok: true };
  });
}

// Over budget: the claim holder flags the order, and it cannot be packed until an owner clears the flag. The note is the audit reason.
export async function flagOrder(orderId: string, fulfillerId: string, note: unknown): Promise<Result> {
  const checked = checkReason(note);
  if (!checked.ok) return no("note_required", checked.message);

  return db().$transaction(async (tx): Promise<Result> => {
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === fulfillerId) return no("own_order", OWN_ORDER_MESSAGE);
    if (!(await hasOpenClaim(tx, orderId, fulfillerId))) return no("not_claimer", "Only the fulfiller who claimed this order can flag it.");
    const verdict = checkFlaggable(order.status);
    if (!verdict.ok) return no("wrong_status", verdict.message);
    const events = await tx.orderStatusEvent.findMany({ where: { orderId, status: { in: [FLAG_STATUS, FLAG_CLEARED_STATUS] } }, select: { status: true, at: true } });
    if (isFlaggedFromEvents(events)) return no("already_flagged", "This order is already flagged.");

    await tx.orderStatusEvent.create({ data: { orderId, status: FLAG_STATUS, actorId: fulfillerId } });
    await recordAudit(tx, {
      actorId: fulfillerId,
      action: "shop.order.flagged",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: checked.reason,
      before: { flagged: false },
      after: { flagged: true },
    });
    return { ok: true };
  });
}

// Owner: clears the over-budget flag so the order can be packed.
export async function clearOrderFlag(orderId: string, actorId: string, reason: string): Promise<Result> {
  return db().$transaction(async (tx): Promise<Result> => {
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === actorId) return no("own_order", OWN_ORDER_MESSAGE);
    const events = await tx.orderStatusEvent.findMany({ where: { orderId, status: { in: [FLAG_STATUS, FLAG_CLEARED_STATUS] } }, select: { status: true, at: true } });
    if (!isFlaggedFromEvents(events)) return no("not_flagged", "This order is not flagged.");

    await tx.orderStatusEvent.create({ data: { orderId, status: FLAG_CLEARED_STATUS, actorId } });
    await recordAudit(tx, {
      actorId,
      action: "shop.order.flag_cleared",
      targetType: "ShopOrder",
      targetId: orderId,
      reason,
      before: { flagged: true },
      after: { flagged: false },
    });
    return { ok: true };
  });
}

// Owner: corrects the tracking, carrier, supplier or cost after packing. A blank field is left alone. Refuses if the order has moved on
// from expectedStatus, so a stale edit cannot overwrite a newer tracking number.
export async function updateShipmentInfo(
  orderId: string,
  actorId: string,
  input: { expectedStatus: string; trackingNumber?: unknown; carrier?: unknown; supplier?: unknown; costCents?: unknown; reason: string },
): Promise<Result> {
  const edit = checkShipmentEdit({ trackingNumber: input.trackingNumber, carrier: input.carrier, supplier: input.supplier });
  if (!edit.ok) return no("bad_shipment", edit.message);
  const cost = input.costCents === undefined || input.costCents === null ? { ok: true as const, value: null } : checkCostCents(input.costCents);
  if (!cost.ok) return no("bad_cost", cost.message);

  return db().$transaction(async (tx): Promise<Result> => {
    const order = await lockedOrder(tx, orderId);
    if (!order) return no("not_found", "That order does not exist.");
    if (order.personId === actorId) return no("own_order", OWN_ORDER_MESSAGE);
    if (!["packed", "shipped", "delivered"].includes(order.status)) return no("wrong_status", "Only a packed or shipped order has tracking to correct.");
    if (input.expectedStatus !== order.status) return no("status_changed", "The order has moved on since the form was opened. Reload and check it first.");

    const data = { ...edit.value };
    if (Object.keys(data).length > 0) {
      const moved = await tx.shopOrder.updateMany({ where: { id: orderId, status: order.status }, data });
      if (moved.count !== 1) return no("changed", CHANGED_MESSAGE);
    }
    await recordAudit(tx, {
      actorId,
      action: "shop.order.info_updated",
      targetType: "ShopOrder",
      targetId: orderId,
      reason: input.reason,
      before: { status: order.status },
      after: { ...edit.value, ...(cost.value === null ? {} : { costCents: cost.value }) },
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

// One row per order for the staff pages. The stage is LOADOUT's name; pixlKey is Pixl's stored key for the same stage.
// Caller checks: staff only (the reviewer pages call it from a guarded page).
export type StaffOrderRow = {
  id: string;
  number: string;
  stage: FulfilmentStage;
  stageLabel: string;
  pixlKey: string;
  status: string;
  buyerId: string;
  totalOre: number;
  itemCount: number;
  region: string | null;
  placedAt: Date;
  claimedById: string | null;
  flagged: boolean;
  grant: boolean;
  tracking: { number: string; carrier: string | null } | null;
  supplier: string | null;
};

export async function listStaffOrders(): Promise<StaffOrderRow[]> {
  const rows = await db().shopOrder.findMany({
    include: {
      lines: { select: { quantity: true } },
      events: { select: { status: true, at: true } },
      commitments: { where: { doneAt: null }, select: { fulfillerId: true }, take: 1 },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const out: StaffOrderRow[] = [];
  for (const row of rows) {
    const claimedById = row.commitments[0]?.fulfillerId ?? null;
    const stage = fulfilmentStage(row.status, claimedById !== null);
    if (!stage) continue;
    out.push({
      id: row.id,
      number: row.number,
      stage,
      stageLabel: FULFILMENT_STAGE_LABELS[stage],
      pixlKey: PIXL_STAGE_KEY[stage],
      status: row.status,
      buyerId: row.personId,
      totalOre: row.totalOre,
      itemCount: itemCountOf(row.lines),
      region: row.region,
      placedAt: row.createdAt,
      claimedById,
      flagged: isFlaggedFromEvents(row.events),
      grant: row.carrier === GRANT_CARRIER,
      tracking: row.trackingNumber ? { number: row.trackingNumber, carrier: row.carrier ?? null } : null,
      supplier: row.supplier ?? null,
    });
  }
  return out;
}
