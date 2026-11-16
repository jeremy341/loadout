// The moderation reads of the reviewer site's db adapter (bans, ban log, ban proposals, violations, reports).
// Same names and return shapes as Pixl's lib/db.ts; the rows come from ./moderation-data.ts. Re-exported from lib/db.ts.
import type { BanRow, ViolationRow } from "../db";
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

export async function listBans(): Promise<BanRow[]> {
  return allBans().slice(0, 200) as BanRow[];
}

export async function listBanLog(limit = 100): Promise<BanLogRow[]> {
  return allBanLog().slice(0, limit);
}

export async function listBanProposals(status?: string): Promise<BanProposalRow[]> {
  const rows = allProposals();
  return (status ? rows.filter((p) => p.status === status) : rows).slice(0, 200);
}

export async function getBanProposal(id: number): Promise<BanProposalRow | null> {
  return allProposals().find((p) => p.id === id) ?? null;
}

export async function listViolations(limit = 100): Promise<ViolationRow[]> {
  return allViolations().slice(0, limit) as ViolationRow[];
}

export async function listReports(limit = 500): Promise<ReportRow[]> {
  return allReports().slice(0, limit);
}

export async function getReport(id: number): Promise<ReportRow | null> {
  return allReports().find((r) => r.id === id) ?? null;
}

// How many reports a target has received and a reporter has filed.
export async function reportCounts(targetId: string, reporterId: string): Promise<{ againstTarget: number; byReporter: number }> {
  const all = allReports();
  return {
    againstTarget: all.filter((r) => r.target_id === targetId).length,
    byReporter: all.filter((r) => r.reporter_id === reporterId).length,
  };
}

// The notify page's typeahead reads this (see app/actions-moderation.ts, searchPlayers).
export function listNotifyPlayers() {
  return knownPlayers();
}
