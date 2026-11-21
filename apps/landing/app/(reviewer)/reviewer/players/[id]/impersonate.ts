"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/platform/db";
import { startImpersonation } from "@/lib/platform/impersonation";
import { requireAccess, setImpersonationCookie } from "@/lib/platform/session";

// The builder page's "Act as this builder" action (Stasis: the Impersonate button on app/admin/users/page.tsx posting to
// app/api/admin/impersonate, references/stasis @ 7a230ced9ad793f0ad4cda30a7d71c02a58da6b6). Stasis confirms with a browser dialog;
// here the staff member also writes a reason, which is stored on the Impersonation row and in the audit event.
//
// The gate is checked again here on the server whatever the page showed: requireAccess("reviewer") for the role, then
// startImpersonation applies the extra owner-or-admin gate and the subject guards (not yourself, not an owner, not an admin,
// not a banned account) with fresh database reads, so a hidden form field or a replayed request cannot widen it.
//
// The builder page's id is Pixl's u-<handle>; the account to act as is the Person with that handle (or, when the id is a Person
// id, that person). A sample builder with no account behind it has nothing to act as, and the action says so.
function personKeyFromPlayerId(playerId: string): { id?: string; handle?: string } {
  const key = playerId.trim();
  if (!key) return {};
  const handle = key.toLowerCase().replace(/^u-/, "");
  return { id: key, handle };
}

function siteDashboardUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const base = (env.NEXT_PUBLIC_LOADOUT_SITE_URL ?? "").trim().replace(/\/+$/, "");
  return base ? `${base}/dashboard` : null;
}

export async function impersonatePlayer(formData: FormData): Promise<void> {
  const viewer = await requireAccess("reviewer");
  const playerId = String(formData.get("playerId") ?? "");
  const back = `/players/${encodeURIComponent(playerId)}`;
  const stop = (message: string): never => redirect(`${back}?error=${encodeURIComponent(message)}`);

  const key = personKeyFromPlayerId(playerId);
  if (!key.id) return stop("Choose a builder first.");
  const subject = await db().person.findFirst({
    where: { OR: [{ id: key.id }, { handle: key.handle }] },
    select: { id: true },
  });
  if (!subject) return stop("That builder has no account to act as.");

  const started = await startImpersonation({ actorId: viewer.id, subjectId: subject.id, reason: formData.get("reason") });
  // A subject refusal arrives here as the single generic message from impersonation.ts; the specific reason was written to the
  // audit row by startImpersonation, so there is nothing to map or rephrase before the redirect.
  if (!started.ok) return stop(started.message);

  await setImpersonationCookie(started.token, started.expiresAt);
  const dashboard = siteDashboardUrl();
  // Without the site address there is nowhere to send the staff member, so say how to get there instead.
  if (!dashboard) redirect(`${back}?ok=${encodeURIComponent("Impersonation started. Open the participant dashboard to act as this builder.")}`);
  redirect(dashboard);
}
