"use server";
// Server actions for the moderation pages: bans (confirm or reject a proposal), reports (resolve or dismiss) and the notify form.
// Same names and call shapes as Pixl's. They check the owner role and run Pixl's input rules, then write nothing real: a decision is
// kept in the in-memory sample store (reviewer-dash/lib/sample/moderation-data.ts), empty again after a restart. No DM, e-mail or
// notification is sent. LOADOUT rule: a ban is proposed by one person and decided by a different owner (canDecide), so a proposer
// can never confirm their own proposal.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePage } from "../lib/guard";
import { safeRedirectPath } from "../lib/safeUrl";
import { canDecide } from "@/lib/reviewer/moderation";
import { withNotice } from "../lib/sample/referer";
import { changes, allProposals, banLength, knownPlayers, nextModerationId } from "../lib/sample/moderation-data";

const PROPOSED = "/bans?tab=proposed";


export async function confirmBanProposal(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const by = access.session.slackId;
  const id = Number(formData.get("id") ?? 0);
  if (!id) return;
  const proposal = allProposals().find((p) => p.id === id);
  if (!proposal || proposal.status !== "pending") return;
  // Two people are needed: whoever proposed the ban cannot decide it.
  if (!canDecide({ proposedBy: proposal.proposed_by }, by))
    redirect(withNotice(PROPOSED, "error", "You proposed this ban, so a different owner has to confirm it."));
  const now = new Date();
  const banId = nextModerationId();
  const expires = proposal.days > 0 ? new Date(now.getTime() + proposal.days * 86_400_000).toISOString() : null;
  changes.bans.unshift({
    id: banId,
    user_id: proposal.user_id,
    reason: proposal.reason,
    banned_by: by,
    expires_at: expires,
    lifted_at: null,
    created_at: now.toISOString(),
    users: proposal.users ?? null,
  });
  changes.log.unshift({
    id: banId * 10,
    user_id: proposal.user_id,
    action: "ban",
    detail: `${banLength(proposal.days)}, ${proposal.reason} (proposed by ${proposal.proposed_by})`,
    actor: by,
    created_at: now.toISOString(),
    player_name: proposal.users?.display_name || proposal.user_id,
  });
  changes.proposals.set(id, { status: "confirmed", decided_by: by, decided_at: now.toISOString(), ban_id: banId });
  revalidatePath("/", "layout");
  revalidatePath("/bans");
}

export async function rejectBanProposal(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const by = access.session.slackId;
  const id = Number(formData.get("id") ?? 0);
  if (!id) return;
  const proposal = allProposals().find((p) => p.id === id);
  if (!proposal || proposal.status !== "pending") return;
  // Rejecting your own proposal withdraws it. Anyone who is an owner may reject.
  changes.proposals.set(id, { status: "rejected", decided_by: by, decided_at: new Date().toISOString() });
  revalidatePath("/bans");
}

export async function resolveReport(formData: FormData): Promise<void> {
  const access = await requirePage("owner");
  const id = Number(formData.get("id") ?? 0);
  const dismissed = formData.get("action") === "dismiss";
  if (!id) return;
  changes.reports.set(id, {
    status: dismissed ? "dismissed" : "resolved",
    handled_by: access.session.slackId,
    handled_at: new Date().toISOString(),
  });
  revalidatePath("/reports");
  revalidatePath(`/reports/${id}`);
}

export async function sendNotification(formData: FormData): Promise<void> {
  await requirePage("owner");
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  const body = String(formData.get("body") ?? "").trim().slice(0, 500);
  const userId = String(formData.get("userId") ?? "").trim();
  const playerName = String(formData.get("playerName") ?? "").trim();
  // Empty stays empty (nothing to return to); a value that is not an address on this site falls back to /notify.
  const rawBackTo = String(formData.get("backTo") ?? "");
  const backTo = rawBackTo ? safeRedirectPath(rawBackTo, "/notify") : "";
  const fail = (message: string): void => {
    if (backTo) redirect(`${backTo}?error=${encodeURIComponent(message)}`);
  };
  if (!title || !body) return fail("Title and message are required.");

  const players = knownPlayers();
  let target = userId;
  if (!target && playerName) {
    const needle = playerName.toLowerCase();
    const hits = players.filter((p) => p.name.toLowerCase().includes(needle));
    if (hits.length !== 1) {
      return fail(hits.length > 1 ? `Several builders match "${playerName}", be more specific.` : `No builder with the handle "${playerName}".`);
    }
    target = hits[0].id;
  }
  const count = target ? 1 : players.length;
  if (backTo) redirect(`${backTo}?sent=${count}`);
}

export interface PlayerHit {
  id: string;
  name: string;
}

// Typeahead for the notify page: find builders by handle so an owner can pick one instead of guessing the spelling.
export async function searchPlayers(query: string): Promise<PlayerHit[]> {
  await requirePage("owner");
  const clean = query.replace(/[%_,()\\]/g, " ").trim().toLowerCase();
  if (clean.length < 2) return [];
  return knownPlayers()
    .filter((p) => p.name.toLowerCase().includes(clean))
    .slice(0, 8);
}
