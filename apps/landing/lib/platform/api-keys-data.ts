// API key reads and writes. Server only (uses the database). The rules are in api-keys.ts.
//
// API:
//   createApiKey(personId, name, scopes, expiresAt?, now?) -> CreateResult   plaintext is returned ONCE, never stored
//   revokeApiKey(personId, id, now?)                       -> { ok, message? }
//   listApiKeys(personId, now?)                            -> KeyView[]      never a hash or a plaintext
//   authenticateBearer(authorizationHeader, now?)          -> BearerAuth     used by api-v1/guard.ts
//   recordKeyRejection(event)                              -> void           AuditEvent for a refused key; never the key itself
//
// Every create and revoke writes an AuditEvent in the same transaction as the change.
import type { ApiScope } from "./api-keys";
import {
  accountBlock,
  API_SCOPES,
  canCreateKey,
  checkExpiry,
  checkKeyName,
  checkScopes,
  generateKey,
  hashKey,
  keyStatus,
  keyView,
  parseBearer,
  sameHash,
  touchDue,
  type KeyView,
} from "./api-keys";
import { recordAudit } from "./audit";
import { db } from "./db";

export type CreateResult = { ok: true; plaintext: string; key: KeyView } | { ok: false; message: string };
export type WriteResult = { ok: true } | { ok: false; message: string };

export type AuthFailure = "missing_key" | "invalid_key" | "revoked_key" | "expired_key" | "account_disabled";

export type AuthenticatedKey = { id: string; name: string; prefix: string; scopes: ApiScope[]; expiresAt: Date | null };

export type BearerAuth =
  | { ok: true; key: AuthenticatedKey; person: { id: string } }
  | { ok: false; status: 401 | 403; code: AuthFailure; keyId: string | null; personId: string | null };

const KEY_SELECT = { id: true, name: true, prefix: true, scopes: true, createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true } as const;

// Counts keys that still work: not revoked and not past expiry.
async function activeKeyCount(tx: Pick<ReturnType<typeof db>, "apiKey">, personId: string, now: Date): Promise<number> {
  return tx.apiKey.count({
    where: {
      personId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}

export async function createApiKey(
  personId: string,
  name: unknown,
  scopes: unknown,
  expiresAt?: unknown,
  now: Date = new Date(),
): Promise<CreateResult> {
  const checkedName = checkKeyName(name);
  if (!checkedName.ok) return { ok: false, message: checkedName.message };
  const checkedScopes = checkScopes(scopes);
  if (!checkedScopes.ok) return { ok: false, message: checkedScopes.message };
  const checkedExpiry = checkExpiry(expiresAt, now);
  if (!checkedExpiry.ok) return { ok: false, message: checkedExpiry.message };

  const key = generateKey();
  return db().$transaction(async (tx) => {
    // Lock the person row so two creates at once cannot both pass the five-key limit.
    await tx.$queryRaw`SELECT "id" FROM "Person" WHERE "id" = ${personId} FOR UPDATE`;
    const person = await tx.person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
    if (!person) return { ok: false, message: "Sign in to create a key." } as const;
    const erasing = (await tx.erasureRequest.count({ where: { personId, status: "requested" } })) > 0;
    if (accountBlock(person, erasing)) return { ok: false, message: "This account cannot create keys." } as const;
    if (!canCreateKey(await activeKeyCount(tx, personId, now))) {
      return { ok: false, message: "You can have five active keys. Revoke one first." } as const;
    }
    const row = await tx.apiKey.create({
      data: {
        personId,
        name: checkedName.name,
        prefix: key.prefix,
        hash: key.hash,
        scopes: [...checkedScopes.scopes],
        expiresAt: checkedExpiry.expiresAt,
      },
      select: KEY_SELECT,
    });
    await recordAudit(tx, {
      actorId: personId,
      action: "api_key.create",
      targetType: "ApiKey",
      targetId: row.id,
      reason: "Builder created an API key in Settings.",
      after: { name: row.name, prefix: row.prefix, scopes: row.scopes, expiresAt: row.expiresAt?.toISOString() ?? null },
    });
    return { ok: true, plaintext: key.plaintext, key: keyView(row, now) } as const;
  });
}

// Creation and authentication refuse banned/erasing accounts; self-service list/revoke must match or a banned session can
// still change keys after the block lands.
async function accountIsBlocked(personId: string): Promise<boolean> {
  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  if (!person) return true;
  const erasing = (await db().erasureRequest.count({ where: { personId, status: "requested" } })) > 0;
  return accountBlock(person, erasing) !== null;
}

export async function revokeApiKey(personId: string, id: string, now: Date = new Date()): Promise<WriteResult> {
  if (await accountIsBlocked(personId)) return { ok: false, message: "This account cannot change keys." } as const;
  return db().$transaction(async (tx) => {
    const found = await tx.apiKey.findFirst({ where: { id, personId, revokedAt: null }, select: { id: true, prefix: true } });
    if (!found) return { ok: false, message: "That key was not found or is already revoked." } as const;
    await tx.apiKey.update({ where: { id: found.id }, data: { revokedAt: now } });
    await recordAudit(tx, {
      actorId: personId,
      action: "api_key.revoke",
      targetType: "ApiKey",
      targetId: found.id,
      reason: "Builder revoked an API key in Settings.",
      after: { prefix: found.prefix },
    });
    return { ok: true } as const;
  });
}

export async function listApiKeys(personId: string, now: Date = new Date()): Promise<KeyView[]> {
  if (await accountIsBlocked(personId)) return [];
  const rows = await db().apiKey.findMany({
    where: { personId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: KEY_SELECT,
  });
  return rows.map((row) => keyView(row, now));
}

// Checks a raw Authorization header. The lookup is by digest (unique index); the digest is then compared again in constant
// time. A banned person or one with an open erasure request is refused with 403; other failures are 401.
export async function authenticateBearer(authorizationHeader: string | null | undefined, now: Date = new Date()): Promise<BearerAuth> {
  const plaintext = parseBearer(authorizationHeader);
  if (!plaintext) {
    const code: AuthFailure = authorizationHeader ? "invalid_key" : "missing_key";
    return { ok: false, status: 401, code, keyId: null, personId: null };
  }
  const hash = hashKey(plaintext);
  const row = await db().apiKey.findUnique({
    where: { hash },
    select: { ...KEY_SELECT, hash: true, personId: true, person: { select: { id: true, bannedAt: true } } },
  });
  if (!row || !sameHash(row.hash, hash)) return { ok: false, status: 401, code: "invalid_key", keyId: null, personId: null };

  const state = keyStatus(row, now);
  if (state === "revoked") return { ok: false, status: 401, code: "revoked_key", keyId: row.id, personId: row.personId };
  if (state === "expired") return { ok: false, status: 401, code: "expired_key", keyId: row.id, personId: row.personId };

  const erasing = (await db().erasureRequest.count({ where: { personId: row.personId, status: "requested" } })) > 0;
  if (accountBlock(row.person, erasing)) {
    return { ok: false, status: 403, code: "account_disabled", keyId: row.id, personId: row.personId };
  }

  if (touchDue(row.lastUsedAt, now)) {
    // A failed write must not fail the request that was otherwise allowed.
    await db().apiKey.update({ where: { id: row.id }, data: { lastUsedAt: now } }).catch(() => undefined);
  }
  return {
    ok: true,
    key: {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      scopes: row.scopes.filter((s): s is ApiScope => (API_SCOPES as readonly string[]).includes(s)),
      expiresAt: row.expiresAt,
    },
    person: { id: row.personId },
  };
}

// Writes one audit row for a refused credential. The key is never written: only its id when it matched a row.
export async function recordKeyRejection(event: {
  code: AuthFailure;
  keyId: string | null;
  personId: string | null;
  method: string;
  path: string;
}): Promise<void> {
  await recordAudit(db(), {
    actorId: event.personId ?? "api-key:anonymous",
    action: "api_key.rejected",
    targetType: "ApiKey",
    targetId: event.keyId ?? "unknown",
    reason: "API key refused",
    after: { code: event.code, method: event.method, path: event.path },
  });
}
