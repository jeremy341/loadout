// The bot's reminders, countdowns and polls (the BotJob table). Server only. The limits and the time window are in jobs.ts.
//
// API:
//   listPendingJobs() -> JobRow[]                         every job not yet done, soonest first (the bot reloads these at startup)
//   countPendingJobs(ownerSlackId, kind) -> number
//   createJob(input) -> { ok: true, job } | { ok: false, code: "limit" }
//   finishJob(id, now?) -> boolean                        marks it done; a cancel is the same call. False when there is no such job.
import type { Prisma } from "../../generated/prisma/client";
import { db } from "../db";
import { hasRoom, type JobKind } from "./jobs";

export type JobRow = { id: string; kind: JobKind; ownerSlackId: string; runAt: string; payload: Record<string, unknown> };
export type CreateJobResult = { ok: true; job: JobRow } | { ok: false; code: "limit" };

function toJob(row: { id: string; kind: string; ownerSlackId: string; runAt: Date; payload: unknown }): JobRow {
  return {
    id: row.id,
    kind: row.kind as JobKind,
    ownerSlackId: row.ownerSlackId,
    runAt: row.runAt.toISOString(),
    payload: row.payload as Record<string, unknown>,
  };
}

export async function listPendingJobs(): Promise<JobRow[]> {
  const rows = await db().botJob.findMany({ where: { doneAt: null }, orderBy: { runAt: "asc" }, take: 1000 });
  return rows.map(toJob);
}

export async function countPendingJobs(ownerSlackId: string, kind: JobKind): Promise<number> {
  return db().botJob.count({ where: { ownerSlackId, kind, doneAt: null } });
}

export async function createJob(input: { kind: JobKind; ownerSlackId: string; runAt: Date; payload: Record<string, unknown> }): Promise<CreateJobResult> {
  // A transaction-scoped advisory lock keyed to (owner, kind) serialises the count and the insert. Without it two callers can
  // both see N-1 pending jobs and both create, blowing the quota by one. The lock is released when the transaction ends.
  const row = await db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`bot-job:${input.ownerSlackId}:${input.kind}`}))`;
    const pending = await tx.botJob.count({ where: { ownerSlackId: input.ownerSlackId, kind: input.kind, doneAt: null } });
    if (!hasRoom(input.kind, pending)) return null;
    return tx.botJob.create({
      data: {
        kind: input.kind,
        ownerSlackId: input.ownerSlackId,
        runAt: input.runAt,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  });
  if (!row) return { ok: false, code: "limit" };
  return { ok: true, job: toJob(row) };
}

export async function finishJob(id: string, now = new Date()): Promise<boolean> {
  const row = await db().botJob.findUnique({ where: { id }, select: { id: true, doneAt: true } });
  if (!row) return false;
  if (row.doneAt === null) await db().botJob.update({ where: { id }, data: { doneAt: now } });
  return true;
}
