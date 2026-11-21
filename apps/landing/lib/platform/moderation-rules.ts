// Pure rules for the moderation domain: bans, ban proposals, reports, violations and blocks. No database and no Next, so the bun
// tests run without one. lib/platform/moderation-data.ts does the writes and calls these gates; the reviewer site's actions do too.
import { createHash } from "node:crypto";
import { proposedBanDecision, type ReviewerAccess } from "../reviewer/access";
import { REPEAT_REPORTS } from "../reviewer/moderation";

// The LOADOUT rules a report or a violation is filed under (the owner's list).
export const RULE_KINDS = ["Kindness", "Own work", "Safety", "Privacy", "Fair play", "Other"] as const;
export type RuleKind = (typeof RULE_KINDS)[number];
export function isRuleKind(value: unknown): value is RuleKind {
  return typeof value === "string" && (RULE_KINDS as readonly string[]).includes(value);
}

// ---- Statuses ----
// Stored words (Report.status, BanProposal.status) and the words the Pixl pages compare against.

export const REPORT_STATUSES = ["open", "actioned", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const REPORT_TARGET_TYPES = ["project", "journal"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

const REPORT_MOVES: Record<ReportStatus, readonly ReportStatus[]> = {
  open: ["actioned", "dismissed"],
  actioned: [],
  dismissed: [],
};

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && (REPORT_STATUSES as readonly string[]).includes(value);
}

// A decided report stays decided: no reopening from the pages.
export function canMoveReport(from: string, to: string): boolean {
  if (!isReportStatus(from) || !isReportStatus(to)) return false;
  return REPORT_MOVES[from].includes(to);
}

// The Pixl pages say resolved, not actioned.
export function reportPageStatus(stored: string): "open" | "resolved" | "dismissed" {
  if (stored === "actioned") return "resolved";
  if (stored === "dismissed") return "dismissed";
  return "open";
}

export function reportStoredStatus(page: string): ReportStatus | null {
  if (page === "resolved" || page === "actioned") return "actioned";
  if (page === "dismissed") return "dismissed";
  return null;
}

export const PROPOSAL_STATUSES = ["open", "confirmed", "overturned"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

const PROPOSAL_MOVES: Record<ProposalStatus, readonly ProposalStatus[]> = {
  open: ["confirmed", "overturned"],
  confirmed: [],
  overturned: [],
};

export function isProposalStatus(value: unknown): value is ProposalStatus {
  return typeof value === "string" && (PROPOSAL_STATUSES as readonly string[]).includes(value);
}

export function canMoveProposal(from: string, to: string): boolean {
  if (!isProposalStatus(from) || !isProposalStatus(to)) return false;
  return PROPOSAL_MOVES[from].includes(to);
}

// The Pixl pages say pending and rejected.
export function proposalPageStatus(stored: string): "pending" | "confirmed" | "rejected" {
  if (stored === "confirmed") return "confirmed";
  if (stored === "overturned") return "rejected";
  return "pending";
}

export function proposalStoredStatus(page: string): ProposalStatus | null {
  if (page === "pending" || page === "open") return "open";
  if (page === "confirmed") return "confirmed";
  if (page === "rejected" || page === "overturned") return "overturned";
  return null;
}

// ---- Repeat offenders ----

// A person who is the subject of this many reports is flagged to staff (the threshold lives in lib/reviewer/moderation.ts).
export function isRepeatOffender(reportsAgainst: number): boolean {
  return reportsAgainst >= REPEAT_REPORTS;
}

// A ban stays in force while any ban row is still open.
export function stillBanned(openBans: number): boolean {
  return openBans > 0;
}

// ---- Ban length and expiry ----

const DAY_MS = 24 * 60 * 60 * 1000;
export const BAN_DAYS_MIN = 1;
export const BAN_DAYS_MAX = 3650;

// The moment a ban of this many days ends, counted from now. Null (no end) for a permanent ban: null or 0 days.
export function banExpiry(days: number | null | undefined, now: Date): Date | null {
  if (!days) return null;
  return new Date(now.getTime() + days * DAY_MS);
}

// A ban row is active while it is not lifted and its end, if it has one, is still ahead. A lifted or expired ban never blocks anyone.
export function isBanActive(
  ban: { liftedAt: Date | string | null | undefined; expiresAt: Date | string | null | undefined },
  now: Date,
): boolean {
  if (ban.liftedAt) return false;
  if (!ban.expiresAt) return true;
  return new Date(ban.expiresAt).getTime() > now.getTime();
}

// A report filed anonymously is never shown to the person it is about. Staff views are not covered by this rule.
export function reporterVisibleToSubject(report: { anonymous: boolean }): boolean {
  return !report.anonymous;
}

// ---- Who may do what ----

export type Gate = { ok: true } | { ok: false; message: string };
const allow: Gate = { ok: true };
const deny = (message: string): Gate => ({ ok: false, message });

export type ActorAccess = Pick<ReviewerAccess, "personId" | "isOwner" | "isReviewer" | "canSecondPass"> | null | undefined;

// Proposing a ban: a reviewer or an owner, never on themselves.
export function gateProposeBan(actor: ActorAccess, subjectId: string): Gate {
  if (!actor) return deny("Sign in to propose a ban.");
  if (!(actor.isOwner || actor.isReviewer)) return deny("Only a reviewer or an owner can propose a ban.");
  if (actor.personId === subjectId) return deny("You can't propose a ban on yourself.");
  return allow;
}

// Confirming a ban: owner only, a different person from the proposer, and never on themselves or a project they own. The
// owner exception in proposedBanDecision (lib/reviewer/access.ts) would let an owner confirm their own proposal, so the proposer
// check is made here as well.
export function gateConfirmBan(
  actor: ActorAccess,
  context: { proposedById: string; subjectIds: readonly string[]; subjectIsOwner: boolean },
): Gate {
  if (!actor) return deny("Sign in to decide this.");
  if (actor.personId === context.proposedById) return deny("You proposed this ban, so a different owner has to confirm it.");
  if (context.subjectIds.includes(actor.personId)) return deny("You can't decide a ban on yourself or on a project you own.");
  // An owner is never banned: a ban would lock them out of the whole site, and lifting it needs an owner.
  if (context.subjectIsOwner) return deny("An owner can't be banned from the site.");
  if (!actor.isOwner) return deny("Only an owner can confirm a ban.");
  return allow;
}

// Overturning a ban proposal: a second-pass reviewer or an owner, never the proposer. Uses the review desk's rule (proposedBanDecision)
// for the reviewer part, so the moderation page and the desk agree.
export function gateOverturnBan(actor: ActorAccess, context: { proposedById: string; subjectIds: readonly string[] }): Gate {
  if (!actor) return deny("Sign in to decide this.");
  if (actor.personId === context.proposedById) return deny("A different reviewer must confirm or overturn this ban proposal.");
  if (context.subjectIds.includes(actor.personId)) return deny("You can't decide a ban on yourself or on a project you own.");
  const decision = proposedBanDecision(
    { isOwner: actor.isOwner, canSecondPass: actor.canSecondPass, personId: actor.personId },
    "approved",
    { own: false, proposedById: context.proposedById },
  );
  if (decision.kind === "deny") return deny(decision.reason);
  return allow;
}

// Withdrawing your own proposal is always open to the proposer.
export function gateWithdrawBan(actor: ActorAccess, proposedById: string): Gate {
  if (!actor) return deny("Sign in to decide this.");
  if (actor.personId !== proposedById) return deny("Only the reviewer who proposed this ban can withdraw it.");
  return allow;
}

// A direct ban or lift is an owner's act, and an owner cannot be banned from the site.
export function gateDirectBan(actor: ActorAccess, target: { id: string; isOwner: boolean }): Gate {
  if (!actor?.isOwner) return deny("Only an owner can ban a builder directly.");
  if (actor.personId === target.id) return deny("You can't ban yourself.");
  if (target.isOwner) return deny("An owner can't be banned from the site.");
  return allow;
}

// Lifting a ban: owner only.
export function gateLiftBan(actor: ActorAccess): Gate {
  if (!actor?.isOwner) return deny("Only an owner can lift a ban.");
  return allow;
}

// Deciding a report: owner only (as the sample did).
export function gateDecideReport(actor: ActorAccess): Gate {
  if (!actor?.isOwner) return deny("Only an owner can decide a report.");
  return allow;
}

// Recording a violation: a reviewer or an owner.
export function gateRecordViolation(actor: ActorAccess): Gate {
  if (!actor || !(actor.isOwner || actor.isReviewer)) return deny("Only a reviewer or an owner can record a violation.");
  return allow;
}

// Blocks: a person can block someone else, never themselves.
export function gateBlock(blockerId: string, blockedId: string): Gate {
  if (!blockerId || !blockedId) return deny("Pick a builder to block.");
  if (blockerId === blockedId) return deny("You can't block yourself.");
  return allow;
}

// ---- Input checks ----

export type ReportInput = {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  detail: string;
  // Optional: the reporter asks not to be named to the person reported. Stored on the row; never part of the checked value.
  anonymous?: boolean;
};
export type CheckedReport = { reporterId: string; targetType: ReportTargetType; targetId: string; reason: RuleKind; detail: string };

export const REPORT_DETAIL_MIN = 10;
export const REPORT_DETAIL_MAX = 1000;

export function checkReportInput(input: ReportInput): { ok: true; value: CheckedReport } | { ok: false; message: string } {
  if (!input.reporterId) return { ok: false, message: "Sign in to report." };
  if (!input.targetId) return { ok: false, message: "Pick what to report." };
  if (!(REPORT_TARGET_TYPES as readonly string[]).includes(input.targetType)) return { ok: false, message: "That kind of thing can't be reported." };
  if (!isRuleKind(input.reason)) return { ok: false, message: "Pick the rule this breaks." };
  const detail = input.detail.trim();
  if (detail.length < REPORT_DETAIL_MIN) return { ok: false, message: `Say what happened in at least ${REPORT_DETAIL_MIN} characters.` };
  if (detail.length > REPORT_DETAIL_MAX) return { ok: false, message: `Keep the report under ${REPORT_DETAIL_MAX} characters.` };
  return {
    ok: true,
    value: { reporterId: input.reporterId, targetType: input.targetType as ReportTargetType, targetId: input.targetId, reason: input.reason, detail },
  };
}

// Which sample fallback applies. Only in development, and only when the database is missing or the table is empty, so local
// screens still show something. Production always returns what the database holds, even nothing.
export function usesSampleRows(env: { nodeEnv: string | undefined; databaseConfigured: boolean; tableEmpty: boolean }): boolean {
  return env.nodeEnv === "development" && (!env.databaseConfigured || env.tableEmpty);
}

// ---- Ids ----

// The reviewer pages address rows by number (/reports/12). The database ids are cuids, so a number is derived from the id: the same
// in every process, with no counter to keep. 52 bits, so it stays a safe integer.
export function numericIdFor(kind: string, id: string): number {
  const digest = createHash("sha256").update(`${kind}:${id}`).digest("hex");
  return parseInt(digest.slice(0, 13), 16);
}
