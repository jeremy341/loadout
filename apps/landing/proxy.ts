import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isReviewerRoute, isReviewHost, movedTo, reviewerRoute } from "@/lib/reviewer/host";

// The reviewer site lives on its own host (review.<domain>), not inside the participant dashboard. On that host every
// address is rewritten into the internal /reviewer route tree, so "/" is the queue and "/ship/abc" is a ship. On every
// other host /reviewer and below answer 404, in development too, so the tree cannot be reached by guessing its path.
// Staff checks still happen in the pages (requireStaff); this only decides which site a host belongs to.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  if (isReviewHost(host)) {
    // An address from before the move to Pixl's paths goes to its new home, keeping the query.
    const moved = movedTo(pathname);
    if (moved) {
      const to = request.nextUrl.clone();
      to.pathname = moved;
      return NextResponse.redirect(to, 308);
    }
    const target = request.nextUrl.clone();
    target.pathname = reviewerRoute(pathname);
    const response = NextResponse.rewrite(target);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (isReviewerRoute(pathname)) {
    // An address no page owns, so the app's own not-found page answers with a 404.
    const target = request.nextUrl.clone();
    target.pathname = "/not-found";
    return NextResponse.rewrite(target);
  }

  return NextResponse.next();
}

// Next reads this statically, so it cannot be imported. lib/reviewer/host.test.ts checks the same pattern as PROXY_MATCHER.
// It skips Next internals, the API, anything with a dot (static files) and the artwork under /loadout.
export const config = {
  matcher: ["/((?!_next|api|loadout/|.*\\..*).*)"],
};
