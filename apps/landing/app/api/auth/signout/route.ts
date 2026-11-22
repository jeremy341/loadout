import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SIGN_IN_PATH } from "@/lib/platform/hca";
import { endImpersonation } from "@/lib/platform/impersonation";
import { publicUrl } from "@/lib/platform/public-origin";
import { sameOrigin } from "@/lib/platform/same-origin";
import {
  destroySession,
  IMPERSONATION_COOKIE,
  impersonationCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/platform/session";

export const dynamic = "force-dynamic";

// POST /api/auth/signout   ends the signed in session: the stored session row is deleted, the cookie is cleared, and the person
// lands on the sign-in page. POST only, and only from this site (the Origin host has to match), so another site can't sign anyone out.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    let destroyed = false;
    for (let attempt = 0; attempt < 2 && !destroyed; attempt += 1) {
      try {
        await destroySession(token);
        destroyed = true;
      } catch {
        // Retry once: a transient database error must not turn a failed logout into a success-looking redirect that
        // leaves the token live for up to 30 days.
      }
    }
    if (!destroyed) return new NextResponse("Could not end the session. Try again.", { status: 500 });
  }
  // readViewer() prefers an impersonation over the normal session, so signing out must end it too. Otherwise the browser
  // lands straight back into the impersonated builder's account and the impersonation stays open and unaudited.
  const impersonation = jar.get(IMPERSONATION_COOKIE)?.value;
  if (impersonation) {
    try {
      await endImpersonation(impersonation);
    } catch {
      // Clear the cookie either way; an orphaned row expires on its own.
    }
  }
  const response = NextResponse.redirect(publicUrl(request, SIGN_IN_PATH), 303);
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(new Date(0)));
  response.cookies.set(IMPERSONATION_COOKIE, "", impersonationCookieOptions(new Date(0)));
  return response;
}
