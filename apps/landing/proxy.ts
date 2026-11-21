import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SIGN_IN_PATH } from "@/lib/platform/hca";
import { hasPlatformUnlockCookie, PLATFORM_GATE_COOKIE, platformGateEnabled } from "@/lib/platform/platform-gate";
import { isPrivatePagePath, isReviewerRoute, isReviewHost, movedTo, reviewerRoute } from "@/lib/reviewer/host";

// The reviewer site lives on its own host (review.<domain>), not inside the participant dashboard. On that host every
// address is rewritten into the internal /reviewer route tree, so "/" is the queue and "/ship/abc" is a ship. On every
// other host /reviewer and below answer 404, in development too, so the tree cannot be reached by guessing its path.
// Staff checks still happen in the pages (requireStaff); this only decides which site a host belongs to.
// LOADOUT_REVIEW_HOST pins the review host explicitly (see lib/reviewer/host.ts).

// Pages that depend on the signed-in person are never stored by a shared cache, and a cache that does vary keys on the cookie.
function markPrivate(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.append("Vary", "Cookie");
  return response;
}

// The shared-password gate fronts the whole platform: every participant page and every page on the review host. The routes
// below are the gate itself, the OAuth handshake that follows it, and files that are not pages. The homepage and the public
// Docs stay public on the main host; they carry no participant data (see docs/README.md and AGENTS.md).
const GATE_ROUTES = new Set([
  SIGN_IN_PATH,
  "/api/auth/platform-gate",
  "/api/auth/hackclub/start",
  "/api/auth/hackclub/callback",
]);

function isGateExempt(pathname: string, review: boolean): boolean {
  if (GATE_ROUTES.has(pathname)) return true;
  // API routes have their own session/key checks; the proxy matcher skips /api anyway.
  if (pathname.startsWith("/api/")) return true;
  // Static assets, including Next's own chunks and the artwork under /loadout.
  if (pathname.startsWith("/_next/") || pathname.startsWith("/loadout/") || /\.[^/]+$/.test(pathname)) return true;
  // Public pages stay public only on the main site. Every address on the review host is staff-only.
  if (!review && (pathname === "/" || pathname === "/docs" || pathname.startsWith("/docs/"))) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const review = isReviewHost(host);

  // The gate is off unless LOADOUT_PLATFORM_PASSWORD is set, so local development and the local test accounts are untouched.
  if (
    platformGateEnabled() &&
    !isGateExempt(pathname, review) &&
    !hasPlatformUnlockCookie(request.cookies.get(PLATFORM_GATE_COOKIE)?.value)
  ) {
    const to = request.nextUrl.clone();
    to.pathname = SIGN_IN_PATH;
    to.search = "";
    to.hash = "";
    // On the review host the sign-in page is let through below, so this redirect cannot loop.
    const redirect = NextResponse.redirect(to, 307);
    return markPrivate(redirect);
  }

  if (review) {
    // The shared sign-in page is the one address on the review host that is not rewritten into /reviewer: it holds the gate
    // form, and redirecting to it must not loop. It still says noindex and is private.
    if (platformGateEnabled() && pathname === SIGN_IN_PATH) {
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return markPrivate(response);
    }

    // The review site has no sitemap. sitemap.ts also answers empty here; this is the proxy-side guard for an explicit call.
    // The production matcher skips dotted paths, so next.config.ts blocks /sitemap.xml on this host before the proxy runs.
    if (pathname === "/sitemap.xml") {
      const target = request.nextUrl.clone();
      target.pathname = "/not-found";
      const response = NextResponse.rewrite(target, { status: 404 });
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return markPrivate(response);
    }

    // An address from before the move to Pixl's paths goes to its new home, keeping the query.
    const moved = movedTo(pathname);
    if (moved) {
      const to = request.nextUrl.clone();
      to.pathname = moved;
      const redirect = NextResponse.redirect(to, 308);
      redirect.headers.set("X-Robots-Tag", "noindex, nofollow");
      return redirect;
    }
    const target = request.nextUrl.clone();
    target.pathname = reviewerRoute(pathname);
    const response = NextResponse.rewrite(target);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    // Every page on the review host is for signed-in staff.
    return markPrivate(response);
  }

  if (isReviewerRoute(pathname)) {
    // An address no page owns, so the app's own not-found page answers with a 404.
    const target = request.nextUrl.clone();
    target.pathname = "/not-found";
    return NextResponse.rewrite(target);
  }

  if (isPrivatePagePath(pathname)) return markPrivate(NextResponse.next());

  return NextResponse.next();
}

// Next reads this statically, so it cannot be imported. lib/reviewer/host.test.ts checks the same pattern as PROXY_MATCHER.
// It skips Next internals, the API, anything with a dot (static files) and the artwork under /loadout.
export const config = {
  matcher: ["/((?!_next|api|loadout/|.*\\..*).*)"],
};
