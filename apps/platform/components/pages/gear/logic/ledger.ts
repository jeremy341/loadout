import type { OreEntry } from "../../../../lib/ore-ledger";

// Pure helpers over Ore ledger entries. The ledger itself (lib/ore-ledger.ts) is append-only and shared; these
// functions only read the entries they are given.

/** The module that wrote shop spends and refunds. Refunds are positive entries from this source. */
export const SHOP_SOURCE = "shop";

export interface LedgerRow extends OreEntry {
  balanceAfter: number;
}

export function withRunningBalance(entries: readonly OreEntry[]): LedgerRow[] {
  let balance = 0;
  return entries.map((entry) => {
    balance += entry.amount;
    return { ...entry, balanceAfter: balance };
  });
}

export interface LedgerTotals {
  balance: number;
  /** Ore that came in, not counting shop refunds (a refund returns spent Ore, it is not new income). */
  earned: number;
  /** Ore spent in the shop, net of refunds. */
  spent: number;
}

export function ledgerTotals(entries: readonly OreEntry[]): LedgerTotals {
  let balance = 0;
  let earned = 0;
  let spent = 0;
  for (const entry of entries) {
    balance += entry.amount;
    if (entry.amount < 0) spent += -entry.amount;
    else if (entry.source === SHOP_SOURCE) spent -= entry.amount;
    else earned += entry.amount;
  }
  return { balance, earned, spent: Math.max(0, spent) };
}

/** Newest entries first. */
export function recentEntries(entries: readonly OreEntry[], count: number): OreEntry[] {
  return entries.slice(-count).reverse();
}

// --- CSV export -----------------------------------------------------------------------------------------------

/**
 * One CSV text cell. Quotes are doubled and the cell is wrapped in quotes when it holds a comma, quote or line
 * break. A cell that starts with = + - @ (or a tab or carriage return) is prefixed with an apostrophe so a
 * spreadsheet cannot run it as a formula.
 */
export function csvText(value: string): string {
  let text = value;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export const LEDGER_CSV_HEADER = ["id", "date", "source", "reason", "amount", "balance_after"] as const;

export function ledgerToCsv(entries: readonly OreEntry[]): string {
  const rows = withRunningBalance(entries);
  const lines = [LEDGER_CSV_HEADER.join(",")];
  for (const row of rows) {
    lines.push([csvText(row.id), csvText(row.at), csvText(row.source), csvText(row.reason), String(Math.trunc(row.amount)), String(Math.trunc(row.balanceAfter))].join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

/** A readable tag for a ledger source. Unknown sources are shown as written. */
export function sourceLabel(source: string): string {
  switch (source) {
    case "shop":
      return "Shop";
    case "preview":
      return "Preview";
    case "award":
      return "Award";
    case "referral":
      return "Referral";
    default:
      return source;
  }
}
