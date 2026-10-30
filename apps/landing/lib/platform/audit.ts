import type { Prisma, PrismaClient } from "../generated/prisma/client";

export const REASON_MIN = 10;
export const REASON_MAX = 500;

export type ReasonResult = { ok: true; reason: string } | { ok: false; message: string };

// Every staff write needs a written reason. Trimmed, then checked for length.
export function checkReason(raw: unknown): ReasonResult {
  const reason = typeof raw === "string" ? raw.trim() : "";
  if (reason.length < REASON_MIN) {
    return { ok: false, message: `Write the reason in at least ${REASON_MIN} characters.` };
  }
  if (reason.length > REASON_MAX) {
    return { ok: false, message: `Keep the reason under ${REASON_MAX} characters.` };
  }
  return { ok: true, reason };
}

export type AuditInput = {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
};

// Writes one audit row. Call it inside the same transaction as the change it records.
export async function recordAudit(tx: Prisma.TransactionClient | PrismaClient, input: AuditInput) {
  return tx.auditEvent.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      before: input.before,
      after: input.after,
    },
  });
}
