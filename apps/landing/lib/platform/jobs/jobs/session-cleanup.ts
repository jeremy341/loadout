// session-cleanup: the scheduled retention sweep. It deletes Session rows whose expiry has passed (readViewer() already refuses
// an expired session, so this changes no access decision), WebhookReplay rows past the webhook tolerance, notifications past
// their retention, and AuditEvent rows older than AUDIT_RETENTION_DAYS. The summary is counts only: no token hashes, person ids,
// email addresses or audit payloads leave the job.
//
// Server only (uses the database and deletes rows).
import type { JobSummary } from "../registry";
import { purgeExpiredSessions } from "../../session";
import { db } from "../../db";
import { cleanupOldNotifications } from "../../notifications-data";

const DAY_MS = 86_400_000;
// Well past the five-minute webhook tolerance, so a replay row always outlives the timestamp it guards.
const WEBHOOK_REPLAY_KEEP_MS = 2 * 60 * 60 * 1000;
// Retention for the audit trail. Owner decision: change here and in the design notes together.
export const AUDIT_RETENTION_DAYS = 365;

export async function runSessionCleanup(now: Date): Promise<JobSummary> {
  const removed = await purgeExpiredSessions(now);
  const prisma = db();
  const replays = await prisma.webhookReplay.deleteMany({
    where: { seenAt: { lt: new Date(now.getTime() - WEBHOOK_REPLAY_KEEP_MS) } },
  });
  const notifications = await cleanupOldNotifications(now);
  const audit = await prisma.auditEvent.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - AUDIT_RETENTION_DAYS * DAY_MS) } },
  });
  return { removed, webhookReplays: replays.count, notifications, auditEvents: audit.count };
}
