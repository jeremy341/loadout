import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/platform/db";
import { bindIdentity, consumeAttempt, exchangeCode, fetchIdentity } from "@/lib/platform/hca-actions";
import { hcaConfig, NONCE_COOKIE, signInErrorPath, type SignInError } from "@/lib/platform/hca";
import { publicOrigin } from "@/lib/platform/public-origin";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/platform/session";

export const dynamic = "force-dynamic";

function nonceFrom(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === NONCE_COOKIE) return rest.join("=") || null;
  }
  return null;
}

// Finishes a Hack Club Auth sign-in: checks the state and the browser nonce, trades the code for a token, reads the identity,
// binds it to one Person and opens a session. Every failure goes back to the sign-in page with a short code.
export async function GET(request: Request) {
  const config = hcaConfig();
  // Redirect targets use the origin the app registered, so a proxy cannot change where people land.
  const origin = config ? new URL(config.redirectUri).origin : publicOrigin(request);
  const fail = (code: SignInError) => {
    const response = NextResponse.redirect(new URL(signInErrorPath(code), origin), 303);
    response.cookies.delete({ name: NONCE_COOKIE, path: "/api/auth/hackclub" });
    return response;
  };
  if (!config || !config.clientSecret) return fail("not_configured");
  if (!databaseConfigured()) return fail("server_error");

  const params = new URL(request.url).searchParams;
  const attempt = await consumeAttempt(params.get("state"), nonceFrom(request));
  if (!attempt.ok) return fail(attempt.error);
  if (params.get("error")) return fail("denied");
  const code = params.get("code");
  if (!code || code.length > 2000) return fail("invalid_state");

  const token = await exchangeCode(config, code);
  if ("error" in token) return fail(token.error);
  const fetched = await fetchIdentity(config, token.accessToken);
  if ("error" in fetched) return fail(fetched.error);
  const bound = await bindIdentity(fetched.identity);
  if ("error" in bound) return fail(bound.error);

  const { token: sessionToken, expires } = await createSession(bound.personId);
  const response = NextResponse.redirect(new URL("/dashboard", origin), 303);
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions(expires));
  response.cookies.delete({ name: NONCE_COOKIE, path: "/api/auth/hackclub" });
  return response;
}
