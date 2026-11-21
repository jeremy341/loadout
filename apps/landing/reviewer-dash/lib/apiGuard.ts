// The few JSON endpoints the copied review components call (Pixl's app/api/*). They answer only on the review host, from sample data,
// and never call out. Same contract as Pixl's guardedRoute: no role at all (a builder, nobody signed in) is the plain 404, a role that is
// not enough is 403, and anything off the review host is 404. Each route states what it needs, and lib/reviewer/route-matrix.test.ts
// checks that against the matrix.
import { headers } from "next/headers";
import { isReviewHost } from "@/lib/reviewer/host";
import { guardedRoute } from "./guard";
import type { AdminAccess, Requirement } from "./roles";

// Reviewer data is private to the signed-in person, so no response may be stored by a shared cache. The same headers proxy.ts
// uses on private pages: no shared storage, and a cache that does key on the cookie must not serve one viewer's answer to another.
export function noStore(response: Response): Response {
  const vary = response.headers.get("vary")?.toLowerCase() ?? "";
  if (response.headers.get("cache-control")?.includes("no-store") && vary.includes("cookie")) return response;
  const addVary = !vary.includes("cookie");
  try {
    response.headers.set("Cache-Control", "private, no-store");
    if (addVary) response.headers.append("Vary", "Cookie");
    return response;
  } catch {
    // Immutable headers (a response relayed from fetch): copy it.
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    if (addVary) headers.append("Vary", "Cookie");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
}

export const notFoundJson = () => noStore(Response.json({ error: "not_found" }, { status: 404 }));

export function reviewApi<C = unknown>(
  name: string,
  req: Requirement,
  fn: (access: AdminAccess, request: Request, ctx: C) => Promise<Response>,
): (request: Request, ctx: C) => Promise<Response> {
  const guarded = guardedRoute<C>(name, req, fn);
  return async (request: Request, ctx: C) => {
    if (!isReviewHost((await headers()).get("host"))) return notFoundJson();
    return noStore(await guarded(request, ctx));
  };
}
