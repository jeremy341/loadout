// Sample data for the operations and fulfilment pages of the reviewer site (orders, tickets, budget, operation entries), as Pixl-shaped rows.
// Built from LOADOUT's own sample data (lib/reviewer/fulfilment.ts, lib/platform/shop.ts, lib/reviewer/budget.ts and the review
// fixtures), so the handles, order numbers and prices match the rest of the site. Prices are in Ore. Everything is invented: no real name, email, address or repository. `slack_id` holds a handle.
// Only types are imported from ./ops, so nothing here runs the db adapter.
import {
  FULFILMENT_ORDERS,
  HELPERS,
  TICKETS,
  itemTotal,
  oreTotal,
  summaryFor,
  linesFor,
  costCents,
  type FulfilmentOrder,
} from "@/lib/reviewer/fulfilment";
import { SHOP_ITEMS } from "@/lib/platform/shop";
import { shopCategoryOf } from "../shopCategories";
import type { ShopOrderRow, OrderStatus, PixlTicket, PixlThreadMessage, OperationEntrySeed } from "./ops";
import { PROJECTS, slackIdFor, userIdFor } from "./index";

const HOUR = 3_600_000;
export const NOW = Date.now();
export const isoAgo = (hoursAgo: number): string => new Date(NOW - hoursAgo * HOUR).toISOString();
const isoAgoOrNull = (hoursAgo: number | undefined): string | null => (hoursAgo === undefined ? null : isoAgo(hoursAgo));

const one = (itemId: string, quantity = 1) => ({ itemId, quantity });

// A few more orders on top of LOADOUT's own, so every stage, a grant, an over-budget flag and a note are all visible with paging.
const EXTRA_ORDERS: readonly FulfilmentOrder[] = [
  { id: "lo-3001", number: "LO-3001", buyer: "nullwisp", country: "United States", status: "new", placedHoursAgo: 2, assignee: null, lines: [one("conference-grant")] },
  { id: "lo-3002", number: "LO-3002", buyer: "quartzfox", country: "Germany", status: "claimed", placedHoursAgo: 40, claimedHoursAgo: 28, assignee: "tamsin", lines: [one("book-grant")] },
  {
    id: "lo-3003", number: "LO-3003", buyer: "tinwren", country: "United Kingdom", status: "delivered", placedHoursAgo: 520, claimedHoursAgo: 500, packedHoursAgo: 470, shippedHoursAgo: 470,
    deliveredHoursAgo: 440, assignee: "tamsin", lines: [one("book-grant")], actualCostUsd: 25,
  },
  {
    id: "lo-3004", number: "LO-3004", buyer: "mothvector", country: "Netherlands", status: "claimed", placedHoursAgo: 80, claimedHoursAgo: 70, assignee: "saltmarsh", lines: [one("monitor")],
    flag: { reason: "Cheapest listing is $212. The Ore are worth about $200.", by: "saltmarsh", hoursAgo: 20 },
  },
  { id: "lo-3005", number: "LO-3005", buyer: "lathelark", country: "Canada", status: "packed", placedHoursAgo: 120, claimedHoursAgo: 100, packedHoursAgo: 90, assignee: "examplepack", lines: [one("macropad-kit")] },
  {
    id: "lo-3006", number: "LO-3006", buyer: "solderbee", country: "United States", status: "packed", placedHoursAgo: 150, claimedHoursAgo: 130, packedHoursAgo: 110, assignee: "deskcrate",
    lines: [one("pico-8"), one("aseprite")], actualCostUsd: 33.5, source: "Sample licence shop",
  },
  {
    id: "lo-3007", number: "LO-3007", buyer: "brasskettle", country: "Netherlands", status: "shipped", placedHoursAgo: 260, claimedHoursAgo: 250, packedHoursAgo: 230, shippedHoursAgo: 200, assignee: "saltmarsh",
    lines: [one("usb-c-dock")], actualCostUsd: 38.1, source: "Sample parts shop", carrier: "Sample Post", tracking: "SP-3007-0001",
  },
  { id: "lo-3008", number: "LO-3008", buyer: "picopilgrim", country: "Canada", status: "new", placedHoursAgo: 11, assignee: null, lines: [one("domain")], buyerNote: "A .dev domain if one is available, please." },
  { id: "lo-3009", number: "LO-3009", buyer: "examplepack", country: "Canada", status: "cancelled", placedHoursAgo: 310, assignee: null, lines: [one("ergonomic-mouse")], note: "Out of stock at every supplier. The Ore were refunded." },
  { id: "lo-3010", number: "LO-3010", buyer: "kestrel42", country: "Germany", status: "new", placedHoursAgo: 6, assignee: null, lines: [one("security-key")] },
];

const ALL_ORDERS: readonly FulfilmentOrder[] = [...FULFILMENT_ORDERS, ...EXTRA_ORDERS];

const itemIndex = (itemId: string): number => SHOP_ITEMS.findIndex((item) => item.id === itemId) + 1;

// An item's category is its kind in the catalogue. A grant is an order for one of the catalogue's grants.
function categoryOf(itemId: string): ShopOrderRow["item_category"] {
  const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId);
  return item ? shopCategoryOf(item.kind) : "other";
}
const isGrantItem = (itemId: string): boolean => itemId.endsWith("-grant");

function statusOf(order: FulfilmentOrder): OrderStatus {
  switch (order.status) {
    case "new": return "pending";
    case "claimed": return "claimed";
    case "packed": return "credited";
    case "shipped": return "shipped";
    case "delivered": return "done";
    default: return "cancelled";
  }
}

const numberOf = (order: FulfilmentOrder): number => Number(order.number.replace(/\D/g, ""));

function toRow(order: FulfilmentOrder): ShopOrderRow {
  const status = statusOf(order);
  const first = order.lines[0];
  const firstItem = SHOP_ITEMS.find((item) => item.id === first?.itemId);
  const claimedBy = order.assignee ?? "";
  const hasCost = costCents(order) !== null && status !== "pending" && status !== "claimed";
  const grant = isGrantItem(first?.itemId ?? "");
  const lines = linesFor(order);
  const single = lines.length === 1;
  const row: ShopOrderRow = {
    id: numberOf(order),
    user_id: userIdFor(order.buyer),
    item_id: itemIndex(first?.itemId ?? "") || null,
    item_name: single ? (firstItem?.name ?? summaryFor(order)) : summaryFor(order),
    option: "",
    price: oreTotal(order),
    quantity: single ? lines[0].quantity : itemTotal(order),
    status,
    note: order.note ?? "",
    buyer_note: order.buyerNote ?? "",
    stock_choice: "",
    created_at: isoAgo(order.placedHoursAgo),
    fulfilled_at: isoAgoOrNull(order.deliveredHoursAgo),
    fulfilled_by: status === "done" ? claimedBy : "",
    claimed_by: claimedBy,
    claimed_by_slack: claimedBy,
    claimed_at: isoAgoOrNull(order.claimedHoursAgo),
    ordered_at: null,
    credited_at: status === "credited" || status === "shipped" || status === "done" ? isoAgoOrNull(order.packedHoursAgo) : null,
    shipped_at: isoAgoOrNull(order.shippedHoursAgo),
    done_at: isoAgoOrNull(order.deliveredHoursAgo),
    tracking: order.tracking ?? "",
    grant_ref: grant && status === "done" ? `GRANT-${numberOf(order)}` : "",
    actual_cost_usd: hasCost ? (costCents(order) ?? 0) / 100 : null,
    flagged_at: order.flag ? isoAgo(order.flag.hoursAgo) : null,
    flagged_by: order.flag?.by ?? "",
    flag_note: order.flag?.reason ?? "",
    player_name: order.buyer,
    player_display_name: order.buyer,
    player_slack: slackIdFor(order.buyer),
    item_source_url: order.source ? `https://parts.invalid/${(order.source ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : null,
    item_alt_source_url: null,
    item_image_url: null,
    item_category: categoryOf(first?.itemId ?? ""),
    item_beacon_locked: false,
    is_grant: grant ? true : null,
  };
  return row;
}

export const SEED_ORDERS = (): ShopOrderRow[] => ALL_ORDERS.map(toRow);

// The buyer's country, by user id, from their orders. The details themselves are placeholders.
export const BUYER_COUNTRY: Map<string, string> = new Map(ALL_ORDERS.map((order) => [userIdFor(order.buyer), order.country]));

// ---- Tickets (support requests) ----

// A message timestamp, the key the tickets API uses: ten digits of seconds, a dot, six digits.
const tsFor = (hoursAgo: number, index: number): string => `${Math.floor((NOW - hoursAgo * HOUR) / 1000)}.${String(100000 + index).padStart(6, "0")}`;

export function seedTickets(): { tickets: PixlTicket[]; threads: Map<string, PixlThreadMessage[]> } {
  const tickets: PixlTicket[] = [];
  const threads = new Map<string, PixlThreadMessage[]>();
  TICKETS.forEach((ticket, index) => {
    const opened = ticket.thread[0]?.hoursAgo ?? 24;
    const msgTs = tsFor(opened, index);
    const closed = ticket.status === "resolved";
    tickets.push({
      msg_ts: msgTs,
      description: ticket.thread[0]?.text ? `${ticket.subject}\n${ticket.thread[0].text}` : ticket.subject,
      title: ticket.subject,
      status: closed ? "closed" : "open",
      opened_by_slack_id: slackIdFor(ticket.builder),
      claimed_by_slack_id: ticket.thread.find((message) => message.from === "staff")?.who ?? null,
      closed_by_slack_id: closed ? (ticket.resolvedBy ?? null) : null,
      closed_at: closed && ticket.resolvedHoursAgo !== undefined ? isoAgo(ticket.resolvedHoursAgo) : null,
      permalink: null,
      ticket_number: 300 + index,
    });
    threads.set(
      msgTs,
      ticket.thread.map((message, position) => ({
        ts: tsFor(message.hoursAgo, index * 10 + position + 1),
        text: message.text,
        name: message.who,
        avatar: null,
        isFirst: position === 0,
        isBot: false,
      })),
    );
  });
  return { tickets, threads };
}

export const SAMPLE_HELPER_IDS: readonly string[] = HELPERS.map((helper) => helper.id);

// ---- Operation entries (a sample campaign over real sample projects) ----

const ENTRY_CYCLE = ["entered", "shipped", "eligible", "needs_changes", "approved", "approved", "ineligible", "shipped"] as const;

export function seedOperationEntries(): OperationEntrySeed[] {
  const projects = PROJECTS.slice(0, 15);
  return projects.map((project, index) => {
    const status = ENTRY_CYCLE[index % ENTRY_CYCLE.length];
    const shipped = status !== "entered";
    const eligibleHours = 4 + ((index * 7) % 23);
    const approved = status === "approved" ? eligibleHours : 0;
    return {
      id: 100 + index,
      projectId: project.id,
      projectName: project.name,
      ownerName: project.user_id.replace(/^u-/, ""),
      status,
      joinedAt: isoAgo(24 * (20 - index) + 5),
      firstQualifiedShipAt: shipped ? isoAgo(24 * (14 - index) + 2) : null,
      eligibleHours,
      approvedHours: approved,
      paidHours: status === "approved" ? approved : 0,
      upliftPx: status === "approved" ? Math.round(approved * 10) : 0,
      evidenceIncomplete: index % 6 === 3,
      trialHoldSkipped: false,
    };
  });
}
