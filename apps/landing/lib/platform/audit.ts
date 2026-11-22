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

// ---- Per-action review and collaborator rows (pure: the caller passes the result to recordAudit, inside the same transaction).
// The action strings are the ones the review desk and collaborator writes already store, so the history view (review-data.ts
// listShipAudits, which reads the "review." prefix) and the existing rows keep matching.
//
//   reviewAuditInput({ actorId, projectId, verb, reason, before?, after? }) -> AuditInput   action "review.<verb>"
//   collaboratorAuditInput({ actorId, projectId, verb, reason, after? })    -> AuditInput   action "collaborator.<verb>"
//   REVIEW_AUDIT_PREFIX "review.", COLLABORATOR_AUDIT_PREFIX "collaborator."
export const REVIEW_AUDIT_PREFIX = "review.";
export const COLLABORATOR_AUDIT_PREFIX = "collaborator.";
export const REVIEW_AUDIT_VERBS = [
  "claim",
  "pickup",
  "release_claim",
  "heartbeat",
  "triage",
  "journal",
  "verdict",
  "ban",
  "hold",
  "release_hold",
  "correction",
  "unship",
  "note",
] as const;
export type ReviewAuditVerb = (typeof REVIEW_AUDIT_VERBS)[number];
export const COLLABORATOR_AUDIT_VERBS = ["invite", "accept", "decline", "remove"] as const;
export type CollaboratorAuditVerb = (typeof COLLABORATOR_AUDIT_VERBS)[number];

// The audit reason is required and capped; an empty note is stored as "(no note)", as the review desk always did.
export function auditReason(raw: string | null | undefined): string {
  return (raw ?? "").trim().slice(0, REASON_MAX) || "(no note)";
}

export function reviewAuditInput(input: {
  actorId: string;
  projectId: string;
  verb: ReviewAuditVerb;
  reason: string | null | undefined;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}): AuditInput {
  return {
    actorId: input.actorId,
    action: `${REVIEW_AUDIT_PREFIX}${input.verb}`,
    targetType: "project",
    targetId: input.projectId,
    reason: auditReason(input.reason),
    before: input.before,
    after: input.after,
  };
}

export function collaboratorAuditInput(input: {
  actorId: string;
  projectId: string;
  verb: CollaboratorAuditVerb;
  reason: string | null | undefined;
  after?: Prisma.InputJsonValue;
}): AuditInput {
  return {
    actorId: input.actorId,
    action: `${COLLABORATOR_AUDIT_PREFIX}${input.verb}`,
    targetType: "project",
    targetId: input.projectId,
    reason: auditReason(input.reason),
    after: input.after,
  };
}

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
