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
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { readViewer, ownerEmails } from "@/lib/platform/session";
import { describeRequirement, resolvePersonAccess } from "@/lib/reviewer/access";
import { TEAM } from "@/lib/reviewer/people";
import { sessionFor } from "./session";
import { satisfies, type AdminAccess, type Requirement } from "./roles";
import { handleForEmail, rolesAfterTeamLog } from "./sample/role-grants";
import { peopleStore } from "./sample/people-data";
import { getGuidelinesAck } from "./db";
import { GUIDELINES_SKIP_COOKIE, guidelinesSkipValue, GUIDELINES_VERSION } from "./guidelines";
import { audit, type AuditResult } from "./audit";

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
  // The handle is display only (a fixture handle for the sample team, the Person id otherwise). The overlay is keyed by the
  // stable Person id, with the email accepted as well for entries written before ids were stored. A display name never decides
  // a role, so two people who share one cannot share a role change or a claim.
  const session = sessionFor(viewer);
  const personKeys = [viewer.id, viewer.email.trim().toLowerCase()];
  const roles = rolesAfterTeamLog(personKeys, viewer.roles, peopleStore.log, STARTED);
  // The same resolution the session and the superadmin/impersonation gates use: a removal written to RoleGrant revokes the
  // person's reviewer power here and in those gates on the same request.
  const resolved = resolvePersonAccess({ id: viewer.id, email: viewer.email, roles }, ownerEmails());
  if (!resolved) return null;
  return {
    session,
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
  if (acked !== null && acked >= GUIDELINES_VERSION) return;
  // "Skip for now" grants exactly one pass and is audited when set. Consuming it here means the next gated request sends
  // the reviewer back to the guidelines, as the button promises.
  const jar = await cookies();
  if (jar.get(GUIDELINES_SKIP_COOKIE)?.value === guidelinesSkipValue()) {
    jar.delete(GUIDELINES_SKIP_COOKIE);
    return;
  }
  redirect("/review/guidelines");
}

// One audit row per guarded call, named after the action/route the caller passed in. The audit writer is fire-and-forget and
// swallows its own database errors, so logging can never turn a clean allow or deny into a 500.
async function writeAudit(name: string, access: AdminAccess | null, result: AuditResult, req?: Request): Promise<void> {
  await audit(
    { action: name, result, actorType: access ? "staff" : "anonymous", slackId: access?.session.slackId ?? null },
    req,
  );
}

// Wraps every exported server action: the role is checked again on the server, whatever the page showed. The first argument
// names the action in the audit row written for every allow and deny.
export function guardedAction<A extends unknown[], R>(
  name: string,
  req: Requirement,
  fn: (access: AdminAccess, ...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    const access = await getAccess();
    if (!access) {
      await writeAudit(name, null, "denied");
      notFound();
    }
    if (!satisfies(access, req)) {
      await writeAudit(name, access, "denied");
      throw new Error(`You need the ${describeRequirement(req)} role for that.`);
    }
    await writeAudit(name, access, "ok");
    return fn(access, ...args);
  };
}

// The same contract for app/api route handlers. No role: 404 JSON (as every other reviewer address). A role that is not enough: 403.
export function guardedRoute<C = unknown>(
  name: string,
  req: Requirement,
  fn: (access: AdminAccess, request: Request, ctx: C) => Promise<Response>,
): (request: Request, ctx: C) => Promise<Response> {
  return async (request: Request, ctx: C): Promise<Response> => {
    const access = await getAccess();
    if (!access) {
      await writeAudit(name, null, "denied", request);
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    if (!satisfies(access, req)) {
      await writeAudit(name, access, "denied", request);
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    await writeAudit(name, access, "ok", request);
    return fn(access, request, ctx);
  };
}
