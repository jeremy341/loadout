import { TRACKS, type Track } from "../platform/progress";
import { ORE_PER_HOUR } from "../platform/shop";
import { USD_PER_TEN_ORE } from "../platform/review";
import { FULFILMENT_ORDERS, oreTotal, type FulfilmentOrder } from "./fulfilment";
import { SAMPLE_NOW } from "./moderation";
import { PLAYERS, approvedTotal, type Player } from "./people";

// The Budget page, after Pixl's migration-free budget report (references/pixl/apps/internal-dashboard/app/budget and lib/budget*.ts):
// cash, rewards still owed, and what remains, all read from tables that already exist, with no accounting writes. LOADOUT has no
// cash ledger, no HCB link and no recorded supplier costs yet, so the cash side is "not set" and the page shows what the sample
// can honestly show: the platform budget the owner decided, the Ore the sample builders hold, and the open orders that have to be
// bought. Pixl's pixel wallets, reviewer payouts and Trial rewards do not exist here, so those lines are left out.
//
// Decided (owner, 25 Oct 2026): the platform costs $300 for the run, and the run is 80 days. 10 Ore = $4.35 (owner, 14 Nov 2026),
// an internal budgeting rate that is never promised to builders as a cash value (plans/02). Everything else is "not set".

export const PLATFORM_BUDGET_CENTS = 30_000;
export const RUN_DAYS = 80;
export const ORE_PER_TEN_CENTS = Math.round(USD_PER_TEN_ORE * 100); // 10 Ore in cents, from the one rate in lib/platform/review.ts

export const BUDGET_SAMPLE_NOTE = "Sample content. The builders, hours and orders behind these figures are invented, and nothing here is live or saved.";

// Whole cents for an amount of Ore at the internal rate.
export function oreCents(ore: number): number {
  return Math.round((Math.max(0, ore) * ORE_PER_TEN_CENTS) / 10);
}

// "$300.00". Dollars with two decimals and a real minus for a negative amount.
export function formatUsd(cents: number): string {
  const whole = Math.abs(Math.round(cents));
  const text = `$${Math.floor(whole / 100).toLocaleString("en-US")}.${String(whole % 100).padStart(2, "0")}`;
  return cents < 0 ? `−${text}` : text;
}

export function formatOre(ore: number): string {
  return `${Math.round(ore).toLocaleString("en-GB")} Ore`;
}

// What the platform costs per day of the run, in cents. 30000 / 80 = 375.
export function platformCentsPerDay(): number {
  return Math.round(PLATFORM_BUDGET_CENTS / RUN_DAYS);
}

// ---- What is still owed ----

export type BuilderBalance = { handle: string; earned: number; spent: number; balance: number };

// Ore earned from approved hours, less what the builder's orders cost at their own level discount. A balance below zero is shown as
// zero and not taken from anyone else's, as Pixl treats negative wallets.
export function builderBalances(players: readonly Player[] = PLAYERS, orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): BuilderBalance[] {
  return players
    .map((player) => {
      const earned = approvedTotal(player) * ORE_PER_HOUR;
      const spent = orders.filter((order) => order.buyer === player.handle && !isCancelled(order)).reduce((sum, order) => sum + oreTotal(order), 0);
      return { handle: player.handle, earned, spent, balance: Math.max(0, earned - spent) };
    })
    .sort((a, b) => b.balance - a.balance || a.handle.localeCompare(b.handle));
}

// A cancelled order never cost anything, whatever else the pipeline holds.
const isCancelled = (order: Pick<FulfilmentOrder, "status">) => (order.status as string) === "cancelled";

// Pixl reserves orders that are pending or ordered and counts the rest as fulfilled (credited, shipped, done). The same cut here:
// an order that is New or Claimed has not had its cost recorded yet, so it stays reserved; Packed, Shipped and Delivered orders
// have, and a Cancelled one is out.
const RESERVED_STATUSES = new Set<string>(["new", "claimed"]);
export function openOrdersToBuy(orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): FulfilmentOrder[] {
  return orders.filter((order) => RESERVED_STATUSES.has(order.status));
}

export type ReserveLine = { id: "balances" | "open-orders"; label: string; note: string; ore: number; cents: number };

export type Reserves = { lines: ReserveLine[]; totalOre: number; totalCents: number };

// The two lines Pixl reserves for builders: what they hold and have not spent, and the cost of orders not yet bought. Packed, shipped
// and delivered orders are not reserved: their cost is recorded and their Ore was spent. Each line is counted once.
export function reserves(players: readonly Player[] = PLAYERS, orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): Reserves {
  const balances = builderBalances(players, orders).reduce((sum, row) => sum + row.balance, 0);
  const open = openOrdersToBuy(orders);
  const openOre = open.reduce((sum, order) => sum + oreTotal(order), 0);
  const lines: ReserveLine[] = [
    { id: "balances", label: "Builders' Ore balances", note: "Ore earned from approved hours and not yet spent. Positive balances only.", ore: balances, cents: oreCents(balances) },
    { id: "open-orders", label: "Orders not yet bought", note: `${open.length} orders that are new or claimed, so their cost is not recorded yet.`, ore: openOre, cents: oreCents(openOre) },
  ];
  return { lines, totalOre: lines.reduce((sum, line) => sum + line.ore, 0), totalCents: lines.reduce((sum, line) => sum + line.cents, 0) };
}

// ---- Orders over time ----

export type MonthRow = { month: string; orders: number; ore: number; cents: number; share: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(hoursAgo: number): { key: number; label: string } {
  const date = new Date(SAMPLE_NOW - hoursAgo * 3_600_000);
  return { key: date.getUTCFullYear() * 12 + date.getUTCMonth(), label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` };
}

// Orders placed in each month of the sample, newest month first, with the Ore they cost and a bar share of the busiest month.
export function ordersByMonth(orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): MonthRow[] {
  const months = new Map<number, { label: string; orders: number; ore: number }>();
  for (const order of orders) {
    if (isCancelled(order)) continue;
    const { key, label } = monthKey(order.placedHoursAgo);
    const row = months.get(key) ?? { label, orders: 0, ore: 0 };
    row.orders += 1;
    row.ore += oreTotal(order);
    months.set(key, row);
  }
  const rows = [...months.entries()].sort((a, b) => b[0] - a[0]).map(([, row]) => row);
  const busiest = Math.max(0, ...rows.map((row) => row.ore));
  return rows.map((row) => ({ month: row.label, orders: row.orders, ore: row.ore, cents: oreCents(row.ore), share: busiest === 0 ? 0 : Math.round((row.ore / busiest) * 100) }));
}

// ---- Ore by track ----

export type TrackHoursRow = { track: Track; hours: number; builders: number };

// Approved hours in each track across the players, and how many of them have hours in it.
export function hoursByTrack(players: readonly Pick<Player, "approved">[] = PLAYERS): TrackHoursRow[] {
  return TRACKS.map((track) => ({ track, hours: players.reduce((sum, player) => sum + player.approved[track], 0), builders: players.filter((player) => player.approved[track] > 0).length }));
}

export type TrackOreRow = { track: Track; builders: number; hours: number; ore: number; cents: number; share: number };

// Ore earned in each track: approved hours at 10 Ore an hour. This is the other half of Pixl's reviewer earnings table, with the
// reviewer payouts left out: builders earn Ore, reviewers are not paid in it.
export function oreByTrack(players: readonly Pick<Player, "approved">[] = PLAYERS): TrackOreRow[] {
  const rows = hoursByTrack(players).map((row) => ({ track: row.track, builders: row.builders, hours: row.hours, ore: row.hours * ORE_PER_HOUR, cents: oreCents(row.hours * ORE_PER_HOUR) }));
  const busiest = Math.max(0, ...rows.map((row) => row.ore));
  return TRACKS.map((track) => {
    const row = rows.find((item) => item.track === track)!;
    return { ...row, share: busiest === 0 ? 0 : Math.round((row.ore / busiest) * 100) };
  });
}

// ---- What is not decided ----

export type Undecided = { label: string; value: string; note: string };

// Shown as "Not set" or "Not connected" on the page, never as a guessed figure.
export const UNDECIDED: readonly Undecided[] = [
  { label: "Funding for rewards and the shop", value: "Not set", note: "No sponsor or cash amount has been decided for the Ore builders spend." },
  { label: "Cash in and out", value: "Not connected", note: "There is no ledger on this site, so no cash balance or remaining estimate can be shown." },
  { label: "Supplier cost per order", value: "Not recorded", note: "An order records what the builder paid in Ore, not what the team paid the supplier." },
  { label: "Event budget", value: "Not set here", note: "Events are costed outside this site, and no event amount is decided here." },
];
