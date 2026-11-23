// Queue rules: how long a ship has waited, which ships look stuck, which queue a reviewer may see, and what a hold means.
// Pure. The caller supplies the timestamps; nothing reads the clock here except through the `now` argument.
//
// API:
//   QUEUE_TYPES = ["software", "hardware", "all"], QueueType
//   WAIT_AGED_MS = 7 days (a ship waiting longer is flagged as aged)
//   queueWaitStart({ firstShippedAt, approvedAt, updatedAt }) -> number
//       the wait counts from the first ship; an update to an already approved project starts a new wait at the update
//   queueWaitMs(input, now)              -> number (never negative)
//   resolveQueueFilter({ requested, reviewerLimitedTo }) -> { filter, forced }
//       a reviewer limited to one queue is held to that queue on the server, whatever they ask for
//   filterShips(ships, filter)           -> ships
//   checkHoldReason(raw)                 -> { ok: true, reason } | { ok: false, message }
//   queueHealth(ships, now)              -> { total, byType, aged, heldIds }
import { cleanPlainText } from "./text";

export const QUEUE_TYPES = ["software", "hardware", "all"] as const;
export type QueueType = (typeof QUEUE_TYPES)[number];
export type ShipQueueType = Exclude<QueueType, "all">;

export const WAIT_AGED_MS = 7 * 24 * 60 * 60 * 1000;
export const HOLD_REASON_MIN = 3;
export const HOLD_REASON_MAX = 280;

// True when an already approved project was updated after its approval.
function updatedSinceApproval(approvedAt: number | null, updatedAt: number | null): updatedAt is number {
  if (approvedAt === null || updatedAt === null) return false;
  return updatedAt > approvedAt;
}

export function queueWaitStart(input: { firstShippedAt: number; approvedAt: number | null; updatedAt: number | null }): number {
  return updatedSinceApproval(input.approvedAt, input.updatedAt) ? input.updatedAt : input.firstShippedAt;
}

export function queueWaitMs(input: Parameters<typeof queueWaitStart>[0], now: number): number {
  return Math.max(0, now - queueWaitStart(input));
}

export function resolveQueueFilter(input: { requested: unknown; reviewerLimitedTo: ShipQueueType | null }): { filter: QueueType; forced: boolean } {
  if (input.reviewerLimitedTo !== null) return { filter: input.reviewerLimitedTo, forced: true };
  const requested = (QUEUE_TYPES as readonly unknown[]).includes(input.requested) ? (input.requested as QueueType) : "all";
  return { filter: requested, forced: false };
}

export type QueueShip = { id: string; type: ShipQueueType; firstShippedAt: number; approvedAt: number | null; updatedAt: number | null; held: boolean };

export function filterShips<T extends { type: ShipQueueType }>(ships: readonly T[], filter: QueueType): T[] {
  return filter === "all" ? [...ships] : ships.filter((ship) => ship.type === filter);
}

export type HoldCheck = { ok: true; reason: string } | { ok: false; message: string };

export function checkHoldReason(raw: unknown): HoldCheck {
  const reason = cleanPlainText(raw);
  if (reason.length < HOLD_REASON_MIN || reason.length > HOLD_REASON_MAX) {
    return { ok: false, message: `Give a hold reason of ${HOLD_REASON_MIN} to ${HOLD_REASON_MAX} characters.` };
  }
  return { ok: true, reason };
}

export function queueHealth(ships: readonly QueueShip[], now: number) {
  const queued = ships.filter((ship) => !ship.held);
  return {
    total: queued.length,
    byType: {
      software: queued.filter((ship) => ship.type === "software").length,
      hardware: queued.filter((ship) => ship.type === "hardware").length,
    },
    aged: queued.filter((ship) => queueWaitMs(ship, now) >= WAIT_AGED_MS).map((ship) => ship.id),
    heldIds: ships.filter((ship) => ship.held).map((ship) => ship.id),
  };
}
