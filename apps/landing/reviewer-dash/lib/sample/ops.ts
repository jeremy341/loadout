// The operations and fulfilment half of the reviewer site's data adapter (re-exported from ../db.ts). Same names and return shapes as
// Pixl's lib/db.ts for shop orders, buyer details, the public stats page and the staff pages' settings; the rows come from
// ./ops-data.ts. Changes an action makes (a claim, a shipment, a ticket resolved) are kept in the in-memory store below: per
// server process, empty again after a restart. Nothing is saved anywhere, and no service is called.
import type { ShopCategory } from "../shopCategories";
import { foldOrderCounts, STAGE_ALIASES, type OrderCounts } from "../fulfillmentView";
import { ORE_PER_HOUR } from "@/lib/platform/review";
import { AUDITS, PROJECTS, USERS } from "./index";
import { BUYER_COUNTRY, NOW, SEED_ORDERS, isoAgo, seedOperationEntries, seedTickets } from "./ops-data";

// Stored keys are Pixl's. LOADOUT shows New (pending), Claimed, Packed (credited; "ordered" is the same stage and no action sets it any more),
// Shipped and Delivered (done), with Cancelled off to the side. shared.tsx holds the labels.
export type OrderStatus = "pending" | "claimed" | "ordered" | "credited" | "shipped" | "done" | "cancelled";

// The stages in order, for the stepper.
export const ORDER_STAGES: OrderStatus[] = ["pending", "claimed", "credited", "shipped", "done"];

export interface ShopOrderRow {
  id: number;
  user_id: string;
  item_id: number | null;
  item_name: string;
  option: string;
  price: number;
  quantity: number;
  status: OrderStatus;
  note: string;
  buyer_note: string;
  stock_choice: string;
  created_at: string;
  fulfilled_at: string | null;
  fulfilled_by: string;
  claimed_by: string;
  claimed_by_slack: string;
  claimed_at: string | null;
  ordered_at: string | null;
  credited_at: string | null;
  shipped_at: string | null;
  done_at: string | null;
  tracking: string;
  /** For a grant: the reference (a voucher code or a link) of the grant that was sent. Empty until it is. */
  grant_ref: string;
  actual_cost_usd: number | null;
  flagged_at: string | null;
  flagged_by: string;
  flag_note: string;
  player_name: string;
  player_display_name: string;
  player_slack: string | null;
  /** The buyer's country, always safe to show. Filled by listShopOrders/getShopOrder for the country-only list view. */
  buyer_country?: string;
  item_source_url: string | null;
  item_alt_source_url?: string | null;
  item_image_url?: string | null;
  item_category?: ShopCategory | null;
  item_beacon_locked?: boolean | null;
  is_grant?: boolean | null;
}

export interface BuyerDetails {
  name: string;
  email: string;
  phone: string;
  /** Non-empty lines only, in mailing order (line1, line2, city/state/zip, country). */
  addressLines: string[];
}

export interface ShopEconomySummary {
  totalOre: number;
  totalActualCostUsd: number;
  ordersWithCost: number;
}

export interface PublicStats {
  builders: number;
  approvedProjects: number;
  inReview: number;
  totalHours: number;
  /** Ore earned by approved hours across the sample builders (10 per approved hour). */
  oreEarned: number;
  reviews: number;
  shipsSeries: { date: string; total: number; added: number }[];
}

export interface GalleryProject {
  id: number;
  name: string;
  description: string;
  image_url: string;
  demo_url: string;
  approved_hours: number | null;
  owner: string;
}

export interface PixlTicket {
  msg_ts: string;
  description: string;
  title: string;
  status: string;
  opened_by_slack_id: string;
  claimed_by_slack_id: string | null;
  closed_by_slack_id: string | null;
  closed_at: string | null;
  permalink: string | null;
  ticket_number: number | null;
}

export interface PixlThreadMessage {
  ts: string;
  text: string;
  name: string;
  avatar: string | null;
  isFirst: boolean;
  isBot: boolean;
}

export interface OperationEntrySeed {
  id: number;
  projectId: number;
  projectName: string;
  ownerName: string;
  status: "entered" | "shipped" | "eligible" | "ineligible" | "approved" | "needs_changes";
  joinedAt: string;
  firstQualifiedShipAt: string | null;
  eligibleHours: number;
  approvedHours: number;
  paidHours: number;
  upliftPx: number;
  evidenceIncomplete: boolean;
  trialHoldSkipped: boolean;
}

export interface OperationState {
  id: number;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: "upcoming" | "active" | "ended" | "paused";
  rateUsd: number;
  rateMode: "floor" | "additive";
  gracePeriodHours: number;
}

type OpsStore = {
  orders: Map<number, ShopOrderRow>;
  tickets: Map<string, PixlTicket>;
  threads: Map<string, PixlThreadMessage[]>;
  entries: OperationEntrySeed[];
  operation: OperationState | null;
};

// One store per server process, kept on globalThis so a hot reload in development does not drop it halfway through a session.
const KEY = "__loadoutOpsSampleStoreV2";
const root = globalThis as unknown as Record<string, OpsStore | undefined>;

function build(): OpsStore {
  const { tickets, threads } = seedTickets();
  return {
    orders: new Map(SEED_ORDERS().map((row) => [row.id, row])),
    tickets: new Map(tickets.map((ticket) => [ticket.msg_ts, ticket])),
    threads,
    entries: seedOperationEntries(),
    operation: {
      id: 1,
      slug: "operation-blackout",
      name: "Sample operation: double Ore weekend",
      startsAt: isoAgo(24 * 21),
      endsAt: new Date(NOW + 24 * 9 * 3_600_000).toISOString(),
      status: "active",
      rateUsd: 1,
      rateMode: "additive",
      gracePeriodHours: 72,
    },
  };
}

export const opsStore: OpsStore = (root[KEY] ??= build());

const clone = (row: ShopOrderRow): ShopOrderRow => ({ ...row, buyer_country: BUYER_COUNTRY.get(row.user_id) ?? "" });

// A fulfiller may see a buyer's identity only on an order they claimed, or when an owner is viewing. Everyone else gets the
// country, item and status: no legal name, handle, note or contact detail on orders still in the shared queue.
function maySeeBuyer(row: ShopOrderRow, opts: OrderSearchOptions): boolean {
  if (opts.allowPrivateNames) return true;
  const viewer = (opts.viewerSlack ?? "").trim();
  const claimer = (row.claimed_by_slack ?? "").trim();
  return viewer !== "" && claimer !== "" && viewer === claimer;
}

function forViewer(row: ShopOrderRow, opts: OrderSearchOptions): ShopOrderRow {
  const copy = clone(row);
  if (maySeeBuyer(row, opts)) return copy;
  return {
    ...copy,
    player_name: "",
    player_display_name: "",
    player_slack: null,
    buyer_note: "",
    item_source_url: null,
    item_alt_source_url: null,
  };
}

export function patchOrder(id: number, patch: Partial<ShopOrderRow>): ShopOrderRow | null {
  const row = opsStore.orders.get(id);
  if (!row) return null;
  Object.assign(row, patch);
  return row;
}

// ---- Shop orders ----

export interface OrderSearchOptions {
  claimedBySlack?: string;
  stages?: string[];
  viewerSlack?: string;
  allowPrivateNames?: boolean;
  offset?: number;
}

// Shop orders newest first, filtered the way Pixl's SQL does: one status (or "flagged"), the stages of "my queue", a claimer, a search.
export async function listShopOrders(
  status?: string,
  limit = 500,
  opts: OrderSearchOptions & { search?: string } = {},
): Promise<ShopOrderRow[]> {
  let rows = [...opsStore.orders.values()];
  if (status === "flagged") rows = rows.filter((row) => row.flagged_at !== null);
  else if (status) rows = rows.filter((row) => (STAGE_ALIASES[status] ?? [status]).includes(row.status));
  if (opts.stages?.length) rows = rows.filter((row) => opts.stages!.includes(row.status));
  if (opts.claimedBySlack) rows = rows.filter((row) => row.claimed_by_slack === opts.claimedBySlack);
  const q = opts.search?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) => {
      const hay = [row.item_name, row.option, String(row.id)];
      // A fulfiller must not be able to search by a buyer's handle or private note on orders they cannot see.
      if (maySeeBuyer(row, opts)) hay.push(row.player_display_name, row.player_slack ?? "", row.buyer_note ?? "");
      return hay.some((value) => value.toLowerCase().includes(q));
    });
  }
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
  const from = Math.max(0, opts.offset ?? 0);
  return rows.slice(from, from + limit).map((row) => forViewer(row, opts));
}

export async function getShopOrder(id: number, opts: OrderSearchOptions = {}): Promise<ShopOrderRow | null> {
  const row = opsStore.orders.get(id);
  return row ? forViewer(row, opts) : null;
}

const handleOf = (userId: string): string => userId.replace(/^u-/, "");

// Shipping details are invented placeholders: no real name, email, phone or street ever sits behind a handle.
export async function buyerDetailsByUserId(userIds: string[]): Promise<Map<string, BuyerDetails>> {
  const out = new Map<string, BuyerDetails>();
  for (const id of new Set(userIds)) {
    const country = BUYER_COUNTRY.get(id) ?? "";
    out.set(id, {
      name: `Sample recipient (${handleOf(id)})`,
      email: `${handleOf(id)}@example.test`,
      phone: "+00 000 000 0000",
      addressLines: ["Sample address line 1", "Sample address line 2", "00000 Sample town", country].filter((line) => line !== ""),
    });
  }
  return out;
}

export async function buyerCountriesByUserId(userIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const id of new Set(userIds)) out.set(id, BUYER_COUNTRY.get(id) ?? "");
  return out;
}

export async function shopOrderStatusCounts(): Promise<OrderCounts> {
  const tally = new Map<string, { n: number; flagged: number }>();
  for (const row of opsStore.orders.values()) {
    const have = tally.get(row.status) ?? { n: 0, flagged: 0 };
    have.n += 1;
    if (row.flagged_at) have.flagged += 1;
    tally.set(row.status, have);
  }
  return foldOrderCounts([...tally.entries()].map(([status, value]) => ({ status, n: value.n, flagged: value.flagged })));
}

// Orders that reached Packed or later carry a recorded cost: the same cohort on both sides, as Pixl's summary.
export async function shopEconomySummary(): Promise<ShopEconomySummary> {
  const rows = [...opsStore.orders.values()].filter((row) => row.status !== "cancelled" && row.actual_cost_usd !== null);
  return {
    totalOre: rows.reduce((sum, row) => sum + row.price, 0),
    totalActualCostUsd: Math.round(rows.reduce((sum, row) => sum + (row.actual_cost_usd ?? 0), 0) * 100) / 100,
    ordersWithCost: rows.length,
  };
}

// ---- The public stats page ----

export async function publicStats(days = 30): Promise<PublicStats> {
  const approved = PROJECTS.filter((project) => project.status === "approved");
  const inReview = PROJECTS.filter((project) => ["shipped", "fraud_review", "second_review"].includes(project.status));
  const totalHours =
    Math.round(
      approved.reduce((sum, project) => sum + (project.approved_hours ?? project.hackatime_seconds / 3600), 0) * 10,
    ) / 10;
  // One ship per sample project, spread over the window so the chart has a shape.
  const added = new Map<string, number>();
  const start = new Date(NOW);
  start.setUTCHours(0, 0, 0, 0);
  PROJECTS.forEach((project, index) => {
    const day = new Date(start.getTime() - (index % days) * 86_400_000).toISOString().slice(0, 10);
    added.set(day, (added.get(day) ?? 0) + 1 + (index % 3 === 0 ? 1 : 0));
  });
  let total = 0;
  const shipsSeries = Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    const day = added.get(date) ?? 0;
    total += day;
    return { date, total, added: day };
  });
  return {
    builders: USERS().length,
    approvedProjects: approved.length,
    inReview: inReview.length,
    totalHours,
    oreEarned: Math.round(totalHours * ORE_PER_HOUR),
    reviews: AUDITS.length,
    shipsSeries,
  };
}

export async function publicGallery(limit = 12): Promise<GalleryProject[]> {
  return PROJECTS.filter((project) => project.status === "approved")
    .slice(0, limit)
    .map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description ?? "",
      image_url: project.image_url ?? "",
      demo_url: "",
      approved_hours: project.approved_hours,
      owner: handleOf(project.user_id),
    }));
}
