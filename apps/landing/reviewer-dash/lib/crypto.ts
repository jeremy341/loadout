import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Personal details at rest: AES-256-GCM with a 32-byte key from LOADOUT_PII_KEY (64 hex characters or base64 of 32 bytes).
// Stored values carry the "enc:v1:" prefix, then base64 of iv (12 bytes) + auth tag (16 bytes) + ciphertext.
//
// Status: this is the primitive. No column is written through encryptPII yet, so nothing in the database is encrypted today.
// encryptPII fails closed without a key rather than storing plaintext. decryptPII passes unprefixed values through unchanged,
// so legacy plaintext (the sample desk data) still reads.
const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function piiKey(env: Record<string, string | undefined> = process.env): Buffer {
  const raw = env.LOADOUT_PII_KEY?.trim() ?? "";
  if (!raw) throw new Error("LOADOUT_PII_KEY is not set");
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("LOADOUT_PII_KEY must decode to 32 bytes");
  return key;
}

export function encryptPII(value: string, env: Record<string, string | undefined> = process.env): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", piiKey(env), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

export function decryptPII(value: string | null | undefined, env: Record<string, string | undefined> = process.env): string {
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value;
  const packed = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = packed.subarray(0, IV_BYTES);
  const tag = packed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const body = packed.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", piiKey(env), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}
