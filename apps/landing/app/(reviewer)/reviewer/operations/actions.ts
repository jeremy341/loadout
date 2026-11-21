"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/platform/db";
import { readViewer } from "@/lib/platform/session";
import { checkReason } from "@/lib/platform/audit";
import { operationStatus, parseOperationDate } from "@/lib/reviewer/program-operations";
import { guardedAction } from "@/reviewer-dash/lib/guard";
import type { Prisma } from "@/lib/generated/prisma/client";
import { operationAuditState } from "./audit";

function back(slug: string, message: string, ok = false): never {
  const query = new URLSearchParams({ [ok ? "ok" : "error"]: message });
  if (slug) query.set("slug", slug);
  if (ok) revalidatePath("/reviewer/operations");
  redirect(`/operations?${query}`);
}

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function actorId() {
  const viewer = await readViewer();
  if (!viewer) throw new Error("Session unavailable");
  return viewer.impersonation?.actorId ?? viewer.id;
}

export const createOperation = guardedAction("createOperation", "owner", async (_access, form: FormData) => {
  const name = field(form, "name");
  const slug = field(form, "slug");
  const startsAt = parseOperationDate(form.get("startsAt"));
  const endsAt = parseOperationDate(form.get("endsAt"));
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) back("", "Use lowercase letters, numbers and dashes for the slug.");
  if (!name || name.length > 120) back("", "Enter a name up to 120 characters.");
  if (!startsAt || !endsAt || endsAt <= startsAt || endsAt <= new Date()) back("", "Enter a valid time range ending in the future.");
  const checkedReason = checkReason(field(form, "reason"));
  if (!checkedReason.ok) back("", checkedReason.message);

  const actor = await actorId();
  try {
    await db().$transaction(async (tx) => {
      const operation = await tx.programOperation.create({ data: { slug, name, startsAt, endsAt } });
      await tx.auditEvent.create({ data: {
        actorId: actor, action: "operation.create", targetType: "operation", targetId: operation.id,
        reason: checkedReason.reason, after: operationAuditState(operation, new Date()),
      } });
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") back("", "An operation already uses that slug.");
    throw error;
  }
  back(slug, "Operation created.", true);
});

export const controlOperation = guardedAction("controlOperation", "owner", async (_access, form: FormData) => {
  const slug = field(form, "slug");
  const action = field(form, "control");
  const operation = await db().programOperation.findUnique({ where: { slug } });
  if (!operation) back("", "Operation not found.");
  if (String(operation.version) !== field(form, "version")) back(slug, "The operation changed. Review its current settings and try again.");
  const now = new Date();
  const status = operationStatus(operation, now);
  if (status === "Ended") back(slug, "This operation has already ended.");
  // A Scheduled operation has not started: ending it now would erase a schedule with nothing to report.
  if (action === "end" && status === "Scheduled") back(slug, "A scheduled operation cannot be ended before it starts.");
  const checkedReason = checkReason(field(form, "note"));
  if (!checkedReason.ok) back(slug, checkedReason.message);

  const data: Prisma.ProgramOperationUpdateManyMutationInput = { version: { increment: 1 } };
  const before = operationAuditState(operation, now);
  const after = { ...before };
  if (action === "pause" && status !== "Paused") {
    data.pausedAt = now;
    after.pausedAt = now.toISOString();
    after.status = "Paused";
  } else if (action === "resume" && status === "Paused") {
    data.pausedAt = null;
    after.pausedAt = null;
    after.status = operationStatus({ ...operation, pausedAt: null }, now);
  } else if (action === "end" && form.get("confirmEnd") === "yes") {
    data.endedAt = now;
    after.endedAt = now.toISOString();
    after.status = "Ended";
  } else if (action === "extend" || action === "edit") {
    const endsAt = parseOperationDate(form.get("endsAt"));
    const startsAt = action === "edit" && now < operation.startsAt
      ? parseOperationDate(form.get("startsAt"))
      : operation.startsAt;
    if (!startsAt || !endsAt || endsAt <= startsAt || endsAt <= now) back(slug, "Enter a valid time range ending in the future.");
    if (action === "extend" && endsAt <= operation.endsAt) back(slug, "The new end time must be later.");
    data.endsAt = endsAt;
    after.endsAt = endsAt.toISOString();
    if (action === "edit") {
      const name = field(form, "name");
      if (!name || name.length > 120) back(slug, "Enter a name up to 120 characters.");
      data.name = name;
      data.startsAt = startsAt;
      after.name = name;
      after.startsAt = startsAt.toISOString();
      after.status = operationStatus({ ...operation, startsAt }, now);
    }
  } else {
    back(slug, "This change is unavailable or needs confirmation.");
  }

  const actor = await actorId();
  const saved = await db().$transaction(async (tx) => {
    const result = await tx.programOperation.updateMany({
      where: { id: operation.id, version: operation.version, endsAt: { gt: new Date() }, endedAt: null },
      data,
    });
    if (!result.count) return false;
    await tx.auditEvent.create({ data: {
      actorId: actor, action: `operation.${action}`, targetType: "operation", targetId: operation.id,
      reason: checkedReason.reason,
      before,
      after,
    } });
    return true;
  });
  if (!saved) back(slug, "The operation changed or ended. Review its current status.");
  back(slug, "Operation updated.", true);
});
