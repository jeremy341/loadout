// Moderation sample rows in Pixl's shapes (reviewer-dash/lib/db.ts types), built from the older LOADOUT fixtures in
// lib/reviewer/moderation.ts and the bulk review handles. Everything is invented: a handle stands in for a Slack id, and no row is a
// real person. Times are relative to now, so a ban that "ends in 3 days" always ends in 3 days. The in-memory changes made by the
// actions (a ban confirmed, a report resolved) live in one per-process store here and are empty again after a restart.
import { BULK_HANDLES } from "@/lib/platform/review-fixtures-bulk";
import { REVIEW_SHIPS } from "@/lib/platform/review";
import { BAN_PROPOSALS, BANS, REPORTS, VIOLATIONS, lengthLabel, type RuleId } from "@/lib/reviewer/moderation";
import { iso, slackIdFor, userIdFor, USERS } from "./index";

// The LOADOUT rules a report or a violation is filed under. The sample's six older rules map onto the owner's list.
export const RULE_KINDS = ["Kindness", "Own work", "Safety", "Privacy", "Fair play", "Other"] as const;
export type RuleKind = (typeof RULE_KINDS)[number];
const RULE_KIND: Record<RuleId | "other", RuleKind> = {
  kind: "Kindness",
  "own-work": "Own work",
  safe: "Safety",
  private: "Privacy",
  honest: "Fair play",
  spam: "Other",
  other: "Other",
};
export const ruleSlug = (rule: string): string => rule.toLowerCase().replace(/\s+/g, "-");

// A report is about a project or a post in LOADOUT. There is no chat and no model, so a report has no AI fields and no chat lines.
export interface ReportRow {
  id: number;
  reporter_id: string;
  target_id: string;
  reason: string;
  // The LOADOUT rule the reporter picked.
  rule: RuleKind;
  // What was reported, for example "Project: A tiny weather clock" or "Post: Show and Tell, round 2".
  subject: string;
  status: string;
  handled_by: string;
  handled_at: string | null;
  created_at: string;
  anonymous: boolean;
  reporter_name: string;
  target_name: string;
}

export interface BanLogRow {
  id: number;
  user_id: string;
  action: string;
  detail: string;
  actor: string;
  created_at: string;
  player_name: string;
}

export interface BanProposalRow {
  id: number;
  user_id: string;
  reason: string;
  // Ban length in days; 0 is permanent.
  days: number;
  proposed_by: string;
  status: "pending" | "confirmed" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  ban_id: number | null;
  created_at: string;
  users?: { id: string; display_name: string; real_name: string } | null;
}

export interface SampleBan {
  id: number;
  user_id: string;
  reason: string;
  banned_by: string;
  expires_at: string | null;
  lifted_at: string | null;
  created_at: string;
  users?: { id: string; display_name: string; real_name: string } | null;
}

export interface SampleViolation {
  id: number;
  user_id: string;
  kind: string;
  content: string;
  created_at: string;
  users?: { id: string; display_name: string; real_name: string; slack_id: string | null } | null;
}

const HOUR = 3_600_000;
// Ban length in days for the pages: 0 or null is permanent.
export const banLength = (days: number | null): string => (days ? lengthLabel(days) : "Permanent");
const handleOf = (userId: string): string => userId.replace(/^u-/, "");
const numberOf = (id: string): number => Number(id.replace(/\D/g, ""));
const bulk = (i: number): string => BULK_HANDLES[i % BULK_HANDLES.length];

// The user row a moderation row embeds: the sample user when the handle has one, otherwise a plain row for the handle.
function embedUser(handle: string): { id: string; display_name: string; real_name: string; slack_id: string | null } {
  const id = userIdFor(handle);
  const known = USERS().find((u) => u.id === id);
  return { id, display_name: known?.display_name ?? handle, real_name: known?.real_name ?? "", slack_id: known ? known.slack_id : slackIdFor(handle) };
}
// Handles only: the sample has no real names.
const label = (handle: string): string => embedUser(handle).display_name;

// ---- Bans ----

const BAN_REASONS = [
  "Copied a project from another builder's repository.",
  "Hours logged from another builder's account.",
  "Posted another builder's address in a reply.",
  "Repeated mocking replies after a warning.",
  "A link that promised free Ore, posted three times.",
  "Hours logged while the timer was idle, on four journals.",
  "A journal written from someone else's commits.",
  "Harassment of one builder across several posts.",
];
const STAFF = ["lintel", "saltmarsh", "tamsin", "bellwether", "orrery", "fenwick"];

function buildBans(): SampleBan[] {
  const rows: SampleBan[] = BANS.map((b) => ({
    id: numberOf(b.id),
    user_id: userIdFor(b.handle),
    reason: b.reason,
    banned_by: b.approvedBy,
    expires_at: b.days === null ? null : iso(b.hoursAgo - b.days * 24),
    lifted_at: b.lifted ? iso(b.lifted.hoursAgo) : null,
    created_at: iso(b.hoursAgo),
  }));
  const lengths: (number | null)[] = [1, 7, 14, 30, null];
  for (let i = 0; i < 21; i++) {
    const handle = bulk(i * 5 + 2);
    const hoursAgo = 30 + i * 40;
    const days = lengths[i % lengths.length];
    rows.push({
      id: 200 + i,
      user_id: userIdFor(handle),
      reason: BAN_REASONS[i % BAN_REASONS.length],
      banned_by: STAFF[(i + 1) % STAFF.length],
      expires_at: days === null ? null : iso(hoursAgo - days * 24),
      lifted_at: i % 4 === 1 ? iso(hoursAgo - 12) : null,
      created_at: iso(hoursAgo),
    });
  }
  return rows.map((r) => ({ ...r, users: embedUser(handleOf(r.user_id)) }));
}

// ---- Violations ----

function buildViolations(): SampleViolation[] {
  const rows: SampleViolation[] = VIOLATIONS.map((v) => ({
    id: numberOf(v.id),
    user_id: userIdFor(v.handle),
    kind: RULE_KIND[v.rule],
    content: v.detail,
    created_at: iso(v.hoursAgo),
  }));
  // More rows from the bulk handles, so the table has a second page and every rule has some.
  const BULK_NOTES: [RuleKind, string][] = [
    ["Kindness", "Told another builder their idea was stupid."],
    ["Fair play", "Hours logged while the timer was idle."],
    ["Other", "Posted a link that promised free Ore."],
    ["Privacy", "Named another builder's school in a reply."],
    ["Own work", "A project that matched another builder's repository."],
    ["Safety", "Posted a build step that bypasses a battery protection circuit."],
  ];
  for (let i = 0; i < 18; i++) {
    const [kind, content] = BULK_NOTES[i % BULK_NOTES.length];
    rows.push({ id: 130 + i, user_id: userIdFor(bulk(i * 13 + 8)), kind, content, created_at: iso(70 + i * 48) });
  }
  return rows
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => ({ ...r, users: embedUser(handleOf(r.user_id)) }));
}

// ---- Reports ----

function buildReports(): ReportRow[] {
  return REPORTS.map((r) => {
    const handled = r.handled;
    return {
      id: numberOf(r.id),
      reporter_id: userIdFor(r.reporter),
      target_id: userIdFor(r.target.owner),
      reason: r.note,
      rule: RULE_KIND[r.reason],
      subject: `${r.target.kind === "post" ? "Post" : "Project"}: ${r.target.title}`,
      status: r.status,
      handled_by: handled ? handled.by : "",
      handled_at: handled ? iso(handled.hoursAgo) : null,
      created_at: iso(r.hoursAgo),
      anonymous: r.anonymous,
      reporter_name: label(r.reporter),
      target_name: label(r.target.owner),
    };
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ---- Ban proposals ----

function buildProposals(): BanProposalRow[] {
  const rows: BanProposalRow[] = BAN_PROPOSALS.map((p) => ({
    id: numberOf(p.id),
    user_id: userIdFor(p.handle),
    reason: p.reason,
    days: p.days === null ? 0 : p.days,
    proposed_by: p.proposedBy,
    status: "pending",
    decided_by: null,
    decided_at: null,
    ban_id: null,
    created_at: iso(p.hoursAgo),
  }));
  // The ships in the review area's Proposed bans tab: the same builder, the first-pass reviewer's note as the reason.
  for (const ship of REVIEW_SHIPS) {
    if (ship.status !== "proposed-ban" || !ship.firstPass) continue;
    rows.push({
      id: 20 + numberOf(ship.id) % 1000,
      user_id: userIdFor(ship.builder),
      reason: `${ship.title}: ${ship.firstPass.note}`,
      days: 0,
      proposed_by: ship.firstPass.by,
      status: "pending",
      decided_by: null,
      decided_at: null,
      ban_id: null,
      created_at: iso(ship.firstPass.hoursAgo),
    });
  }
  // A few already decided, so the Proposed tab's history exists in the data.
  rows.push(
    { id: 9, user_id: userIdFor(bulk(41)), reason: "Hours the history does not support.", days: 7, proposed_by: "saltmarsh", status: "confirmed", decided_by: "bellwether", decided_at: iso(300), ban_id: 205, created_at: iso(320) },
    { id: 8, user_id: userIdFor(bulk(57)), reason: "Two reports in a week, both dismissed.", days: 1, proposed_by: "tamsin", status: "rejected", decided_by: "orrery", decided_at: iso(520), ban_id: null, created_at: iso(540) },
  );
  return rows.map((r) => ({ ...r, users: embedUser(handleOf(r.user_id)) }));
}

// ---- Base data (built once) and in-memory changes ----

const BASE_BANS = buildBans();
const BASE_VIOLATIONS = buildViolations();
const BASE_REPORTS = buildReports();
const BASE_PROPOSALS = buildProposals();

type Changes = {
  bans: SampleBan[];
  lifted: Map<number, string>;
  log: BanLogRow[];
  reports: Map<number, Partial<ReportRow>>;
  proposals: Map<number, Partial<BanProposalRow>>;
  // Proposals made in this session (from a builder page, Violations, a report or the mass action).
  proposed: BanProposalRow[];
  nextId: number;
};
const KEY = "__loadoutReviewerModerationStore";
const root = globalThis as unknown as Record<string, Changes | undefined>;
export const changes: Changes = (root[KEY] ??= { bans: [], lifted: new Map(), log: [], reports: new Map(), proposals: new Map(), proposed: [], nextId: 5000 });

// A store left by an older build of this module (dev reload) has no `proposed` list yet.
changes.proposed ??= [];

export const nextModerationId = (): number => ++changes.nextId;

export function allBans(): SampleBan[] {
  return [...changes.bans, ...BASE_BANS]
    .map((b) => (changes.lifted.has(b.id) ? { ...b, lifted_at: changes.lifted.get(b.id)! } : b))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function allViolations(): SampleViolation[] {
  return BASE_VIOLATIONS;
}

export function allReports(): ReportRow[] {
  return BASE_REPORTS.map((r) => ({ ...r, ...(changes.reports.get(r.id) ?? {}) }));
}

export function allProposals(): BanProposalRow[] {
  return [...changes.proposed, ...BASE_PROPOSALS].map((p) => ({ ...p, ...(changes.proposals.get(p.id) ?? {}) })).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function baseLog(): BanLogRow[] {
  const rows: BanLogRow[] = [];
  for (const b of allBans()) {
    const length = b.expires_at ? lengthLabel(Math.max(1, Math.round((Date.parse(b.expires_at) - Date.parse(b.created_at)) / (24 * HOUR)))) : "permanent";
    rows.push({ id: b.id * 10, user_id: b.user_id, action: "ban", detail: `${length}, ${b.reason}`, actor: b.banned_by, created_at: b.created_at, player_name: label(handleOf(b.user_id)) });
    if (b.lifted_at) {
      rows.push({ id: b.id * 10 + 1, user_id: b.user_id, action: "unban", detail: "1 active ban(s) lifted", actor: STAFF[b.id % STAFF.length], created_at: b.lifted_at, player_name: label(handleOf(b.user_id)) });
    }
  }
  return rows;
}

export function allBanLog(): BanLogRow[] {
  const base = baseLog();
  const seen = new Set(base.map((r) => r.id));
  return [...changes.log.filter((r) => !seen.has(r.id)), ...base].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ---- Players the notify page can find ----

export function knownPlayers(): { id: string; name: string }[] {
  const byId = new Map<string, string>();
  for (const u of USERS()) byId.set(u.id, u.display_name);
  for (const r of BASE_REPORTS) {
    byId.set(r.target_id, r.target_name);
    byId.set(r.reporter_id, r.reporter_name);
  }
  for (const b of BASE_BANS) byId.set(b.user_id, label(handleOf(b.user_id)));
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
