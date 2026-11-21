import { NextResponse } from "next/server";
import { clientIp, UNKNOWN_IP } from "@/lib/platform/client-ip";
import { SIGN_IN_PATH, signInErrorPath } from "@/lib/platform/hca";
import {
  checkPlatformPassword,
  PLATFORM_GATE_COOKIE,
  platformGateCookieOptions,
  platformGateEnabled,
  platformGateToken,
} from "@/lib/platform/platform-gate";
import { checkLimit, rateLimitHeaders } from "@/lib/platform/rate-limit-db";
import { sameOrigin } from "@/lib/platform/same-origin";

export const dynamic = "force-dynamic";

// POST /api/auth/platform-gate   accepts the shared admin password and sets a 7-day unlock cookie. The gate is off unless
// LOADOUT_PLATFORM_PASSWORD is configured. After unlocking, the person still signs in with Hack Club Auth as usual.
// Password guesses are rate limited per IP. Without a trusted proxy every caller shares one larger "unknown" bucket
// (lib/platform/client-ip.ts), so a forged header cannot be used to sidestep the limit.
const GATE_PER_MINUTE = { limit: 10, windowMs: 60_000 } as const;
const SHARED_PER_MINUTE = { limit: 100, windowMs: 60_000 } as const;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  if (!platformGateEnabled()) return NextResponse.redirect(new URL(SIGN_IN_PATH, request.url), 303);

  const ip = clientIp(request);
  let limit;
  try {
    limit = await checkLimit({ key: `platform-gate:${ip}:minute`, ...(ip === UNKNOWN_IP ? SHARED_PER_MINUTE : GATE_PER_MINUTE) });
  } catch {
    // No rate-limit store means no way to stop guessing. Fail closed with the same generic message as a wrong password.
    return NextResponse.redirect(new URL(signInErrorPath("gate_failed"), request.url), 303);
  }
  if (!limit.ok) {
    // Back to the form with a plain message instead of a bare 429 body; the rate-limit headers still go out.
    return NextResponse.redirect(new URL(signInErrorPath("throttled"), request.url), {
      status: 303,
      headers: { ...rateLimitHeaders(limit), "Cache-Control": "no-store" },
    });
  }

  const form = await request.formData().catch(() => null);
  const password = form?.get("password");

  // A wrong password gets a generic error: no echo of what was typed, in the body or in the redirect target.
  if (!checkPlatformPassword(password)) {
    return NextResponse.redirect(new URL(signInErrorPath("gate_failed"), request.url), 303);
  }

  // Straight to the sign-in page, where the Hack Club Auth button now shows; there is no other destination to honour.
  const response = NextResponse.redirect(new URL(SIGN_IN_PATH, request.url), 303);
  response.cookies.set(PLATFORM_GATE_COOKIE, platformGateToken(), platformGateCookieOptions());
  return response;
}
