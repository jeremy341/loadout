// Grant orders skip the item pipeline (claim -> packed -> shipped) and use a short one:
// claim -> send grant -> delivered. An order is a grant when its shop item is a grant (the sample
// sets is_grant), or a fulfiller converted that single order with "Convert to grant".
// LOADOUT pays nobody in Ore for fulfilling an order, so there is no payout here.

export interface GrantShaped {
  item_category?: string | null;
  is_grant?: boolean | null;
}

export function isGrantOrder(order: GrantShaped): boolean {
  return order.is_grant === true || order.item_category === "grants";
}

// Grants are claimed and then sent in one step. Orders already moved past "claimed" by the item flow keep the standard controls.
export function usesGrantFlow(order: GrantShaped & { status: string }): boolean {
  return isGrantOrder(order) && (order.status === "pending" || order.status === "claimed" || order.status === "done");
}

// The grant stepper: New -> Claimed -> Grant sent (stored as done, shown as Delivered elsewhere).
export const GRANT_STAGES = ["pending", "claimed", "done"] as const;
export const GRANT_STAGE_LABEL: Record<(typeof GRANT_STAGES)[number], string> = {
  pending: "New",
  claimed: "Claimed",
  done: "Grant sent",
};
export const GRANT_STAGE_HINT: Record<(typeof GRANT_STAGES)[number], string> = {
  pending: "Request received",
  claimed: "Assigned; grant not sent yet",
  done: "The grant was sent to the buyer",
};
