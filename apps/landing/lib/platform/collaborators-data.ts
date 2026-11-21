// Collaborator reads and writes. Server only (uses the database). Pure rules are in collaborators.ts.
// Hours stay per person: nothing here moves hours or ledger rows between builders. Removing a collaborator is audited (AuditEvent,
// action "collaborator.remove"). Invites notify the invited builder ("collab-invite"); accepting notifies the owner ("collab-accepted").
//
// API:
//   inviteCollaborator(ownerId, projectId, handle)    -> WriteResult   owner only; max MAX_COLLABORATORS; re-invites a declined builder
//   respondToInvite(personId, projectId, rawDecision) -> WriteResult   "accept" | "decline"
//   removeCollaborator(actorId, projectId, handle)    -> WriteResult   owner removes anyone; a collaborator may remove themself
//   listCollaborators(projectId, viewerId)            -> { handle, status }[]   accepted only, plus pending invites for the owner
//   listInvitesFor(personId)                          -> InviteRow[]   pending invites for this builder, hiding banned owners and blocks
//   WriteResult = { ok: true } | { ok: false, message }
import { recordAudit } from "./audit";
import { isBlockedEitherWay, notBlockedWith } from "./blocks-data";
import { db } from "./db";
import { acceptTitle, canInvite, canRemove, canRespond, countsTowardLimit, inviteTitle } from "./collaborators";
import { clipText } from "./notifications";
import { notify } from "./notifications-data";
import { createRateLimiter } from "./rate-limit";

export type WriteResult = { ok: true } | { ok: false; message: string };
export type InviteRow = { projectId: string; projectTitle: string; ownerHandle: string | null };

const writeLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
const SLOW_DOWN = "Slow down a little and try again.";
const NOT_FOUND: WriteResult = { ok: false, message: "That project was not found." };
const NOT_BUILDER: WriteResult = { ok: false, message: "That builder was not found." };

function cleanHandle(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export async function inviteCollaborator(ownerId: string, projectId: unknown, rawHandle: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`invite:${ownerId}`).ok) return { ok: false, message: SLOW_DOWN };
  if (typeof projectId !== "string" || projectId === "") return NOT_FOUND;
  const handle = cleanHandle(rawHandle);
  if (handle === "") return NOT_BUILDER;

  const project = await db().project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, status: true, title: true, owner: { select: { handle: true } } },
  });
  if (!project) return NOT_FOUND;
  const target = await db().person.findUnique({ where: { handle }, select: { id: true, bannedAt: true } });
  if (!target) return NOT_BUILDER;

  const existing = await db().projectCollaborator.findUnique({
    where: { projectId_personId: { projectId, personId: target.id } },
    select: { status: true },
  });
  const rows = await db().projectCollaborator.findMany({ where: { projectId }, select: { status: true } });
  const verdict = canInvite({
    actorId: ownerId,
    project,
    target: { id: target.id, banned: target.bannedAt !== null },
    blocked: await isBlockedEitherWay(ownerId, target.id),
    existingStatus: existing?.status ?? null,
    activeCount: rows.filter((row) => countsTowardLimit(row.status)).length,
  });
  if (!verdict.ok) return { ok: false, message: verdict.message };

  await db().projectCollaborator.upsert({
    where: { projectId_personId: { projectId, personId: target.id } },
    create: { projectId, personId: target.id, status: "invited", invitedById: ownerId },
    update: { status: "invited", invitedById: ownerId },
  });
  await notify(target.id, "collab-invite", {
    title: inviteTitle(project.owner.handle, project.title),
    href: `/dashboard/projects/${projectId}`,
  });
  return { ok: true };
}

export async function respondToInvite(personId: string, projectId: unknown, rawDecision: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`respond:${personId}`).ok) return { ok: false, message: SLOW_DOWN };
  if (typeof projectId !== "string" || projectId === "") return NOT_FOUND;
  if (rawDecision !== "accept" && rawDecision !== "decline") return { ok: false, message: "Choose accept or decline." };
  const row = await db().projectCollaborator.findUnique({
    where: { projectId_personId: { projectId, personId } },
    select: { personId: true, status: true, project: { select: { title: true, ownerId: true } } },
  });
  if (!row) return { ok: false, message: "That invite is not waiting for you." };
  const verdict = canRespond({ personId, row });
  if (!verdict.ok) return verdict;

  const status = rawDecision === "accept" ? "accepted" : "declined";
  // The status guard keeps a double click from notifying the owner twice.
  const moved = await db().projectCollaborator.updateMany({
    where: { projectId, personId, status: "invited" },
    data: { status },
  });
  if (moved.count === 0) return { ok: false, message: "That invite is not waiting for you." };

  if (status === "accepted") {
    const me = await db().person.findUnique({ where: { id: personId }, select: { handle: true } });
    await notify(row.project.ownerId, "collab-accepted", {
      title: acceptTitle(me?.handle ?? null, row.project.title),
      href: `/dashboard/projects/${projectId}`,
    });
  }
  return { ok: true };
}

export async function removeCollaborator(actorId: string, projectId: unknown, rawHandle: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`remove:${actorId}`).ok) return { ok: false, message: SLOW_DOWN };
  if (typeof projectId !== "string" || projectId === "") return NOT_FOUND;
  const handle = cleanHandle(rawHandle);
  const target = handle === "" ? null : await db().person.findUnique({ where: { handle }, select: { id: true } });
  if (!target) return NOT_BUILDER;
  const row = await db().projectCollaborator.findUnique({
    where: { projectId_personId: { projectId, personId: target.id } },
    select: { personId: true, status: true, project: { select: { ownerId: true } } },
  });
  if (!row) return NOT_BUILDER;
  const verdict = canRemove({ actorId, ownerId: row.project.ownerId, row });
  if (!verdict.ok) return verdict;

  await db().$transaction(async (tx) => {
    await tx.projectCollaborator.deleteMany({ where: { projectId, personId: target.id } });
    await recordAudit(tx, {
      actorId,
      action: "collaborator.remove",
      targetType: "Project",
      targetId: projectId,
      reason: actorId === row.project.ownerId ? "Owner removed a collaborator from the project." : "Collaborator left the project.",
      before: { personId: target.id, status: row.status },
    });
  });
  return { ok: true };
}

export async function listCollaborators(projectId: string, viewerId: string): Promise<{ handle: string; status: string }[]> {
  const project = await db().project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!project) return [];
  const isOwner = project.ownerId === viewerId;
  const rows = await db().projectCollaborator.findMany({
    where: {
      projectId,
      status: isOwner ? { in: ["invited", "accepted"] } : "accepted",
      person: { bannedAt: null, handle: { not: null }, ...notBlockedWith(viewerId) },
    },
    orderBy: { person: { handle: "asc" } },
    take: 4,
    select: { status: true, person: { select: { handle: true } } },
  });
  return rows.flatMap((row) => (row.person.handle ? [{ handle: row.person.handle, status: row.status }] : []));
}

export async function listInvitesFor(personId: string): Promise<InviteRow[]> {
  const rows = await db().projectCollaborator.findMany({
    where: {
      personId,
      status: "invited",
      project: { status: { not: "banned" }, owner: { bannedAt: null, ...notBlockedWith(personId) } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { projectId: true, project: { select: { title: true, owner: { select: { handle: true } } } } },
  });
  return rows.map((row) => ({
    projectId: row.projectId,
    projectTitle: clipText(row.project.title, 120),
    ownerHandle: row.project.owner.handle,
  }));
}
