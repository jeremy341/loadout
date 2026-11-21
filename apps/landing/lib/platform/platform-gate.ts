import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// An optional shared-password gate in front of Hack Club Auth. It is a barrier to starting a sign-in, not a second identity
// system: once OAuth succeeds the normal session is what authorises requests. The password is kept server-side only; the browser
// gets an HMAC token so the password itself never leaves the server or appears in a cookie, log or error message.
export const PLATFORM_GATE_COOKIE = "loadout_platform_gate";
const GATE_LABEL = "loadout-platform-gate-v1";
const GATE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type Env = Record<string, string | undefined>;

function configuredSecret(env: Env = process.env): string {
  return env.LOADOUT_PLATFORM_PASSWORD?.trim() ?? "";
}

export function platformGateEnabled(env: Env = process.env): boolean {
  return configuredSecret(env).length > 0;
}

export function checkPlatformPassword(raw: unknown, env: Env = process.env): boolean {
  const expected = configuredSecret(env);
  if (!expected || typeof raw !== "string" || raw.length === 0) return false;
  const given = createHash("sha256").update(raw).digest();
  const wanted = createHash("sha256").update(expected).digest();
  return timingSafeEqual(given, wanted);
}

export function platformGateToken(env: Env = process.env): string {
  return createHmac("sha256", configuredSecret(env)).update(GATE_LABEL).digest("base64url");
}

export function platformGateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GATE_MAX_AGE_SECONDS,
  };
}

// Constant-time comparison of a cookie value against the HMAC token. Pure and synchronous, so proxy.ts can use the same rule
// with the cookie read from the request instead of the async next/headers store (which proxy does not have).
function tokenMatches(token: string | null | undefined, env: Env): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  const given = Buffer.from(token);
  const wanted = Buffer.from(platformGateToken(env));
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

// The gate check for a cookie value supplied by the caller. Returns true when the gate is off, so local development and the
// built-in test accounts keep working exactly as before.
export function hasPlatformUnlockCookie(token: string | null | undefined, env: Env = process.env): boolean {
  if (!platformGateEnabled(env)) return true;
  return tokenMatches(token, env);
}

export async function hasPlatformUnlock(): Promise<boolean> {
  if (!platformGateEnabled()) return true;
  return tokenMatches((await cookies()).get(PLATFORM_GATE_COOKIE)?.value, process.env);
}
