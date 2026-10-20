"use client";

import { pushNotification } from "../../../lib/notifications";
import { ORE_LEDGER_KEY, SEED_ORE_LEDGER, addOreEntry, oreBalance, type OreEntry } from "../../../lib/ore-ledger";
import { getPreview, setPreview, uid, usePreviewState } from "../../../lib/preview-store";
import { ME, type TrackName } from "../../../lib/sample/builders";
import { COLLECTIBLES, DRAFT_RULES, findCollectible, type GearStats, type GeneralTier, type Levels } from "./data";
import { EMPTY_STATS, applyEarned, claimManual, newlyEarned, togglePin, type EarnedMap } from "./logic/collectibles";
import {
  approveQuote,
  createCustomRequest,
  declineRequest,
  markOrdered,
  quoteItem,
  startReview,
  withdrawRequest,
  type CustomInput,
  type CustomRequest,
} from "./logic/custom-orders";
import { ledgerTotals, SHOP_SOURCE } from "./logic/ledger";
import { advanceOrder, cancelOrder, placeOrder, usedTicketIds, type CancelResult, type Order, type PlaceOrderInput, type PlaceResult } from "./logic/orders";
import type { CalcInputs, Scenario } from "./logic/ore-calc";
import { DEFAULT_INPUTS, deleteScenario, renameScenario, saveScenario } from "./logic/ore-calc";
import { fieldTicketsFor, normalizeLevels, type GeneralTicket, type Ticket } from "./logic/pricing";
import {
  addReferral,
  advanceReferral,
  qualifiedCount,
  referralCode,
  removeReferral,
  removeUsage,
  rewindReferral,
  saveUsage,
  validateAppliedCode,
  type AdvanceResult,
  type InviteResult,
  type Referral,
  type SelfContext,
  type UsageEntry,
  type UsageResult,
} from "./logic/referrals";
import { addWish, isWished, moveWish, removeWish, setWishNote, toggleWish, type WishEntry } from "./logic/wishlist";

// Persistence for the Gear tabs. Everything lives in the browser's localStorage through the shared preview store,
// under keys that start with "gear.". The Ore ledger is shared: spends and refunds go through addOreEntry so the
// balance can never go negative and entries are never edited. Pure rules live in ./logic; this file only reads and
// writes state and raises notifications. Functions with a "Now" suffix are imperative and are called from event
// handlers only (they read the clock).

export const GEAR_KEYS = {
  track: "gear.track",
  levels: "gear.levels",
  wishlist: "gear.wishlist",
  orders: "gear.orders",
  custom: "gear.custom",
  general: "gear.generalTickets",
  collectibles: "gear.collectibles",
  pins: "gear.pins",
  referrals: "gear.referrals",
  referredBy: "gear.referredBy",
  usage: "gear.usage",
  scenarios: "gear.scenarios",
  calc: "gear.calcInputs",
} as const;

export const INITIAL_TRACK: TrackName = ME.track;
export const INITIAL_LEVELS: Levels = DRAFT_RULES.defaultLevels;
export const NO_WISHES: WishEntry[] = [];
export const NO_ORDERS: Order[] = [];
export const NO_CUSTOM: CustomRequest[] = [];
export const NO_GENERAL: GeneralTicket[] = [];
export const NO_EARNED: EarnedMap = {};
export const NO_PINS: string[] = [];
export const NO_REFERRALS: Referral[] = [];
export const NO_USAGE: UsageEntry[] = [];
export const NO_SCENARIOS: Scenario[] = [];
export const NO_CODE: string | null = null;
export const INITIAL_CALC: CalcInputs = DEFAULT_INPUTS;

function now(): string {
  return new Date().toISOString();
}

// --- Reads for event handlers -----------------------------------------------------------------------------------

function readLevels(): Levels {
  return normalizeLevels(getPreview<Levels>(GEAR_KEYS.levels, INITIAL_LEVELS));
}

function readOrders(): Order[] {
  return getPreview<Order[]>(GEAR_KEYS.orders, NO_ORDERS);
}

function readLedger(): OreEntry[] {
  return getPreview<OreEntry[]>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
}

// --- Profile (track and levels) ---------------------------------------------------------------------------------

export function useGearProfile() {
  const [track, setTrack] = usePreviewState<TrackName>(GEAR_KEYS.track, INITIAL_TRACK);
  const [rawLevels, setLevels, hydrated] = usePreviewState<Levels>(GEAR_KEYS.levels, INITIAL_LEVELS);
  const levels = normalizeLevels(rawLevels);
  return {
    track,
    setTrack,
    levels,
    setLevel: (name: TrackName, level: number) => setLevels((prev) => normalizeLevels({ ...prev, [name]: level })),
    hydrated,
  };
}

// --- Requisition tickets ----------------------------------------------------------------------------------------

export function useTickets() {
  const { levels } = useGearProfile();
  const [general, setGeneral] = usePreviewState<GeneralTicket[]>(GEAR_KEYS.general, NO_GENERAL);
  const [orders] = usePreviewState<Order[]>(GEAR_KEYS.orders, NO_ORDERS);
  const used = usedTicketIds(orders);
  const all: Ticket[] = [...fieldTicketsFor(levels), ...general];
  return {
    all,
    available: all.filter((ticket) => !used.has(ticket.id)),
    used,
    general,
    /** Preview tools: nothing awards a General Requisition yet (plans/02 section 26.11 leaves triggers open). */
    grantGeneral: (tier: GeneralTier) => setGeneral((prev) => [...prev, { id: uid(`general:${tier}`), kind: "general", tier }]),
  };
}

// --- Wishlist ---------------------------------------------------------------------------------------------------

export function useWishlist() {
  const [list, setList, hydrated] = usePreviewState<WishEntry[]>(GEAR_KEYS.wishlist, NO_WISHES);
  return {
    list,
    hydrated,
    has: (itemId: string) => isWished(list, itemId),
    /** Returns true when the item is now saved. */
    toggle: (itemId: string): boolean => {
      const result = toggleWish(getPreview(GEAR_KEYS.wishlist, NO_WISHES), itemId, now());
      setList(result.list);
      if (result.saved) syncCollectibles();
      return result.saved;
    },
    add: (itemId: string) => {
      setList((prev) => addWish(prev, itemId, now()));
      syncCollectibles();
    },
    remove: (itemId: string) => setList((prev) => removeWish(prev, itemId)),
    move: (itemId: string, direction: -1 | 1) => setList((prev) => moveWish(prev, itemId, direction)),
    setNote: (itemId: string, note: string) => setList((prev) => setWishNote(prev, itemId, note)),
  };
}

// --- Orders -----------------------------------------------------------------------------------------------------

export function placeOrderNow(input: Omit<PlaceOrderInput, "now" | "levels">): PlaceResult {
  const orders = readOrders();
  const result = placeOrder(
    {
      orders,
      balance: oreBalance(readLedger()),
      spend: (amount, reason) => addOreEntry(-amount, reason, SHOP_SOURCE),
    },
    { ...input, levels: readLevels(), now: now() },
  );
  if (result.ok && !result.duplicate) {
    setPreview(GEAR_KEYS.orders, result.orders);
    pushNotification({
      kind: "order",
      title: `Order ${result.order.number} placed`,
      body: `${result.order.lines[0]?.name ?? "Your order"} for ${result.order.oreSpent.toLocaleString("en-GB")} Ore. Preview order, nothing was sent.`,
      href: "/orders",
    });
    syncCollectibles();
  }
  return result;
}

export function cancelOrderNow(orderId: string): CancelResult {
  const result = cancelOrder(readOrders(), orderId, now(), (amount, reason) => addOreEntry(amount, reason, SHOP_SOURCE));
  if (result.ok) {
    setPreview(GEAR_KEYS.orders, result.orders);
    pushNotification({
      kind: "order",
      title: `Order ${result.order.number} cancelled`,
      body: `${result.order.oreSpent.toLocaleString("en-GB")} Ore was refunded to your ledger.`,
      href: "/orders",
    });
  }
  return result;
}

/** Preview tools: moves an order one step along Placed, Processing, Shipped, Delivered. */
export function advanceOrderNow(orderId: string): Order | null {
  const { orders, order } = advanceOrder(readOrders(), orderId, now());
  if (!order) return null;
  setPreview(GEAR_KEYS.orders, orders);
  if (order.status === "shipped" || order.status === "delivered") {
    pushNotification({
      kind: "order",
      title: `Order ${order.number} ${order.status === "shipped" ? "shipped" : "delivered"} (simulated)`,
      body: "A Preview tools step moved this order. No real shipment exists.",
      href: "/orders",
    });
  }
  syncCollectibles();
  return order;
}

/** Preview tools: adds sample Ore through the shared ledger so the shop can be tried. */
export function addSampleOreNow(amount: number): OreEntry | null {
  return addOreEntry(amount, "Preview tools: sample Ore", "preview");
}

// --- Custom Orders ----------------------------------------------------------------------------------------------

export function createCustomRequestNow(input: CustomInput): ReturnType<typeof createCustomRequest> {
  const result = createCustomRequest(input, uid("cust"), now());
  if (result.ok) {
    setPreview(GEAR_KEYS.custom, [result.request, ...getPreview<CustomRequest[]>(GEAR_KEYS.custom, NO_CUSTOM)]);
    syncCollectibles();
  }
  return result;
}

function writeCustom(next: CustomRequest[]) {
  setPreview(GEAR_KEYS.custom, next);
}

export function startReviewNow(id: string) {
  writeCustom(startReview(getPreview(GEAR_KEYS.custom, NO_CUSTOM), id, now()));
}

export function approveQuoteNow(id: string, quote: string, allowsRequisition: boolean): { ok: true } | { ok: false; error: string } {
  const result = approveQuote(getPreview(GEAR_KEYS.custom, NO_CUSTOM), id, quote, allowsRequisition, now());
  if (!result.ok) return result;
  writeCustom(result.list);
  const request = result.list.find((candidate) => candidate.id === id);
  pushNotification({
    kind: "order",
    title: "Custom Order quote ready (simulated)",
    body: `${request?.item ?? "Your request"}: a Preview tools step set a sample quote. No team reviewed it.`,
    href: "/shop",
  });
  return { ok: true };
}

export function declineRequestNow(id: string) {
  writeCustom(declineRequest(getPreview(GEAR_KEYS.custom, NO_CUSTOM), id, now()));
}

export function withdrawRequestNow(id: string) {
  writeCustom(withdrawRequest(getPreview(GEAR_KEYS.custom, NO_CUSTOM), id, now()));
}

/** Accepts an approved quote: places the order (spending Ore) and links it to the request. */
export function acceptQuoteNow(requestId: string, orderId: string, ticket: Ticket | null): PlaceResult {
  const request = getPreview(GEAR_KEYS.custom, NO_CUSTOM).find((candidate) => candidate.id === requestId);
  const item = request ? quoteItem(request) : null;
  if (!request || !item) {
    return { ok: false, code: "unavailable", message: "That request has no approved quote to accept." };
  }
  const result = placeOrderNow({ orderId, line: { item, quantity: 1, custom: true, customRequestId: requestId }, ticket });
  if (result.ok) writeCustom(markOrdered(getPreview(GEAR_KEYS.custom, NO_CUSTOM), requestId, result.order.id, now()));
  return result;
}

// --- Referrals --------------------------------------------------------------------------------------------------

export function selfContext(): SelfContext {
  return { aliases: [ME.handle, ME.name], code: referralCode(ME.handle) };
}

export function addReferralNow(label: string): InviteResult {
  const list = getPreview<Referral[]>(GEAR_KEYS.referrals, NO_REFERRALS);
  const result = addReferral(list, label, selfContext(), uid("ref"), now());
  if (result.ok) {
    setPreview(GEAR_KEYS.referrals, result.list);
    syncCollectibles();
  }
  return result;
}

export function removeReferralNow(id: string) {
  setPreview(GEAR_KEYS.referrals, removeReferral(getPreview(GEAR_KEYS.referrals, NO_REFERRALS), id));
}

/** Preview tools: completes the referral's next stage. Raises a notification when it qualifies. */
export function advanceReferralNow(id: string): AdvanceResult {
  const result = advanceReferral(getPreview<Referral[]>(GEAR_KEYS.referrals, NO_REFERRALS), id, now());
  if (!result.referral) return result;
  setPreview(GEAR_KEYS.referrals, result.list);
  if (result.qualifiedNow) {
    pushNotification({
      kind: "social",
      title: `Referral qualified: ${result.referral.label}`,
      body: "They earned a first approved ship (simulated). The reward is set by the program and is not granted in this preview.",
      href: "/referrals",
    });
  }
  syncCollectibles();
  return result;
}

export function rewindReferralNow(id: string) {
  setPreview(GEAR_KEYS.referrals, rewindReferral(getPreview(GEAR_KEYS.referrals, NO_REFERRALS), id));
}

export function applyReferralCodeNow(input: string): ReturnType<typeof validateAppliedCode> {
  const result = validateAppliedCode(input, referralCode(ME.handle));
  if (result.ok) setPreview(GEAR_KEYS.referredBy, result.code);
  return result;
}

export function saveUsageNow(input: { project: string; users: string; note: string }): UsageResult {
  const result = saveUsage(getPreview<UsageEntry[]>(GEAR_KEYS.usage, NO_USAGE), input, uid("use"), now());
  if (result.ok) setPreview(GEAR_KEYS.usage, result.list);
  return result;
}

export function removeUsageNow(id: string) {
  setPreview(GEAR_KEYS.usage, removeUsage(getPreview(GEAR_KEYS.usage, NO_USAGE), id));
}

// --- Calculator scenarios ---------------------------------------------------------------------------------------

export function saveScenarioNow(name: string, inputs: CalcInputs): ReturnType<typeof saveScenario> {
  const result = saveScenario(getPreview<Scenario[]>(GEAR_KEYS.scenarios, NO_SCENARIOS), name, inputs, uid("scn"), now());
  if (result.ok) {
    setPreview(GEAR_KEYS.scenarios, result.list);
    syncCollectibles();
  }
  return result;
}

export function renameScenarioNow(id: string, name: string): ReturnType<typeof renameScenario> {
  const result = renameScenario(getPreview<Scenario[]>(GEAR_KEYS.scenarios, NO_SCENARIOS), id, name);
  if (result.ok) setPreview(GEAR_KEYS.scenarios, result.list);
  return result;
}

export function deleteScenarioNow(id: string) {
  setPreview(GEAR_KEYS.scenarios, deleteScenario(getPreview(GEAR_KEYS.scenarios, NO_SCENARIOS), id));
}

// --- Collectibles -----------------------------------------------------------------------------------------------

interface StatInputs {
  orders: readonly Order[];
  wishlist: readonly WishEntry[];
  custom: readonly CustomRequest[];
  scenarios: readonly Scenario[];
  referrals: readonly Referral[];
  levels: Levels;
  ledger: readonly OreEntry[];
}

function buildStats(input: StatInputs): GearStats {
  const orders = input.orders.filter((order) => order.status !== "cancelled");
  return {
    ...EMPTY_STATS,
    ordersPlaced: orders.length,
    ordersDelivered: orders.filter((order) => order.status === "delivered").length,
    wishlistCount: input.wishlist.length,
    oreSpent: ledgerTotals(input.ledger).spent,
    requisitionsUsed: orders.filter((order) => order.ticket !== null).length,
    customRequests: input.custom.length,
    scenariosSaved: input.scenarios.length,
    referralsInvited: input.referrals.length,
    referralsQualified: qualifiedCount(input.referrals),
    maxLevel: Math.max(...Object.values(input.levels)),
  };
}

export function readGearStats(): GearStats {
  return buildStats({
    orders: readOrders(),
    wishlist: getPreview(GEAR_KEYS.wishlist, NO_WISHES),
    custom: getPreview(GEAR_KEYS.custom, NO_CUSTOM),
    scenarios: getPreview(GEAR_KEYS.scenarios, NO_SCENARIOS),
    referrals: getPreview(GEAR_KEYS.referrals, NO_REFERRALS),
    levels: readLevels(),
    ledger: readLedger(),
  });
}

/** The same numbers as readGearStats, for rendering. */
export function useGearStats(): GearStats {
  const [orders] = usePreviewState<Order[]>(GEAR_KEYS.orders, NO_ORDERS);
  const [wishlist] = usePreviewState<WishEntry[]>(GEAR_KEYS.wishlist, NO_WISHES);
  const [custom] = usePreviewState<CustomRequest[]>(GEAR_KEYS.custom, NO_CUSTOM);
  const [scenarios] = usePreviewState<Scenario[]>(GEAR_KEYS.scenarios, NO_SCENARIOS);
  const [referrals] = usePreviewState<Referral[]>(GEAR_KEYS.referrals, NO_REFERRALS);
  const { levels } = useGearProfile();
  const [ledger] = usePreviewState<OreEntry[]>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
  return buildStats({ orders, wishlist, custom, scenarios, referrals, levels, ledger });
}

export function useCollectibleState() {
  const [earned] = usePreviewState<EarnedMap>(GEAR_KEYS.collectibles, NO_EARNED);
  const [pins] = usePreviewState<string[]>(GEAR_KEYS.pins, NO_PINS);
  return { earned, pins };
}

/** Awards every collectible whose condition now holds, once, and tells the participant. Safe to call often. */
export function syncCollectibles(): string[] {
  const earned = getPreview<EarnedMap>(GEAR_KEYS.collectibles, NO_EARNED);
  const fresh = newlyEarned(COLLECTIBLES, readGearStats(), earned);
  if (fresh.length === 0) return [];
  setPreview(GEAR_KEYS.collectibles, applyEarned(earned, fresh.map((c) => c.id), now()));
  for (const collectible of fresh) {
    pushNotification({ kind: "mission", title: `Collectible earned: ${collectible.name}`, body: collectible.blurb, href: "/collectibles" });
  }
  return fresh.map((c) => c.id);
}

export function claimCollectibleNow(id: string): { ok: true } | { ok: false; error: string } {
  const collectible = findCollectible(id);
  if (!collectible) return { ok: false, error: "That collectible does not exist." };
  const result = claimManual(collectible, getPreview<EarnedMap>(GEAR_KEYS.collectibles, NO_EARNED), now());
  if (!result.ok) return result;
  setPreview(GEAR_KEYS.collectibles, result.earned);
  pushNotification({ kind: "mission", title: `Collectible claimed: ${collectible.name}`, body: `${collectible.blurb} (Claimed with the preview button.)`, href: "/collectibles" });
  return { ok: true };
}

export function togglePinNow(id: string): ReturnType<typeof togglePin> {
  const result = togglePin(getPreview<string[]>(GEAR_KEYS.pins, NO_PINS), id, getPreview<EarnedMap>(GEAR_KEYS.collectibles, NO_EARNED));
  if (result.ok) setPreview(GEAR_KEYS.pins, result.pins);
  return result;
}
