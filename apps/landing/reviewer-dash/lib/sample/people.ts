// The data functions the People pages (players, projects, reviewers, team, fulfillers) import from reviewer-dash/lib/db.ts. Same names
// and return shapes as Pixl's lib/db.ts; the rows are sample data (./people-data.ts) with the in-memory store laid over them.
// db.ts re-exports this file, so a page keeps importing from "@/reviewer-dash/lib/db".
import type {
  AdminRow,
  BanRow,
  ModActionRow,
  PlayerStateRow,
  ProjectRow,
  ProjectWithUser,
  ReviewerStats,
  ViolationRow,
} from "../db";
import { AUDITS, PROJECTS, USERS } from "./index";
import { store } from "./store";
import type { ReportRow } from "./moderation-data";
import { listBans, listViolations, moderationForPlayer, reportsAgainstOwner } from "./moderation";
import {
  OWNER_IDS,
  fulfillerStats,
  ordersOf,
  peopleStore,
  playerById,
  playerRows,
  addUnshippedProjects,
  type FulfillerOrderRow,
  type FulfillerStatsRow,
  type HelperRowSample,
  type TeamLogRow,
  type PayoutSettings,
} from "./people-data";

addUnshippedProjects();

export type FulfillerStats = FulfillerStatsRow;
type ShopOrderRow = FulfillerOrderRow;
type HelperRow = HelperRowSample;
type FulfillerRow = HelperRowSample;
export type ReviewPayoutSettings = PayoutSettings;
export type { TeamLogRow };

// ---- Players ----

export function banIsActive(b: BanRow): boolean {
  if (b.lifted_at) return false;
  if (!b.expires_at) return true;
  return new Date(b.expires_at).getTime() > Date.now();
}

const projectOf = (row: ProjectRow): ProjectRow => ({ ...row, ...(store.overrides.get(row.id) ?? {}) });

export async function listPlayers(query?: string) {
  const needle = (query ?? "").replace(/[,()%*\\]/g, " ").trim().toLowerCase();
  const users = playerRows()
    .filter((u) => !needle || u.display_name.toLowerCase().includes(needle) || u.real_name.toLowerCase().includes(needle))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  // The ban and violation rows come from the database when its tables have rows (see ./moderation); a sample builder matches none of them.
  const bans = await listBans();
  const violations = await listViolations(5000);
  return users.map((u) => ({
    ...u,
    projectCount: PROJECTS.filter((p) => p.user_id === u.id).length,
    violationCount: violations.filter((v) => v.user_id === u.id).length,
    activeBan: (bans.find((b) => b.user_id === u.id && banIsActive(b as BanRow)) as BanRow | undefined) ?? null,
  }));
}

export async function getPlayer(id: string) {
  const user = playerById(id);
  if (!user) return null;
  const projects = PROJECTS.filter((p) => p.user_id === id)
    .map(projectOf)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  // The bans, the ban log, violations and open proposals for this builder: database rows when the tables have rows, else the sample.
  const { bans, actions: logRows, violations, proposals } = await moderationForPlayer(id);
  const states: PlayerStateRow[] = [];
  // The same log the Bans page shows, so a ban, a lift or a warning made anywhere appears here at once.
  const actions: ModActionRow[] = [
    ...violations.map((v, i): ModActionRow => ({ id: 800 + i, user_id: id, action: "note", detail: `${v.kind}: ${v.content}`, actor: "bellwether", created_at: v.created_at })),
    ...logRows.map((row): ModActionRow => ({ id: row.id, user_id: id, action: row.action, detail: row.detail, actor: row.actor, created_at: row.created_at })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { user, states, projects, violations: violations as ViolationRow[], bans: bans as BanRow[], actions, proposals };
}

export async function listReportsAgainst(targetId: string, limit = 50): Promise<ReportRow[]> {
  return reportsAgainstOwner(targetId, limit);
}

export async function displayNamesBySlackId(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  for (const u of USERS()) {
    if (u.slack_id && ids.includes(u.slack_id)) map.set(u.slack_id, u.real_name || u.display_name);
  }
  return map;
}

// ---- Projects ----

const projectNumber = (query?: string): number | null => {
  const m = /^#?(\d{1,9})$/.exec((query ?? "").trim());
  return m ? Number(m[1]) : null;
};

export async function listProjects(
  query?: string,
  opts: { archived?: boolean; includeArchived?: boolean } = {},
): Promise<ProjectWithUser[]> {
  const needle = (query ?? "").trim().toLowerCase();
  const number = projectNumber(query);
  const rows = PROJECTS.map(projectOf).filter((p) => {
    if (opts.archived) {
      if (!p.archived_at) return false;
    } else if (!opts.includeArchived && p.archived_at) return false;
    if (!needle) return true;
    return p.name.toLowerCase().includes(needle) || (number !== null && p.id === number);
  });
  const users = USERS();
  return rows
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 500)
    .map((p) => {
      const u = users.find((row) => row.id === p.user_id);
      return { ...p, users: u ? { id: u.id, display_name: u.display_name, real_name: u.real_name, slack_id: u.slack_id, birthday: u.birthday } : null };
    });
}

// ---- The team ----

export async function getAdmin(slackId: string): Promise<AdminRow | null> {
  return peopleStore.admins.get(slackId) ?? null;
}

export async function listAdmins(): Promise<AdminRow[]> {
  return [...peopleStore.admins.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function listHelpers(): Promise<HelperRow[]> {
  return [...peopleStore.helpers.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function listFulfillers(): Promise<FulfillerRow[]> {
  return [...peopleStore.fulfillers.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function listFulfillerIds(): Promise<string[]> {
  return [...peopleStore.fulfillers.keys()];
}

export async function getTeamChange(id: number): Promise<TeamLogRow | null> {
  return peopleStore.log.find((row) => row.id === id) ?? null;
}

export async function listTeamLog(limit = 20): Promise<TeamLogRow[]> {
  return [...peopleStore.log].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

export async function getReviewPayoutSettings(): Promise<ReviewPayoutSettings> {
  return peopleStore.payout;
}

export const teamOwnerIds = (): string[] => [...OWNER_IDS];

// ---- Stats ----

export async function listOrdersForFulfiller(slackId: string, limit = 100): Promise<ShopOrderRow[]> {
  return ordersOf(slackId).slice(0, limit);
}

export async function fulfillerStatsBySlackId(): Promise<Map<string, FulfillerStats>> {
  const map = new Map<string, FulfillerStats>();
  for (const id of peopleStore.fulfillers.keys()) map.set(id, fulfillerStats(id));
  return map;
}

// Who a review audit belongs to: the "Name (id)" label the audits carry holds the id in brackets.
const reviewerIdOf = (label: string): string => /\(([^)]+)\)\s*$/.exec(label)?.[1] ?? label;

export async function reviewerStatsBySlackId(): Promise<Map<string, ReviewerStats>> {
  const map = new Map<string, ReviewerStats & { _seconds: number; _timed: number; _repo: number }>();
  for (const a of [...store.audits, ...AUDITS]) {
    const id = reviewerIdOf(a.reviewer);
    const s = map.get(id) ?? { reviews: 0, approved: 0, firstPass: 0, needsChanges: 0, hoursApproved: 0, avgSeconds: 0, repoOpenRate: 0, flagged: 0, lastReview: null, _seconds: 0, _timed: 0, _repo: 0 };
    s.reviews += 1;
    if (a.verdict === "approved") {
      s.approved += 1;
      s.hoursApproved += Number(a.approved_hours) || 0;
    }
    if (a.verdict === "first_pass_approved") s.firstPass += 1;
    if (a.verdict === "needs_changes") s.needsChanges += 1;
    if (a.total_seconds > 0) {
      s._seconds += a.total_seconds;
      s._timed += 1;
    }
    if (a.repo_opened) s._repo += 1;
    if (auditFlagsOf(a).length > 0) s.flagged += 1;
    if (!s.lastReview || a.created_at > s.lastReview) s.lastReview = a.created_at;
    map.set(id, s);
  }
  const out = new Map<string, ReviewerStats>();
  for (const [id, s] of map) {
    out.set(id, {
      reviews: s.reviews,
      approved: s.approved,
      firstPass: s.firstPass,
      needsChanges: s.needsChanges,
      hoursApproved: s.hoursApproved,
      avgSeconds: s._timed ? Math.round(s._seconds / s._timed) : 0,
      repoOpenRate: s.reviews ? s._repo / s.reviews : 0,
      flagged: s.flagged,
      lastReview: s.lastReview,
    });
  }
  return out;
}

function auditFlagsOf(a: { verdict: string; total_seconds: number; repo_opened: boolean }): string[] {
  const flags: string[] = [];
  if (a.total_seconds > 0 && a.total_seconds < 60) flags.push("under a minute");
  if ((a.verdict === "approved" || a.verdict === "first_pass_approved") && !a.repo_opened) flags.push("repo never opened");
  return flags;
}
