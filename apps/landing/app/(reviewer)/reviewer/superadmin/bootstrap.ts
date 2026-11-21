import { createHash, timingSafeEqual } from "node:crypto";
import { recordAudit } from "@/lib/platform/audit";
import { db } from "@/lib/platform/db";
import { ADMIN_ROLE } from "@/lib/platform/impersonation";

// The superadmin bootstrap: how the first admin grant gets written without a database console.
//
// Ported from Stasis (references/stasis @ 7a230ced9ad793f0ad4cda30a7d71c02a58da6b6):
//   app/superadmin/page.tsx     a bare page with one "Grant Admin Access" button
//   app/api/superadmin/route.ts POST: 404 when SUPERADMIN_EMAIL is unset, 404 when nobody is signed in, 404 when the signed-in email
//                               is not that email, 403 unless the person signed in through Hack Club Auth, then upsert the admin
//                               role (grantedBy: themselves) and write the SUPERADMIN_GRANT audit row.
// What is kept 1:1: the page does not exist (404) until the environment switch is set; a person who is not signed in gets the same
// 404; the grant needs a Hack Club Auth identity (Person.hcaId, relaxed only for local test accounts, which never run in
// production); the grant is an upsert of the admin role on the signed-in person themselves; every use is audited.
// What differs: Stasis names one allowed email in SUPERADMIN_EMAIL. LOADOUT names a secret (LOADOUT_SUPERADMIN_BOOTSTRAP_SECRET)
// that the person types, so the switch is a value only the people who run the deployment hold, never an address in the code or the
// repository. It is compared in constant time and attempts are rate limited (actions.ts). The grant is the "admin" marker that the
// impersonation gate reads (lib/platform/impersonation.ts); it adds no access of its own and never makes an owner.

// A bootstrap secret is the only thing between a reviewer and the admin marker, so a short or well-known placeholder is no
// better than no secret at all. Such a value is treated as OFF (the page stays a 404) and reported loudly in the server log.
export const MIN_BOOTSTRAP_SECRET_LENGTH = 16;

const WEAK_SECRETS = new Set([
  "changeme", "change-me", "change_me", "letmein", "password", "password123", "adminadmin", "secretsecret", "supersecret",
  "super-secret", "your-secret-here", "replace-me",
]);

// Why a configured value is unusable, or null when it is strong enough. Never echoes the value itself.
export function weakSecretReason(value: string): string | null {
  if (value.length < MIN_BOOTSTRAP_SECRET_LENGTH) return `shorter than ${MIN_BOOTSTRAP_SECRET_LENGTH} characters`;
  if (WEAK_SECRETS.has(value.toLowerCase())) return "a well-known placeholder";
  if (/^(.)\1+$/.test(value)) return "a single repeated character";
  return null;
}

// The configured secret, or null when the switch is off. Blank, short and placeholder values all mean off; a weak value warns
// loudly rather than leaving a one-word switch guarding the admin grant.
export function bootstrapSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const value = env.LOADOUT_SUPERADMIN_BOOTSTRAP_SECRET?.trim();
  if (!value) return null;
  const weak = weakSecretReason(value);
  if (weak) {
    console.warn(
      `[loadout] LOADOUT_SUPERADMIN_BOOTSTRAP_SECRET is ${weak}; the superadmin bootstrap is DISABLED. Set a long, random secret to enable it.`,
    );
    return null;
  }
  return value;
}

// Constant-time comparison. Both sides are hashed first so the buffers are always the same length and the length of the real
// secret does not leak through an early return.
export function secretMatches(provided: unknown, secret: string): boolean {
  if (typeof provided !== "string" || provided.length === 0) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

export type BootstrapPerson = { id: string; hcaId: string | null };

// The bootstrap is for staff who already hold some power: an owner from LOADOUT_OWNER_EMAILS, or a person who already holds the
// admin marker. A plain reviewer with only the shared secret must not be able to promote themselves. The marker is checked from
// the grants read with the Person row, so a revoked grant closes this gate on the next request.
export function mayBootstrap(access: { isOwner: boolean; roles: readonly string[] }): boolean {
  return access.isOwner || access.roles.includes(ADMIN_ROLE);
}

export type BootstrapDecision =
  | { ok: true }
  | { ok: false; status: "not_found" | "forbidden" | "wrong_secret"; message: string };

// The whole gate as one pure function, in Stasis's order: switch off -> 404, nobody signed in -> 404, no Hack Club Auth identity ->
// 403, then the secret. `hcaOptional` is true for local test accounts only.
export function bootstrapDecision(input: {
  secret: string | null;
  person: BootstrapPerson | null;
  provided: unknown;
  hcaOptional?: boolean;
}): BootstrapDecision {
  if (!input.secret) return { ok: false, status: "not_found", message: "Not found." };
  if (!input.person) return { ok: false, status: "not_found", message: "Not found." };
  if (!input.person.hcaId && !input.hcaOptional) {
    return { ok: false, status: "forbidden", message: "Sign in with Hack Club Auth to do this." };
  }
  if (!secretMatches(input.provided, input.secret)) {
    return { ok: false, status: "wrong_secret", message: "That is not the bootstrap secret." };
  }
  return { ok: true };
}

// Writes the admin grant and its audit event in one transaction. Idempotent like Stasis's upsert (a second call changes no grant),
// but every call is audited, as Stasis's is. before/after hold the person's role list so the audit shows what the grant changed.
export async function grantAdmin(personId: string): Promise<{ created: boolean }> {
  return db().$transaction(async (tx) => {
    const before = (await tx.roleGrant.findMany({ where: { personId }, select: { role: true }, orderBy: { role: "asc" } })).map(
      (grant) => grant.role,
    );
    const created = !before.includes(ADMIN_ROLE);
    await tx.roleGrant.upsert({
      where: { personId_role: { personId, role: ADMIN_ROLE } },
      create: { personId, role: ADMIN_ROLE },
      update: {},
    });
    await recordAudit(tx, {
      actorId: personId,
      action: "superadmin.grant",
      targetType: "Person",
      targetId: personId,
      reason: "Superadmin bootstrap.",
      before: { roles: before },
      after: { roles: [...new Set([...before, ADMIN_ROLE])].sort() },
    });
    return { created };
  });
}
