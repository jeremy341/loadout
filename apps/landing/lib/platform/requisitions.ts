import { LEVEL_REWARDS, levelForHours, TRACKS, type Track } from "./progress";
import { DISCOUNT_CAP_PERCENT, REQUISITION_MIN_ORE, REQUISITION_PERCENT, type ShopItem, type ShopPrice, type TrackHours } from "./shop";

// Field Requisitions. A builder earns one for every coupon level reached in a track (LV.5, 8, 11, 15, 18 and 20), and can
// use it only on an item of that track. Nothing is stored: the earned count is worked out from approved hours, and the used
// count comes from orders, which do not exist yet, so it is zero until the Orders release passes its used list in.
// A General Requisition is only earned through a Flagship, which is not built, so it is not handled here.

export type RequisitionCounts = Record<Track, number>;

// The levels that give a coupon, read from the rewards table so the two cannot drift apart.
export const COUPON_LEVELS: readonly number[] = Object.keys(LEVEL_REWARDS)
  .map(Number)
  .sort((a, b) => a - b);

const none = (): RequisitionCounts => ({ Tools: 0, Systems: 0, Compute: 0, Hardware: 0 });

// Coupon levels reached in each track.
export function requisitionsEarned(approved: TrackHours): RequisitionCounts {
  const earned = none();
  for (const track of TRACKS) {
    const level = levelForHours(approved[track]);
    earned[track] = COUPON_LEVELS.filter((needed) => level >= needed).length;
  }
  return earned;
}

// One requisition that has been spent, named by the track it was spent in. The Orders release will pass the ones its orders used.
export type UsedRequisition = { track: Track };

// Earned minus used, per track, never below zero. `used` may be a list of spent requisitions or a count per track.
export function requisitionsAvailable(earned: RequisitionCounts, used: readonly UsedRequisition[] | Partial<RequisitionCounts> = []): RequisitionCounts {
  const spent = none();
  if (Array.isArray(used)) {
    for (const entry of used as readonly UsedRequisition[]) spent[entry.track] += 1;
  } else {
    for (const track of TRACKS) spent[track] = (used as Partial<RequisitionCounts>)[track] ?? 0;
  }
  const available = none();
  for (const track of TRACKS) available[track] = Math.max(0, earned[track] - spent[track]);
  return available;
}

export type RequisitionReason = "no_requisition_available" | "wrong_track" | "under_minimum" | "general_item" | "ok";

export type RequisitionOffer = {
  eligible: boolean;
  reason: RequisitionReason;
  // How many requisitions the viewer has for this item's tracks.
  available: number;
  // The track a requisition would be spent in: the item's track with the most left.
  track: Track | null;
  percentWith: number;
  priceWith: number;
};

// What a Field Requisition would do on one item. It stacks with the level discount, capped at 40%. When the item is not
// eligible, percentWith and priceWith are the plain level-discount figures.
export function requisitionOffer(item: ShopItem, price: ShopPrice, available: RequisitionCounts): RequisitionOffer {
  let track: Track | null = null;
  let count = 0;
  for (const related of item.tracks) {
    if (available[related] > count) {
      count = available[related];
      track = related;
    }
  }
  const anywhere = TRACKS.some((entry) => available[entry] > 0);
  const reason: RequisitionReason =
    item.tracks.length === 0
      ? "general_item"
      : item.baseOre < REQUISITION_MIN_ORE
        ? "under_minimum"
        : count > 0
          ? "ok"
          : anywhere
            ? "wrong_track"
            : "no_requisition_available";
  const eligible = reason === "ok";
  const percentWith = eligible ? Math.min(DISCOUNT_CAP_PERCENT, price.percent + REQUISITION_PERCENT) : price.percent;
  return { eligible, reason, available: count, track, percentWith, priceWith: Math.round(item.baseOre * (1 - percentWith / 100)) };
}

// The plain-words reason a requisition cannot be used, or null when it can.
export function requisitionReasonText(reason: RequisitionReason): string | null {
  switch (reason) {
    case "ok":
      return null;
    case "general_item":
      return "General items are open to everyone at the full price. Field Requisitions need an item with a track.";
    case "under_minimum":
      return `Requisitions need an item of ${REQUISITION_MIN_ORE} Ore or more.`;
    case "wrong_track":
      return "This item is in another track.";
    case "no_requisition_available":
      return "You have no Field Requisition for this track yet.";
  }
}
