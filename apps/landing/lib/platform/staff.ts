import { db } from "./db";
import { recordAudit, type ReasonResult } from "./audit";
import { STAFF_ROLE } from "./session";

export type AccessChange = {
  personId: string;
  staff: boolean;
  banned: boolean;
};

export type AccessResult =
  | { ok: true; changed: string[] }
  | { ok: false; message: string };

// Applies role and ban changes in one transaction, with one audit row per changed setting.
// The actor cannot remove their own staff role or ban themselves.
export async function updatePersonAccess(
  actorId: string,
  change: AccessChange,
  reason: Extract<ReasonResult, { ok: true }>,
): Promise<AccessResult> {
  return db().$transaction(async (tx) => {
    const person = await tx.person.findUnique({
      where: { id: change.personId },
      include: { roles: true },
    });
    if (!person) return { ok: false as const, message: "That person no longer exists." };

    const isStaff = person.roles.some((grant) => grant.role === STAFF_ROLE);
    const isBanned = person.bannedAt !== null;
    const self = person.id === actorId;

    if (self && (!change.staff || change.banned)) {
      return { ok: false as const, message: "You cannot remove your own staff role or ban yourself." };
    }

    const changed: string[] = [];

    if (change.staff !== isStaff) {
      if (change.staff) {
        await tx.roleGrant.create({ data: { personId: person.id, role: STAFF_ROLE } });
      } else {
        await tx.roleGrant.deleteMany({ where: { personId: person.id, role: STAFF_ROLE } });
      }
      await recordAudit(tx, {
        actorId,
        action: change.staff ? "role.grant" : "role.revoke",
        targetType: "person",
        targetId: person.id,
        reason: reason.reason,
        before: { role: STAFF_ROLE, granted: isStaff },
        after: { role: STAFF_ROLE, granted: change.staff },
      });
      changed.push(change.staff ? "Staff role granted" : "Staff role removed");
    }

    if (change.banned !== isBanned) {
      await tx.person.update({
        where: { id: person.id },
        data: change.banned
          ? { bannedAt: new Date(), banReason: reason.reason }
          : { bannedAt: null, banReason: null },
      });
      await recordAudit(tx, {
        actorId,
        action: change.banned ? "person.ban" : "person.unban",
        targetType: "person",
        targetId: person.id,
        reason: reason.reason,
        before: { banned: isBanned },
        after: { banned: change.banned },
      });
      changed.push(change.banned ? "Account banned" : "Ban lifted");
    }

    if (changed.length === 0) {
      return { ok: false as const, message: "Change a setting before saving." };
    }
    return { ok: true as const, changed };
  });
}
