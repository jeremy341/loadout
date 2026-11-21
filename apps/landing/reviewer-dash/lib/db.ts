// Pixl's row types, copied verbatim from references/pixl/apps/internal-dashboard/lib/db.ts. The reviewer site keeps Pixl's shapes (snake_case,
// numeric ids, status strings) so the copied pages and components run unchanged; the data behind them is sample data.

export interface UserRow {
  id: string;
  oauth_provider: string;
  oauth_id: string;
  display_name: string;
  // Real name from Hack Club OAuth. This is what the dashboard shows , the
  // in-game display_name can drift from it. Empty for players who haven't logged
  // in since real_name was added; call playerLabel() to fall back gracefully.
  real_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  avatar_url: string | null;
  skin: string;
  slack_id: string | null;
  pixels: number;
  created_at: string;
  // YSWS Unified Database fields , filled in by the player via /account in
  // apps/game/web, not backfillable. birthday drives the "turns 19 mid-review"
  // age-eligibility flag on the review page.
  birthday: string | null;
  address_line1: string;
  address_line2: string;
  address_city: string;
  address_state: string;
  address_country: string;
  address_postal: string;
}

export function playerLabel(
  u: { real_name?: string | null; display_name?: string | null } | null | undefined,
  fallback = "",
): string {
  return (u?.real_name || u?.display_name || fallback).trim();
}

export interface ViolationRow {
  id: number;
  user_id: string;
  kind: string;
  content: string;
  created_at: string;
  users?: Pick<UserRow, "id" | "display_name" | "real_name" | "slack_id"> | null;
}

export interface BanRow {
  id: number;
  user_id: string;
  reason: string;
  banned_by: string;
  expires_at: string | null;
  lifted_at: string | null;
  created_at: string;
  users?: Pick<UserRow, "id" | "display_name" | "real_name"> | null;
}

export interface ProjectRow {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  demo_url: string | null;
  hackatime_projects: string[];
  hackatime_seconds: number;
  status: string;
  review_note: string;
  review_note_by: string;
  approved_hours: number | null;
  /** Approved total frozen when an update was shipped; update Airtable rows carry approved_hours minus this. */
  prior_approved_hours: number;
  image_url: string;
  level: number;
  /** The project's one track (Tools, Systems, Compute or Hardware). LOADOUT has no tiers: `level` is kept for the copied code and not shown. */
  track?: string | null;
  /** Research Mode is a modifier (a question, a method, measurements and a write-up). It earns no extra XP. */
  research_mode?: boolean;
  project_type: string | null;
  is_game: boolean;
  kind: string;
  needs_funding: boolean;
  funding_usd: number;
  funding_deducted_px: number;
  bom_url: string;
  cart_screenshot_urls: string[];
  used_ai: boolean;
  ai_notes: string;
  // AI pre-check (apps/server/src/precheck/), read through lib/precheck.ts.
  ai_review_status?: string;
  ai_review_started_at?: string | null;
  ai_review_summary?: string;
  ai_review_findings?: unknown;
  ai_review_error?: string;
  is_update: boolean;
  update_notes: string;
  ship_note: string;
  other_ysws: boolean;
  other_ysws_notes: string;
  system_note: string;
  imported_ysws_entry_id: string | null;
  imported_from_ysws: string | null;
  imported_ysws_hours: number | null;
  imported_ysws_approved_at: string | null;
  archived_at: string | null;
  rejected_at: string | null;
  reject_reason: string;
  reject_by: string;
  banned_at: string | null;
  ban_reason: string;
  ban_by: string;
  /** Long random token for the public, no-login journal-only page (see
   * ensureJournalShareToken below and apps/game/web/journals). Null until
   * lazily generated, the first time this project is pushed to Airtable. */
  journal_share_token: string | null;
  reviewing_by: string;
  reviewing_at: string | null;
  first_pass_by: string;
  first_pass_at: string | null;
  first_pass_note: string;
  first_pass_hours: number | null;
  first_pass_verdict: string | null;
  // Second pass is now Robert's fraud review (lib/robertSync.ts), not a
  // human triage step - a landed review always writes second_pass_by
  // "Robert" and verdict "not_fraud" (parking it for a super's real verdict
  // in Second pass), carrying Robert's own note here. second_pass_hours is
  // unused by Robert (null) - kept for the Second pass reviewer to still see
  // what a verdict's hours were historically. null verdict = still parked
  // in fraud_review, awaiting Robert (see the Second pass tab).
  second_pass_by: string;
  second_pass_at: string | null;
  second_pass_note: string;
  second_pass_hours: number | null;
  second_pass_verdict: string | null;
  shipped_at: string | null;
  // First ever ship; shipped_at restarts on every reship (migration 0208).
  first_shipped_at?: string | null;
  created_at: string;
  sidequest_id: number | null;
  trial_prize_order_id: number | null;
  eligibility_attested: boolean;
  // Reviewer-only cosmetic flag, see toggleProjectPeak in actions.ts. Never
  // player-set, never affects payout.
  is_peak: boolean;
  // Robert fraud review (telescreen.hackclub.com), the fraud determination
  // now - see lib/robert.ts/robertSync.ts. robert_error holds the last
  // submission failure so a stuck project explains itself in the UI.
  // robert_state is Robert's own project state at last sync (awaiting_review
  // / awaiting_outcome / rejected_fraud / decided).
  robert_project_id: string | null;
  robert_submitted_at: string | null;
  robert_trust_score: number | null;
  robert_note: string | null;
  robert_reviewed_at: string | null;
  robert_state: string | null;
  robert_outcome: string | null;
  robert_outcome_at: string | null;
  robert_error: string;
  // Airtable YSWS push (see sendProjectToAirtable in app/actions.ts) - the
  // Airtable record id once this project has been pushed, so a re-send
  // updates the existing row instead of creating a duplicate.
  airtable_record_id: string | null;
  // Second-pass checklist (see updateSecondPassChecklist in app/actions.ts) -
  // replaces Joe's automated fraud pass with the final reviewer's own checks.
  second_pass_telescreen_checked: boolean;
  second_pass_hours_deflated: boolean;
  second_pass_heartbeats_added: boolean;
  // A past reviewer override that counted Hackatime hours from before the
  // global hackatimeCutoff for this one project. The override can no longer
  // be set from the dashboard; these only describe ones already applied.
  // hours_extended_since is the "since" date used; null means none.
  hours_extended_since: string | null;
  hours_extended_by: string;
  hours_extended_note: string;
  // Post-approval hour correction from the project page, see
  // deflateProjectHours in app/actions.ts - opposite direction from
  // hours_extended_* above. hours_deflated_at null = never deflated.
  deflation_reason: string;
  hours_deflated_at: string | null;
  hours_deflated_by: string;
  // Super-admin-only hold: blocks submitting any verdict on this project
  // while set (still visible in the queue). See holdReview/releaseReviewHold
  // in app/actions.ts. hold_at null = not held.
  hold_at: string | null;
  hold_by: string;
  hold_reason: string;
  // The reviewer who first requested changes on this project, when it's back
  // in first pass: only they (and owners) can review it for 3 days after the
  // re-ship, see lib/reviewAssignment.ts. '' = nobody.
  assigned_reviewer_slack_id: string;
  assigned_at: string | null;
  assignment_reminded_at: string | null;
  // Optional super-admin QA pass over second_review projects (the Second pass
  // tab, markSpotChecked in app/actions.ts). Doesn't gate the project - purely
  // a "has a super looked at how this was reviewed" marker. Global once set
  // (not per-admin), and reset back to null whenever a project re-enters
  // second_review from a fresh first-pass approval.
  spot_checked_at: string | null;
  spot_checked_by: string;
  // Shared review-form draft (ReviewForm.tsx's saveDraft, one per project -
  // last writer wins), so a super leaving notes while spot-checking is
  // visible to whoever opens the project next, not stuck in their own
  // browser's localStorage. Cleared the moment a real verdict is submitted
  // (see reviewProject in app/actions.ts).
  review_draft: Record<string, string | number> | null;
  review_draft_by: string;
  review_draft_at: string | null;
}

export interface PlayerStateRow {
  user_id: string;
  scene: string;
  pos_x: number;
  pos_y: number;
  direction: string;
  updated_at: string;
}

export interface ModActionRow {
  id: number;
  user_id: string;
  action: string;
  detail: string;
  actor: string;
  created_at: string;
}

export interface AdminRow {
  slack_id: string;
  name: string;
  permissions: string[];
  added_by: string;
  created_at: string;
}

export interface ProjectWithUser extends ProjectRow {
  users?: Pick<UserRow, "id" | "display_name" | "real_name" | "slack_id" | "birthday"> | null;
}

const QUEUE_FIELDS = [
  "id",
  "user_id",
  "name",
  "image_url",
  "level",
  "track",
  "project_type",
  "is_game",
  "kind",
  "status",
  "needs_funding",
  "funding_usd",
  "is_peak",
  "is_update",
  "hold_at",
  "hold_reason",
  "first_pass_by",
  "first_pass_at",
  "first_shipped_at",
  "shipped_at",
  "reviewing_by",
  "reviewing_at",
  "hackatime_projects",
  "hackatime_seconds",
  "ai_review_status",
  "ai_review_started_at",
  "assigned_reviewer_slack_id",
  "assigned_at",
  "assignment_reminded_at",
] as const;

export interface ShippedProject extends Pick<ProjectRow, (typeof QUEUE_FIELDS)[number]> {
  users?: Pick<UserRow, "id" | "display_name" | "slack_id"> | null;
  hours: number;
  hackatimeHours: number;
  journalHours: number;
  entries: number;
  own?: boolean;
  /** Slack id of another reviewer actively holding this, if any. */
  claimedBy?: string;
}

export interface IdeaWithUser {
  id: number;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  banned_at: string | null;
  ban_reason: string;
  ban_by: string;
  users?: Pick<UserRow, "id" | "display_name" | "real_name"> | null;
}

export interface RobertReviewRow {
  id: number;
  name: string;
  status: string;
  approved_hours: number | null;
  hackatime_seconds: number | null;
  banned_at: string | null;
  robert_trust_score: number;
  robert_note: string | null;
  robert_reviewed_at: string | null;
  robert_state: string | null;
  users: { display_name: string | null; real_name: string | null; slack_id: string | null } | null;
}

export interface ReviewAuditRow {
  id: number;
  project_id: number;
  user_id: string;
  reviewer: string;
  verdict: string;
  note: string;
  audit_note: string;
  claimed_hours: number;
  approved_hours: number | null;
  repo_opened: boolean;
  demo_opened: boolean;
  repo_seconds: number;
  demo_seconds: number;
  total_seconds: number;
  created_at: string;
  player_name: string;
  project_name: string;
}

// player_name is the builder's legal name only with opts.realNames (owners and
// final reviewers, canSeeBuilderPII in lib/reviewAccess.ts); otherwise their

export interface ProjectNoteRow {
  id: number;
  project_id: number;
  author: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

export interface ReviewerStats {
  reviews: number;
  approved: number;
  firstPass: number;
  needsChanges: number;
  hoursApproved: number;
  avgSeconds: number;
  repoOpenRate: number;
  flagged: number;
  lastReview: string | null;
}


export function auditFlags(a: {
  verdict: string;
  total_seconds: number;
  repo_opened: boolean;
}): string[] {
  const flags: string[] = [];
  if (a.total_seconds > 0 && a.total_seconds < 60) flags.push("under a minute");
  if (
    (a.verdict === "approved" || a.verdict === "first_pass_approved") &&
    !a.repo_opened
  )
    flags.push("repo never opened");
  return flags;
}


export interface PayoutTotals {
  earnedPixels: number;
  paid: number;
  pending: number;
  cut: number;
}

export interface JournalRow {
  id: number;
  project_id: number;
  user_id: string;
  title: string;
  content: string;
  hours: number;
  // A reviewer's override for this one entry, set from the Journals tab -
  // null means "use the player's own claimed `hours` above, unchanged".
  approved_hours: number | null;
  // Why approved_hours is currently lower than hours - required whenever
  // approved_hours deflates, cleared back to null whenever it doesn't (see
  // 0178_journal_deflation_reason.sql).
  deflation_reason: string | null;
  created_at: string;
  edited_at: string | null;
}

export interface CollaboratorRow {
  id: number;
  project_id: number;
  user_id: string;
  invited_by: string;
  status: string;
  hackatime_projects: string[];
  hackatime_seconds: number | null;
  approved_hours: number | null;
  users?: Pick<UserRow, "id" | "display_name" | "real_name" | "slack_id"> | null;
}

// Accepted (and, for the reviewer's own visibility, pending) collaborators on

export interface GrowthPoint {
  date: string;
  total: number;
  added: number;
}

export interface PixelFlowPoint {
  date: string;
  given: number;
  deducted: number;
}


export interface FeedItem {
  kind: "mod" | "team" | "review" | "pixels" | "payout";
  text: string;
  detail: string;
  href: string | null;
  when: string;
}

export const REVIEW_LOCK_MS = 30 * 60 * 1000;


// ---------------------------------------------------------------------------------------------------------------------------
// The adapter. Same exported names as Pixl's lib/db.ts for what the review area imports; the data is the sample data in
// ./sample, with the in-memory store laid over it. Functions LOADOUT has no service for answer with an honest empty result.
// ---------------------------------------------------------------------------------------------------------------------------
import { cache } from "react";
import { activeReviewClaim } from "./reviewClaimState";
import { queueWaitStartMs, type QueueWaitInput } from "./queueWait";
import { isPrecheckRunning } from "./precheck";
import { lockedForViewer, openableQueueIds, type AssignmentFields } from "./reviewAssignment";
import { DEFAULT_STAFF_SETTINGS, type StaffSettings } from "./staffSettings";
import { reForHours } from "@/reviewer-dash/app/_generated/config";
import { sampleDb } from "./sample/query";
import { store } from "./sample/store";
import { AUDITS, COLLABORATORS, JOURNALS, NOTES, PROJECTS, USERS } from "./sample/index";
import { isRealId, loadAudits, loadReal, sampleShipsOn } from "./real";

export const db = sampleDb;

// Pixl proves a birthday is encrypted at rest and decrypts it here. Sample birthdays are plain dates.
export function turnedNineteenSinceShipping(
  birthday: string | null | undefined,
  shippedAt: string | null | undefined,
): boolean {
  if (!birthday || !shippedAt) return false;
  const bday = new Date(birthday);
  const shipped = new Date(shippedAt);
  if (Number.isNaN(bday.getTime()) || Number.isNaN(shipped.getTime())) return false;
  return ageOn(bday, shipped) < 19 && ageOn(bday, new Date()) >= 19;
}

function ageOn(birthday: Date, at: Date): number {
  let age = at.getFullYear() - birthday.getFullYear();
  const m = at.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birthday.getDate())) age--;
  return age;
}

// ---- Rows with the store laid over them ----

function current(row: ProjectRow): ProjectRow {
  const patch = store.overrides.get(row.id);
  return patch ? { ...row, ...patch } : row;
}

// What the desk reads: the real ships from the database, plus the sample ships when sampleShipsOn() (a development fixture).
type Snap = {
  projects: ProjectRow[];
  userFor: (id: string) => Pick<UserRow, "id" | "display_name" | "real_name" | "first_name" | "last_name" | "email" | "slack_id" | "birthday" | "address_country" | "address_line1" | "address_line2" | "address_city" | "address_state" | "address_postal"> | null;
  journalsFor: (projectId: number) => JournalRow[];
};

async function snapshot(): Promise<Snap> {
  const real = await loadReal();
  const sample = sampleShipsOn();
  const sampleJournals = (projectId: number): JournalRow[] =>
    JOURNALS.filter((row) => row.project_id === projectId).map((row) => {
      const set = store.journalApprovals.get(row.id);
      return set ? { ...row, approved_hours: set.approved_hours, deflation_reason: set.deflation_reason } : row;
    });
  return {
    projects: [...(sample ? PROJECTS.map(current) : []), ...real.projects],
    userFor: (id) => real.users.get(id) ?? (sample ? (USERS().find((row) => row.id === id) ?? null) : null),
    journalsFor: (projectId) => (isRealId(projectId) ? real.journals.filter((row) => row.project_id === projectId) : sampleJournals(projectId)),
  };
}

function toShipped(row: ProjectRow, snap: Snap): ShippedProject {
  const user = snap.userFor(row.user_id);
  const picked = Object.fromEntries(QUEUE_FIELDS.map((key) => [key, row[key]])) as Pick<ProjectRow, (typeof QUEUE_FIELDS)[number]>;
  const journals = snap.journalsFor(row.id);
  const journalHours = Math.round(journals.reduce((sum, entry) => sum + (Number(entry.approved_hours ?? entry.hours) || 0), 0) * 10) / 10;
  const hackatimeHours = Math.round(((row.hackatime_seconds ?? 0) / 3600) * 10) / 10;
  return {
    ...picked,
    users: user ? { id: user.id, display_name: user.display_name, slack_id: user.slack_id } : null,
    hours: hackatimeHours > 0 ? hackatimeHours : journalHours,
    hackatimeHours,
    journalHours,
    entries: journals.length,
  };
}

function oldestWaitFirst<T extends QueueWaitInput>(rows: T[]): T[] {
  return [...rows].sort((a, b) => queueWaitStartMs(a) - queueWaitStartMs(b));
}

const live = (row: ProjectRow): boolean => !row.archived_at && !row.rejected_at && !row.banned_at;

function claimedByOther(p: ShippedProject, viewer?: string): boolean {
  const holder = activeReviewClaim(p, Date.now(), REVIEW_LOCK_MS);
  return !!holder && holder !== viewer;
}

export function annotateClaims(rows: ShippedProject[], viewer?: string): ShippedProject[] {
  for (const p of rows) {
    if (claimedByOther(p, viewer)) p.claimedBy = p.reviewing_by as string;
  }
  return rows;
}

function ownedByViewer(p: ShippedProject, viewer?: string): boolean {
  return !!viewer && !!p.users?.slack_id && p.users.slack_id === viewer;
}

type Kind = "software" | "hardware";
const ofKind = (kind?: Kind) => (row: ProjectRow) => !kind || row.kind === kind;

export async function listShippedProjects(
  viewer?: string,
  kind?: Kind,
  opts?: { includeClaimed?: boolean },
): Promise<ShippedProject[]> {
  const snap = await snapshot();
  const rows = oldestWaitFirst(snap.projects.filter((p) => p.status === "shipped" && live(p) && ofKind(kind)(p)).map((p) => toShipped(p, snap))).filter(
    (p) => !isPrecheckRunning(p),
  );
  const visible = opts?.includeClaimed ? annotateClaims(rows, viewer) : rows.filter((p) => !claimedByOther(p, viewer));
  for (const p of visible) if (ownedByViewer(p, viewer)) p.own = true;
  return visible;
}

const shippedQueueForRequest = cache((viewer: string | undefined, kind: Kind | undefined) =>
  listShippedProjects(viewer, kind, { includeClaimed: true }),
);
export function listShippedQueueCached(viewer?: string, kind?: Kind): Promise<ShippedProject[]> {
  return shippedQueueForRequest(viewer, kind);
}

export async function firstPassAccess(
  projectId: number,
  viewer: string,
  isOwner: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isOwner) return { ok: true };
  const row = (await snapshot()).projects.find((p) => p.id === projectId);
  if (!row || row.status !== "shipped") return { ok: true };
  if (lockedForViewer(row as AssignmentFields, viewer, false, Date.now()))
    return {
      ok: false,
      message:
        "This project is reserved for the reviewer who requested its changes. It goes back to the shared queue if they don't review it within 3 days of the re-ship.",
    };
  return { ok: true };
}

// Pixl's second pass is Robert's fraud review. LOADOUT has no such service, so nothing is ever parked there.
export async function listSecondReviewProjects(
  viewer?: string,
  kind?: Kind,
  opts?: { includeClaimed?: boolean },
): Promise<ShippedProject[]> {
  const snap = await snapshot();
  const rows = oldestWaitFirst(
    snap.projects.filter((p) => p.status === "fraud_review" && p.first_pass_verdict !== "banned" && live(p) && ofKind(kind)(p)).map((p) => toShipped(p, snap)),
  );
  return opts?.includeClaimed ? annotateClaims(rows, viewer) : rows.filter((p) => !claimedByOther(p, viewer));
}

export async function listReviewedProjects(): Promise<ShippedProject[]> {
  const snap = await snapshot();
  return snap.projects
    .filter((p) => (p.status === "approved" || p.status === "needs_changes") && !p.archived_at)
    .sort((a, b) => String(b.shipped_at).localeCompare(String(a.shipped_at)))
    .map((p) => toShipped(p, snap));
}

export async function listSecondPassProjects(viewer?: string, kind?: Kind, opts?: { includeClaimed?: boolean }): Promise<ShippedProject[]> {
  const snap = await snapshot();
  // A sample ship waits here once its triage says not fraud (Robert's way). A real ship waits here from its first-pass approval:
  // the final reviewer records the triage on the ship's page, then gives the verdict.
  const rows = oldestWaitFirst(
    snap.projects
      .filter((p) => p.status === "second_review" && p.first_pass_verdict !== "banned" && (isRealId(p.id) || p.second_pass_verdict === "not_fraud") && live(p) && ofKind(kind)(p))
      .map((p) => toShipped(p, snap)),
  );
  return opts?.includeClaimed ? annotateClaims(rows, viewer) : rows.filter((p) => !claimedByOther(p, viewer));
}

export async function countSecondPassProjects(kind?: Kind): Promise<number> {
  return (await listSecondPassProjects(undefined, kind)).length;
}

export async function listProposedBanProjects(kind?: Kind): Promise<ShippedProject[]> {
  const snap = await snapshot();
  return oldestWaitFirst(
    snap.projects.filter((p) => p.status === "second_review" && p.first_pass_verdict === "banned" && live(p) && ofKind(kind)(p)).map((p) => toShipped(p, snap)),
  );
}

export async function countProposedBanProjects(): Promise<number> {
  return (await listProposedBanProjects()).length;
}

// kind: a reviewer limited to one queue is counted that queue only (R roles), so the badge never counts ships they cannot open.
export async function countPendingReviews(opts?: { viewer?: string; kind?: Kind }): Promise<number> {
  return (await listShippedProjects(undefined, opts?.kind, { includeClaimed: true })).length;
}

export const countReviewTabs = cache(async (kind?: Kind): Promise<{ pending: number; secondPass: number; proposedBans: number }> => ({
  pending: await countPendingReviews({ kind }),
  secondPass: await countSecondPassProjects(kind),
  proposedBans: await countProposedBanProjects(),
}));

// Ships waiting for a first-pass review, one count per queue. The top bar and the tab badge add the two (only for a reviewer who can
// open both) and say so, so a figure is never taken for the queue the page below it lists.
export const countPendingByKind = cache(async (): Promise<{ software: number; hardware: number }> => ({
  software: await countPendingReviews({ kind: "software" }),
  hardware: await countPendingReviews({ kind: "hardware" }),
}));

export async function countSecondPassReviews(): Promise<number> {
  return (await listSecondReviewProjects()).length;
}

// Robert's fraud reviews do not exist here.
export async function listRobertReviews(limit = 300): Promise<RobertReviewRow[]> {
  void limit;
  return [];
}

export async function nextReviewId(opts: {
  viewer: string;
  by: string;
  canSecondPass: boolean;
  isSuper: boolean;
  fullQueue?: boolean;
  excludeId: number;
  prefer: "shipped" | "second_review";
  reviewQueues?: "software" | "hardware" | "both";
  secondPass?: boolean;
}): Promise<number | null> {
  const kind = opts.reviewQueues && opts.reviewQueues !== "both" ? opts.reviewQueues : undefined;
  const queue = await listShippedProjects(opts.viewer, kind, { includeClaimed: true });
  const open = openableQueueIds(queue, opts.viewer, opts.isSuper || !!opts.fullQueue, Date.now());
  const next = queue.find((p) => p.id !== opts.excludeId && !p.hold_at && !p.own && !p.claimedBy && open.has(Number(p.id)));
  return next?.id ?? null;
}

// ---- Verdict history ----

export async function listReviewAudits(
  limit = 50,
  reviewerSlackId?: string,
  opts: { realNames?: boolean } = {},
): Promise<ReviewAuditRow[]> {
  void opts;
  const all = (await auditRows()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const rows = reviewerSlackId ? all.filter((a) => a.reviewer.includes(`(${reviewerSlackId})`)) : all;
  return rows.slice(0, limit);
}

// Real verdicts from the audit rows, plus the sample history when the sample ships are on.
async function auditRows(): Promise<ReviewAuditRow[]> {
  const real = await loadAudits();
  return [...real.audits, ...(sampleShipsOn() ? [...store.audits, ...AUDITS] : [])];
}

export async function listReviewAuditsForProject(projectId: number): Promise<ReviewAuditRow[]> {
  return (await auditRows()).filter((a) => a.project_id === projectId).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((a) => ({ ...a, player_name: isRealId(projectId) ? a.player_name : "", project_name: isRealId(projectId) ? a.project_name : "" }));
}

export async function getFirstPassAuditNote(projectId: number): Promise<string | null> {
  const found = (await listReviewAuditsForProject(projectId)).find((a) => a.verdict.startsWith("first_pass_"));
  return found?.audit_note ?? null;
}

export async function listProjectNotes(projectId: number): Promise<ProjectNoteRow[]> {
  if (isRealId(projectId)) return (await loadAudits()).notes.filter((n) => n.project_id === projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return [...store.notes, ...NOTES].filter((n) => n.project_id === projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listCollaboratorsForProject(projectId: number): Promise<CollaboratorRow[]> {
  // There is no collaborator table yet, so a real ship has none.
  if (isRealId(projectId)) return [];
  return COLLABORATORS.filter((c) => c.project_id === projectId && (c.status === "pending" || c.status === "accepted"));
}

export async function collaboratorsByProject(projectIds: number[]): Promise<Map<number, CollaboratorRow[]>> {
  const map = new Map<number, CollaboratorRow[]>();
  for (const c of COLLABORATORS) {
    if (!projectIds.includes(c.project_id) || c.status !== "accepted") continue;
    map.set(c.project_id, [...(map.get(c.project_id) ?? []), c]);
  }
  return map;
}

export async function getProject(id: number) {
  const snap = await snapshot();
  const row = snap.projects.find((p) => p.id === id);
  if (!row) return null;
  const user = snap.userFor(row.user_id);
  const project: ProjectWithUser = {
    ...row,
    users: user
      ? {
          id: user.id,
          display_name: user.display_name,
          real_name: user.real_name,
          slack_id: user.slack_id,
          birthday: user.birthday,
        }
      : null,
  };
  // The full builder row rides along for the eligibility check, as Pixl's select("*, users(...)") does.
  Object.assign(project.users ?? {}, user ? { first_name: user.first_name, last_name: user.last_name, email: user.email, address_country: user.address_country, address_line1: user.address_line1, address_line2: user.address_line2, address_city: user.address_city, address_state: user.address_state, address_postal: user.address_postal } : {});
  const journals = snap.journalsFor(id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { project, journals, verdicts: [] as ModActionRow[], reviewAudits: await listReviewAuditsForProject(id) };
}

// What a builder already earned elsewhere sets their rate in Pixl's economy. Sample: approved hours of their other ships.
export async function lifetimeRe(userId: string, excludeProjectId?: number): Promise<number> {
  const hours = (await snapshot()).projects
    .filter((p) => p.user_id === userId && p.id !== excludeProjectId && p.status === "approved")
    .reduce((sum, p) => sum + (Number(p.approved_hours) || 0), 0);
  return Math.round(reForHours(hours, 1) * 10) / 10;
}

// ---- Staff settings and the guidelines acknowledgement ----

export async function getStaffSettings(slackId: string): Promise<StaffSettings> {
  return store.settings.get(slackId) ?? DEFAULT_STAFF_SETTINGS;
}

export async function saveStaffSettingsRow(slackId: string, settings: StaffSettings): Promise<boolean> {
  store.settings.set(slackId, settings);
  return true;
}

// ---- The overview page (owner) ----

export async function getStats() {
  const projects = (await snapshot()).projects;
  return {
    players: USERS().length,
    projects: projects.length,
    violations: 0,
    violations7d: 0,
    activeBans: projects.filter((p) => p.banned_at).length,
    playersToday: 0,
    playersWeek: 0,
    playersMonth: USERS().length,
    projectsWeek: projects.filter((p) => p.shipped_at && Date.now() - Date.parse(p.shipped_at) < 7 * 86_400_000).length,
  };
}

function flatSeries(days: number, total: number): GrowthPoint[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(today.getTime() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    total,
    added: 0,
  }));
}

export async function getGrowthSeries(days = 30) {
  return { players: flatSeries(days, USERS().length), projects: flatSeries(days, PROJECTS.length), violations: flatSeries(days, 0) };
}

export async function getPixelFlowSeries(days = 30): Promise<PixelFlowPoint[]> {
  void days;
  return [];
}

export async function listActivityFeed(opts: {
  mod: boolean;
  review: boolean;
  team: boolean;
  pixels: boolean;
  payouts: boolean;
  limit?: number;
}): Promise<FeedItem[]> {
  if (!opts.review) return [];
  return AUDITS.slice(0, Number(opts.limit) || 8).map((a) => ({
    kind: "review" as const,
    text: `${a.reviewer.replace(/\s*\(.*\)$/, "")} gave ${a.verdict.replaceAll("_", " ")} on ${a.project_name}`,
    detail: a.note.slice(0, 140),
    href: `/review/${a.project_id}`,
    when: a.created_at,
  }));
}

export * from "./sample/moderation";

export * from "./sample/content";

export * from "./sample/people";

export * from "./sample/ops";

export * from "./sample/records";
