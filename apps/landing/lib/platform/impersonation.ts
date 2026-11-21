// Staff impersonation: a staff member opens the participant dashboard as one builder, to see what that builder sees.
//
// Ported from Stasis (references/stasis @ 7a230ced9ad793f0ad4cda30a7d71c02a58da6b6):
//   app/api/admin/impersonate/route.ts   POST: admin only, "cannot impersonate yourself", a NEW session is created for the target,
//                                        1 hour long, and the action is audited (ADMIN_IMPERSONATE). DELETE: end it.
//   app/components/ImpersonationBanner.tsx  the banner with an "End Impersonation" button on every dashboard page.
// What is kept 1:1: admin-only start, the self guard, a fresh one-hour session for the target (never the staff member's own
// session, never a shared token), an audit row at the start, a banner that always says who is being acted as, and an explicit end.
// What differs, on purpose:
//   - Stasis swaps the browser's session cookie for the target's and stashes the admin's own token in a second cookie so it can
//     swap back. Here the staff session is never touched: the impersonation lives in its own httpOnly cookie
//     (IMPERSONATION_COOKIE in session.ts) that readViewer() prefers on the participant site only. Ending is deleting that cookie
//     and revoking its session, so there is no admin token sitting in a second cookie and nothing to restore.
//   - Stasis keeps no record beyond the audit log. Here an Impersonation row (actor, subject, tokenHash, reason, startedAt,
//     endedAt) says who looked at whom and for how long; the audit rows carry the same facts with the written reason.
//   - Stasis has no reason prompt and no "other admins" guard (its route only refuses yourself). LOADOUT asks for a written reason
//     (lib/platform/audit.ts checkReason, as every staff write does) and also refuses owners and admins as the subject, so
//     impersonation can never be used to step sideways into a stronger account.
//   - Stasis's banner reads a non-httpOnly cookie in the browser. Here it is a server component that asks the database, so a
//     forged or stale cookie cannot make it show or hide anything, and the subject's browser never receives a thing.
//
// Who may start one (the owner's access matrix): the "reviewer" requirement, plus an extra gate: an owner, or a person holding an
// "admin" role grant. "admin" is not a role the review site reads (lib/reviewer/access.ts STAFF_ROLES does not list it, and
// access-levels.test.ts pins that an "admin" grant alone opens nothing); it is only the marker this gate looks for, written by
// the superadmin bootstrap page. So an admin grant on its own adds no access, and owners stay env-only.
//
// This file has no Next imports beyond what session.ts already pulls in, so the lifecycle is testable against the local database.
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { hashToken, newToken, ownerEmails } from "./session";
import { resolvePersonAccess, satisfies } from "@/lib/reviewer/access";

// The role-grant value the superadmin bootstrap writes and the impersonation gate reads (Stasis's Role.ADMIN).
export const ADMIN_ROLE = "admin";

// One hour, as Stasis (maxAge 60 * 60 on both the session row and the cookie). Impersonating is a short look, not a login.
export const IMPERSONATION_MINUTES = 60;

export function impersonationExpiry(now: Date): Date {
  return new Date(now.getTime() + IMPERSONATION_MINUTES * 60 * 1000);
}

export type StaffPerson = { id: string; email: string; roles: readonly string[] };
export type SubjectPerson = StaffPerson & { bannedAt: Date | null };

// The gate for starting: the "reviewer" requirement (owners pass every requirement, a reviewer needs the grant and no no_review
// marker) and then owner-or-admin. Role grants come in raw, so the "admin" marker is visible even though access.ts ignores it.
export function mayImpersonate(person: StaffPerson, owners: readonly string[]): boolean {
  const access = resolvePersonAccess(person, owners);
  if (!access || !satisfies(access, "reviewer")) return false;
  return access.isOwner || person.roles.includes(ADMIN_ROLE);
}

// One message for every subject refusal. The specific reason belongs in the audit row only: the error a staff member sees must not
// reveal which guard stopped them (for example, that an account is an owner or is banned).
export const SUBJECT_REFUSAL_MESSAGE = "That builder can't be acted as.";

export type SubjectRefusal = {
  code: "self" | "owner" | "admin" | "banned";
  // The specific, internal reason. Written to the audit event, never shown to the caller.
  reason: string;
  // The single generic message returned to the caller.
  message: string;
};

const refuse = (code: SubjectRefusal["code"], reason: string): SubjectRefusal => ({ code, reason, message: SUBJECT_REFUSAL_MESSAGE });

// Why this person cannot be the subject, or null. Stasis refuses yourself; the owner, admin and banned checks are LOADOUT's.
export function subjectRefusal(actor: StaffPerson, subject: SubjectPerson, owners: readonly string[]): SubjectRefusal | null {
  if (subject.id === actor.id) return refuse("self", "Refused: the staff member tried to impersonate themselves.");
  if (owners.includes(subject.email.trim().toLowerCase())) return refuse("owner", "Refused: the subject is an owner.");
  if (subject.roles.includes(ADMIN_ROLE)) return refuse("admin", "Refused: the subject is an admin.");
  if (subject.bannedAt) return refuse("banned", "Refused: the subject is banned.");
  return null;
}

export type StartResult =
  | { ok: true; token: string; expiresAt: Date; impersonationId: string }
  | { ok: false; message: string };

type Tx = Parameters<Parameters<ReturnType<typeof db>["$transaction"]>[0]>[0];

// Closes one open impersonation: stamps endedAt, revokes the subject session the cookie carried, writes the audit row. All in
// the caller's transaction, so a half-ended impersonation cannot exist.
async function closeRow(
  tx: Tx,
  row: { id: string; actorId: string; subjectId: string; tokenHash: string; startedAt: Date },
  reason: string,
  now: Date,
): Promise<void> {
  await tx.impersonation.update({ where: { id: row.id }, data: { endedAt: now } });
  await tx.session.deleteMany({ where: { tokenHash: row.tokenHash } });
  await recordAudit(tx, {
    actorId: row.actorId,
    action: "impersonation.end",
    targetType: "Person",
    targetId: row.subjectId,
    reason,
    before: { impersonationId: row.id, startedAt: row.startedAt.toISOString(), endedAt: null },
    after: { impersonationId: row.id, endedAt: now.toISOString() },
  });
}

// Opens an impersonation. The raw token is returned once for the cookie; only its hash is stored (on the session and on the
// Impersonation row, which is where the unique index on tokenHash guarantees one row per token). A staff member has at most one
// open impersonation: starting another closes the first, so the banner never has two answers.
export async function startImpersonation(input: {
  actorId: string;
  subjectId: string;
  reason: unknown;
  now?: Date;
}): Promise<StartResult> {
  const reason = checkReason(input.reason);
  if (!reason.ok) return { ok: false, message: reason.message };
  const now = input.now ?? new Date();
  const owners = ownerEmails();

  const [actor, subject] = await Promise.all([
    db().person.findUnique({ where: { id: input.actorId }, include: { roles: true } }),
    db().person.findUnique({ where: { id: input.subjectId }, include: { roles: true } }),
  ]);
  if (!actor || actor.bannedAt) return { ok: false, message: "You can't do that." };
  const actorPerson: StaffPerson = { id: actor.id, email: actor.email, roles: actor.roles.map((grant) => grant.role) };
  if (!mayImpersonate(actorPerson, owners)) return { ok: false, message: "Impersonating needs an owner or admin." };
  if (!subject) return { ok: false, message: "That builder has no account to act as." };
  const refusal = subjectRefusal(
    actorPerson,
    { id: subject.id, email: subject.email, roles: subject.roles.map((grant) => grant.role), bannedAt: subject.bannedAt },
    owners,
  );
  if (refusal) {
    // The refusal is a staff action worth recording: the audit row carries the specific reason, the caller gets only the generic
    // message. Written outside the transaction because nothing else changes on a refusal.
    await recordAudit(db(), {
      actorId: actor.id,
      action: "impersonation.refused",
      targetType: "Person",
      targetId: subject.id,
      reason: refusal.reason,
      before: { code: refusal.code },
    });
    return { ok: false, message: refusal.message };
  }

  const token = newToken();
  const tokenHash = hashToken(token);
  const expiresAt = impersonationExpiry(now);

  const created = await db().$transaction(async (tx) => {
    const open = await tx.impersonation.findMany({ where: { actorId: actor.id, endedAt: null } });
    for (const row of open) await closeRow(tx, row, "Replaced by a new impersonation.", now);
    await tx.session.create({ data: { personId: subject.id, tokenHash, expiresAt } });
    const row = await tx.impersonation.create({
      data: { actorId: actor.id, subjectId: subject.id, tokenHash, reason: reason.reason, startedAt: now },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "impersonation.start",
      targetType: "Person",
      targetId: subject.id,
      reason: reason.reason,
      after: { impersonationId: row.id, subjectId: subject.id, expiresAt: expiresAt.toISOString() },
    });
    return row;
  });
  return { ok: true, token, expiresAt, impersonationId: created.id };
}

// Ends the impersonation the cookie token belongs to. Anyone holding the token may end it (it is httpOnly, held only by the
// staff member), and an already-ended or unknown token is a quiet false, so ending twice is safe. An expired but unclosed row is
// closed here too, which is the only place a lapsed impersonation gets its endedAt.
export async function endImpersonation(token: string, now = new Date()): Promise<boolean> {
  const tokenHash = hashToken(token);
  return db().$transaction(async (tx) => {
    const row = await tx.impersonation.findUnique({ where: { tokenHash } });
    if (!row || row.endedAt) return false;
    await closeRow(tx, row, "Impersonation ended.", now);
    return true;
  });
}

export type ActiveImpersonation = {
  id: string;
  actor: { id: string; displayName: string };
  // The subject as readViewer's toViewer expects it.
  subject: {
    id: string;
    email: string;
    displayName: string;
    bannedAt: Date | null;
    roles: { role: string }[];
  };
};

// The open impersonation for a cookie token, or null. Re-checked on every read, so it stops working the moment any of these
// is false: the row was ended, its session was revoked or ran out, the staff member lost the gate or was banned, or the subject
// has since become an owner or admin or was banned.
export async function readImpersonation(token: string, now = new Date()): Promise<ActiveImpersonation | null> {
  const tokenHash = hashToken(token);
  const row = await db().impersonation.findUnique({
    where: { tokenHash },
    include: { actor: { include: { roles: true } }, subject: { include: { roles: true } } },
  });
  if (!row || row.endedAt) return null;
  const session = await db().session.findUnique({ where: { tokenHash }, select: { personId: true, expiresAt: true } });
  if (!session || session.personId !== row.subjectId || session.expiresAt <= now) return null;
  if (row.actor.bannedAt) return null;

  const owners = ownerEmails();
  const actor: StaffPerson = { id: row.actor.id, email: row.actor.email, roles: row.actor.roles.map((grant) => grant.role) };
  if (!mayImpersonate(actor, owners)) return null;
  const subject: SubjectPerson = {
    id: row.subject.id,
    email: row.subject.email,
    roles: row.subject.roles.map((grant) => grant.role),
    bannedAt: row.subject.bannedAt,
  };
  if (subjectRefusal(actor, subject, owners)) return null;
  return {
    id: row.id,
    actor: { id: row.actor.id, displayName: row.actor.displayName },
    subject: row.subject,
  };
}
