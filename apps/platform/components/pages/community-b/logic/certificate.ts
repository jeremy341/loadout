// Achievement certificate codes and verification.
//
// Adapted from the Stasis certificate verifier (references/stasis/lib/certificates.ts and
// app/certificate/page.tsx): codes are printed in capitals and typed back by hand, so verification accepts any
// casing and stray separators (`normalizeCode`) and looks the code up among the issued certificates. Stasis
// reads issued rows from Airtable; the preview reads the certificates stored in this browser instead. Stasis
// uses fixed 6-character codes with no checksum; here the code carries a check character so a typo is told
// apart from "no such certificate".
//
// Code format: LDT-XXXX-XXXX-C
//   X = 8 characters from a 32-symbol alphabet without I, L, O, U, derived from a hash of
//       (event id, builder handle, issue day);
//   C = one check character: sum of (symbol value * odd weight) mod 32. Odd weights are invertible mod 32, so
//       every single-character mistake is caught; most swaps of neighbours are caught too.
// A real service would sign certificates with a server secret. This preview code contains no secret and proves
// nothing outside this browser: it is only a stand-in with the same user flow.

export const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CODE_PREFIX = "LDT";
const WEIGHTS = [1, 3, 5, 7, 9, 11, 13, 15];
export const BODY_LENGTH = 8;

/** FNV-1a, 32 bit. */
export function fnv1a(text: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export interface CertificateSeed {
  eventId: string;
  handle: string;
  /** `YYYY-MM-DD` issue day in Preview time. */
  issueDay: string;
}

/** 8 alphabet characters from two hashes (30 bits + 10 bits). */
export function codeBody(seed: CertificateSeed): string {
  const payload = `${seed.eventId}|${seed.handle}|${seed.issueDay}`;
  const a = fnv1a(payload);
  const b = fnv1a(`${payload}|loadout-preview`, 0x1234abcd);
  let out = "";
  for (let i = 0; i < 6; i += 1) out += CODE_ALPHABET[(a >>> (i * 5)) & 31];
  for (let i = 0; i < 2; i += 1) out += CODE_ALPHABET[(b >>> (i * 5)) & 31];
  return out;
}

export function checkChar(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i += 1) {
    const value = CODE_ALPHABET.indexOf(body[i]);
    sum += value * WEIGHTS[i % WEIGHTS.length];
  }
  return CODE_ALPHABET[sum % 32];
}

/** `LDT-XXXX-XXXX-C`. */
export function formatCode(body: string, check: string): string {
  return `${CODE_PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}-${check}`;
}

export function certificateCode(seed: CertificateSeed): string {
  const body = codeBody(seed);
  return formatCode(body, checkChar(body));
}

/**
 * Accepts any casing and separators. Drops the LDT prefix, then reads the look-alike characters the way
 * Crockford base 32 does (O is 0, I and L are 1). Returns the 9 symbols (8 body + 1 check) or "" if the
 * result cannot be a code.
 */
export function normalizeCode(input: string): string {
  let text = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (text.startsWith(CODE_PREFIX) && text.length === CODE_PREFIX.length + BODY_LENGTH + 1) text = text.slice(CODE_PREFIX.length);
  text = text.replace(/O/g, "0").replace(/[IL]/g, "1");
  return text;
}

export type VerifyOutcome<T> =
  | { status: "empty" }
  | { status: "malformed" }
  | { status: "checksum" }
  | { status: "not-issued" }
  | { status: "valid"; certificate: T };

/** Checks shape, then the check character, then looks the code up among the issued certificates. */
export function verifyCode<T extends { code: string }>(input: string, issued: readonly T[]): VerifyOutcome<T> {
  if (input.trim() === "") return { status: "empty" };
  const symbols = normalizeCode(input);
  if (symbols.length !== BODY_LENGTH + 1) return { status: "malformed" };
  for (const ch of symbols) if (!CODE_ALPHABET.includes(ch)) return { status: "malformed" };
  const body = symbols.slice(0, BODY_LENGTH);
  if (checkChar(body) !== symbols[BODY_LENGTH]) return { status: "checksum" };
  const hit = issued.find((c) => normalizeCode(c.code) === symbols);
  return hit ? { status: "valid", certificate: hit } : { status: "not-issued" };
}

export interface IssuedCertificate {
  code: string;
  eventId: string;
  eventTitle: string;
  builderName: string;
  handle: string;
  /** ISO timestamp in Preview time. */
  issuedAt: string;
  /** Always true in the preview: the certificate is from a sample event. */
  sample: boolean;
}

export interface NameCheck {
  ok: boolean;
  name: string;
  message?: string;
}

/** The name printed on a certificate: 1 to 60 characters, no control characters, no angle brackets. */
export function validateCertificateName(input: string): NameCheck {
  const name = input.replace(/\s+/g, " ").trim();
  if (name.length === 0) return { ok: false, name, message: "Enter the name to print on the certificate." };
  if (name.length > 60) return { ok: false, name, message: "Use 60 characters or fewer." };
  // Control characters are rejected on purpose.
  if (/[<>\u0000-\u001f\u007f]/.test(name)) return { ok: false, name, message: "Use letters, numbers and ordinary punctuation only." };
  return { ok: true, name };
}

/** Issues one certificate. Returns the existing one when this builder already has one for the event. */
export function issueCertificate(
  existing: readonly IssuedCertificate[],
  input: { eventId: string; eventTitle: string; builderName: string; handle: string; issuedAtIso: string; sample: boolean },
): { certificate: IssuedCertificate; created: boolean } {
  const found = existing.find((c) => c.eventId === input.eventId && c.handle === input.handle);
  if (found) return { certificate: found, created: false };
  const code = certificateCode({ eventId: input.eventId, handle: input.handle, issueDay: input.issuedAtIso.slice(0, 10) });
  return {
    certificate: {
      code,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      builderName: input.builderName,
      handle: input.handle,
      issuedAt: input.issuedAtIso,
      sample: input.sample,
    },
    created: true,
  };
}
