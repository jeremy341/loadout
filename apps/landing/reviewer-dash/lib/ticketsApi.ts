// The guard for the tickets JSON endpoints (Pixl's app/api/tickets/*, which use guardedRoute): the review host only, the role Pixl asks
// for (helpers and owners), else the plain 404. Same name and call shape as Pixl's guardedRoute for these routes.
import { headers } from "next/headers";
import { isReviewHost } from "@/lib/reviewer/host";
import { notFoundJson } from "./apiGuard";
import { getAccess, can } from "./guard";
import type { AdminAccess, Requirement } from "./roles";

export function guardedRoute<C = unknown>(
  name: string,
  req: Requirement,
  fn: (access: AdminAccess, request: Request, ctx: C) => Promise<Response>,
): (request: Request, ctx: C) => Promise<Response> {
  void name;
  return async (request: Request, ctx: C): Promise<Response> => {
    if (!isReviewHost((await headers()).get("host"))) return notFoundJson();
    const access = await getAccess();
    if (!access || !can(access, req)) return notFoundJson();
    return fn(access, request, ctx);
  };
}

// The same check as a plain call, for a route that wants the access without wrapping its handler.
export async function helperOnly(): Promise<AdminAccess | null> {
  if (!isReviewHost((await headers()).get("host"))) return null;
  const access = await getAccess();
  return access && can(access, "helper") ? access : null;
}
