// Pixl-shaped rows (snake_case, numeric ids, status strings) built from LOADOUT's sample review data:
// lib/platform/review.ts, review-fixtures.ts, review-fixtures-bulk.ts and lib/reviewer/desk. Ids are the ship number: sh-2043 is 2043.
// Everything is invented. Handles stand in for Slack ids, and nothing here is a real person, address or repository.
// Built once per server process; the in-memory store (./store.ts) is laid over the project rows by the db adapter.
import {
  REVIEW_AUDITS,
  REVIEW_SHIPS,
  REVIEWERS,
  approvedMinutes,
  journaledMinutes,
  trackedMinutes,
  deskViewer,
  type ReviewAudit,
  type ReviewShip,
} from "@/lib/platform/review";
import { doubleDipFor } from "@/lib/reviewer/desk/evidence-fixtures";
import type { CollaboratorRow, JournalRow, ProjectNoteRow, ProjectRow, ReviewAuditRow, UserRow } from "../db";
import { buildAuditNote } from "../auditNote";

const HOUR = 3_600_000;
const NOW = Date.now();
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export const iso = (hoursAgo: number): string => new Date(NOW - hoursAgo * HOUR).toISOString();

export const shipNumber = (id: string): number => Number(id.replace(/\D/g, ""));
export const userIdFor = (handle: string): string => `u-${handle}`;
// Pixl labels a staff member "Name (SlackID)". Here both parts are the handle.
export const staffLabel = (handle: string): string => `${handle} (${handle})`;

// "3 Nov" means the 3rd of the last November that is not in the future.
function dayToIso(day: string, index: number): string {
  const match = /^(\d{1,2}) ([A-Za-z]{3})/.exec(day);
  const month = match ? MONTHS.indexOf(match[2].toLowerCase()) : 0;
  const date = match ? Number(match[1]) : 1;
  const year = new Date(NOW).getUTCFullYear();
  let at = Date.UTC(year, Math.max(0, month), date, 9 + (index % 9), 12);
  if (at > NOW) at = Date.UTC(year - 1, Math.max(0, month), date, 9 + (index % 9), 12);
  return new Date(at).toISOString();
}

// The sample reviewers. The local test accounts map to these handles (deskViewer in lib/platform/review.ts), so a builder handle
// that belongs to a test account becomes that account's Slack id: the "your own submission" state can then be seen.
const OWN_BUILDERS: Record<string, string> = {};
for (const name of ["Test owner", "Test reviewer", "Test final reviewer", "Test hardware reviewer"]) {
  const person = deskViewer({ isOwner: false, canSecondPass: false, reviewQueues: "both" }, name);
  if (person.builder && person.reviewer) OWN_BUILDERS[person.builder] = person.reviewer;
}
export const slackIdFor = (handle: string): string => OWN_BUILDERS[handle] ?? handle;

const BASE_USER = {
  oauth_provider: "sample",
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
} as const;

const users = new Map<string, UserRow & { hackatime_token: string | null }>();

function birthdayFor(age: number, turnedNineteen: boolean): string {
  const at = new Date(NOW);
  if (turnedNineteen) {
    // Nineteen since five days ago, so they were eighteen when they shipped.
    at.setUTCFullYear(at.getUTCFullYear() - 19);
    at.setUTCDate(at.getUTCDate() - 5);
    return at.toISOString().slice(0, 10);
  }
  at.setUTCFullYear(at.getUTCFullYear() - age);
  at.setUTCMonth(at.getUTCMonth() - 4);
  return at.toISOString().slice(0, 10);
}

export function ensureUser(handle: string, extra: Partial<UserRow> = {}): UserRow {
  const id = userIdFor(handle);
  const have = users.get(id);
  if (have) return have;
  const row = {
    ...BASE_USER,
    id,
    oauth_id: id,
    display_name: handle,
    slack_id: slackIdFor(handle),
    created_at: iso(24 * 90),
    birthday: null,
    address_country: "",
    hackatime_token: null,
    ...extra,
  } as UserRow & { hackatime_token: string | null };
  users.set(id, row);
  return row;
}

// A final reviewer sees the second half of the evidence the same way a builder row does: one row per person.
function ownerRow(ship: ReviewShip): UserRow {
  return ensureUser(ship.builder, {
    birthday: birthdayFor(ship.builderAge, ship.turnedNineteen === true),
    address_country: ship.builderCountry,
  });
}

function projectStatus(ship: ReviewShip): { status: string; patch: Partial<ProjectRow> } {
  switch (ship.status) {
    case "waiting":
    case "claimed":
      return { status: "shipped", patch: {} };
    case "second-pass":
      return { status: "second_review", patch: { second_pass_verdict: "not_fraud", second_pass_by: "Robert", second_pass_at: iso(6) } };
    case "proposed-ban":
      return { status: "second_review", patch: { first_pass_verdict: "banned" } };
    case "approved":
      return { status: "approved", patch: {} };
    case "needs-changes":
      return { status: "needs_changes", patch: {} };
    case "banned":
      return { status: "banned", patch: { banned_at: iso(30) } };
  }
}

// An SYSTEM note in the words the server writes (see lib/doubleDip.ts), from the sample matcher.
function systemNoteFor(ship: ReviewShip): string {
  const result = doubleDipFor(ship.id);
  const match = result?.matches[0];
  if (!result || !match) return "";
  const where = match.other.label;
  if (match.other.program === "another-ysws") {
    const undisclosed = ship.id === "sh-2043";
    return undisclosed
      ? `SYSTEM: ${ship.source} already appears in ${where} but the builder did NOT disclose it. Possible double dip. ${match.detail}.`
      : `SYSTEM: Builder disclosed this was submitted to ${where}. ${match.detail}.`;
  }
  return `SYSTEM: This ship matches another LOADOUT ship (${where}): ${match.detail}.`;
}

function buildProject(ship: ReviewShip): ProjectRow {
  const id = shipNumber(ship.id);
  const owner = ownerRow(ship);
  const { status, patch } = projectStatus(ship);
  const tracked = trackedMinutes(ship);
  const ownerJournal = journaledMinutes(ship);
  const software = ship.evidence.source === "hackatime";
  const approved = approvedMinutes(ship);
  const claimed = ship.claimedBy !== null && ship.status === "claimed";
  const reserved = ship.reserved;
  const firstShipped = ship.firstShippedHoursAgo ?? ship.submittedHoursAgo;
  const first = ship.firstPass;
  const decided = ship.decision;
  const row: ProjectRow = {
    id,
    user_id: owner.id,
    name: ship.title,
    description: ship.capability,
    repo_url: ship.source ? `https://${ship.source.replace(/^https?:\/\//, "")}` : null,
    demo_url: ship.demo ? `https://${ship.demo.replace(/^https?:\/\//, "")}` : null,
    hackatime_projects: ship.evidence.source === "hackatime" ? ship.evidence.projects.map((item) => item.name) : [],
    hackatime_seconds: (software ? tracked : tracked + ownerJournal) * 60,
    status,
    review_note: decided?.reason ?? "",
    review_note_by: decided ? staffLabel(decided.by) : "",
    approved_hours: decided?.outcome === "approved" && approved !== null ? approved / 60 : status === "approved" ? ownerJournal / 60 : null,
    prior_approved_hours: ship.update ? ship.update.priorApprovedMinutes / 60 : 0,
    image_url: "",
    level: 1,
    track: ship.track,
    research_mode: ship.researchMode,
    project_type: ship.projectType,
    is_game: ship.isGame,
    kind: ship.kind,
    // LOADOUT has no per-project funding.
    needs_funding: false,
    funding_usd: 0,
    funding_deducted_px: 0,
    bom_url: ship.evidence.source === "lapse" ? `https://git.example/${ship.builder}/bom.csv` : "",
    cart_screenshot_urls: [],
    used_ai: ship.ai.percent > 0,
    ai_notes: ship.ai.note,
    ai_review_status: "done",
    ai_review_started_at: null,
    ai_review_summary: "",
    ai_review_findings: null,
    ai_review_error: "",
    is_update: !!ship.update,
    update_notes: ship.update?.notes ?? "",
    ship_note: ship.shipNote ?? "",
    other_ysws: /^SYSTEM: Builder disclosed/.test(systemNoteFor(ship)),
    other_ysws_notes: "",
    system_note: systemNoteFor(ship),
    imported_ysws_entry_id: null,
    imported_from_ysws: null,
    imported_ysws_hours: null,
    imported_ysws_approved_at: null,
    archived_at: null,
    rejected_at: null,
    reject_reason: "",
    reject_by: "",
    banned_at: ship.status === "banned" ? iso(ship.ban?.hoursAgo ?? 30) : null,
    ban_reason: ship.ban?.reason ?? "",
    ban_by: ship.ban ? staffLabel(ship.ban.by) : "",
    journal_share_token: null,
    reviewing_by: claimed ? (ship.claimedBy as string) : "",
    reviewing_at: claimed ? iso(0.1) : null,
    first_pass_by: first ? staffLabel(first.by) : "",
    first_pass_at: first ? iso(first.hoursAgo) : null,
    first_pass_note: first?.note ?? "",
    first_pass_hours: first?.minutes != null ? first.minutes / 60 : null,
    first_pass_verdict: first ? (first.verdict === "needs-changes" ? "needs_changes" : first.verdict) : null,
    second_pass_by: "",
    second_pass_at: null,
    second_pass_note: "",
    second_pass_hours: null,
    second_pass_verdict: null,
    shipped_at: iso(ship.submittedHoursAgo),
    first_shipped_at: iso(firstShipped),
    created_at: iso(firstShipped + 24 * 6),
    sidequest_id: null,
    trial_prize_order_id: null,
    eligibility_attested: true,
    is_peak: false,
    robert_project_id: null,
    robert_submitted_at: null,
    robert_trust_score: status === "second_review" ? 8 : null,
    robert_note: null,
    robert_reviewed_at: status === "second_review" ? iso(6) : null,
    robert_state: status === "second_review" ? "decided" : null,
    robert_outcome: null,
    robert_outcome_at: null,
    robert_error: "",
    airtable_record_id: null,
    second_pass_telescreen_checked: ship.finalChecks?.[0] ?? false,
    second_pass_hours_deflated: ship.finalChecks?.[1] ?? false,
    second_pass_heartbeats_added: ship.finalChecks?.[2] ?? false,
    hours_extended_since: null,
    hours_extended_by: "",
    hours_extended_note: "",
    deflation_reason: "",
    hours_deflated_at: null,
    hours_deflated_by: "",
    hold_at: ship.hold ? iso(ship.hold.hoursAgo) : null,
    hold_by: ship.hold ? staffLabel(ship.hold.by) : "",
    hold_reason: ship.hold?.reason ?? "",
    assigned_reviewer_slack_id: reserved ? reserved.reviewer : "",
    // The window is 72 hours from the re-ship (lib/reviewAssignment.ts); "hours left" puts the start that far back.
    assigned_at: reserved ? iso(72 - reserved.hoursLeft) : null,
    assignment_reminded_at: null,
    spot_checked_at: null,
    spot_checked_by: "",
    review_draft: null,
    review_draft_by: "",
    review_draft_at: null,
    ...patch,
  };
  return row;
}

export const PROJECTS: ProjectRow[] = REVIEW_SHIPS.map(buildProject);
const PROJECT_BY_ID = new Map(PROJECTS.map((row) => [row.id, row]));
const SHIP_BY_NUMBER = new Map(REVIEW_SHIPS.map((ship) => [shipNumber(ship.id), ship]));
export const shipFor = (projectId: number): ReviewShip | null => SHIP_BY_NUMBER.get(projectId) ?? null;
export const baseProject = (projectId: number): ProjectRow | null => PROJECT_BY_ID.get(projectId) ?? null;

// ---- Journals ----

export const JOURNALS: JournalRow[] = [];
let journalId = 0;
for (const ship of REVIEW_SHIPS) {
  const project = shipNumber(ship.id);
  const owner = userIdFor(ship.builder);
  ship.journals.forEach((entry, index) => {
    journalId += 1;
    let approvedHours: number | null = null;
    let reason: string | null = null;
    if (entry.action) {
      const kept = entry.action === "approve-all" ? entry.minutes : entry.action === "partial" ? Math.min(entry.keptMinutes ?? 0, entry.minutes) : 0;
      approvedHours = kept / 60;
      reason = kept < entry.minutes ? (entry.reason ?? "Hours reduced by a reviewer.") : null;
    }
    JOURNALS.push({
      id: journalId,
      project_id: project,
      user_id: owner,
      title: `Entry ${ship.journals.length - index}`,
      content: entry.text,
      hours: entry.minutes / 60,
      approved_hours: approvedHours,
      deflation_reason: reason,
      created_at: dayToIso(entry.day, index),
      edited_at: null,
    });
  });
  for (const mate of ship.collaborators ?? []) {
    journalId += 1;
    JOURNALS.push({
      id: journalId,
      project_id: project,
      user_id: userIdFor(mate.handle),
      title: "Collaborator entry",
      content: "Worked on the parts list and the enclosure.",
      hours: mate.journalMinutes / 60,
      approved_hours: null,
      deflation_reason: null,
      created_at: iso(ship.submittedHoursAgo + 12),
      edited_at: null,
    });
  }
}

// ---- Collaborators ----

export const COLLABORATORS: CollaboratorRow[] = [];
let collaboratorId = 0;
for (const ship of REVIEW_SHIPS) {
  for (const mate of ship.collaborators ?? []) {
    collaboratorId += 1;
    const person = ensureUser(mate.handle);
    COLLABORATORS.push({
      id: collaboratorId,
      project_id: shipNumber(ship.id),
      user_id: person.id,
      invited_by: userIdFor(ship.builder),
      status: "accepted",
      hackatime_projects: ship.evidence.source === "hackatime" ? ship.evidence.projects.map((item) => item.name) : [],
      hackatime_seconds: mate.trackedMinutes * 60,
      approved_hours: null,
      users: { id: person.id, display_name: person.display_name, real_name: person.real_name, slack_id: person.slack_id },
    });
  }
}

// ---- Notes ----

export const NOTES: ProjectNoteRow[] = [];
let noteId = 0;
for (const ship of REVIEW_SHIPS) {
  for (const note of ship.notes) {
    noteId += 1;
    NOTES.push({ id: noteId, project_id: shipNumber(ship.id), author: staffLabel(note.author), body: note.body, image_url: null, created_at: iso(note.hoursAgo) });
  }
}

// ---- Audits (the verdict history) ----

function buildAudit(audit: ReviewAudit, index: number): ReviewAuditRow {
  const ship = shipFor(shipNumber(audit.ship));
  const builder = ship?.builder ?? "unknown";
  const sections = audit.sections ?? {};
  return {
    id: index + 1,
    project_id: shipNumber(audit.ship),
    user_id: userIdFor(builder),
    reviewer: staffLabel(audit.reviewer),
    verdict: audit.verdict,
    note: audit.note,
    audit_note: buildAuditNote({
      "TECHNICAL FEATURES": sections.technical,
      "DEFLATION REASON": sections.deflation,
      "AGE JUSTIFICATION": sections.age,
      NOTES: sections.notes,
    }),
    claimed_hours: audit.claimedMinutes / 60,
    approved_hours: audit.approvedMinutes === null ? null : audit.approvedMinutes / 60,
    repo_opened: audit.repoSeconds !== null,
    demo_opened: audit.demoSeconds !== null,
    repo_seconds: audit.repoSeconds ?? 0,
    demo_seconds: audit.demoSeconds ?? 0,
    total_seconds: audit.seconds,
    created_at: iso(audit.hoursAgo),
    player_name: builder,
    project_name: ship?.title ?? `#${shipNumber(audit.ship)}`,
  };
}

export const AUDITS: ReviewAuditRow[] = REVIEW_AUDITS.map(buildAudit).sort((a, b) => b.created_at.localeCompare(a.created_at));

for (const ship of REVIEW_SHIPS) ownerRow(ship);
for (const person of REVIEWERS) ensureUser(person.handle);
export const USERS = (): (UserRow & { hackatime_token: string | null })[] => [...users.values()];
export const userBySlackId = (slackId: string) => USERS().find((row) => row.slack_id === slackId) ?? null;
