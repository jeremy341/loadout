// Fulfillers and order commitments in the database. Server only (uses the database).
//   addFulfiller(actorId, personId, reason)      -> Result; audited
//   removeFulfiller(actorId, personId, reason)   -> Result; audited; refused while the fulfiller has any commitment
//   commitOrder(orderId, fulfillerId)            -> CommitResult; one open commitment per order
//   completeCommitment(commitmentId, fulfillerId) -> Result; marks the fulfiller's own commitment done
//   listCommitments(opts?)                        -> CommitmentRow[], newest first
//
// Caller checks: addFulfiller and removeFulfiller must be called from an owner action (requireAccess("owner") in actions.ts style);
// the actor id is recorded in the audit row, not checked here. commitOrder and completeCommitment take the fulfiller's own id from the
// session. A fulfiller cannot commit their own order (canCommit in shop-rules.ts).
//
// Schema note: Fulfiller -> FulfillmentCommitment cascades on delete, so removal is refused while any commitment exists rather than
// letting the history disappear.
import type { Prisma } from "../generated/prisma/client";
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { canCommit, canRemoveFulfiller } from "./shop-rules";

export type Result = { ok: true } | { ok: false; message: string };
export type CommitResult = { ok: true; commitmentId: string } | { ok: false; message: string };

export type CommitmentRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  fulfillerId: string;
  committedAt: Date;
  doneAt: Date | null;
};

export async function addFulfiller(actorId: string, personId: string, reason: unknown): Promise<Result> {
  const checked = checkReason(reason);
  if (!checked.ok) return { ok: false, message: checked.message };

  return db().$transaction(async (tx): Promise<Result> => {
    const person = await tx.person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
    if (!person || person.bannedAt) return { ok: false, message: "That person cannot be a fulfiller." };
    const existing = await tx.fulfiller.findUnique({ where: { personId }, select: { personId: true } });
    if (existing) return { ok: true };

    await tx.fulfiller.create({ data: { personId, addedById: actorId } });
    await recordAudit(tx, {
      actorId,
      action: "fulfiller.added",
      targetType: "Person",
      targetId: personId,
      reason: checked.reason,
      after: { fulfiller: true },
    });
    return { ok: true };
  });
}

export async function removeFulfiller(actorId: string, personId: string, reason: unknown): Promise<Result> {
  const checked = checkReason(reason);
  if (!checked.ok) return { ok: false, message: checked.message };

  return db().$transaction(async (tx): Promise<Result> => {
    const existing = await tx.fulfiller.findUnique({ where: { personId }, select: { personId: true } });
    if (!existing) return { ok: false, message: "That person is not a fulfiller." };
    const commitments = await tx.fulfillmentCommitment.count({ where: { fulfillerId: personId } });
    const verdict = canRemoveFulfiller(commitments);
    if (!verdict.ok) return verdict;

    await tx.fulfiller.delete({ where: { personId } });
    await recordAudit(tx, {
      actorId,
      action: "fulfiller.removed",
      targetType: "Person",
      targetId: personId,
      reason: checked.reason,
      before: { fulfiller: true },
    });
    return { ok: true };
  });
}

export async function commitOrder(orderId: string, fulfillerId: string): Promise<CommitResult> {
  return db().$transaction(async (tx): Promise<CommitResult> => {
    // Locks the order row so two fulfillers cannot both see "no open commitment" and both insert one.
    await tx.$queryRaw`SELECT "id" FROM "ShopOrder" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.shopOrder.findUnique({ where: { id: orderId }, select: { personId: true, status: true } });
    if (!order) return { ok: false, message: "That order does not exist." };

    const verdict = await commitCheck(tx, orderId, fulfillerId, order);
    if (!verdict.ok) return verdict;

    const commitment = await tx.fulfillmentCommitment.create({ data: { orderId, fulfillerId }, select: { id: true } });
    return { ok: true, commitmentId: commitment.id };
  });
}

async function commitCheck(
  tx: Prisma.TransactionClient,
  orderId: string,
  fulfillerId: string,
  order: { personId: string; status: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const fulfiller = await tx.fulfiller.findUnique({ where: { personId: fulfillerId }, select: { personId: true } });
  const person = await tx.person.findUnique({ where: { id: fulfillerId }, select: { bannedAt: true } });
  const openCommitments = await tx.fulfillmentCommitment.count({ where: { orderId, doneAt: null } });
  return canCommit({
    fulfillerId,
    isFulfiller: Boolean(fulfiller),
    fulfillerBanned: !person || Boolean(person.bannedAt),
    orderPersonId: order.personId,
    orderStatus: order.status,
    openCommitments,
  });
}

export async function completeCommitment(commitmentId: string, fulfillerId: string): Promise<Result> {
  const moved = await db().fulfillmentCommitment.updateMany({
    where: { id: commitmentId, fulfillerId, doneAt: null },
    data: { doneAt: new Date() },
  });
  if (moved.count !== 1) return { ok: false, message: "That commitment is not open for you." };
  return { ok: true };
}

export async function listCommitments(opts: { fulfillerId?: string; open?: boolean } = {}): Promise<CommitmentRow[]> {
  const rows = await db().fulfillmentCommitment.findMany({
    where: {
      ...(opts.fulfillerId ? { fulfillerId: opts.fulfillerId } : {}),
      ...(opts.open === undefined ? {} : opts.open ? { doneAt: null } : { doneAt: { not: null } }),
    },
    include: { order: { select: { number: true, status: true } } },
    orderBy: [{ committedAt: "desc" }, { id: "desc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.order.number,
    orderStatus: row.order.status,
    fulfillerId: row.fulfillerId,
    committedAt: row.committedAt,
    doneAt: row.doneAt,
  }));
}
