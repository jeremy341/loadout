// Live fulfilment read side. The copied Pixl desk used to read the in-memory sample store while its actions wrote Prisma, so a new
// claim or shipment never appeared in the list. This adapter reads the same ShopOrder rows the actions write and maps them to the
// Pixl-shaped row the desk components expect. Buyer contact details and budget figures remain explicit staging placeholders.
import { databaseConfigured, db } from "@/lib/platform/db";
import { fulfilmentStage, PIXL_STAGE_KEY } from "@/lib/platform/shop-rules";
import { canSeeBuyerDetails } from "./fulfillmentAccess";
import { STAGE_ALIASES } from "./fulfillmentView";
import type { OrderStatus, ShopOrderRow } from "./sample/ops";

type Options = {
  search?: string;
  offset?: number;
  claimedBySlack?: string;
  stages?: readonly string[];
  // Private buyer fields participate in search only for their assigned fulfiller or an owner.
  viewerSlack?: string;
  allowPrivateNames?: boolean;
};

const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);
const eventAt = (events: readonly { status: string; at: Date }[], status: string) =>
  events.find((event) => event.status === status)?.at ?? null;

function numericId(number: string): number {
  const value = Number(number.replace(/^LO-/i, ""));
  return Number.isSafeInteger(value) ? value : 0;
}

function toShopOrderRow(row: {
  id: string;
  number: string;
  status: string;
  totalOre: number;
  region: string | null;
  createdAt: Date;
  trackingNumber: string | null;
  carrier: string | null;
  lines: readonly { option: string; quantity: number; item: { name: string } }[];
  events: readonly { status: string; at: Date; actorId: string | null }[];
  commitments: readonly { fulfiller: { person: { displayName: string; slackId: string | null } } }[];
  person: { id: string; displayName: string; handle: string | null; slackId: string | null };
}): ShopOrderRow {
  const claimed = row.commitments[0]?.fulfiller ?? null;
  const stage = fulfilmentStage(row.status, claimed !== null);
  const pixlKey = stage ? PIXL_STAGE_KEY[stage] : "pending";
  const first = row.lines[0];
  const flag = [...row.events].reverse().find((event) => event.status === "flagged" || event.status === "flag_cleared");
  const flagged = flag?.status === "flagged";
  const grant = row.carrier === "Grant";
  return {
    id: numericId(row.number),
    user_id: row.person.id,
    item_id: null,
    item_name: first?.item.name ?? "Shop order",
    option: first?.option ?? "",
    price: row.totalOre,
    quantity: row.lines.reduce((sum, line) => sum + line.quantity, 0),
    status: pixlKey as OrderStatus,
    note: "",
    buyer_note: "",
    stock_choice: "",
    created_at: row.createdAt.toISOString(),
    fulfilled_at: iso(eventAt(row.events, "delivered")),
    fulfilled_by: "",
    claimed_by: claimed?.person.displayName ?? "",
    claimed_by_slack: claimed?.person.slackId ?? "",
    claimed_at: iso(eventAt(row.events, "claimed")),
    ordered_at: iso(eventAt(row.events, "packed")),
    credited_at: iso(eventAt(row.events, "packed")),
    shipped_at: iso(eventAt(row.events, "shipped")),
    done_at: iso(eventAt(row.events, "delivered")),
    tracking: grant ? "" : (row.trackingNumber ?? ""),
    grant_ref: grant ? (row.trackingNumber ?? "") : "",
    actual_cost_usd: null,
    flagged_at: flagged ? iso(flag?.at) : null,
    flagged_by: "",
    flag_note: "",
    player_name: row.person.displayName,
    player_display_name: row.person.handle ?? row.person.displayName,
    player_slack: row.person.slackId,
    buyer_country: row.region ?? "",
    item_source_url: null,
    item_category: null,
    is_grant: grant,
  };
}

type DbRow = Parameters<typeof toShopOrderRow>[0];

function matchesStatus(row: ShopOrderRow, status?: string): boolean {
  if (!status) return true;
  if (status === "flagged") return row.flagged_at !== null;
  return (STAGE_ALIASES[status] ?? [status]).includes(row.status);
}

function matchesFilters(row: ShopOrderRow, status: string | undefined, opts: Options): boolean {
  if (!matchesStatus(row, status)) return false;
  if (opts.stages?.length && !opts.stages.includes(row.status)) return false;
  return !opts.claimedBySlack || row.claimed_by_slack === opts.claimedBySlack;
}

function matchesSearch(row: ShopOrderRow, needle: string, opts: Options): boolean {
  if (!needle) return true;
  const maySearchBuyer = canSeeBuyerDetails(row, {
    isOwner: opts.allowPrivateNames === true,
    session: { slackId: opts.viewerSlack ?? "" },
  });
  const buyerFields = maySearchBuyer ? [row.player_name, row.player_display_name, row.player_slack ?? ""] : [];
  return [String(row.id), row.item_name, row.option, ...buyerFields].some((field) => field.toLowerCase().includes(needle));
}

function fetchOrderBatch(skip: number, take: number): Promise<DbRow[]> {
  return db().shopOrder.findMany({
    include: {
      lines: { include: { item: { select: { name: true } } } },
      events: { orderBy: { at: "asc" } },
      commitments: { where: { doneAt: null }, include: { fulfiller: { include: { person: { select: { displayName: true, slackId: true } } } } }, take: 1 },
      person: { select: { id: true, displayName: true, handle: true, slackId: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip,
    take,
  }) as Promise<DbRow[]>;
}

// Mirrors the sample signature the desk page calls. Status is a Pixl stage key ("pending", "credited", ...).
export async function listShopOrders(status?: string, limit = 50, opts: Options = {}): Promise<ShopOrderRow[]> {
  if (!databaseConfigured()) return [];
  const pageLimit = Math.max(1, Math.trunc(limit));
  const offset = Math.max(0, Math.trunc(opts.offset ?? 0));
  const targetCount = offset + pageLimit;
  const batchSize = Math.max(200, Math.min(pageLimit, 500));
  const needle = (opts.search ?? "").trim().toLowerCase();
  const matching: ShopOrderRow[] = [];
  let databaseOffset = 0;

  while (matching.length < targetCount) {
    const rows = await fetchOrderBatch(databaseOffset, batchSize);
    databaseOffset += rows.length;
    for (const sourceRow of rows) {
      const row = toShopOrderRow(sourceRow);
      if (matchesFilters(row, status, opts) && matchesSearch(row, needle, opts)) matching.push(row);
      if (matching.length >= targetCount) break;
    }
    if (rows.length < batchSize) break;
  }

  return matching.slice(offset, targetCount);
}
