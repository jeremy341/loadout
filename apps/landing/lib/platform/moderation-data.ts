// Database reads and writes for the moderation domain: bans, ban proposals, reports, violations and blocks. The rules and the gates are
// in ./moderation-rules.ts (pure, tested). Every write runs in one transaction with an AuditEvent row (./audit.ts), and a moderation
// act also writes a ModAction row for the log. The row mappers at the top are pure so the bun tests can check them without a database.
//
// Ban length: a ban proposed or made with a length gets Ban.expiresAt (now plus the days); a ban with no length is open until lifted.
// A ban is active only while it is not lifted and its end, if any, is ahead (isBanActive). An expired ban that nobody lifted is
// cleared from the person the next time they are read or sign in (releaseExpiredBan), with an AuditEvent row. Report.anonymous is
// stored from the reporter's choice; the staff rows keep the reporter's name, and reporterVisibleToSubject is the rule for any view
// shown to the reported person. BanProposal.days holds the proposed length; older rows fall back to the "propose" ModAction detail.
//
// Detail text on ModAction is JSON ({text, days, proposal, ban}); older plain text reads as the text itself.
//
// No Next imports: the server actions own revalidation, redirects and the signed-in person (readViewer).
import type { Prisma } from "../generated/prisma/client";
import type { BanLogRow, BanProposalRow, ReportRow, SampleBan, SampleViolation } from "@/reviewer-dash/lib/sample/moderation-data";
import type { ReviewerAccess } from "../reviewer/access";
import { lengthLabel } from "../reviewer/moderation";
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { checkLedgerEntry } from "./ledger";
import {
  BAN_DAYS_MAX,
  BAN_DAYS_MIN,
  banExpiry,
  canMoveReport,
  gateBlock,
  gateConfirmBan,
  gateDecideReport,
  gateDirectBan,
  gateLiftBan,
  gateOverturnBan,
  gateProposeBan,
  gateRecordViolation,
  gateWithdrawBan,
  isBanActive,
  isRuleKind,
  numericIdFor,
  proposalPageStatus,
  reportPageStatus,
  stillBanned,
  checkReportInput,
  type ActorAccess,
  type Gate,
  type ProposalStatus,
  type ReportInput,
  type ReportStatus,
} from "./moderation-rules";

// ---- Results ----

export type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

// A decision on a proposal that is no longer there (a sample row, or a number nobody holds). Lets the action say so.
export type DecideResult = ({ ok: true; banId: string | null } ) | { ok: false; message: string; missing?: boolean };

const RACE_MESSAGE = "This changed while you were working. Reload the page and try again.";
class Race extends Error {}
function must(result: { count: number }): void {
  if (result.count === 0) throw new Race(RACE_MESSAGE);
}
const fail = (message: string): { ok: false; message: string } => ({ ok: false, message });

// ---- Pure helpers (tested) ----

export type Names = Map<string, string>;
export type ActDetail = { text: string; days: number | null; proposal: string | null; ban: string | null };

const iso = (value: Date | null | undefined): string | null => (value ? value.toISOString() : null);
const nameOf = (names: Names, id: string | null | undefined): string => (id ? (names.get(id) ?? "") : "");
const embed = (personId: string, names: Names) => ({
  id: personId,
  display_name: nameOf(names, personId),
  real_name: "",
  slack_id: null,
});

// The handle the reviewer pages use for a person (the same shape as handleFor's fallback in reviewer-dash/lib/session.ts). The bans page
// compares a proposal's proposer with the signed-in handle, so proposed_by is written in this shape.
export function handleLike(displayName: string): string {
  return displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "reviewer";
}

// Whether a person's sign-in email is one of the owner emails (LOADOUT_OWNER_EMAILS). Compared without case.
export function isOwnerEmail(email: string, ownerEmails: readonly string[]): boolean {
  const wanted = email.trim().toLowerCase();
  return ownerEmails.some((listed) => listed.trim().toLowerCase() === wanted);
}

export async function isOwnerPerson(personId: string, ownerEmails: readonly string[]): Promise<boolean> {
  const row = await db().person.findUnique({ where: { id: personId }, select: { email: true } });
  return row ? isOwnerEmail(row.email, ownerEmails) : false;
}

// "7 days", "No end date" or, for a permanent ban, "Permanent". Days 0 or null are permanent.
export function lengthText(days: number | null): string {
  return days ? lengthLabel(days) : "Permanent";
}

export function encodeDetail(detail: ActDetail): string {
  return JSON.stringify(detail);
}

export function decodeDetail(raw: string): ActDetail {
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object") {
      const v = value as Record<string, unknown>;
      return {
        text: typeof v.text === "string" ? v.text : "",
        days: typeof v.days === "number" ? v.days : null,
        proposal: typeof v.proposal === "string" ? v.proposal : null,
        ban: typeof v.ban === "string" ? v.ban : null,
      };
    }
  } catch {
    // Plain text from before the structured form.
  }
  return { text: raw, days: null, proposal: null, ban: null };
}

const LOG_WORDS: Record<string, string> = { ban: "ban", lift: "unban", propose: "propose", overturn: "overturn", withdraw: "withdraw" };
export const BAN_LOG_ACTIONS = Object.keys(LOG_WORDS);

// A ban row for the Bans page. expires_at is the end of a temporary ban, null for one that runs until lifted.
export function toBanRow(
  row: { id: string; personId: string; bannedById: string; reason: string; createdAt: Date; liftedAt: Date | null; expiresAt?: Date | null },
  names: Names,
): SampleBan {
  return {
    id: numericIdFor("ban", row.id),
    user_id: row.personId,
    reason: row.reason,
    banned_by: nameOf(names, row.bannedById),
    expires_at: iso(row.expiresAt),
    lifted_at: iso(row.liftedAt),
    created_at: row.createdAt.toISOString(),
    users: embed(row.personId, names),
  };
}

export function toBanLogRow(
  row: { id: string; action: string; personId: string | null; actorId: string; detail: string; createdAt: Date },
  names: Names,
): BanLogRow {
  return {
    id: numericIdFor("mod", row.id),
    user_id: row.personId ?? "",
    action: LOG_WORDS[row.action] ?? row.action,
    detail: decodeDetail(row.detail).text,
    actor: nameOf(names, row.actorId),
    created_at: row.createdAt.toISOString(),
    player_name: nameOf(names, row.personId),
  };
}

export function toReportRow(
  row: {
    id: string;
    reporterId: string | null;
    targetType: string;
    targetId: string;
    reason: string;
    detail: string;
    status: string;
    resolvedById: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    anonymous?: boolean;
  },
  subject: { title: string; ownerId: string } | undefined,
  names: Names,
): ReportRow {
  const kind = row.targetType === "journal" ? "Post" : "Project";
  const reporter = row.reporterId ?? "";
  const owner = subject?.ownerId ?? "";
  return {
    id: numericIdFor("report", row.id),
    reporter_id: reporter,
    target_id: owner,
    reason: row.detail,
    rule: isRuleKind(row.reason) ? row.reason : "Other",
    subject: `${kind}: ${subject?.title ?? "(removed)"}`,
    status: reportPageStatus(row.status),
    handled_by: nameOf(names, row.resolvedById),
    handled_at: iso(row.resolvedAt),
    created_at: row.createdAt.toISOString(),
    // Staff always see who reported, so the staff row is never marked anonymous. The stored flag is checked by
    // reporterVisibleToSubject for any view the reported person sees. The reports pages hide an anonymous reporter when the row says so;
    // this row does not, by owner decision.
    anonymous: false,
    reporter_name: nameOf(names, reporter),
    target_name: nameOf(names, owner),
  };
}

export type ProposalMeta = { days: number | null; ban: string | null };

export function toProposalRow(
  row: { id: string; personId: string; proposedById: string; reason: string; status: string; decidedById: string | null; decidedAt: Date | null; createdAt: Date; days?: number | null },
  meta: ProposalMeta | undefined,
  names: Names,
): BanProposalRow {
  return {
    id: numericIdFor("proposal", row.id),
    user_id: row.personId,
    reason: row.reason,
    // The stored length; a row from before the column existed reads its length from the propose log. Unknown reads as permanent.
    days: row.days ?? meta?.days ?? 0,
    proposed_by: handleLike(nameOf(names, row.proposedById)),
    status: proposalPageStatus(row.status),
    decided_by: row.decidedById ? nameOf(names, row.decidedById) : null,
    decided_at: iso(row.decidedAt),
    ban_id: meta?.ban ? numericIdFor("ban", meta.ban) : null,
    created_at: row.createdAt.toISOString(),
    users: embed(row.personId, names),
  };
}

// A ban the review desk proposed on a project (Project.proposedBanBy, lib/platform/review-actions.ts). The desk's bans are permanent.
export function toFlaggedProposalRow(
  project: { id: string; ownerId: string; proposedBanBy: string | null; proposedBanReason: string | null; createdAt: Date; statusChangedAt: Date | null },
  names: Names,
): BanProposalRow {
  return {
    id: numericIdFor("project-proposal", project.id),
    user_id: project.ownerId,
    reason: project.proposedBanReason ?? "",
    days: 0,
    proposed_by: handleLike(nameOf(names, project.proposedBanBy)),
    status: "pending",
    decided_by: null,
    decided_at: null,
    ban_id: null,
    created_at: (project.statusChangedAt ?? project.createdAt).toISOString(),
    users: embed(project.ownerId, names),
  };
}

export function toViolationRow(row: { id: string; personId: string; kind: string; note: string; createdAt: Date }, names: Names): SampleViolation {
  return {
    id: numericIdFor("violation", row.id),
    user_id: row.personId,
    kind: row.kind,
    content: row.note,
    created_at: row.createdAt.toISOString(),
    users: embed(row.personId, names),
  };
}

// ---- Reads ----

// Names for a set of person ids, in one query.
async function namesFor(ids: readonly (string | null | undefined)[]): Promise<Names> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();
  const rows = await db().person.findMany({ where: { id: { in: unique } }, select: { id: true, displayName: true } });
  return new Map(rows.map((row) => [row.id, row.displayName]));
}

export type CountedTable = "ban" | "proposal" | "report" | "violation" | "modAction";

// Rows in a table, for the development fallback. "proposal" counts the stored proposals and the desk's flagged projects together.
export async function countRows(table: CountedTable): Promise<number> {
  const client = db();
  switch (table) {
    case "ban":
      return client.ban.count();
    case "proposal": {
      const [stored, flagged] = await Promise.all([client.banProposal.count(), client.project.count({ where: { proposedBanBy: { not: null } } })]);
      return stored + flagged;
    }
    case "report":
      return client.report.count();
    case "violation":
      return client.violation.count();
    case "modAction":
      return client.modAction.count();
  }
}

export async function listBanRows(limit = 200): Promise<SampleBan[]> {
  const rows = await db().ban.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  const names = await namesFor(rows.flatMap((row) => [row.personId, row.bannedById]));
  return rows.map((row) => toBanRow(row, names));
}

export async function listBanLogRows(limit = 100): Promise<BanLogRow[]> {
  const rows = await db().modAction.findMany({
    where: { action: { in: BAN_LOG_ACTIONS }, personId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const names = await namesFor(rows.flatMap((row) => [row.actorId, row.personId]));
  return rows.map((row) => toBanLogRow({ ...row, personId: row.personId }, names));
}

// The propose and ban log rows for a set of proposals, so each one has its length and its ban id.
async function proposalMeta(subjectIds: readonly string[]): Promise<Map<string, ProposalMeta>> {
  const meta = new Map<string, ProposalMeta>();
  if (subjectIds.length === 0) return meta;
  const rows = await db().modAction.findMany({
    where: { personId: { in: [...subjectIds] }, action: { in: ["propose", "ban"] } },
    select: { action: true, detail: true },
  });
  for (const row of rows) {
    const detail = decodeDetail(row.detail);
    if (!detail.proposal) continue;
    const current = meta.get(detail.proposal) ?? { days: null, ban: null };
    meta.set(detail.proposal, {
      days: row.action === "propose" ? detail.days : current.days,
      ban: row.action === "ban" ? detail.ban : current.ban,
    });
  }
  return meta;
}

// The review desk's flagged projects that are not yet a proposal row (one row per project, so nothing is listed twice).
async function unrecordedFlaggedProjects(take: number) {
  const projects = await db().project.findMany({
    where: { proposedBanBy: { not: null }, bannedAt: null },
    orderBy: { statusChangedAt: "desc" },
    take,
  });
  if (projects.length === 0) return projects;
  const recorded = await db().banProposal.findMany({
    where: { projectId: { in: projects.map((p) => p.id) } },
    select: { projectId: true },
  });
  const taken = new Set(recorded.map((row) => row.projectId));
  return projects.filter((p) => !taken.has(p.id));
}

export async function listBanProposalRows(options: { status?: ProposalStatus; take?: number } = {}): Promise<BanProposalRow[]> {
  const take = options.take ?? 200;
  const stored = await db().banProposal.findMany({
    where: options.status ? { status: options.status } : {},
    orderBy: { createdAt: "desc" },
    take,
  });
  const flagged = !options.status || options.status === "open" ? await unrecordedFlaggedProjects(take) : [];
  const meta = await proposalMeta(stored.map((row) => row.personId));
  const names = await namesFor([
    ...stored.flatMap((row) => [row.personId, row.proposedById, row.decidedById]),
    ...flagged.flatMap((p) => [p.ownerId, p.proposedBanBy]),
  ]);
  const rows: BanProposalRow[] = [
    ...stored.map((row) => toProposalRow(row, meta.get(row.id), names)),
    ...flagged.map((p) => toFlaggedProposalRow(p, names)),
  ];
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, take);
}

// The proposal with this page number, from any status. Scans the rows, which stays small for proposals.
export async function getBanProposalRow(id: number): Promise<BanProposalRow | null> {
  const rows = await listBanProposalRows({ take: 5000 });
  return rows.find((row) => row.id === id) ?? null;
}

export async function listViolationRows(limit = 100): Promise<SampleViolation[]> {
  const rows = await db().violation.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  const names = await namesFor(rows.map((row) => row.personId));
  return rows.map((row) => toViolationRow(row, names));
}

// Reads for one person (the player page). Same row shapes as the list reads above.
export async function listBanRowsFor(personId: string, limit = 200): Promise<SampleBan[]> {
  const rows = await db().ban.findMany({ where: { personId }, orderBy: { createdAt: "desc" }, take: limit });
  const names = await namesFor(rows.flatMap((row) => [row.personId, row.bannedById]));
  return rows.map((row) => toBanRow(row, names));
}

export async function listBanLogRowsFor(personId: string, limit = 200): Promise<BanLogRow[]> {
  const rows = await db().modAction.findMany({ where: { personId, action: { in: BAN_LOG_ACTIONS } }, orderBy: { createdAt: "desc" }, take: limit });
  const names = await namesFor(rows.flatMap((row) => [row.actorId, row.personId]));
  return rows.map((row) => toBanLogRow(row, names));
}

export async function listViolationRowsFor(personId: string, limit = 200): Promise<SampleViolation[]> {
  const rows = await db().violation.findMany({ where: { personId }, orderBy: { createdAt: "desc" }, take: limit });
  const names = await namesFor([personId]);
  return rows.map((row) => toViolationRow(row, names));
}

export async function listOpenProposalRowsFor(personId: string): Promise<BanProposalRow[]> {
  return (await listBanProposalRows({ status: "open", take: 500 })).filter((row) => row.user_id === personId);
}

// Reports against anything this person owns (projects and posts).
export async function listReportRowsAgainstOwner(ownerId: string, limit = 50): Promise<ReportRow[]> {
  const [projects, journals] = await Promise.all([
    db().project.findMany({ where: { ownerId }, select: { id: true } }),
    db().journalEntry.findMany({ where: { authorId: ownerId }, select: { id: true } }),
  ]);
  if (projects.length === 0 && journals.length === 0) return [];
  return loadReports(
    {
      OR: [
        { targetType: "project", targetId: { in: projects.map((p) => p.id) } },
        { targetType: "journal", targetId: { in: journals.map((j) => j.id) } },
      ],
    },
    limit,
  );
}

// Projects and journal entries the reports point at, by "kind:id".
async function subjectsFor(rows: readonly { targetType: string; targetId: string }[]): Promise<Map<string, { title: string; ownerId: string }>> {
  const projectIds = rows.filter((row) => row.targetType === "project").map((row) => row.targetId);
  const journalIds = rows.filter((row) => row.targetType === "journal").map((row) => row.targetId);
  const [projects, journals] = await Promise.all([
    projectIds.length ? db().project.findMany({ where: { id: { in: projectIds } }, select: { id: true, title: true, ownerId: true } }) : [],
    journalIds.length ? db().journalEntry.findMany({ where: { id: { in: journalIds } }, select: { id: true, title: true, authorId: true } }) : [],
  ]);
  const map = new Map<string, { title: string; ownerId: string }>();
  for (const p of projects) map.set(`project:${p.id}`, { title: p.title, ownerId: p.ownerId });
  for (const j of journals) map.set(`journal:${j.id}`, { title: j.title, ownerId: j.authorId });
  return map;
}

async function loadReports(where: Prisma.ReportWhereInput, take: number): Promise<ReportRow[]> {
  const rows = await db().report.findMany({ where, orderBy: { createdAt: "desc" }, take });
  const subjects = await subjectsFor(rows);
  const names = await namesFor(
    rows.flatMap((row) => [row.reporterId, row.resolvedById, subjects.get(`${row.targetType}:${row.targetId}`)?.ownerId]),
  );
  return rows.map((row) => toReportRow(row, subjects.get(`${row.targetType}:${row.targetId}`), names));
}

export async function listReportRows(limit = 500): Promise<ReportRow[]> {
  return loadReports({}, limit);
}

// The stored id of the report with this page number, or null.
async function reportIdFor(number: number): Promise<string | null> {
  const ids = await db().report.findMany({ select: { id: true } });
  return ids.find((row) => numericIdFor("report", row.id) === number)?.id ?? null;
}

export async function getReportRow(number: number): Promise<ReportRow | null> {
  const id = await reportIdFor(number);
  if (!id) return null;
  const [row] = await loadReports({ id }, 1);
  return row ?? null;
}

// How many reports a person has had against their projects and posts, and how many they have filed.
export async function reportCountsFor(targetOwnerId: string, reporterId: string): Promise<{ againstTarget: number; byReporter: number }> {
  const client = db();
  const [projects, journals] = await Promise.all([
    client.project.findMany({ where: { ownerId: targetOwnerId }, select: { id: true } }),
    client.journalEntry.findMany({ where: { authorId: targetOwnerId }, select: { id: true } }),
  ]);
  const [againstTarget, byReporter] = await Promise.all([
    client.report.count({
      where: {
        OR: [
          { targetType: "project", targetId: { in: projects.map((p) => p.id) } },
          { targetType: "journal", targetId: { in: journals.map((j) => j.id) } },
        ],
      },
    }),
    client.report.count({ where: { reporterId } }),
  ]);
  return { againstTarget, byReporter };
}

export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const found = await db().block.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { blockerId: true },
  });
  return found !== null;
}

// ---- Writes: bans ----

// Bans a builder directly (owner only). The ban runs until it is lifted; the length is kept in the log.
export async function banPerson(input: {
  access: ReviewerAccess | null;
  actorId: string;
  personId: string;
  // LOADOUT_OWNER_EMAILS (ownerEmails() in lib/platform/session.ts). The owner check is made here, never left to the caller.
  ownerEmails: readonly string[];
  reason: string;
  days: number | null;
}): Promise<Result<{ banId: string }>> {
  const subjectIsOwner = await isOwnerPerson(input.personId, input.ownerEmails);
  const gate = gateDirectBan(input.access, { id: input.personId, isOwner: subjectIsOwner });
  if (!gate.ok) return fail(gate.message);
  const checked = checkReason(input.reason);
  if (!checked.ok) return fail(checked.message);
  if (input.days !== null && (!Number.isInteger(input.days) || input.days < BAN_DAYS_MIN || input.days > BAN_DAYS_MAX)) {
    return fail(`Pick a length from ${BAN_DAYS_MIN} to ${BAN_DAYS_MAX} days, or no end date.`);
  }
  const person = await db().person.findUnique({ where: { id: input.personId }, select: { id: true, bannedAt: true } });
  if (!person) return fail("That builder was not found.");
  const now = new Date();
  try {
    const banId = await db().$transaction(async (tx) => {
      const ban = await tx.ban.create({
        data: { personId: input.personId, bannedById: input.actorId, reason: checked.reason, expiresAt: banExpiry(input.days, now) },
      });
      await tx.person.update({
        where: { id: input.personId },
        data: { bannedAt: person.bannedAt ?? now, banReason: checked.reason },
      });
      // A banned person is signed out everywhere: their sessions go now, and readViewer refuses them while the ban holds.
      await tx.session.deleteMany({ where: { personId: input.personId } });
      await tx.modAction.create({
        data: {
          actorId: input.actorId,
          personId: input.personId,
          action: "ban",
          detail: encodeDetail({ text: `${lengthText(input.days)}, ${checked.reason}`, days: input.days, proposal: null, ban: ban.id }),
        },
      });
      await recordAudit(tx, {
        actorId: input.actorId,
        action: "moderation.ban",
        targetType: "person",
        targetId: input.personId,
        reason: checked.reason,
        after: { banId: ban.id, days: input.days },
      });
      return ban.id;
    });
    return { ok: true, banId };
  } catch (caught) {
    if (caught instanceof Race) return fail(caught.message);
    throw caught;
  }
}

// Lifts every open ban on a builder (owner only). The person's ban flags clear once no active ban is left. An expired ban that is still
// open is lifted with the rest, so it does not count as left.
export async function liftBans(input: { access: ReviewerAccess | null; actorId: string; personId: string; reason: string }): Promise<Result<{ lifted: number }>> {
  const gate = gateLiftBan(input.access);
  if (!gate.ok) return fail(gate.message);
  const checked = checkReason(input.reason);
  if (!checked.ok) return fail(checked.message);
  const now = new Date();
  try {
    const lifted = await db().$transaction(async (tx) => {
      const open = await tx.ban.findMany({ where: { personId: input.personId, liftedAt: null }, select: { id: true } });
      if (open.length === 0) return 0;
      must(await tx.ban.updateMany({ where: { id: { in: open.map((b) => b.id) }, liftedAt: null }, data: { liftedAt: now, liftedById: input.actorId } }));
      // Every open row (expired or not) was lifted just above, so this is zero unless a new ban landed in between.
      const left = await tx.ban.count({ where: { personId: input.personId, liftedAt: null } });
      if (!stillBanned(left)) await tx.person.update({ where: { id: input.personId }, data: { bannedAt: null, banReason: null } });
      await tx.modAction.create({
        data: { actorId: input.actorId, personId: input.personId, action: "lift", detail: encodeDetail({ text: checked.reason, days: null, proposal: null, ban: null }) },
      });
      await recordAudit(tx, { actorId: input.actorId, action: "moderation.unban", targetType: "person", targetId: input.personId, reason: checked.reason, after: { lifted: open.length } });
      return open.length;
    });
    if (lifted === 0) return fail("This builder has no open ban.");
    return { ok: true, lifted };
  } catch (caught) {
    if (caught instanceof Race) return fail(caught.message);
    throw caught;
  }
}

// Clears a person's ban flags once every open ban on them has run out. Called wherever a person is read or signs in, so an expired
// temporary ban stops blocking them without anyone lifting it. Conservative: a flag with no open ban rows is a manual ban and stays,
// and so does a person with any ban still active. Idempotent: the update only matches a person still flagged, and the audit row is
// written only when that update changed a row. Returns true when the flag was cleared by this call.
export async function releaseExpiredBan(personId: string, now: Date = new Date()): Promise<boolean> {
  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  if (!person?.bannedAt) return false;
  const open = await db().ban.findMany({ where: { personId, liftedAt: null }, select: { id: true, liftedAt: true, expiresAt: true } });
  if (open.length === 0) return false;
  if (open.some((ban) => isBanActive(ban, now))) return false;
  return db().$transaction(async (tx) => {
    const cleared = await tx.person.updateMany({ where: { id: personId, bannedAt: { not: null } }, data: { bannedAt: null, banReason: null } });
    if (cleared.count === 0) return false;
    await recordAudit(tx, {
      actorId: "system",
      action: "moderation.ban_expired",
      targetType: "person",
      targetId: personId,
      reason: "A temporary ban ran out, so the builder's account opens again.",
      after: { expiredBanIds: open.map((ban) => ban.id) },
    });
    return true;
  });
}

// ---- Writes: ban proposals ----

export async function proposeBan(input: {
  access: ReviewerAccess | null;
  actorId: string;
  subjectId: string;
  ownerEmails: readonly string[];
  reason: string;
  days: number | null;
}): Promise<Result<{ id: number }>> {
  const gate: Gate = gateProposeBan(input.access, input.subjectId);
  if (!gate.ok) return fail(gate.message);
  if (await isOwnerPerson(input.subjectId, input.ownerEmails)) return fail("An owner can't be proposed for a ban.");
  const checked = checkReason(input.reason);
  if (!checked.ok) return fail(checked.message);
  if (input.days !== null && (!Number.isInteger(input.days) || input.days < BAN_DAYS_MIN || input.days > BAN_DAYS_MAX)) {
    return fail(`Pick a length from ${BAN_DAYS_MIN} to ${BAN_DAYS_MAX} days, or no end date.`);
  }
  const person = await db().person.findUnique({ where: { id: input.subjectId }, select: { id: true } });
  if (!person) return fail("That builder was not found.");
  const now = new Date();
  const activeBan = await db().ban.findFirst({
    where: { personId: input.subjectId, liftedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { id: true },
  });
  if (activeBan) return fail("This builder is already banned.");
  const waiting = await db().banProposal.findFirst({ where: { personId: input.subjectId, status: "open" }, select: { id: true } });
  if (waiting) return fail("A ban for this builder is already waiting for an owner.");
  const id = await db().$transaction(async (tx) => {
    const row = await tx.banProposal.create({
      data: { personId: input.subjectId, proposedById: input.actorId, reason: checked.reason, status: "open", days: input.days },
    });
    await tx.modAction.create({
      data: {
        actorId: input.actorId,
        personId: input.subjectId,
        action: "propose",
        detail: encodeDetail({ text: `${lengthText(input.days)}, ${checked.reason}`, days: input.days, proposal: row.id, ban: null }),
      },
    });
    await recordAudit(tx, { actorId: input.actorId, action: "moderation.propose_ban", targetType: "person", targetId: input.subjectId, reason: checked.reason, after: { proposalId: row.id, days: input.days } });
    return row.id;
  });
  return { ok: true, id: numericIdFor("proposal", id) };
}

type DecidableProposal = {
  kind: "row" | "project";
  id: string | null;
  projectId: string | null;
  personId: string;
  proposedById: string;
  reason: string;
  // The proposed length in days, null for permanent (the desk's flagged projects are always permanent).
  days: number | null;
  subjectIds: string[];
  projectTitle: string | null;
  projectOwnerId: string | null;
};

// The open proposal with this page number: a stored row, or a flagged project that has no row yet.
async function findDecidable(number: number): Promise<DecidableProposal | null> {
  const rows = await db().banProposal.findMany({ where: { status: "open" }, take: 5000 });
  const row = rows.find((r) => numericIdFor("proposal", r.id) === number);
  if (row) {
    const project = row.projectId ? await db().project.findUnique({ where: { id: row.projectId }, select: { ownerId: true, title: true } }) : null;
    // Rows from before the column existed keep their length in the propose log.
    const days = row.days ?? (await proposalMeta([row.personId])).get(row.id)?.days ?? null;
    return {
      kind: "row",
      id: row.id,
      projectId: row.projectId,
      personId: row.personId,
      proposedById: row.proposedById,
      reason: row.reason,
      days,
      subjectIds: [row.personId, ...(project ? [project.ownerId] : [])],
      projectTitle: project?.title ?? null,
      projectOwnerId: project?.ownerId ?? null,
    };
  }
  const flagged = await unrecordedFlaggedProjects(5000);
  const project = flagged.find((p) => numericIdFor("project-proposal", p.id) === number);
  if (!project || !project.proposedBanBy) return null;
  return {
    kind: "project",
    id: null,
    projectId: project.id,
    personId: project.ownerId,
    proposedById: project.proposedBanBy,
    reason: project.proposedBanReason ?? "Proposed on the review desk.",
    days: null,
    subjectIds: [project.ownerId],
    projectTitle: project.title,
    projectOwnerId: project.ownerId,
  };
}

// Confirms, overturns or withdraws a proposal. A confirmed ban is the same as a direct ban, and a project-linked proposal also moves the
// project the way the review desk's confirmed ban does (lib/platform/review-actions.ts): status banned, the pending Ore released. An
// overturn clears the project's proposed-ban flag and triage, as the desk's reroute does.
export async function decideBanProposal(input: {
  access: ReviewerAccess | null;
  actorId: string;
  // LOADOUT_OWNER_EMAILS (ownerEmails() in lib/platform/session.ts). An owner is never banned through a proposal.
  ownerEmails: readonly string[];
  proposalNumber: number;
  decision: "confirm" | "overturn" | "withdraw";
  note: string;
}): Promise<DecideResult> {
  const target = await findDecidable(input.proposalNumber);
  if (!target) return { ok: false, message: "That ban proposal was not found or is already decided.", missing: true };
  // An overturn by the proposer is a withdrawal: the proposer cannot overturn their own proposal, but may take it back.
  const effective: "confirm" | "overturn" | "withdraw" =
    input.decision === "overturn" && input.access?.personId === target.proposedById ? "withdraw" : input.decision;
  const subjectIsOwner = await isOwnerPerson(target.personId, input.ownerEmails);
  const context = { proposedById: target.proposedById, subjectIds: target.subjectIds, subjectIsOwner };
  const actor: ActorAccess = input.access;
  const gate: Gate =
    effective === "confirm"
      ? gateConfirmBan(actor, context)
      : effective === "overturn"
        ? gateOverturnBan(actor, context)
        : gateWithdrawBan(actor, target.proposedById);
  if (!gate.ok) return { ok: false, message: gate.message };

  const now = new Date();
  const note = input.note.trim().slice(0, 500);
  const auditReason = (effective === "confirm" ? target.reason : note) || "(no note)";
  const days = target.days;

  try {
    const banId = await db().$transaction(async (tx) => {
      let proposalId: string;
      if (target.kind === "project") {
        // One row per flagged project, even when two owners click at once: the advisory lock serialises the check and the insert.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ban-proposal:${target.projectId}`}))`;
        const existing = await tx.banProposal.findFirst({ where: { projectId: target.projectId ?? undefined }, select: { id: true } });
        if (existing) throw new Race(RACE_MESSAGE);
        const created = await tx.banProposal.create({
          data: { personId: target.personId, projectId: target.projectId, proposedById: target.proposedById, reason: target.reason, status: "open" },
        });
        proposalId = created.id;
      } else {
        proposalId = target.id as string;
      }

      const status: ProposalStatus = effective === "confirm" ? "confirmed" : "overturned";
      must(await tx.banProposal.updateMany({ where: { id: proposalId, status: "open" }, data: { status, decidedById: input.actorId, decidedAt: now } }));

      let banRowId: string | null = null;
      if (effective === "confirm") {
        const person = await tx.person.findUnique({ where: { id: target.personId }, select: { bannedAt: true } });
        const ban = await tx.ban.create({
          data: { personId: target.personId, bannedById: input.actorId, reason: target.reason, expiresAt: banExpiry(days, now) },
        });
        banRowId = ban.id;
        await tx.person.update({ where: { id: target.personId }, data: { bannedAt: person?.bannedAt ?? now, banReason: target.reason } });
        await tx.session.deleteMany({ where: { personId: target.personId } });
        await tx.modAction.create({
          data: {
            actorId: input.actorId,
            personId: target.personId,
            action: "ban",
            detail: encodeDetail({ text: `${lengthText(days)}, ${target.reason}`, days, proposal: proposalId, ban: ban.id }),
          },
        });
        if (target.projectId && target.projectTitle !== null) {
          const projectId = target.projectId;
          // The same effect as the desk's confirmed ban: the project is banned and its pending Ore is reversed (never edited).
          must(await tx.project.updateMany({ where: { id: projectId, bannedAt: null }, data: { status: "banned", bannedAt: now, proposedBanReason: target.reason, assignedTo: null, reshippedAt: null, statusChangedAt: now } }));
          const sum = await tx.ledgerEntry.aggregate({
            where: { projectId, personId: target.personId, status: "pending", kind: { in: ["approved_hours", "adjustment"] } },
            _sum: { amountOre: true },
          });
          const pending = sum._sum.amountOre ?? 0;
          if (pending > 0) {
            const why = `Pending Ore released: the project was banned (${target.projectTitle}).`.slice(0, 200);
            const checked = checkLedgerEntry({ amountOre: -pending, status: "pending", kind: "adjustment", reason: why });
            if (!checked.ok) throw new Error(checked.message);
            await tx.ledgerEntry.create({
              data: { personId: target.personId, projectId, amountOre: checked.entry.amountOre, status: checked.entry.status, kind: checked.entry.kind, reason: checked.entry.reason },
            });
          }
        }
      } else {
        if (target.projectId) {
          // The desk's reroute: the flag and the triage clear, the project stays where it is.
          await tx.project.updateMany({
            where: { id: target.projectId },
            data: { proposedBanBy: null, proposedBanReason: null, triage: null, triageBy: null, triageNote: null, triageAt: null, statusChangedAt: now },
          });
        }
        await tx.modAction.create({
          data: {
            actorId: input.actorId,
            personId: target.personId,
            action: effective,
            detail: encodeDetail({ text: note || "(no note)", days: null, proposal: proposalId, ban: null }),
          },
        });
      }

      await recordAudit(tx, {
        actorId: input.actorId,
        action: `moderation.ban_${effective}`,
        targetType: "person",
        targetId: target.personId,
        reason: auditReason,
        after: { proposalId, banId: banRowId },
      });
      return banRowId;
    });
    return { ok: true, banId };
  } catch (caught) {
    if (caught instanceof Race) return { ok: false, message: caught.message };
    throw caught;
  }
}

// ---- Writes: reports ----

// A builder reports a project or a post. The reporter is always stored; anonymous only hides them from the person reported.
export async function createReport(input: ReportInput): Promise<Result<{ id: number }>> {
  const checked = checkReportInput(input);
  if (!checked.ok) return fail(checked.message);
  const subject = await subjectOf(checked.value.targetType, checked.value.targetId);
  if (!subject) return fail("That project or post was not found.");
  if (subject.ownerId === checked.value.reporterId) return fail("You can't report your own project or post.");
  const row = await db().report.create({
    data: {
      reporterId: checked.value.reporterId,
      targetType: checked.value.targetType,
      targetId: checked.value.targetId,
      reason: checked.value.reason,
      detail: checked.value.detail,
      anonymous: input.anonymous === true,
      status: "open",
    },
  });
  return { ok: true, id: numericIdFor("report", row.id) };
}

async function subjectOf(targetType: string, targetId: string): Promise<{ title: string; ownerId: string } | null> {
  if (targetType === "journal") {
    const row = await db().journalEntry.findUnique({ where: { id: targetId }, select: { title: true, authorId: true } });
    return row ? { title: row.title, ownerId: row.authorId } : null;
  }
  const row = await db().project.findUnique({ where: { id: targetId }, select: { title: true, ownerId: true } });
  return row ? { title: row.title, ownerId: row.ownerId } : null;
}

// Actions an open report or dismisses it (owner only). The decision and its ModAction are one transaction.
export async function decideReport(input: {
  access: ReviewerAccess | null;
  actorId: string;
  reportNumber: number;
  to: "actioned" | "dismissed";
  note: string;
}): Promise<Result> {
  const gate = gateDecideReport(input.access);
  if (!gate.ok) return fail(gate.message);
  const id = await reportIdFor(input.reportNumber);
  if (!id) return fail("That report was not found.");
  const report = await db().report.findUnique({ where: { id }, select: { id: true, status: true, targetType: true, targetId: true } });
  if (!report) return fail("That report was not found.");
  if (!canMoveReport(report.status, input.to)) return fail("This report is already decided.");
  const subject = await subjectOf(report.targetType, report.targetId);
  const note = input.note.trim().slice(0, 500) || "(no note)";
  const now = new Date();
  try {
    await db().$transaction(async (tx) => {
      must(await tx.report.updateMany({ where: { id, status: "open" }, data: { status: input.to satisfies ReportStatus, resolvedById: input.actorId, resolvedAt: now } }));
      await tx.modAction.create({
        data: {
          actorId: input.actorId,
          personId: subject?.ownerId ?? null,
          action: `report.${input.to}`,
          detail: encodeDetail({ text: note, days: null, proposal: null, ban: null }),
        },
      });
      await recordAudit(tx, { actorId: input.actorId, action: `moderation.report_${input.to}`, targetType: "report", targetId: id, reason: note });
    });
    return { ok: true };
  } catch (caught) {
    if (caught instanceof Race) return fail(caught.message);
    throw caught;
  }
}

// Records that a staff member opened a report (one row per reviewer and report, the time updated on each open).
export async function markReportViewed(reportNumber: number, viewerId: string): Promise<void> {
  const id = await reportIdFor(reportNumber);
  if (!id || !viewerId) return;
  await db().reportViewer.upsert({
    where: { reportId_viewerId: { reportId: id, viewerId } },
    create: { reportId: id, viewerId },
    update: { viewedAt: new Date() },
  });
}

// ---- Writes: violations ----

// Records a violation against a builder (a reviewer or an owner). The rule must be one of the owner's six.
export async function recordViolation(input: {
  access: ReviewerAccess | null;
  actorId: string;
  personId: string;
  kind: string;
  note: string;
}): Promise<Result<{ id: number }>> {
  const gate = gateRecordViolation(input.access);
  if (!gate.ok) return fail(gate.message);
  if (!isRuleKind(input.kind)) return fail("Pick the rule this breaks.");
  const checked = checkReason(input.note);
  if (!checked.ok) return fail(checked.message);
  const person = await db().person.findUnique({ where: { id: input.personId }, select: { id: true } });
  if (!person) return fail("That builder was not found.");
  const id = await db().$transaction(async (tx) => {
    const row = await tx.violation.create({ data: { personId: input.personId, kind: input.kind, note: checked.reason, createdById: input.actorId } });
    await tx.modAction.create({
      data: { actorId: input.actorId, personId: input.personId, action: "violation", detail: encodeDetail({ text: `${input.kind}: ${checked.reason}`, days: null, proposal: null, ban: null }) },
    });
    await recordAudit(tx, { actorId: input.actorId, action: "moderation.violation", targetType: "person", targetId: input.personId, reason: checked.reason, after: { kind: input.kind } });
    return row.id;
  });
  return { ok: true, id: numericIdFor("violation", id) };
}

// ---- Writes: blocks (between people) ----

// A block stops follows, collaborator invites and idea applications between the two (those features enforce it).
export async function blockPerson(input: { blockerId: string; blockedId: string }): Promise<Result> {
  const gate: Gate = gateBlock(input.blockerId, input.blockedId);
  if (!gate.ok) return fail(gate.message);
  const blocked = await db().person.findUnique({ where: { id: input.blockedId }, select: { id: true } });
  if (!blocked) return fail("That builder was not found.");
  await db().block.upsert({
    where: { blockerId_blockedId: { blockerId: input.blockerId, blockedId: input.blockedId } },
    create: { blockerId: input.blockerId, blockedId: input.blockedId },
    update: {},
  });
  return { ok: true };
}

export async function unblockPerson(input: { blockerId: string; blockedId: string }): Promise<Result> {
  if (!input.blockerId || !input.blockedId) return fail("Pick a builder to unblock.");
  await db().block.deleteMany({ where: { blockerId: input.blockerId, blockedId: input.blockedId } });
  return { ok: true };
}
