// Ore ledger rules (plans/02-economy-and-rewards.md). Pure: no database. Ore is global and spendable. Every approved hour earns
// 10 Ore. The ledger is append-only: nothing here edits or removes an entry; a correction is a new "adjustment" entry.
// Amounts are signed whole Ore: positive earned, negative spent. "confirmed" counts toward the balance; "pending" is shown apart.
// The internal rate is 10 Ore = $4.35 (owner, 14 Nov 2026). It is staff facing; the participant UI does not show dollars.

export const ORE_PER_APPROVED_HOUR = 10;
export const LEDGER_KINDS = ["approved_hours", "funding_deduction", "shop_purchase", "shop_refund", "toolbelt_reward", "fulfilment_payout", "adjustment", "dev_seed"] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];
export const LEDGER_STATUSES = ["pending", "confirmed"] as const;
export type LedgerStatus = (typeof LEDGER_STATUSES)[number];
export const LEDGER_REASON_MAX = 200;

export type LedgerLike = { amountOre: number; status: string; createdAt: Date };

export type Balances = {
  // Sum of confirmed amounts.
  confirmed: number;
  // Sum of pending amounts. Shown apart, never spendable.
  pending: number;
  // What can be spent now. Equal to confirmed: pending Ore is not available until it is confirmed.
  available: number;
};

export function balances(entries: readonly Pick<LedgerLike, "amountOre" | "status">[]): Balances {
  let confirmed = 0;
  let pending = 0;
  for (const entry of entries) {
    if (entry.status === "confirmed") confirmed += entry.amountOre;
    else if (entry.status === "pending") pending += entry.amountOre;
  }
  return { confirmed, pending, available: confirmed };
}

// ---- The one Ore conversion (owner decision, 16 Nov 2026) ----
// Hours round to 0.1 first (as tenths of an hour), then the Ore rounds UP to a whole Ore. Every display estimate, the review
// rules and the ledger rows use this one version (review-rules.ts creditFor, review.ts creditFor and hoursToOre call it).

function wholeMinutes(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

// Hours rounded to 0.1, as tenths of an hour. 100 minutes is 17 tenths (1.7 hours). Under 3 minutes is 0 tenths.
export function tenthsOfHour(minutes: number): number {
  return Math.round(wholeMinutes(minutes) / 6);
}

// Ore for approved minutes at a rate per hour. 100 minutes is 1.7 hours, 17 Ore. At the standard 10 Ore an hour a tenth of an
// hour is exactly 1 Ore, so rounding up only matters for another rate. Zero, negative and not-a-number all give 0.
export function oreForMinutes(approvedMinutes: number, ratePerHourOre: number = ORE_PER_APPROVED_HOUR): number {
  if (!Number.isFinite(ratePerHourOre) || ratePerHourOre <= 0) return 0;
  // The epsilon keeps float noise from rounding a whole number up by one.
  return Math.max(0, Math.ceil((tenthsOfHour(approvedMinutes) * ratePerHourOre) / 10 - 1e-9));
}

// Ore for approved hours. Approved hours only; self-reported journal hours earn nothing until a reviewer approves them.
// The hours become whole minutes first, the way a journal entry stores them, then go through oreForMinutes.
export function hoursToOre(hours: number): number {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  return oreForMinutes(Math.round(hours * 60));
}

// What an unship takes back. The clawback never goes past the confirmed balance the builder still has (earned minus spent), so
// the balance does not silently go negative; the part that was already spent is the shortfall, and the caller records it.
export function clawbackPlan({ netEarnedOre, confirmedBalanceOre }: { netEarnedOre: number; confirmedBalanceOre: number }): { clawbackOre: number; shortfallOre: number } {
  const earned = Number.isFinite(netEarnedOre) && netEarnedOre > 0 ? Math.floor(netEarnedOre) : 0;
  const balance = Number.isFinite(confirmedBalanceOre) && confirmedBalanceOre > 0 ? Math.floor(confirmedBalanceOre) : 0;
  const clawbackOre = Math.min(earned, balance);
  return { clawbackOre, shortfallOre: earned - clawbackOre };
}

// "1,250 Ore", "+40 Ore" when signed, and a real minus sign for spends: "−120 Ore".
export function formatOre(amount: number, opts: { signed?: boolean } = {}): string {
  const rounded = Math.round(amount);
  const digits = Math.abs(rounded).toLocaleString("en-US");
  const sign = rounded < 0 ? "−" : opts.signed && rounded > 0 ? "+" : "";
  return `${sign}${digits} Ore`;
}

const KIND_LABELS: Record<LedgerKind, string> = {
  approved_hours: "Approved hours",
  funding_deduction: "Hardware funding",
  shop_purchase: "Shop purchase",
  shop_refund: "Shop refund",
  toolbelt_reward: "Toolbelt reward",
  fulfilment_payout: "Fulfilment payout",
  adjustment: "Adjustment",
  dev_seed: "Starting balance",
};

export function isLedgerKind(value: unknown): value is LedgerKind {
  return typeof value === "string" && (LEDGER_KINDS as readonly string[]).includes(value);
}

export function kindLabel(kind: string): string {
  return isLedgerKind(kind) ? KIND_LABELS[kind] : "Other";
}

export function statusLabel(status: string): string {
  return status === "pending" ? "Pending" : status === "confirmed" ? "Confirmed" : "Unknown";
}

// UTC day key, "2026-11-16". The ledger groups by UTC day so the server and the browser agree.
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type DayGroup<T extends LedgerLike> = { day: string; entries: T[]; net: number };

// Newest day first; within a day, newest entry first. `net` is the day's amounts added together, pending included.
export function groupByDay<T extends LedgerLike>(entries: readonly T[]): DayGroup<T>[] {
  const sorted = [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const groups: DayGroup<T>[] = [];
  for (const entry of sorted) {
    const day = dayKey(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.entries.push(entry);
      last.net += entry.amountOre;
    } else {
      groups.push({ day, entries: [entry], net: entry.amountOre });
    }
  }
  return groups;
}

// Oldest first, with the confirmed balance after each entry. A pending entry carries the previous balance unchanged,
// because it does not count yet.
export function runningBalance<T extends LedgerLike>(entries: readonly T[]): (T & { balanceAfter: number })[] {
  const sorted = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let total = 0;
  return sorted.map((entry) => {
    if (entry.status === "confirmed") total += entry.amountOre;
    return { ...entry, balanceAfter: total };
  });
}

// A spend is allowed only up to the confirmed balance. For the shop and funding actions in later work.
export function canSpend(confirmedBalance: number, amountOre: number): boolean {
  return Number.isInteger(amountOre) && amountOre > 0 && amountOre <= confirmedBalance;
}

export type LedgerInput = { amountOre: number; status: LedgerStatus; kind: LedgerKind; reason: string };

// Validates a new entry before it is appended. Approved hours, refunds and Toolbelt rewards add Ore (positive); shop purchases
// and funding deductions spend it (negative); adjustments and sample entries may be either, never zero.
export function checkLedgerEntry(input: {
  amountOre: unknown;
  status: unknown;
  kind: unknown;
  reason: unknown;
}): { ok: true; entry: LedgerInput } | { ok: false; message: string } {
  const { amountOre, status, kind } = input;
  if (typeof amountOre !== "number" || !Number.isInteger(amountOre) || amountOre === 0) return { ok: false, message: "An Ore amount must be a whole number that is not zero." };
  if (status !== "pending" && status !== "confirmed") return { ok: false, message: "An entry is pending or confirmed." };
  if (!isLedgerKind(kind)) return { ok: false, message: "That kind of entry is not known." };
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (reason.length === 0) return { ok: false, message: "Give a short reason." };
  if (reason.length > LEDGER_REASON_MAX) return { ok: false, message: `Keep the reason under ${LEDGER_REASON_MAX} characters.` };
  const earns = kind === "approved_hours" || kind === "shop_refund" || kind === "toolbelt_reward" || kind === "fulfilment_payout";
  const spends = kind === "shop_purchase" || kind === "funding_deduction";
  if (earns && amountOre < 0) return { ok: false, message: "This kind of entry adds Ore." };
  if (spends && amountOre > 0) return { ok: false, message: "This kind of entry spends Ore." };
  return { ok: true, entry: { amountOre, status, kind, reason } };
}
