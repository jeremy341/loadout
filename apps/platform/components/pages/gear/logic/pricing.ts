import type { TrackName } from "../../../../lib/sample/builders";
import { DRAFT_RULES, PLAN_RULES, TRACKS, type GeneralTier, type ItemRequirement, type Levels } from "../data";

// Shop pricing. Whole Ore only: every saving is rounded to the nearest whole Ore (plans/proposals/economy-calibration.md
// section 3.2) and the base price is the only input.
//
//   permanent saving = base price x best related track discount        (plans/02 section 26.5, 66)
//   ticket saving    = base price x 20% for a Field Requisition        (plans/02 section 26.8)
//   final price      = base price - permanent saving - ticket saving
//
// The best matching track discount is used, never the sum. The combined saving never passes 40% of the base price.
// A Requisition never unlocks a level requirement. The intermediate discount curve is a Draft preview rule.

export interface PriceableItem {
  id: string;
  name: string;
  basePrice: number;
  tracks: readonly TrackName[];
  requisitionEligible: boolean;
  requires?: ItemRequirement;
}

export interface FieldTicket {
  id: string;
  kind: "field";
  track: TrackName;
  /** The level that earned this ticket: 3, 6, 9, 12 or 15. */
  level: number;
}

export interface GeneralTicket {
  id: string;
  kind: "general";
  tier: GeneralTier;
}

export type Ticket = FieldTicket | GeneralTicket;

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function normalizeLevels(raw: Partial<Record<TrackName, unknown>> | null | undefined): Levels {
  const out = { ...DRAFT_RULES.defaultLevels };
  if (!raw) return out;
  for (const track of TRACKS) {
    const value = raw[track];
    if (typeof value === "number") out[track] = clampInt(value, 0, PLAN_RULES.maxLevel);
  }
  return out;
}

/** Draft preview curve: round(20% x ((level - 1) / 14) ^ 1.2). Level 15 is exactly 20%; levels 0 and 1 are 0%. */
export function trackDiscountPercent(level: number): number {
  const lvl = clampInt(level, 0, PLAN_RULES.maxLevel);
  if (lvl <= 1) return 0;
  const position = (lvl - 1) / (PLAN_RULES.maxLevel - 1);
  return Math.round(PLAN_RULES.maxPermanentPercent * Math.pow(position, DRAFT_RULES.discountCurveExponent));
}

export interface BestDiscount {
  percent: number;
  track: TrackName | null;
}

/** The best related discount, never the sum. An item with no related track gets none. */
export function bestRelatedDiscount(tracks: readonly TrackName[], levels: Levels): BestDiscount {
  let best: BestDiscount = { percent: 0, track: null };
  for (const track of tracks) {
    const percent = trackDiscountPercent(levels[track] ?? 0);
    if (percent > best.percent) best = { percent, track };
  }
  return best;
}

export interface RequirementCheck {
  ok: boolean;
  /** Levels still missing in the closest related track. 0 when the item is unlocked. */
  levelsRemaining: number;
}

export function meetsRequirement(requires: ItemRequirement | undefined, levels: Levels): RequirementCheck {
  if (!requires) return { ok: true, levelsRemaining: 0 };
  const top = Math.max(...requires.tracks.map((track) => levels[track] ?? 0));
  const remaining = Math.max(0, requires.level - top);
  return { ok: remaining === 0, levelsRemaining: remaining };
}

/** Field Requisitions a participant has earned: one per track at each of levels 3, 6, 9, 12 and 15. */
export function fieldTicketsFor(levels: Levels): FieldTicket[] {
  const tickets: FieldTicket[] = [];
  for (const track of TRACKS) {
    for (const level of PLAN_RULES.fieldTicketLevels) {
      if ((levels[track] ?? 0) >= level) tickets.push({ id: `field:${track}:${level}`, kind: "field", track, level });
    }
  }
  return tickets;
}

export function ticketLabel(ticket: Ticket): string {
  return ticket.kind === "field" ? `Field Requisition, ${ticket.track}, level ${ticket.level}` : `General Requisition ${ticket.tier}`;
}

export type TicketCheck = { ok: true } | { ok: false; reason: string };

function refuse(reason: string): TicketCheck {
  return { ok: false, reason };
}

function checkFieldTicket(ticket: FieldTicket, item: PriceableItem): TicketCheck {
  if (item.basePrice < PLAN_RULES.fieldTicketMinBase) {
    return refuse(`A Field Requisition needs an item with a base price of at least ${PLAN_RULES.fieldTicketMinBase} Ore.`);
  }
  if (!item.tracks.includes(ticket.track)) {
    return refuse(`This ticket is for ${ticket.track}. The item relates to ${item.tracks.length ? item.tracks.join(" and ") : "no track"}.`);
  }
  return { ok: true };
}

function checkGeneralTicket(ticket: GeneralTicket, item: PriceableItem): TicketCheck {
  const rule = DRAFT_RULES.generalRequisitions[ticket.tier];
  if (item.basePrice >= rule.minBase) return { ok: true };
  return refuse(`General Requisition ${ticket.tier} needs an item with a base price of at least ${rule.minBase.toLocaleString("en-GB")} Ore.`);
}

/** Whether this ticket may be used on this item at this base price. Does not check whether the ticket is spent. */
export function checkTicket(ticket: Ticket, item: PriceableItem): TicketCheck {
  if (!item.requisitionEligible) return refuse("This item does not accept Requisitions.");
  return ticket.kind === "field" ? checkFieldTicket(ticket, item) : checkGeneralTicket(ticket, item);
}

export interface PriceBreakdown {
  base: number;
  permanentPercent: number;
  permanentTrack: TrackName | null;
  permanentSaving: number;
  ticket: { id: string; label: string; saving: number } | null;
  /** Set when a ticket was supplied but cannot be used. The price then ignores it. */
  ticketRejected: string | null;
  totalSaving: number;
  final: number;
  combinedPercent: number;
}

function percentOf(base: number, percent: number): number {
  return Math.round((base * percent) / 100);
}

/** The saving a valid ticket offers on this base price, before the combined ceiling is applied. */
function rawTicketSaving(ticket: Ticket, base: number): number {
  if (ticket.kind === "field") return percentOf(base, PLAN_RULES.fieldTicketPercent);
  const rule = DRAFT_RULES.generalRequisitions[ticket.tier];
  return Math.min(percentOf(base, rule.percent), rule.maxSaving);
}

type TicketOutcome = Pick<PriceBreakdown, "ticket" | "ticketRejected">;

/** Applies a ticket to an item. The 40% ceiling is the only guardrail: it trims the ticket, never the permanent discount. */
function resolveTicket(ticket: Ticket | null, item: PriceableItem, base: number, room: number): TicketOutcome {
  if (!ticket) return { ticket: null, ticketRejected: null };
  const check = checkTicket(ticket, item);
  if (!check.ok) return { ticket: null, ticketRejected: check.reason };
  const saving = Math.max(0, Math.min(rawTicketSaving(ticket, base), room));
  return { ticket: { id: ticket.id, label: ticketLabel(ticket), saving }, ticketRejected: null };
}

/** Prices one unit of an item for these track levels and an optional Requisition ticket. */
export function priceItem(item: PriceableItem, levels: Levels, ticket: Ticket | null = null): PriceBreakdown {
  const base = Math.max(0, Math.trunc(item.basePrice));
  const best = bestRelatedDiscount(item.tracks, levels);
  const permanentSaving = percentOf(base, best.percent);
  const capSaving = percentOf(base, PLAN_RULES.maxCombinedPercent);

  const { ticket: ticketInfo, ticketRejected } = resolveTicket(ticket, item, base, capSaving - permanentSaving);

  const totalSaving = permanentSaving + (ticketInfo?.saving ?? 0);
  return {
    base,
    permanentPercent: best.percent,
    permanentTrack: best.track,
    permanentSaving,
    ticket: ticketInfo,
    ticketRejected,
    totalSaving,
    final: base - totalSaving,
    combinedPercent: base === 0 ? 0 : Math.round((totalSaving / base) * 100),
  };
}

export interface OrderPrice {
  quantity: number;
  unitFinal: number;
  permanentSavingTotal: number;
  ticketSaving: number;
  total: number;
  saved: number;
  breakdown: PriceBreakdown;
}

/**
 * Prices a quantity. The permanent discount applies to every unit. One Requisition applies to one unit, because the
 * plan allows a maximum of one Requisition per order (plans/02 section 26.8).
 */
export function priceOrder(item: PriceableItem, quantity: number, levels: Levels, ticket: Ticket | null): OrderPrice {
  const qty = Math.max(1, Math.trunc(quantity));
  const breakdown = priceItem(item, levels, ticket);
  const unitPermanent = breakdown.base - breakdown.permanentSaving;
  const ticketSaving = breakdown.ticket?.saving ?? 0;
  const permanentSavingTotal = breakdown.permanentSaving * qty;
  const total = unitPermanent * qty - ticketSaving;
  return {
    quantity: qty,
    unitFinal: unitPermanent,
    permanentSavingTotal,
    ticketSaving,
    total,
    saved: permanentSavingTotal + ticketSaving,
    breakdown,
  };
}

// --- Affordability --------------------------------------------------------------------------------------------

export function canAfford(balance: number, price: number): boolean {
  return balance >= price;
}

export function shortfall(balance: number, price: number): number {
  return Math.max(0, price - balance);
}

/** Share of a price that a balance covers, 0 to 100. */
export function progressPercent(balance: number, price: number): number {
  if (price <= 0) return 100;
  return Math.max(0, Math.min(100, Math.floor((Math.max(0, balance) / price) * 100)));
}
