"use server";

import { notFound, redirect } from "next/navigation";
import { recordAudit } from "@/lib/platform/audit";
import { db } from "@/lib/platform/db";
import { localTestAccountsEnabled } from "@/lib/platform/local-accounts";
import { checkLimit } from "@/lib/platform/rate-limit-db";
import { requireAccess } from "@/lib/platform/session";
import { bootstrapDecision, bootstrapSecret, grantAdmin, mayBootstrap } from "./bootstrap";

// Five tries per person per quarter hour. The secret is the only thing between a reviewer and the admin marker, so guessing it
// must not be a matter of patience.
const ATTEMPTS = { limit: 5, windowMs: 15 * 60 * 1000 };

// The POST of Stasis's /superadmin (references/stasis @ 7a230ced9ad793f0ad4cda30a7d71c02a58da6b6, app/api/superadmin/route.ts),
// as a server action. The order of refusals is Stasis's: switch off -> 404, not signed in -> 404 (requireAccess), then the checks in
// bootstrapDecision. The person can only grant the marker to themselves; there is no field naming anyone else.
export async function grantSuperadmin(formData: FormData): Promise<void> {
  const secret = bootstrapSecret();
  if (!secret) notFound();
  const viewer = await requireAccess("reviewer");
  // Checked again in the action: a hidden form or a stale page cannot let a plain reviewer self-grant with the shared secret.
  if (!mayBootstrap({ isOwner: viewer.access.isOwner, roles: viewer.roles })) notFound();
  const fail = (message: string): never => redirect(`/superadmin?error=${encodeURIComponent(message)}`);

  const limit = await checkLimit({ key: `superadmin:${viewer.id}`, ...ATTEMPTS });
  if (!limit.ok) return fail("Too many attempts. Try again later.");

  const person = await db().person.findUnique({ where: { id: viewer.id }, select: { id: true, hcaId: true } });
  const decision = bootstrapDecision({
    secret,
    person,
    provided: formData.get("secret"),
    hcaOptional: localTestAccountsEnabled(),
  });
  if (!decision.ok) {
    if (decision.status === "not_found") notFound();
    // A wrong secret is worth a trace. The attempt is recorded; the value typed is not.
    if (decision.status === "wrong_secret") {
      await recordAudit(db(), {
        actorId: viewer.id,
        action: "superadmin.rejected",
        targetType: "Person",
        targetId: viewer.id,
        reason: "Wrong bootstrap secret.",
      });
    }
    return fail(decision.message);
  }

  await grantAdmin(viewer.id);
  redirect("/superadmin?ok=" + encodeURIComponent("Admin access granted."));
}
