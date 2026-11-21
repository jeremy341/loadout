// Real ships for the reviewer desk. The desk keeps Pixl's row shapes (snake_case, numeric ids, status strings, handles for people),
// so this file turns the database rows of lib/platform/review-data.ts into those shapes. Nothing here writes: the actions in
// lib/platform/review-actions.ts do, and reviewer-dash/app/actions-review.ts forwards to them for a real ship.
//
// Ids: a real ship's desk id is Project.seq, a real journal's is JournalEntry.seq. Both start at 100000, so they never meet the
// sample ships (ids below 4000). isRealId() tells them apart.
// People: Pixl compares Slack ids. Here a person's handle stands in: the sample handle of a local test account, else the display
// name as a slug (the same rule as reviewer-dash/lib/session.ts). The real authorisation always uses Person ids.
//
// Status words: submitted and in-review are Pixl's "shipped" (a reviewer's lock is the claim, not a status); second-pass is
// "second_review" (with first_pass_verdict "banned" for a ban proposal); needs-changes is "needs_changes".
//
// Sample ships: shown only when sampleShipsOn() is true (local test accounts, unless LOADOUT_REVIEW_SAMPLE_SHIPS=false, or set to
// "true" anywhere). They are a development fixture; a production desk has real ships only.
import { cache } from "react";
import { deskViewer } from "@/lib/platform/review";
import { localTestAccountsEnabled } from "@/lib/platform/local-accounts";
import { assignmentView, listDeskShips, listPersonNames, listShipAudits, type DeskShip, type ShipAudit } from "@/lib/platform/review-data";
import type { JournalRow, ProjectNoteRow, ProjectRow, ReviewAuditRow, UserRow } from "./db";

export const REAL_ID_BASE = 100_000;
export const isRealId = (id: number): boolean => Number.isSafeInteger(id) && id >= REAL_ID_BASE;

export function sampleShipsOn(env: NodeJS.ProcessEnv = process.env): boolean {
  // A test fixture switch must never populate a production desk, even if someone sets the flag in a shared environment.
  if (env.LOADOUT_REVIEW_SAMPLE_SHIPS === "false") return false;
  if (env.LOADOUT_REVIEW_SAMPLE_SHIPS === "true") return localTestAccountsEnabled(env);
  return localTestAccountsEnabled(env);
}

const NO_ACCESS = { isOwner: false, canSecondPass: false, reviewQueues: "both" } as const;
export function handleOfName(displayName: string): string {
  const mapped = deskViewer(NO_ACCESS, displayName).reviewer;
  return mapped || displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "reviewer";
}
export const labelOf = (handle: string): string => (handle ? `${handle} (${handle})` : "");

const iso = (date: Date | null | undefined): string | null => (date ? date.toISOString() : null);

export type RealSnapshot = {
  ships: DeskShip[];
  projects: ProjectRow[];
  journals: JournalRow[];
  users: Map<string, UserRow & { hackatime_token: string | null }>;
  handleOf: (personId: string | null | undefined) => string;
  shipFor: (projectId: number) => DeskShip | null;
};

const BASE_USER = {
  oauth_provider: "loadout",
  real_name: "",
  first_name: "",
  last_name: "",
  email: null,
  avatar_url: null,
  skin: "",
  pixels: 0,
  address_line1: "",
  address_line2: "",
  address_city: "",
  address_state: "",
  address_postal: "",
  address_country: "",
} as const;

function projectRow(ship: DeskShip, handleOf: (id: string | null | undefined) => string): ProjectRow {
  const second = ship.status === "second-pass";
  const proposedBan = second && !!ship.proposedBanBy;
  const status = ship.status === "submitted" || ship.status === "in-review" ? "shipped" : second ? "second_review" : ship.status === "needs-changes" ? "needs_changes" : ship.status;
  const claimTouch = ship.facts.claimHeartbeatAt ?? ship.facts.claimedAt;
  const view = assignmentView(ship, new Date());
  const firstBy = handleOf(ship.firstPassBy);
  const reshipped = ship.reshippedAt ?? ship.submittedAt;
  return {
    id: ship.seq,
    user_id: ship.owner.id,
    name: ship.title,
    description: ship.description,
    repo_url: ship.repoUrl,
    demo_url: ship.demoUrl,
    hackatime_projects: [],
    // There is no Hackatime link yet, so no tracked time: the claimed hours are the builder's journal hours.
    hackatime_seconds: 0,
    status,
    review_note: ship.reviewNote ?? "",
    review_note_by: "",
    approved_hours: ship.status === "approved" ? ship.approvedMinutes / 60 : null,
    prior_approved_hours: ship.isUpdate && ship.status !== "approved" ? ship.approvedMinutes / 60 : 0,
    image_url: "",
    level: 1,
    track: ship.track,
    research_mode: false,
    project_type: null,
    is_game: false,
    kind: ship.kind,
    needs_funding: false,
    funding_usd: 0,
    funding_deducted_px: 0,
    bom_url: "",
    cart_screenshot_urls: [],
    used_ai: false,
    ai_notes: "",
    ai_review_status: "done",
    ai_review_started_at: null,
    ai_review_summary: "",
    ai_review_findings: null,
    ai_review_error: "",
    is_update: ship.isUpdate,
    update_notes: ship.changeNote ?? "",
    ship_note: "",
    other_ysws: false,
    other_ysws_notes: "",
    system_note: "",
    imported_ysws_entry_id: null,
    imported_from_ysws: null,
    imported_ysws_hours: null,
    imported_ysws_approved_at: null,
    archived_at: null,
    rejected_at: null,
    reject_reason: "",
    reject_by: "",
    banned_at: iso(ship.bannedAt),
    ban_reason: ship.status === "banned" ? (ship.proposedBanReason ?? "") : "",
    ban_by: "",
    journal_share_token: null,
    reviewing_by: ship.facts.claimedBy ? handleOf(ship.facts.claimedBy) : "",
    reviewing_at: iso(claimTouch),
    first_pass_by: proposedBan ? handleOf(ship.proposedBanBy) : firstBy,
    first_pass_at: iso(ship.firstPassAt),
    first_pass_note: ship.firstPassNote ?? "",
    first_pass_hours: ship.firstPassMinutes != null ? ship.firstPassMinutes / 60 : null,
    first_pass_verdict: proposedBan ? "banned" : ship.firstPassBy ? "approved" : null,
    second_pass_by: ship.triageBy ? handleOf(ship.triageBy) : "",
    second_pass_at: iso(ship.triageAt),
    second_pass_note: ship.triageNote ?? "",
    second_pass_hours: null,
    second_pass_verdict: ship.triage === "not-fraud" ? "not_fraud" : ship.triage === "fraud" ? "fraud" : null,
    shipped_at: iso(reshipped),
    first_shipped_at: iso(ship.firstShippedAt ?? ship.submittedAt),
    created_at: ship.createdAt.toISOString(),
    sidequest_id: null,
    trial_prize_order_id: null,
    eligibility_attested: true,
    is_peak: false,
    robert_project_id: null,
    robert_submitted_at: null,
    robert_trust_score: null,
    robert_note: null,
    robert_reviewed_at: null,
    robert_state: null,
    robert_outcome: null,
    robert_outcome_at: null,
    robert_error: "",
    airtable_record_id: null,
    second_pass_telescreen_checked: false,
    second_pass_hours_deflated: false,
    second_pass_heartbeats_added: false,
    hours_extended_since: null,
    hours_extended_by: "",
    hours_extended_note: "",
    deflation_reason: "",
    hours_deflated_at: null,
    hours_deflated_by: "",
    hold_at: iso(ship.heldAt),
    hold_by: ship.heldBy ? labelOf(handleOf(ship.heldBy)) : "",
    hold_reason: ship.holdReason ?? "",
    assigned_reviewer_slack_id: view.locked || ship.status === "needs-changes" ? handleOf(ship.assignedTo) : "",
    assigned_at: iso(ship.reshippedAt),
    assignment_reminded_at: iso(ship.assignmentRemindedAt),
    spot_checked_at: null,
    spot_checked_by: "",
    review_draft: null,
    review_draft_by: "",
    review_draft_at: null,
  };
}

export const loadReal = cache(async (): Promise<RealSnapshot> => {
  const ships = await listDeskShips();
  const ids = ships.flatMap((ship) => [ship.owner.id, ship.facts.claimedBy, ship.firstPassBy, ship.heldBy, ship.assignedTo, ship.proposedBanBy, ship.triageBy, ...ship.journals.map((entry) => entry.authorId)]);
  const names = await listPersonNames(ids.filter((id): id is string => !!id));
  const handles = new Map([...names].map(([id, name]) => [id, handleOfName(name)]));
  const handleOf = (id: string | null | undefined): string => (id ? (handles.get(id) ?? "") : "");
  const users = new Map<string, UserRow & { hackatime_token: string | null }>();
  for (const ship of ships) {
    if (users.has(ship.owner.id)) continue;
    users.set(ship.owner.id, {
      ...BASE_USER,
      id: ship.owner.id,
      oauth_id: ship.owner.id,
      display_name: ship.owner.displayName,
      slack_id: handleOf(ship.owner.id),
      created_at: ship.createdAt.toISOString(),
      birthday: ship.owner.birthday ? ship.owner.birthday.toISOString().slice(0, 10) : null,
      hackatime_token: null,
    });
  }
  const journals: JournalRow[] = ships.flatMap((ship) =>
    ship.journals.map((entry) => {
      const kept = entry.keptMinutes;
      const cut = kept != null && kept < entry.minutes;
      return {
        id: entry.seq,
        project_id: ship.seq,
        user_id: entry.authorId,
        title: entry.title,
        content: entry.body,
        hours: entry.hours,
        approved_hours: kept != null ? kept / 60 : null,
        deflation_reason: cut ? (entry.reviewReason ?? "") : null,
        created_at: entry.createdAt.toISOString(),
        edited_at: null,
      };
    }),
  );
  const byId = new Map(ships.map((ship) => [ship.seq, ship]));
  return { ships, projects: ships.map((ship) => projectRow(ship, handleOf)), journals, users, handleOf, shipFor: (id) => byId.get(id) ?? null };
});

// ---- History and notes, from the audit rows ----

const VERDICTS = new Set(["first_pass_approved", "approved", "needs_changes", "first_pass_banned", "banned", "ban_overturned"]);

export const loadAudits = cache(async (): Promise<{ audits: ReviewAuditRow[]; notes: ProjectNoteRow[] }> => {
  const [rows, snap] = await Promise.all([listShipAudits(undefined, 400), loadReal()]);
  const byId = new Map(snap.ships.map((ship) => [ship.id, ship]));
  const names = await listPersonNames(rows.map((row) => row.actorId));
  const audits: ReviewAuditRow[] = [];
  const notes: ProjectNoteRow[] = [];
  rows.forEach((row: ShipAudit, index) => {
    const ship = byId.get(row.projectId);
    if (!ship) return;
    const handle = handleOfName(names.get(row.actorId) ?? "");
    const after = row.after;
    if (row.action === "review.note") {
      notes.push({ id: 200_000 + index, project_id: ship.seq, author: labelOf(handle), body: String(after.body ?? row.reason), image_url: null, created_at: row.createdAt.toISOString() });
      return;
    }
    const verdict = String(after.verdict ?? "");
    if (!VERDICTS.has(verdict)) return;
    const approvedMinutes = typeof after.approvedMinutes === "number" ? after.approvedMinutes : null;
    audits.push({
      id: 200_000 + index,
      project_id: ship.seq,
      user_id: ship.owner.id,
      reviewer: labelOf(handle),
      verdict,
      note: row.reason,
      audit_note: String(after.auditNote ?? ""),
      claimed_hours: (typeof after.claimedMinutes === "number" ? after.claimedMinutes : 0) / 60,
      approved_hours: verdict === "approved" || verdict === "first_pass_approved" ? (approvedMinutes ?? 0) / 60 : null,
      repo_opened: after.repoOpened === true,
      demo_opened: after.demoOpened === true,
      repo_seconds: Number(after.repoSeconds) || 0,
      demo_seconds: Number(after.demoSeconds) || 0,
      total_seconds: Number(after.totalSeconds) || 0,
      created_at: row.createdAt.toISOString(),
      player_name: ship.owner.displayName,
      project_name: ship.title,
    });
  });
  return { audits, notes };
});
