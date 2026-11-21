// Hackatime link, project mapping and sync. Server only (uses the database). Every write records an AuditEvent in the same
// transaction (lib/platform/audit.ts). Audit rows and results never carry a Hackatime user id or a response body.
//
// API:
//   linkHackatime(personId, hackatimeUserId, now?) -> { ok: true } | { ok: false, code: "invalid-id" | "missing-person" | "banned" }
//   unlinkHackatime(personId)                      -> { ok: true }   removes the link and that person's HackatimeProject and HoursDay rows
//   mapProjectName(personId, name, projectId)      -> { ok: true } | { ok: false, code: "not-found" }   projectId null clears the mapping;
//                                                     a project the person does not own is "not-found" too
//   syncPerson(personId, now)                      -> SyncResult     fetch, normalise, replace the 120 day window, update the link
//   manualRefresh(personId, now)                   -> SyncResult     syncPerson behind a 10 minute limit (rate-limited, retryAt)
//   listLinkedPersonIds()                          -> string[]       linked people who are not banned, oldest link first
//   SyncResult: { ok: true, days, flagged } | { ok: false, code } where code is "not-linked" | "banned" | "rate-limited" | HackatimeErrorCode
import { recordAudit } from "../audit";
import { db } from "../db";
import {
  dailySecondsFor,
  fetchProjects,
  HackatimeApiError,
  isValidHackatimeUserId,
  type DailyRow,
  type HackatimeErrorCode,
  type ProjectTotal,
} from "./api";
import { canManualRefresh, dayKey, addDays, HISTORY_DAYS, normaliseDays } from "./rules";

export type SyncResult =
  | { ok: true; days: number; flagged: number }
  | { ok: false; code: "not-linked" | "banned" | "rate-limited" | HackatimeErrorCode; retryAt?: Date };

function dayDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export async function linkHackatime(
  personId: string,
  hackatimeUserId: string,
  now: Date = new Date(),
): Promise<{ ok: true } | { ok: false; code: "invalid-id" | "missing-person" | "banned" }> {
  if (!isValidHackatimeUserId(hackatimeUserId)) return { ok: false, code: "invalid-id" };
  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  if (!person) return { ok: false, code: "missing-person" };
  if (person.bannedAt) return { ok: false, code: "banned" };

  await db().$transaction(async (tx) => {
    const existing = await tx.hackatimeLink.findUnique({ where: { personId }, select: { hackatimeUserId: true } });
    // A different Hackatime account means the old account's hours must not survive the switch.
    if (existing && existing.hackatimeUserId !== hackatimeUserId) {
      await tx.hoursDay.deleteMany({ where: { personId } });
      await tx.hackatimeProject.deleteMany({ where: { personId } });
    }
    await tx.hackatimeLink.upsert({
      where: { personId },
      create: { personId, hackatimeUserId, linkedAt: now },
      update: { hackatimeUserId, lastError: null },
    });
    await recordAudit(tx, {
      actorId: personId,
      action: "hackatime.link",
      targetType: "person",
      targetId: personId,
      reason: existing ? "Changed the linked Hackatime account" : "Linked a Hackatime account",
      after: { relinked: Boolean(existing) },
    });
  });
  return { ok: true };
}

export async function unlinkHackatime(personId: string): Promise<{ ok: true }> {
  await db().$transaction(async (tx) => {
    await tx.hoursDay.deleteMany({ where: { personId } });
    await tx.hackatimeProject.deleteMany({ where: { personId } });
    await tx.hackatimeLink.deleteMany({ where: { personId } });
    await recordAudit(tx, {
      actorId: personId,
      action: "hackatime.unlink",
      targetType: "person",
      targetId: personId,
      reason: "Unlinked the Hackatime account",
    });
  });
  return { ok: true };
}

export async function mapProjectName(
  personId: string,
  name: string,
  projectId: string | null,
): Promise<{ ok: true } | { ok: false; code: "not-found" }> {
  // The project must be the person's own. Other people's projects answer "not-found" so ids cannot be probed.
  if (projectId !== null) {
    const project = await db().project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
    if (!project || project.ownerId !== personId) return { ok: false, code: "not-found" };
  }
  const row = await db().hackatimeProject.findUnique({
    where: { personId_name: { personId, name } },
    select: { id: true, projectId: true },
  });
  if (!row) return { ok: false, code: "not-found" };

  await db().$transaction(async (tx) => {
    await tx.hackatimeProject.update({ where: { id: row.id }, data: { projectId } });
    await recordAudit(tx, {
      actorId: personId,
      action: "hackatime.map-project",
      targetType: "hackatime-project",
      targetId: row.id,
      reason: projectId ? "Mapped a Hackatime project to a LOADOUT project" : "Cleared a Hackatime project mapping",
      before: { projectId: row.projectId },
      after: { projectId },
    });
  });
  return { ok: true };
}

// Project totals and per-day seconds for the window, one account at a time.
async function fetchWindow(
  hackatimeUserId: string,
  from: string,
  to: string,
): Promise<{ projects: ProjectTotal[]; daily: DailyRow[] }> {
  const projects = await fetchProjects(hackatimeUserId);
  const daily = await dailySecondsFor(hackatimeUserId, projects.map((p) => p.name), from, to);
  return { projects, daily };
}

export async function syncPerson(personId: string, now: Date): Promise<SyncResult> {
  const link = await db().hackatimeLink.findUnique({
    where: { personId },
    select: { hackatimeUserId: true, person: { select: { bannedAt: true } } },
  });
  if (!link) return { ok: false, code: "not-linked" };
  if (link.person.bannedAt) return { ok: false, code: "banned" };

  const today = dayKey(now);
  const from = addDays(today, -HISTORY_DAYS);
  const fetched = await fetchWindow(link.hackatimeUserId, from, today).then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, code: error instanceof HackatimeApiError ? error.code : ("network" as const) }),
  );
  if (!fetched.ok) {
    // Failures are recorded as a short code. lastSyncAt still moves, so a broken account cannot be hammered by refreshes.
    const { code } = fetched;
    await db().$transaction(async (tx) => {
      await tx.hackatimeLink.update({
        where: { personId },
        data: { lastSyncAt: now, lastStatus: code === "rate_limited" ? "rate-limited" : "error", lastError: code },
      });
      await recordAudit(tx, {
        actorId: personId,
        action: "hackatime.sync",
        targetType: "person",
        targetId: personId,
        reason: "Hackatime sync failed",
        after: { code },
      });
    });
    return { ok: false, code };
  }
  const { projects, daily } = fetched.value;

  const mapped = await db().hackatimeProject.findMany({ where: { personId }, select: { name: true, projectId: true } });
  const projectByName = new Map(mapped.map((m) => [m.name, m.projectId]));
  const { rows, flags } = normaliseDays(
    daily.map((r) => ({ day: r.day, name: r.name, seconds: r.seconds, projectId: projectByName.get(r.name) ?? null })),
    now,
  );

  await db().$transaction(async (tx) => {
    for (const p of projects) {
      await tx.hackatimeProject.upsert({
        where: { personId_name: { personId, name: p.name } },
        create: { personId, name: p.name, totalSeconds: Math.max(0, Math.round(p.seconds)) },
        update: { totalSeconds: Math.max(0, Math.round(p.seconds)) },
      });
    }
    // The 120 day window is rebuilt from the answer, so a day that dropped out of Hackatime is removed too. Rows older than the
    // window are kept as history. A window replace is one short statement, where per-row upserts in one interactive
    // transaction would run into its default timeout.
    await tx.hoursDay.deleteMany({ where: { personId, day: { gte: dayDate(from) } } });
    if (rows.length > 0) {
      await tx.hoursDay.createMany({
        data: rows.map((r) => ({ personId, hackatimeName: r.name, day: dayDate(r.day), seconds: r.seconds, source: "hackatime" })),
      });
    }
    await tx.hackatimeLink.update({
      where: { personId },
      data: { lastSyncAt: now, lastStatus: "ok", lastError: null },
    });
    await recordAudit(tx, {
      actorId: personId,
      action: "hackatime.sync",
      targetType: "person",
      targetId: personId,
      reason: "Synced Hackatime hours",
      after: { days: rows.length, flagged: flags.length, projects: projects.length },
    });
  });
  return { ok: true, days: rows.length, flagged: flags.length };
}

export async function manualRefresh(personId: string, now: Date): Promise<SyncResult> {
  const link = await db().hackatimeLink.findUnique({ where: { personId }, select: { lastSyncAt: true } });
  const allowed = canManualRefresh(link?.lastSyncAt ?? null, now);
  if (!allowed.ok) return { ok: false, code: "rate-limited", retryAt: allowed.retryAt };
  return syncPerson(personId, now);
}

export async function listLinkedPersonIds(): Promise<string[]> {
  const rows = await db().hackatimeLink.findMany({
    where: { person: { bannedAt: null } },
    select: { personId: true },
    orderBy: { linkedAt: "asc" },
  });
  return rows.map((r) => r.personId);
}

