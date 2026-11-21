// Page logic for the Ledger page. Pure: no database. Reads ?kind= and ?page= safely, builds page links, and totals earned and spent.
import { formatOre, isLedgerKind, kindLabel, LEDGER_KINDS, statusLabel, type LedgerKind, type LedgerLike } from "./ledger";

export const LEDGER_PAGE_SIZE = 50;

export type LedgerQuery = { kind: LedgerKind | null; page: number };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// An unknown kind is ignored (shows everything); a page that is not a whole number of 1 or more is page 1.
export function parseLedgerQuery(params: { kind?: string | string[]; page?: string | string[] }): LedgerQuery {
  const kind = first(params.kind);
  const rawPage = first(params.page);
  const page = rawPage && /^\d{1,6}$/.test(rawPage) ? Math.max(Number.parseInt(rawPage, 10), 1) : 1;
  return { kind: kind && isLedgerKind(kind) ? kind : null, page };
}

export function pageCount(total: number, size = LEDGER_PAGE_SIZE): number {
  return Math.max(Math.ceil(total / size), 1);
}

// A page past the end is pulled back to the last page.
export function clampPage(page: number, total: number, size = LEDGER_PAGE_SIZE): number {
  return Math.min(Math.max(page, 1), pageCount(total, size));
}

export function ledgerHref(query: { kind?: LedgerKind | null; page?: number }): string {
  const search = new URLSearchParams();
  if (query.kind) search.set("kind", query.kind);
  if (query.page && query.page > 1) search.set("page", String(query.page));
  const text = search.toString();
  return text ? `/dashboard/ledger?${text}` : "/dashboard/ledger";
}

// Earned: confirmed entries above zero. Spent: confirmed entries below zero, as a positive number. Pending is never counted here.
export function earnedAndSpent(entries: readonly Pick<LedgerLike, "amountOre" | "status">[]): { earned: number; spent: number } {
  let earned = 0;
  let spent = 0;
  for (const entry of entries) {
    if (entry.status !== "confirmed") continue;
    if (entry.amountOre > 0) earned += entry.amountOre;
    else spent += -entry.amountOre;
  }
  return { earned, spent };
}

// Share of the bar that is confirmed, 0 to 100. With nothing confirmed or pending the bar is empty.
export function confirmedShare(confirmed: number, pending: number): number {
  const c = Math.max(confirmed, 0);
  const p = Math.max(pending, 0);
  return c + p === 0 ? 0 : Math.round((c / (c + p)) * 100);
}

// Chip title: "Ore, confirmed." or "Ore, confirmed. 80 pending."
export function oreChipTitle(pending: number): string {
  return pending > 0 ? `Ore, confirmed. ${pending.toLocaleString("en-US")} pending.` : "Ore, confirmed.";
}

// Kinds offered in the filter. The development seed kind is hidden outside development, unless the address already asks for it.
export function ledgerKindOptions(opts: { development: boolean; current?: LedgerKind | null }): LedgerKind[] {
  return LEDGER_KINDS.filter((kind) => kind !== "dev_seed" || opts.development || opts.current === "dev_seed");
}

// Reasons written by the Desk can carry an internal id ("Desk approve 1794869784110"). A builder should not see it.
export function cleanReason(reason: string): string {
  const cleaned = reason
    .replace(/\s*\((?:[^)]*\b)?Desk approve \d+\)/gi, "")
    .replace(/\s+on Desk approve \d+/gi, "")
    .replace(/\s*\bDesk approve \d+/gi, "")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
  return cleaned || reason.trim();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "16 Nov, 22:57" in UTC, so the server and the browser agree.
export function entryDateText(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${hh}:${mm}`;
}

export type LedgerRowInput = { amountOre: number; status: string; kind: string; reason: string; createdAt: Date };
export type LedgerRowView = {
  kind: string;
  amountText: string;
  sign: "in" | "out";
  status: "pending" | "confirmed";
  statusText: string;
  dateText: string;
  reason: string;
  // Only a confirmed row has a balance after it, and only when the whole history is shown.
  balanceText: string | null;
};

// What one row of the list shows. The amount is always signed ("+20 Ore", "−120 Ore"); a pending row has no balance.
export function ledgerRowView(row: LedgerRowInput, balanceAfter: number | null): LedgerRowView {
  const confirmed = row.status === "confirmed";
  return {
    kind: kindLabel(row.kind),
    amountText: formatOre(row.amountOre, { signed: true }),
    sign: row.amountOre < 0 ? "out" : "in",
    status: confirmed ? "confirmed" : "pending",
    statusText: statusLabel(row.status),
    dateText: entryDateText(row.createdAt),
    reason: cleanReason(row.reason),
    balanceText: confirmed && balanceAfter !== null ? formatOre(balanceAfter) : null,
  };
}
