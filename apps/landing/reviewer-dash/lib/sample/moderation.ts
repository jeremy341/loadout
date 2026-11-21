// The moderation reads of the reviewer site's db adapter (bans, ban log, ban proposals, violations, reports).
// Same names and return shapes as Pixl's lib/db.ts. The rows come from the database (lib/platform/moderation-data.ts). The sample rows
// in ./moderation-data.ts show only in development, when the database is missing or the table is empty (usesSampleRows). Production
// returns what the database holds, even an empty list. Re-exported from lib/db.ts.
import type { BanRow, ViolationRow } from "../db";
import { databaseConfigured } from "@/lib/platform/db";
import * as live from "@/lib/platform/moderation-data";
import { usesSampleRows, proposalStoredStatus } from "@/lib/platform/moderation-rules";
import { readViewer } from "@/lib/platform/session";
import {
  allBanLog,
  allBans,
  allProposals,
  allReports,
  allViolations,
  knownPlayers,
  type BanLogRow,
  type BanProposalRow,
  type ReportRow,
} from "./moderation-data";

export type { BanLogRow, BanProposalRow, ReportRow } from "./moderation-data";

// The real rows when the database holds them. The sample only when usesSampleRows says so (development, no database or an empty table).
async function rowsOr<T>(table: live.CountedTable, real: () => Promise<T[]>, sample: () => T[]): Promise<T[]> {
  const configured = databaseConfigured();
  const tableEmpty = configured ? (await live.countRows(table)) === 0 : true;
  if (usesSampleRows({ nodeEnv: process.env.NODE_ENV, databaseConfigured: configured, tableEmpty })) return sample();
  return configured ? real() : [];
}

export async function listBans(): Promise<BanRow[]> {
  return (await rowsOr("ban", () => live.listBanRows(200), () => allBans().slice(0, 200))) as BanRow[];
}

export async function listBanLog(limit = 100): Promise<BanLogRow[]> {
  return rowsOr("modAction", () => live.listBanLogRows(limit), () => allBanLog().slice(0, limit));
}

// The status is the Pixl word (pending, confirmed, rejected); no status lists everything.
export async function listBanProposals(status?: string): Promise<BanProposalRow[]> {
  return rowsOr(
    "proposal",
    async () => {
      if (!status) return live.listBanProposalRows({ take: 200 });
      const stored = proposalStoredStatus(status);
      return stored ? live.listBanProposalRows({ status: stored, take: 200 }) : [];
    },
    () => {
      const rows = allProposals();
      return (status ? rows.filter((p) => p.status === status) : rows).slice(0, 200);
    },
  );
}

export async function getBanProposal(id: number): Promise<BanProposalRow | null> {
  const rows = await rowsOr(
    "proposal",
    async () => {
      const row = await live.getBanProposalRow(id);
      return row ? [row] : [];
    },
    () => allProposals().filter((p) => p.id === id),
  );
  return rows[0] ?? null;
}

export async function listViolations(limit = 100): Promise<ViolationRow[]> {
  return (await rowsOr("violation", () => live.listViolationRows(limit), () => allViolations().slice(0, limit))) as ViolationRow[];
}

export async function listReports(limit = 500): Promise<ReportRow[]> {
  return rowsOr("report", () => live.listReportRows(limit), () => allReports().slice(0, limit));
}

// Opening a report records the reviewer who opened it (ReportViewer), when there is a signed-in person to record.
export async function getReport(id: number): Promise<ReportRow | null> {
  const rows = await rowsOr(
    "report",
    async () => {
      const row = await live.getReportRow(id);
      if (!row) return [];
      const viewer = await readViewer();
      if (viewer) await live.markReportViewed(id, viewer.id);
      return [row];
    },
    () => allReports().filter((r) => r.id === id),
  );
  return rows[0] ?? null;
}

// How many reports a target has received and a reporter has filed.
export async function reportCounts(targetId: string, reporterId: string): Promise<{ againstTarget: number; byReporter: number }> {
  const [counts] = await rowsOr(
    "report",
    async () => [await live.reportCountsFor(targetId, reporterId)],
    () => {
      const all = allReports();
      return [
        {
          againstTarget: all.filter((r) => r.target_id === targetId).length,
          byReporter: all.filter((r) => r.reporter_id === reporterId).length,
        },
      ];
    },
  );
  return counts ?? { againstTarget: 0, byReporter: 0 };
}

// The player page's moderation rows for one builder: bans, the ban log, violations and open proposals. The database rows when their table
// has rows; the sample rows for this builder in development when the table is empty. A sample builder id never matches a database row,
// so a sample builder reads nothing once the table has rows.
export async function moderationForPlayer(userId: string): Promise<{
  bans: BanRow[];
  actions: BanLogRow[];
  violations: ViolationRow[];
  proposals: BanProposalRow[];
}> {
  const [bans, actions, violations, proposals] = await Promise.all([
    rowsOr<BanRow>(
      "ban",
      async () => (await live.listBanRowsFor(userId)) as BanRow[],
      () => allBans().filter((b) => b.user_id === userId) as BanRow[],
    ),
    rowsOr<BanLogRow>(
      "modAction",
      () => live.listBanLogRowsFor(userId),
      () => allBanLog().filter((row) => row.user_id === userId),
    ),
    rowsOr<ViolationRow>(
      "violation",
      async () => (await live.listViolationRowsFor(userId)) as ViolationRow[],
      () => allViolations().filter((v) => v.user_id === userId) as ViolationRow[],
    ),
    rowsOr<BanProposalRow>(
      "proposal",
      () => live.listOpenProposalRowsFor(userId),
      () => allProposals().filter((p) => p.user_id === userId && p.status === "pending"),
    ),
  ]);
  return { bans, actions, violations, proposals };
}

// Reports against anything this builder owns (the Players page lists them against the builder).
export async function reportsAgainstOwner(ownerId: string, limit = 50): Promise<ReportRow[]> {
  return rowsOr(
    "report",
    () => live.listReportRowsAgainstOwner(ownerId, limit),
    () => allReports().filter((r) => r.target_id === ownerId).slice(0, limit),
  );
}

// The notify page's typeahead reads this (see app/actions-moderation.ts, searchPlayers). Still sample data: nothing is sent.
export function listNotifyPlayers() {
  return knownPlayers();
}
