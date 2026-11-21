// Sample rows for the People pages (players, projects, reviewers, team, fulfillers), in Pixl's shapes (snake_case, string ids, a
// handle where Pixl holds a Slack id). Built from the same invented data the rest of the reviewer site uses: the builders and
// unfinished projects in lib/reviewer/people.ts, the team there, the fulfillers and orders in lib/reviewer/fulfilment.ts, and the
// ships and verdicts in ./index.ts. Nothing here is a real person. The in-memory team changes the People actions make live in one
// per-process store (empty again after a restart).
import { PLAYERS, STAFF_PROJECTS, TEAM, type StaffProject } from "@/lib/reviewer/people";
import { FULFILLERS, FULFILMENT_ORDERS, type FulfilmentStatus } from "@/lib/reviewer/fulfilment";
import { shopItemById } from "@/lib/platform/shop";
import { REVIEWERS } from "@/lib/platform/review";
import { databaseConfigured, db } from "@/lib/platform/db";
import { recordAudit } from "@/lib/platform/audit";
import { emailForHandle, roleDelta, roleKeysForLog } from "./role-grants";
import type { AdminRow, JournalRow, ProjectRow, UserRow } from "../db";
import { SECOND_PASS, REVIEW, NO_REVIEW, REVIEW_HARDWARE_ONLY, REVIEW_SOFTWARE_ONLY, EDIT_SUBMISSION, AI_DRAFT, FRAUD_REVIEW } from "../roles";
import { JOURNALS, PROJECTS, ensureUser, iso, userIdFor } from "./index";

const HOUR = 3_600_000;

// ---- Builders (the "players" of Pixl) ----

export type PlayerRow = UserRow;

// Edits made from the player page (name, email), kept in memory only.
const EDITS_KEY = "__loadoutReviewerPlayerEdits";
const editRoot = globalThis as unknown as Record<string, Map<string, Partial<UserRow>> | undefined>;
export const playerEdits: Map<string, Partial<UserRow>> = (editRoot[EDITS_KEY] ??= new Map());

let playersCache: PlayerRow[] | null = null;
export function playerRows(): PlayerRow[] {
  const base = (playersCache ??= PLAYERS.map((player) => {
    const user = ensureUser(player.handle);
    const hours = Object.values(player.approved).reduce((sum, value) => sum + value, 0);
    // Ore is 10 per approved hour; the Pixl "pixels" column carries it.
    return { ...user, created_at: iso(player.joinedDaysAgo * 24), pixels: hours * 10 };
  }));
  return base.map((row) => ({ ...row, ...(playerEdits.get(row.id) ?? {}) }));
}

export const playerById = (id: string): PlayerRow | null => playerRows().find((row) => row.id === id) ?? null;

// ---- Projects that have no ship yet (drafts, logging) and the ones staff removed ----

function draftRow(project: StaffProject): ProjectRow {
  const removal = project.removal;
  return {
    id: project.number,
    user_id: userIdFor(project.owner),
    name: project.title,
    description: project.summary,
    repo_url: project.source ? `https://${project.source}` : null,
    demo_url: null,
    hackatime_projects: project.hackatime,
    hackatime_seconds: project.loggedMinutes * 60,
    status: "draft",
    review_note: "",
    review_note_by: "",
    approved_hours: null,
    prior_approved_hours: 0,
    image_url: "",
    level: 1,
    project_type: null,
    is_game: false,
    kind: project.kind,
    needs_funding: project.kind === "hardware",
    funding_usd: project.kind === "hardware" ? 40 : 0,
    funding_deducted_px: 0,
    bom_url: "",
    cart_screenshot_urls: [],
    used_ai: false,
    ai_notes: "",
    ai_review_status: "",
    ai_review_started_at: null,
    ai_review_summary: "",
    ai_review_findings: null,
    ai_review_error: "",
    is_update: false,
    update_notes: "",
    ship_note: "",
    other_ysws: false,
    other_ysws_notes: "",
    system_note: "",
    imported_ysws_entry_id: null,
    imported_from_ysws: null,
    imported_ysws_hours: null,
    imported_ysws_approved_at: null,
    archived_at: removal?.kind === "archived" ? iso(removal.hoursAgo) : null,
    rejected_at: removal?.kind === "rejected" ? iso(removal.hoursAgo) : null,
    reject_reason: removal?.kind === "rejected" ? removal.reason : "",
    reject_by: removal?.kind === "rejected" ? removal.by : "",
    banned_at: removal?.kind === "banned" ? iso(removal.hoursAgo) : null,
    ban_reason: removal?.kind === "banned" ? removal.reason : "",
    ban_by: removal?.kind === "banned" ? removal.by : "",
    journal_share_token: null,
    reviewing_by: "",
    reviewing_at: null,
    first_pass_by: "",
    first_pass_at: null,
    first_pass_note: "",
    first_pass_hours: null,
    first_pass_verdict: null,
    second_pass_by: "",
    second_pass_at: null,
    second_pass_note: "",
    second_pass_hours: null,
    second_pass_verdict: null,
    shipped_at: null,
    first_shipped_at: null,
    created_at: iso(project.createdHoursAgo),
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
    hold_at: null,
    hold_by: "",
    hold_reason: "",
    assigned_reviewer_slack_id: "",
    assigned_at: null,
    assignment_reminded_at: null,
    spot_checked_at: null,
    spot_checked_by: "",
    review_draft: null,
    review_draft_by: "",
    review_draft_at: null,
  };
}

// The review area's PROJECTS and JOURNALS hold the ships only. The unfinished projects are added to the same arrays once per
// process (nothing in the queues reads a draft), so getProject and the lists find them.
export function addUnshippedProjects(): void {
  const seen = new Set(PROJECTS.map((row) => row.id));
  let journalId = 100_000;
  for (const project of STAFF_PROJECTS) {
    if (project.shipId) continue;
    ensureUser(project.owner);
    if (seen.has(project.number)) continue;
    PROJECTS.push(draftRow(project));
    seen.add(project.number);
    project.journals.forEach((entry, index) => {
      journalId += 1;
      const row: JournalRow = {
        id: journalId,
        project_id: project.number,
        user_id: userIdFor(project.owner),
        title: `Entry ${project.journals.length - index}`,
        content: entry.text,
        hours: entry.minutes / 60,
        approved_hours: null,
        deflation_reason: null,
        created_at: iso(project.lastActiveHoursAgo + index * 24),
        edited_at: null,
      };
      if (!JOURNALS.some((j) => j.id === row.id)) JOURNALS.push(row);
    });
  }
}

// ---- The team ----

export interface TeamLogRow {
  id: number;
  source: "audit" | "legacy";
  slack_id: string;
  // Stable person key (email) used by the access overlay; absent on seeded legacy rows.
  person_key?: string;
  name: string;
  action: string;
  before: string[];
  after: string[];
  actor: string;
  reason: string;
  created_at: string;
}

export interface HelperRowSample {
  slack_user_id: string;
  created_at: string;
}

export interface PayoutSettings {
  approvedPixels: number;
  needsChangesPixels: number;
  updatedBy: string;
  updatedAt: string;
}

interface PeopleStore {
  admins: Map<string, AdminRow>;
  helpers: Map<string, HelperRowSample>;
  fulfillers: Map<string, HelperRowSample>;
  log: TeamLogRow[];
  payout: PayoutSettings;
  nextLogId: number;
}

const KEY = "__loadoutReviewerPeopleStore";
const root = globalThis as unknown as Record<string, PeopleStore | undefined>;

function seedStore(): PeopleStore {
  const admins = new Map<string, AdminRow>();
  for (const member of TEAM) {
    const reviewer = REVIEWERS.find((item) => item.handle === member.handle);
    const isOwner = member.roles.includes("owner");
    const permissions: string[] = [];
    if (member.roles.includes("reviewer")) permissions.push(REVIEW);
    for (const marker of member.markers) {
      if (marker === "second_pass") permissions.push(SECOND_PASS);
      else if (marker === "reviewer_hardware_only") permissions.push(REVIEW_HARDWARE_ONLY);
      else if (marker === "reviewer_software_only") permissions.push(REVIEW_SOFTWARE_ONLY);
      else if (marker === "no_review") permissions.push(NO_REVIEW);
    }
    if (member.handle === "lintel") permissions.push(EDIT_SUBMISSION, FRAUD_REVIEW);
    if (member.handle === "tamsin") permissions.push(AI_DRAFT);
    if (!isOwner && !reviewer && permissions.length === 0) continue;
    if (isOwner && permissions.length === 0) continue;
    admins.set(member.handle, {
      slack_id: member.handle,
      name: member.handle,
      permissions,
      added_by: "ironlark",
      created_at: iso((member.sinceDaysAgo ?? 100) * 24),
    });
  }
  const helpers = new Map<string, HelperRowSample>();
  const fulfillers = new Map<string, HelperRowSample>();
  for (const member of TEAM) {
    if (member.roles.includes("helper")) helpers.set(member.handle, { slack_user_id: member.handle, created_at: iso((member.sinceDaysAgo ?? 30) * 24) });
  }
  FULFILLERS.forEach((fulfiller, index) => fulfillers.set(fulfiller.id, { slack_user_id: fulfiller.id, created_at: iso((90 - index * 17) * 24) }));
  const log: TeamLogRow[] = [];
  let id = 0;
  const entry = (handle: string, action: string, before: string[], after: string[], daysAgo: number, reason = "", actor = "ironlark") => {
    id += 1;
    log.push({ id, source: "audit", slack_id: handle, name: handle, action, before, after, actor, reason, created_at: iso(daysAgo * 24) });
  };
  entry("bellwether", "added", [], [REVIEW], 96);
  entry("bellwether", "updated", [REVIEW], [REVIEW, SECOND_PASS], 80, "Promoted after the first month.");
  entry("lintel", "added", [], [REVIEW], 58);
  entry("lintel", "updated", [REVIEW], [REVIEW, EDIT_SUBMISSION, FRAUD_REVIEW], 40);
  entry("fenwick", "updated", [REVIEW], [REVIEW, REVIEW_HARDWARE_ONLY], 33, "Hardware reviewer only.");
  entry("lanternfly", "helper added", [], ["helper"], 40);
  entry("wick", "helper added", [], ["helper"], 12);
  entry("deskcrate", "fulfiller added", [], ["fulfiller"], 21, "", "tolliver");
  entry("tolliver", "updated", [], [NO_REVIEW], 9, "Not reviewing while on the budget.", "tolliver");
  log.reverse();
  return {
    admins,
    helpers,
    fulfillers,
    log,
    payout: { approvedPixels: 3, needsChangesPixels: 1, updatedBy: "", updatedAt: iso(24 * 60) },
    nextLogId: id,
  };
}

export const peopleStore: PeopleStore = (root[KEY] ??= seedStore());

export const OWNER_IDS: readonly string[] = TEAM.filter((member) => member.roles.includes("owner")).map((member) => member.handle);

// ---- Persisting a team change ----
//
// The Pixl-shaped roster above is the sample store. The viewer's real grants are the RoleGrant rows read by readViewer, and the
// superadmin/impersonation gates resolve their access from those same rows. A change on the Admins page is written to both: the
// in-memory log gives the viewer the change on their very next request, and this transaction makes it durable and auditable.
// With no database configured (the sample-only development mode) this is a no-op and the in-memory store remains the whole story.

export const DEFAULT_TEAM_CHANGE_REASON = "Team role change from the Admins page.";

export interface TeamRoleChange {
  personKey: string;
  before: readonly string[];
  after: readonly string[];
  actorId: string;
  reason?: string;
  action?: string;
}

// Resolves the key an action received (sample handle, email or person id) to the Person row, then applies only the changed grants
// and the audit row in one transaction. Returns the person so the caller can key its overlay entry by the same stable email.
export async function persistTeamRoleChange(input: TeamRoleChange): Promise<{ id: string; email: string } | null> {
  const key = input.personKey.trim();
  if (!databaseConfigured() || !key) return null;
  const mappedEmail = emailForHandle(key);
  const person = await db().person.findFirst({
    where: {
      OR: [
        { id: key },
        { email: key },
        ...(mappedEmail ? [{ email: mappedEmail }] : []),
        { handle: key },
      ],
    },
    select: { id: true, email: true },
  });
  if (!person) return null;

  const delta = roleDelta(input.before, input.after);
  if (delta.add.length === 0 && delta.remove.length === 0) return person;

  await db().$transaction(async (tx) => {
    if (delta.remove.length > 0) {
      await tx.roleGrant.deleteMany({ where: { personId: person.id, role: { in: delta.remove } } });
    }
    for (const role of delta.add) {
      await tx.roleGrant.upsert({
        where: { personId_role: { personId: person.id, role } },
        create: { personId: person.id, role },
        update: {},
      });
    }
    await recordAudit(tx, {
      actorId: input.actorId,
      action: input.action ?? "team.role.change",
      targetType: "Person",
      targetId: person.id,
      reason: input.reason?.trim() || DEFAULT_TEAM_CHANGE_REASON,
      before: { roles: roleKeysForLog(input.before) },
      after: { roles: roleKeysForLog(input.after) },
    });
  });
  return person;
}

// ---- Fulfillers and their orders ----

export type OrderStatus = "pending" | "claimed" | "ordered" | "credited" | "shipped" | "done" | "cancelled";

export interface FulfillerOrderRow {
  id: number;
  user_id: string;
  item_name: string;
  quantity: number;
  status: OrderStatus;
  tracking: string;
  claimed_at: string | null;
  shipped_at: string | null;
  player_name: string;
}

const STATUS_OF: Record<FulfilmentStatus, OrderStatus> = {
  new: "pending",
  claimed: "claimed",
  packed: "ordered",
  shipped: "shipped",
  delivered: "done",
  cancelled: "cancelled",
};

export function ordersOf(slackId: string): FulfillerOrderRow[] {
  return FULFILMENT_ORDERS.filter((order) => order.assignee === slackId)
    .map((order) => {
      const names = order.lines.map((line) => shopItemById(line.itemId)?.name ?? line.itemId);
      return {
        id: Number(order.number.replace(/\D/g, "")),
        user_id: userIdFor(order.buyer),
        item_name: names.join(", "),
        quantity: order.lines.length === 1 ? order.lines[0].quantity : 1,
        status: STATUS_OF[order.status],
        tracking: order.tracking ?? "",
        claimed_at: order.claimedHoursAgo != null ? new Date(Date.now() - order.claimedHoursAgo * HOUR).toISOString() : null,
        shipped_at: order.shippedHoursAgo != null ? new Date(Date.now() - order.shippedHoursAgo * HOUR).toISOString() : null,
        player_name: order.buyer,
        placed: order.placedHoursAgo,
      };
    })
    .sort((a, b) => a.placed - b.placed)
    .map(({ placed, ...row }) => {
      void placed;
      return row;
    });
}

export interface FulfillerStatsRow {
  claimed: number;
  shipped: number;
  done: number;
  inQueue: number;
  avgShipSeconds: number;
  lastActivity: string | null;
  pixelsEarned: number;
}

export function fulfillerStats(slackId: string): FulfillerStatsRow {
  const mine = FULFILMENT_ORDERS.filter((order) => order.assignee === slackId);
  const shipped = mine.filter((order) => order.status === "shipped" || order.status === "delivered");
  const spans = shipped
    .filter((order) => order.claimedHoursAgo != null && order.shippedHoursAgo != null)
    .map((order) => ((order.claimedHoursAgo as number) - (order.shippedHoursAgo as number)) * 3600);
  const stamps = mine.flatMap((order) => [order.placedHoursAgo, order.claimedHoursAgo, order.packedHoursAgo, order.shippedHoursAgo, order.deliveredHoursAgo]).filter((value): value is number => typeof value === "number");
  return {
    claimed: mine.filter((order) => order.status !== "new" && order.status !== "cancelled").length,
    shipped: shipped.length,
    done: mine.filter((order) => order.status === "delivered").length,
    inQueue: mine.filter((order) => order.status === "claimed" || order.status === "packed").length,
    avgShipSeconds: spans.length ? Math.round(spans.reduce((sum, value) => sum + value, 0) / spans.length) : 0,
    lastActivity: stamps.length ? new Date(Date.now() - Math.min(...stamps) * HOUR).toISOString() : null,
    // Ore paid to a fulfiller for shipping an order: a flat 25 here.
    pixelsEarned: shipped.length * 25,
  };
}
