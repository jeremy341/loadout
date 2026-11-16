// Page, action and route guards for the reviewer site, over LOADOUT's session and role rules (lib/platform/session.ts,
// lib/reviewer/access.ts). Pixl's own shapes are kept: AdminAccess, Requirement, requirePage, requireGuidelinesAck, guardedAction,
// guardedRoute, can, landingFor.
//
// The rules, as Pixl has them:
// - Not signed in, or signed in with no role at all (a builder, a former reviewer): the plain 404, so the site does not advertise
//   itself. Pages call notFound(), actions throw it, API routes answer a 404 JSON body.
// - A role that is not enough for this page: redirect to the person's own landing page (landingFor). An action throws "You need
//   the X role for that", and an API route answers 403 JSON (a redirect would not mean anything to a script).
// - Owners pass every gate. no_review on an owner takes them out of the review queues only.
//
// Roles come from the database grants (readViewer) with the team changes made since the server started laid over them
// (sample/role-grants.ts), so the Admins page changes what a person may open.
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { readViewer, ownerEmails } from "@/lib/platform/session";
import { describeRequirement, resolveAccess } from "@/lib/reviewer/access";
import { TEAM } from "@/lib/reviewer/people";
import { handleFor } from "./session";
import { satisfies, type AdminAccess, type Requirement } from "./roles";
import { handleForEmail, rolesAfterTeamLog } from "./sample/role-grants";
import { peopleStore } from "./sample/people-data";
import { getGuidelinesAck } from "./db";
import { GUIDELINES_VERSION } from "./guidelines";

export * from "./roles";

// Team changes made after this are the viewer's own; the seeded history is older.
const START_KEY = "__loadoutReviewerStarted";
const startRoot = globalThis as unknown as Record<string, number | undefined>;
const STARTED = (startRoot[START_KEY] ??= Date.now() - 2000);

// Pixl's owner list, in handles: the owners of the invented team, plus the owners of this environment (LOADOUT_OWNER_EMAILS and,
// in development, the local owner accounts). SECOND_PASS_SLACK_IDS is unset, so a final reviewer is a reviewer with second_pass, or an owner.
export function ownerSlackIds(): string[] {
  return [...new Set([...TEAM.filter((member) => member.roles.includes("owner")).map((member) => member.handle), ...ownerEmails().map(handleForEmail)])];
}

export function secondPassSlackIds(): string[] {
  return [];
}

// Once per request, however many components ask.
export const getAccess = cache(async (): Promise<AdminAccess | null> => {
  const viewer = await readViewer();
  if (!viewer) return null;
  const handle = handleFor(viewer.access, viewer.displayName);
  const roles = rolesAfterTeamLog(handle, viewer.roles, peopleStore.log, STARTED);
  const resolved = resolveAccess({ id: viewer.id, email: viewer.email }, { ownerEmails: ownerEmails(), roles });
  if (!resolved) return null;
  return {
    session: { slackId: handle, name: viewer.displayName, exp: Math.floor(Date.now() / 1000) + 3600 },
    isOwner: resolved.isOwner,
    isReviewer: resolved.isReviewer,
    isHelper: resolved.isHelper,
    isFulfiller: resolved.isFulfiller,
    canSecondPass: resolved.canSecondPass,
    canEditSubmission: resolved.canEditSubmission,
    canFraudReview: resolved.canFraudReview,
    canAiDraft: resolved.canAiDraft,
    canOpenFullQueue: resolved.canOpenFullQueue,
    reviewQueues: resolved.reviewQueues,
  };
});

export function can(access: AdminAccess | null | undefined, req: Requirement): boolean {
  return !!access && satisfies(access, req);
}

// Where someone lands when they open a page they cannot see (Pixl's landingFor, same order). Pixl's last line is /removed for a
// person with no role; here that person never gets this far, because they get the 404 first.
export function landingFor(access: AdminAccess): string {
  if (access.isOwner) return "/";
  if (access.isReviewer) return "/review";
  if (access.isHelper) return "/tickets";
  if (access.isFulfiller) return "/fulfillment";
  if (access.canFraudReview) return "/review/fraud-reviews";
  return "/";
}

export async function requirePage(req: Requirement = "staff"): Promise<AdminAccess> {
  const access = await getAccess();
  if (!access) notFound();
  if (!satisfies(access, req)) redirect(landingFor(access));
  return access;
}

export async function requireGuidelinesAck(access: AdminAccess): Promise<void> {
  const acked = await getGuidelinesAck(access.session.slackId);
  if (acked === null || acked < GUIDELINES_VERSION) redirect("/review/guidelines");
}

// Wraps every exported server action: the role is checked again on the server, whatever the page showed. The name is for the
// log Pixl keeps; there is no log here.
export function guardedAction<A extends unknown[], R>(
  _name: string,
  req: Requirement,
  fn: (access: AdminAccess, ...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    const access = await getAccess();
    if (!access) notFound();
    if (!satisfies(access, req)) throw new Error(`You need the ${describeRequirement(req)} role for that.`);
    return fn(access, ...args);
  };
}

// The same contract for app/api route handlers. No role: 404 JSON (as every other reviewer address). A role that is not enough: 403.
export function guardedRoute<C = unknown>(
  _name: string,
  req: Requirement,
  fn: (access: AdminAccess, request: Request, ctx: C) => Promise<Response>,
): (request: Request, ctx: C) => Promise<Response> {
  return async (request: Request, ctx: C): Promise<Response> => {
    const access = await getAccess();
    if (!access) return Response.json({ error: "not_found" }, { status: 404 });
    if (!satisfies(access, req)) return Response.json({ error: "forbidden" }, { status: 403 });
    return fn(access, request, ctx);
  };
}
