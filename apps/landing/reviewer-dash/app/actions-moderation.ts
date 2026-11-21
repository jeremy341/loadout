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
import { knownPlayers } from "../lib/sample/moderation-data";

const PROPOSED = "/bans?tab=proposed";
const NO_DATABASE = "The database is not connected here, so nothing was saved.";
const MISSING_PROPOSAL = "That ban proposal is sample data or was already decided. Nothing was saved.";

// Confirms (owner), overturns (a second-pass reviewer or an owner) or withdraws (the proposer) one proposal.
async function decideProposal(formData: FormData, decision: "confirm" | "overturn", role: "owner" | "reviewer"): Promise<void> {
  await requirePage(role);
  const id = Number(formData.get("id") ?? 0);
  if (!id) return;
  const viewer = await readViewer();
  if (!viewer) redirect(withNotice(PROPOSED, "error", "Sign in again to decide this."));
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
