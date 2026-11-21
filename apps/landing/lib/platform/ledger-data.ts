// Ore ledger reads. Server only (uses the database). Read only: there is no update or delete anywhere. A banned person sees nothing.
//   listLedger(personId, { limit?, offset?, kind? }) -> LedgerRow[]   newest first; limit default 50, max 200
//   ledgerBalances(personId)                         -> Balances      { confirmed, pending, available }; zeros for a banned person
//   ledgerCount(personId, kind?)                     -> number        for pagination
import { db } from "./db";
import { balances, isLedgerKind, type Balances } from "./ledger";

export type LedgerRow = {
  id: string;
  amountOre: number;
  status: string;
  kind: string;
  reason: string;
  projectId: string | null;
  projectTitle: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
};

export const LEDGER_PAGE_MAX = 200;
const ZERO: Balances = { confirmed: 0, pending: 0, available: 0 };

async function active(personId: string): Promise<boolean> {
  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  return Boolean(person) && !person?.bannedAt;
}

export async function listLedger(personId: string, opts: { limit?: number; offset?: number; kind?: string } = {}): Promise<LedgerRow[]> {
  if (!(await active(personId))) return [];
  const take = Math.min(Math.max(Math.trunc(opts.limit ?? 50), 1), LEDGER_PAGE_MAX);
  const skip = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const kind = opts.kind && isLedgerKind(opts.kind) ? opts.kind : undefined;
  const rows = await db().ledgerEntry.findMany({
    where: { personId, ...(kind ? { kind } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    skip,
    select: { id: true, amountOre: true, status: true, kind: true, reason: true, projectId: true, createdAt: true, confirmedAt: true, project: { select: { title: true } } },
  });
  return rows.map(({ project, ...row }) => ({ ...row, projectTitle: project?.title ?? null }));
}

export async function ledgerCount(personId: string, kind?: string): Promise<number> {
  if (!(await active(personId))) return 0;
  return db().ledgerEntry.count({ where: { personId, ...(kind && isLedgerKind(kind) ? { kind } : {}) } });
}

export async function ledgerBalances(personId: string): Promise<Balances> {
  if (!(await active(personId))) return ZERO;
  const groups = await db().ledgerEntry.groupBy({ by: ["status"], where: { personId }, _sum: { amountOre: true } });
  return balances(groups.map((g) => ({ status: g.status, amountOre: g._sum.amountOre ?? 0 })));
}
