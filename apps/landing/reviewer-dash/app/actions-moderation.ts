"use server";
// Server actions for the moderation pages: a ban proposal (confirm, overturn or withdraw), a report (action or dismiss) and the notify form.
// Same names and call shapes as Pixl's. The role is checked here (requirePage), then the rule: lib/platform/moderation-data.ts checks the
// gates from lib/platform/moderation-rules.ts and writes the row, the ban and the audit row in one transaction. The person is the
// signed-in Person (readViewer), never the sample handle. The notify form is still sample data: no DM, e-mail or notification is sent.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePage } from "../lib/guard";
import { safeRedirectPath } from "../lib/safeUrl";
import { withNotice } from "../lib/sample/referer";
import { databaseConfigured } from "@/lib/platform/db";
import * as live from "@/lib/platform/moderation-data";
import { ownerEmails, readViewer } from "@/lib/platform/session";
import { canDecide } from "@/lib/reviewer/moderation";
import { iso } from "../lib/sample/index";
import { allProposals, changes, knownPlayers, nextModerationId, type BanProposalRow } from "../lib/sample/moderation-data";

const PROPOSED = "/bans?tab=proposed";
const NO_DATABASE = "The database is not connected here, so nothing was saved.";
const MISSING_PROPOSAL = "That ban proposal is sample data or was already decided. Nothing was saved.";

// Confirms (owner), overturns (a second-pass reviewer or an owner) or withdraws (the proposer) one proposal.
async function decideProposal(formData: FormData, decision: "confirm" | "overturn", role: "owner" | "reviewer"): Promise<void> {
  const access = await requirePage(role);
  const id = Number(formData.get("id") ?? 0);
  if (!id) return;
  const viewer = await readViewer();
  if (!viewer) redirect(withNotice(PROPOSED, "error", "Sign in again to decide this."));
  // A proposal on a sample builder has no Person row, so the database data layer cannot see it. Decide it in the same
  // in-memory store the Bans page reads, keeping the two-person rule: the proposer withdraws, someone else decides.
  // Sample rows only exist in development (usesSampleRows), so the branch is limited to it as well.
  const sample = process.env.NODE_ENV === "development" ? allProposals().find((p) => p.id === id && p.status === "pending") : undefined;
  if (sample) {
    const me = access.session.slackId;
    if (decision === "confirm" && !canDecide({ proposedBy: sample.proposed_by }, me)) {
      redirect(withNotice(PROPOSED, "error", "A different owner has to confirm it."));
    }
    const by = access.session.name;
    const at = iso(0);
    const patch: Partial<BanProposalRow> = {
      status: decision === "confirm" ? "confirmed" : "rejected",
      decided_by: by,
      decided_at: at,
    };
    if (decision === "confirm") {
      const banId = nextModerationId();
      const days = sample.days > 0 ? sample.days : null;
      changes.bans.unshift({
        id: banId,
        user_id: sample.user_id,
        reason: sample.reason,
        banned_by: by,
        expires_at: days === null ? null : iso(-days * 24),
        lifted_at: null,
        created_at: at,
        users: sample.users,
      });
      patch.ban_id = banId;
    }
    changes.proposals.set(id, patch);
    // The ban row added above prints itself in the ban log (baseLog), so only a withdrawn or overturned proposal adds an
    // action row here, using the database path's vocabulary.
    if (decision === "overturn") {
      changes.log.unshift({
        id: nextModerationId(),
        user_id: sample.user_id,
        action: me === sample.proposed_by ? "withdraw" : "overturn",
        detail: `proposed by ${sample.proposed_by}`,
        actor: by,
        created_at: at,
        player_name: sample.users?.display_name ?? sample.user_id,
      });
    }
    revalidatePath("/", "layout");
    revalidatePath("/bans");
    return;
  }
  if (!databaseConfigured()) redirect(withNotice(PROPOSED, "error", NO_DATABASE));
  const result = await live.decideBanProposal({
    access: viewer.access,
    actorId: viewer.id,
    ownerEmails: ownerEmails(),
    proposalNumber: id,
    decision,
    note: String(formData.get("note") ?? ""),
  });
  if (!result.ok) {
    redirect(withNotice(PROPOSED, "error", result.missing && process.env.NODE_ENV === "development" ? MISSING_PROPOSAL : result.message));
  }
  revalidatePath("/", "layout");
  revalidatePath("/bans");
}

export async function confirmBanProposal(formData: FormData): Promise<void> {
  await decideProposal(formData, "confirm", "owner");
}

// Rejecting: the proposer withdraws their own proposal, anyone else overturns it (the data layer decides which).
export async function rejectBanProposal(formData: FormData): Promise<void> {
  await decideProposal(formData, "overturn", "reviewer");
}

export async function resolveReport(formData: FormData): Promise<void> {
  await requirePage("owner");
  const id = Number(formData.get("id") ?? 0);
  if (!id) return;
  const back = `/reports/${id}`;
  const viewer = await readViewer();
  if (!viewer) redirect(withNotice(back, "error", "Sign in again to decide this."));
  if (!databaseConfigured()) redirect(withNotice(back, "error", NO_DATABASE));
  const dismissed = formData.get("action") === "dismiss";
  const result = await live.decideReport({
    access: viewer.access,
    actorId: viewer.id,
    reportNumber: id,
    to: dismissed ? "dismissed" : "actioned",
    note: String(formData.get("note") ?? ""),
  });
  if (!result.ok) redirect(withNotice(back, "error", result.message));
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
    if (backTo) redirect(withNotice(backTo, "error", message));
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
  if (backTo) redirect(withNotice(backTo, "sent", String(count)));
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
