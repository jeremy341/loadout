// Pure rules for project collaborators. No database; every function has a bun test (collaborators.test.ts).
// Hours stay per person: a collaborator's hours are their own HoursDay and ledger rows, and never move to the owner or the project's
// total. Collaboration gives credit and a place on the project, not a share of anyone else's work.
//
// API:
//   MAX_COLLABORATORS = 4                        invited and accepted rows count toward it; declined and removed rows do not
//   countsTowardLimit(status) -> boolean
//   canInvite({ actorId, project, target, blocked, existingStatus, activeCount })
//       project: { ownerId, status }. target: { id, banned }. existingStatus: the current row's status or null.
//       -> { ok: true } | { ok: false, code, message }
//       code: "not-owner" | "not-found" | "self" | "unavailable" | "already-invited" | "already-collaborating" | "full"
//       "unavailable" covers a banned or blocked builder, so a block is not revealed.
//   canRespond({ personId, row }) -> { ok: true } | { ok: false, message }   only the invited person, and only while invited
//   canRemove({ actorId, ownerId, row }) -> { ok: true } | { ok: false, message }   the owner or the collaborator themself
//   inviteTitle(ownerHandle, projectTitle) -> string     plain text, at most 120
//   acceptTitle(collaboratorHandle, projectTitle) -> string
import { clipText } from "./notifications";

export const MAX_COLLABORATORS = 4;

export const COLLABORATOR_STATUSES = ["invited", "accepted", "declined"] as const;
export type CollaboratorStatus = (typeof COLLABORATOR_STATUSES)[number];

export function countsTowardLimit(status: string): boolean {
  return status === "invited" || status === "accepted";
}

export type InviteCode = "not-owner" | "not-found" | "self" | "unavailable" | "already-invited" | "already-collaborating" | "full";

export function canInvite({
  actorId,
  project,
  target,
  blocked,
  existingStatus,
  activeCount,
}: {
  actorId: string;
  project: { ownerId: string; status: string };
  target: { id: string; banned: boolean };
  blocked: boolean;
  existingStatus: string | null;
  activeCount: number;
}): { ok: true } | { ok: false; code: InviteCode; message: string } {
  if (project.ownerId !== actorId) return { ok: false, code: "not-owner", message: "Only the owner can invite collaborators." };
  if (project.status === "banned") return { ok: false, code: "not-found", message: "That project was not found." };
  if (target.id === actorId) return { ok: false, code: "self", message: "You are already the owner of this project." };
  if (target.banned || blocked) return { ok: false, code: "unavailable", message: "That builder cannot be invited to this project." };
  if (existingStatus === "invited") return { ok: false, code: "already-invited", message: "That builder already has a pending invite." };
  if (existingStatus === "accepted") return { ok: false, code: "already-collaborating", message: "That builder already collaborates on this project." };
  if (activeCount >= MAX_COLLABORATORS) {
    return { ok: false, code: "full", message: `A project can have up to ${MAX_COLLABORATORS} collaborators. Remove one first.` };
  }
  return { ok: true };
}

export function canRespond({ personId, row }: { personId: string; row: { personId: string; status: string } }): { ok: true } | { ok: false; message: string } {
  if (row.personId !== personId || row.status !== "invited") return { ok: false, message: "That invite is not waiting for you." };
  return { ok: true };
}

export function canRemove({
  actorId,
  ownerId,
  row,
}: {
  actorId: string;
  ownerId: string;
  row: { personId: string };
}): { ok: true } | { ok: false; message: string } {
  if (actorId === ownerId || actorId === row.personId) return { ok: true };
  return { ok: false, message: "Only the owner or the collaborator can remove this." };
}

export function inviteTitle(ownerHandle: string | null, projectTitle: string): string {
  return clipText(`${ownerHandle ?? "A builder"} invited you to ${projectTitle}`, 120);
}

export function acceptTitle(collaboratorHandle: string | null, projectTitle: string): string {
  return clipText(`${collaboratorHandle ?? "A builder"} joined ${projectTitle}`, 120);
}
