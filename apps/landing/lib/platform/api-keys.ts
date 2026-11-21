// API keys for /api/v1: the pure rules. No database; every function has a bun test (api-keys.test.ts).
// Database reads and writes are in api-keys-data.ts.
//
// A key is `ldk_` followed by 32 random bytes in base64url. Only its sha256 hex digest is stored (ApiKey.hash), plus the
// first 8 characters for display (ApiKey.prefix). The plaintext is shown once, when the key is created.
//
// API:
//   KEY_PREFIX "ldk_", KEY_BYTES 32, KEY_DISPLAY_PREFIX_LENGTH 8, API_SCOPES, MAX_ACTIVE_KEYS 5, KEY_NAME_MAX 60,
//   KEY_EXPIRY_MAX_DAYS 730, LAST_USED_WRITE_MS 60000
//   generateKey(bytes?) -> { plaintext, prefix, hash }
//   hashKey(plaintext) -> hex sha256
//   parseBearer(header) -> plaintext | null           only the "Bearer <key>" shape with a well-formed key
//   checkKeyName(raw) -> { ok, name } | { ok: false, message }
//   checkScopes(raw) -> { ok, scopes } | { ok: false, message }     unique, in API_SCOPES order, at least one
//   checkExpiry(raw, now) -> { ok, expiresAt } | { ok: false, message }   empty means no expiry
//   canCreateKey(activeCount) -> boolean
//   keyStatus(key, now) -> "active" | "revoked" | "expired"
//   accountBlock(person, erasureRequested) -> null | "banned" | "erasure_requested"
//   hasScope(scopes, scope) -> boolean
//   touchDue(lastUsedAt, now) -> boolean             true when lastUsedAt should be written (at most once a minute)
//   sameHash(a, b) -> boolean                        constant time comparison of two hex digests
//   keyView(row, now) -> KeyView                     the listing shape: never a hash or plaintext
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const KEY_PREFIX = "ldk_";
export const KEY_BYTES = 32;
export const KEY_DISPLAY_PREFIX_LENGTH = 8;
export const API_SCOPES = ["profile", "projects", "journal", "hours", "ledger", "activity", "export", "stats"] as const;
export type ApiScope = (typeof API_SCOPES)[number];
export const MAX_ACTIVE_KEYS = 5;
export const KEY_NAME_MAX = 60;
export const KEY_EXPIRY_MAX_DAYS = 730;
export const LAST_USED_WRITE_MS = 60_000;

const DAY_MS = 86_400_000;
// base64url of 32 bytes is 43 characters.
const KEY_PATTERN = /^ldk_[A-Za-z0-9_-]{43}$/;

export type Checked<T> = { ok: true } & T | { ok: false; message: string };

export function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

export function generateKey(bytes: Uint8Array = randomBytes(KEY_BYTES)): { plaintext: string; prefix: string; hash: string } {
  if (bytes.length !== KEY_BYTES) throw new Error("an API key needs exactly 32 random bytes");
  const plaintext = `${KEY_PREFIX}${Buffer.from(bytes).toString("base64url")}`;
  return {
    plaintext,
    prefix: plaintext.slice(0, KEY_DISPLAY_PREFIX_LENGTH),
    hash: hashKey(plaintext),
  };
}

// Reads "Bearer <key>". Anything else (another scheme, extra words, a malformed key) is null, so it is never looked up.
export function parseBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer (\S+)$/.exec(header.trim());
  if (!match) return null;
  return KEY_PATTERN.test(match[1]) ? match[1] : null;
}

export function checkKeyName(raw: unknown): Checked<{ name: string }> {
  const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (name.length === 0) return { ok: false, message: "Give the key a name, for example Laptop script." };
  if (name.length > KEY_NAME_MAX) return { ok: false, message: `Keep the name under ${KEY_NAME_MAX} characters.` };
  if (/[\u0000-\u001f\u007f]/.test(name)) return { ok: false, message: "The name has a control character in it." };
  return { ok: true, name };
}

export function checkScopes(raw: unknown): Checked<{ scopes: ApiScope[] }> {
  if (!Array.isArray(raw)) return { ok: false, message: "Choose at least one permission." };
  const wanted = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") return { ok: false, message: "A permission is not valid." };
    wanted.add(item.trim());
  }
  const unknown = [...wanted].find((s) => !(API_SCOPES as readonly string[]).includes(s));
  if (unknown !== undefined) return { ok: false, message: `The permission "${unknown.slice(0, 20)}" does not exist.` };
  const scopes = API_SCOPES.filter((s) => wanted.has(s));
  if (scopes.length === 0) return { ok: false, message: "Choose at least one permission." };
  return { ok: true, scopes };
}

// No expiry is allowed (null). An expiry must be in the future and at most KEY_EXPIRY_MAX_DAYS away.
export function checkExpiry(raw: unknown, now: Date): Checked<{ expiresAt: Date | null }> {
  if (raw === null || raw === undefined || raw === "") return { ok: true, expiresAt: null };
  const when = raw instanceof Date ? raw : typeof raw === "string" ? new Date(raw) : null;
  if (!when || Number.isNaN(when.getTime())) return { ok: false, message: "The expiry date is not valid." };
  if (when.getTime() <= now.getTime()) return { ok: false, message: "The expiry date has to be in the future." };
  if (when.getTime() > now.getTime() + KEY_EXPIRY_MAX_DAYS * DAY_MS) {
    return { ok: false, message: `Keys can last at most ${KEY_EXPIRY_MAX_DAYS} days.` };
  }
  return { ok: true, expiresAt: when };
}

export function canCreateKey(activeCount: number): boolean {
  return activeCount < MAX_ACTIVE_KEYS;
}

export type KeyStatus = "active" | "revoked" | "expired";

export function keyStatus(key: { revokedAt: Date | null; expiresAt: Date | null }, now: Date): KeyStatus {
  if (key.revokedAt) return "revoked";
  if (key.expiresAt && key.expiresAt.getTime() <= now.getTime()) return "expired";
  return "active";
}

// A banned person, or one who has asked for erasure, cannot use any key. Null means the account may use its keys.
export function accountBlock(person: { bannedAt: Date | null }, erasureRequested: boolean): "banned" | "erasure_requested" | null {
  if (person.bannedAt) return "banned";
  if (erasureRequested) return "erasure_requested";
  return null;
}

export function hasScope(scopes: readonly string[], scope: ApiScope): boolean {
  return scopes.includes(scope);
}

export function touchDue(lastUsedAt: Date | null, now: Date): boolean {
  return !lastUsedAt || now.getTime() - lastUsedAt.getTime() >= LAST_USED_WRITE_MS;
}

export function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export type KeyView = Omit<KeyRow, "createdAt" | "lastUsedAt" | "expiresAt" | "revokedAt"> & {
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  status: KeyStatus;
};

// Only the fields a person may see about their own key. The row is copied field by field, so an extra column (such as
// the hash) can never leak through a spread.
export function keyView(row: KeyRow, now: Date): KeyView {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: [...row.scopes],
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    status: keyStatus(row, now),
  };
}
