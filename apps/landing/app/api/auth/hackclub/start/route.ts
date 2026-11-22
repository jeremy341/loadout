import { NextResponse } from "next/server";
import { clientIp, UNKNOWN_IP } from "@/lib/platform/client-ip";
import { databaseConfigured } from "@/lib/platform/db";
import { startAttempt } from "@/lib/platform/hca-actions";
import { buildAuthorizeUrl, hcaConfig, NONCE_COOKIE, SIGN_IN_PATH, signInErrorPath } from "@/lib/platform/hca";
import { publicUrl } from "@/lib/platform/public-origin";
import { hasPlatformUnlock } from "@/lib/platform/platform-gate";
import { checkLimit, rateLimitHeaders } from "@/lib/platform/rate-limit-db";

export const dynamic = "force-dynamic";

// Starting a sign-in writes a LoginAttempt row, so throttle it like any other public write. Known addresses get their own bucket;
// when no proxy is trusted every caller shares one larger "unknown" bucket (lib/platform/client-ip.ts).
const START_PER_MINUTE = { limit: 10, windowMs: 60_000 } as const;
const SHARED_PER_MINUTE = { limit: 200, windowMs: 60_000 } as const;

// Begins a Hack Club Auth sign-in. Without the app keys nothing is sent anywhere: the person lands on the sign-in page,
// which says sign-in is not set up.
export async function GET(request: Request) {
  // A direct call to this route must not skip the shared-password step shown on the sign-in page.
  if (!(await hasPlatformUnlock())) return NextResponse.redirect(publicUrl(request, SIGN_IN_PATH), 303);
  const config = hcaConfig();
  if (!config) return NextResponse.redirect(publicUrl(request, SIGN_IN_PATH), 303);
  if (!databaseConfigured()) return NextResponse.redirect(publicUrl(request, signInErrorPath("server_error")), 303);
  try {
    const ip = clientIp(request);
    const limit = await checkLimit({ key: `hca-start:${ip}:minute`, ...(ip === UNKNOWN_IP ? SHARED_PER_MINUTE : START_PER_MINUTE) });
    if (!limit.ok) {
      return NextResponse.redirect(publicUrl(request, signInErrorPath("throttled")), {
        status: 303,
        headers: { ...rateLimitHeaders(limit), "Cache-Control": "no-store" },
      });
    }
    const { state, nonce, expiresAt } = await startAttempt();
    const response = NextResponse.redirect(buildAuthorizeUrl(config, state), 303);
    response.cookies.set(NONCE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/hackclub",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    console.error("hca sign-in start failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.redirect(publicUrl(request, signInErrorPath("server_error")), 303);
  }
}
