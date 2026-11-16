// A stand-in for Pixl's `sql` tagged template (lib/pgCompat.ts) for the copied Budget modules (lib/budget.ts, lib/budgetPosition.ts).
// There is no database: each query is recognised by its text and answered with Pixl-shaped rows worked out from the sample orders
// and LOADOUT's sample budget figures (lib/reviewer/budget.ts). Anything it does not recognise answers with no rows. Read only.
// Money is Ore where Pixl has pixels (the unit change is for the adjustment pass). Invented figures, nothing is live.
import { builderBalances } from "@/lib/reviewer/budget";
import { REVIEWERS } from "@/lib/platform/review";
import { AUDITS } from "./index";
import { opsStore } from "./ops";
import { NOW } from "./ops-data";

type Row = Record<string, unknown>;

const text = (strings: TemplateStringsArray): string => strings.join("?").replace(/\s+/g, " ");

function shopRows(): Row[] {
  const orders = [...opsStore.orders.values()].filter((order) => order.status !== "cancelled");
  const withCost = orders.filter((order) => order.actual_cost_usd !== null);
  const processed = orders.filter((order) => ["credited", "shipped", "done"].includes(order.status));
  return [{
    spent_cents: String(withCost.reduce((sum, order) => sum + Math.round((order.actual_cost_usd ?? 0) * 100), 0)),
    orders_with_cost: String(withCost.length),
    redeemed_px: String(withCost.reduce((sum, order) => sum + order.price, 0)),
    processed_orders: String(processed.length),
    processed_with_cost: String(processed.filter((order) => order.actual_cost_usd !== null).length),
    missing_cost: String(processed.filter((order) => order.actual_cost_usd === null).length),
  }];
}

function monthRows(): Row[] {
  const months = new Map<string, { cents: number; px: number; orders: number }>();
  for (const order of opsStore.orders.values()) {
    if (order.status === "cancelled" || order.actual_cost_usd === null) continue;
    const key = (order.credited_at ?? order.created_at).slice(0, 7);
    const have = months.get(key) ?? { cents: 0, px: 0, orders: 0 };
    have.cents += Math.round(order.actual_cost_usd * 100);
    have.px += order.price;
    have.orders += 1;
    months.set(key, have);
  }
  return [...months.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([month, value]) => ({ month, spent_cents: String(value.cents), redeemed_px: String(value.px), orders: String(value.orders) }));
}

// Reviewers are paid per review in Pixl. The sample pays a small flat figure so the table has rows; LOADOUT does not pay reviewers in Ore.
const APPROVED_PAY = 5;
const CHANGES_PAY = 3;

function reviewerCounts(): Map<string, { paid: number; px: number }> {
  const counts = new Map<string, { paid: number; px: number }>();
  for (const audit of AUDITS) {
    const id = /\(([^)]+)\)$/.exec(audit.reviewer)?.[1] ?? audit.reviewer;
    const have = counts.get(id) ?? { paid: 0, px: 0 };
    have.paid += 1;
    have.px += audit.verdict === "approved" ? APPROVED_PAY : CHANGES_PAY;
    counts.set(id, have);
  }
  return counts;
}

function answer(query: string): Row[] {
  if (query.includes("spent_cents") && query.includes("FROM shop_orders") && query.includes("processed_orders")) return shopRows();
  if (query.includes("project_px")) {
    const hours = builderBalances().reduce((sum, row) => sum + row.earned, 0);
    return [{ project_px: String(hours), operation_px: "1280", fulfiller_px: "0" }];
  }
  if (query.includes("paid_reviews")) {
    return [...reviewerCounts().entries()].map(([slack, value]) => ({
      slack_id: slack,
      paid_reviews: String(value.paid),
      pending_reviews: String(Math.max(0, 3 - (slack.length % 3))),
      paid_px: String(value.px),
      credited_px: String(Math.round(value.px * 0.8)),
    }));
  }
  if (query.includes("net_px")) return [...reviewerCounts().entries()].map(([slack, value]) => ({ slack_id: slack, net_px: String(Math.round(value.px * 0.9)) }));
  if (query.includes("review_payout_settings")) return [{ approved_pixels: String(APPROVED_PAY), needs_changes_pixels: String(CHANGES_PAY) }];
  if (query.includes("to_char(date_trunc('month'")) return monthRows();
  if (query.includes("wallets_px")) {
    const orders = [...opsStore.orders.values()];
    const sum = (statuses: string[]) => orders.filter((order) => statuses.includes(order.status)).reduce((total, order) => total + order.price, 0);
    const count = (statuses: string[]) => orders.filter((order) => statuses.includes(order.status)).length;
    const names = Object.fromEntries(REVIEWERS.map((reviewer) => [reviewer.id, `${reviewer.id} (${reviewer.id})`]));
    return [{
      read_at: new Date(NOW).toISOString(),
      wallets_px: String(builderBalances().reduce((total, row) => total + row.balance, 0)),
      negative_px: "-120",
      pending_px: String(sum(["pending", "claimed"])),
      ordered_px: String(sum(["ordered"])),
      pending_orders: String(count(["pending", "claimed"])),
      ordered_orders: String(count(["ordered"])),
      fulfilled_px: String(sum(["credited", "shipped", "done"])),
      fulfilled_orders: String(count(["credited", "shipped", "done"])),
      held_px: "300",
      pending_review_px: "90",
      uncredited_review_px: "40",
      drift_px: "0",
      drift_accounts: "0",
      reviewer_names: names,
    }];
  }
  return [];
}

// Used as sql<RowType[]>`...`, like Pixl's.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the copied callers type the rows themselves, as they do with Pixl's sql
export function sql<T = any[]>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
  void values;
  return Promise.resolve(answer(text(strings)) as unknown as T);
}

// ---- The cash ledger (HCB in Pixl) ----

// Invented transactions that reconcile: received minus sent equals the balance, and the memos fall into the report's categories.
export function sampleCashRows(): { id: string; amount_cents: number; memo: string; date: string; pending: boolean; tags: { label: string }[] }[] {
  const day = (ago: number) => new Date(NOW - ago * 86_400_000).toISOString().slice(0, 10);
  return [
    { id: "txn_1", amount_cents: 300_000, memo: "Sample sponsor transfer in", date: day(40), pending: false, tags: [] },
    { id: "txn_2", amount_cents: 150_000, memo: "Sample programme budget transfer in", date: day(30), pending: false, tags: [] },
    { id: "txn_3", amount_cents: -30_000, memo: "Sample platform hosting for the run", date: day(25), pending: false, tags: [{ label: "platform" }] },
    { id: "txn_4", amount_cents: -28_450, memo: "Sample fulfilment purchases", date: day(14), pending: false, tags: [{ label: "fulfilment" }] },
    { id: "txn_5", amount_cents: -9_800, memo: "Grant to a sample builder", date: day(12), pending: false, tags: [] },
    { id: "txn_6", amount_cents: -6_400, memo: "Sample shipping labels", date: day(9), pending: false, tags: [{ label: "fulfilment" }] },
    { id: "txn_7", amount_cents: -12_000, memo: "Transfer to Sample programme budget", date: day(6), pending: true, tags: [] },
    { id: "txn_8", amount_cents: -2_500, memo: "Sample domain renewals", date: day(3), pending: false, tags: [] },
  ];
}
