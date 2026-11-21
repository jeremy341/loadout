// Totals for the Ledger page. Server only, read only. Zeros for a banned person.
import { db } from "./db";

async function active(personId: string): Promise<boolean> {
  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  return Boolean(person) && !person?.bannedAt;
}

// Earned: confirmed entries above zero. Spent: confirmed entries below zero, returned as a positive number.
export async function ledgerEarnedSpent(personId: string): Promise<{ earned: number; spent: number }> {
  if (!(await active(personId))) return { earned: 0, spent: 0 };
  const [earned, spent] = await Promise.all([
    db().ledgerEntry.aggregate({ where: { personId, status: "confirmed", amountOre: { gt: 0 } }, _sum: { amountOre: true } }),
    db().ledgerEntry.aggregate({ where: { personId, status: "confirmed", amountOre: { lt: 0 } }, _sum: { amountOre: true } }),
  ]);
  return { earned: earned._sum.amountOre ?? 0, spent: -(spent._sum.amountOre ?? 0) };
}

// The confirmed amounts of every entry newer than `row` (the list is newest first, ties broken by id). Lets a page of the
// ledger work out the balance after each of its rows without reading the whole history.
export async function confirmedNewerThan(personId: string, row: { createdAt: Date; id: string }): Promise<number> {
  if (!(await active(personId))) return 0;
  const sum = await db().ledgerEntry.aggregate({
    where: {
      personId,
      status: "confirmed",
      OR: [{ createdAt: { gt: row.createdAt } }, { createdAt: row.createdAt, id: { gt: row.id } }],
    },
    _sum: { amountOre: true },
  });
  return sum._sum.amountOre ?? 0;
}
