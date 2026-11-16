// The few JSON endpoints the copied review components call (Pixl's app/api/*). They answer only on the review host, from sample data,
// and never call out. Same contract as Pixl's guardedRoute: no role at all (a builder, nobody signed in) is the plain 404, a role that is
// not enough is 403, and anything off the review host is 404. Each route states what it needs, and lib/reviewer/route-matrix.test.ts
// checks that against the matrix.
import { headers } from "next/headers";
import { isReviewHost } from "@/lib/reviewer/host";
import { guardedRoute } from "./guard";
import type { AdminAccess, Requirement } from "./roles";

export const notFoundJson = () => Response.json({ error: "not_found" }, { status: 404 });

export function reviewApi<C = unknown>(
  name: string,
  req: Requirement,
  fn: (access: AdminAccess, request: Request, ctx: C) => Promise<Response>,
): (request: Request, ctx: C) => Promise<Response> {
  const guarded = guardedRoute<C>(name, req, fn);
  return async (request: Request, ctx: C) => {
    if (!isReviewHost((await headers()).get("host"))) return notFoundJson();
    return guarded(request, ctx);
  };
}
