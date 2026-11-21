import { cancelOrder, clearOrderFlag, claimOrder, convertOrderToGrant, flagOrderOverBudget, markOrderPacked, markOrderDone, reassignOrder, sendGrant, shipOrder, updateOrderFulfillmentInfo } from "@/reviewer-dash/app/actions";
import type { ShopOrderRow } from "@/reviewer-dash/lib/db";
import { isGrantOrder } from "@/reviewer-dash/lib/fulfillmentGrant";
import { ActionButton, Details, Field, Input, Muted } from "@/reviewer-dash/app/_ui/ui";
import { usdBudget } from "./shared";

// Corrects the actual cost / tracking / source after the fact. Deliberately
// not gated by `actionable`: a wrong cost or a typo'd tracking number still
// needs fixing once an order is delivered. Owner-only, same as updateOrderFulfillmentInfo.
export function EditFulfillmentInfo({ order: o }: { order: ShopOrderRow }) {
  return (
    <Details summary="Edit cost, tracking or source URL">
      <form action={updateOrderFulfillmentInfo} className="fw-order-action-form">
        <input type="hidden" name="id" value={o.id} />
        <input type="hidden" name="confirm" value="yes" />
        <input type="hidden" name="expectedStatus" value={o.status} />
        <div className="fw-order-action-fields">
          <Field label="Actual cost ($)">
            <Input
              name="actualCostUsd"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={o.actual_cost_usd !== null ? Number(o.actual_cost_usd) : undefined}
            />
          </Field>
          <Field label="Tracking">
            <Input name="tracking" maxLength={120} defaultValue={o.tracking} />
          </Field>
          <Field label="Bought from" hint="Saved onto the item for the next fulfiller">
            <Input
              name="sourceUrl"
              type="url"
              maxLength={500}
              defaultValue={o.item_source_url ?? ""}
              placeholder="https://..."
            />
          </Field>
        </div>
        <div className="fw-order-action-buttons">
          <ActionButton variant="outline" pendingLabel="Saving...">
            Save changes
          </ActionButton>
        </div>
      </form>
    </Details>
  );
}

// Sourcing escalation. A fulfiller who can't buy the item for what the builder's
// Ore are worth flags it here instead of ordering it over budget; an owner
// clears the flag once they've decided what to do about it.
export function FlagControls({ order: o, canManage, budget }: { order: ShopOrderRow; canManage: boolean; budget: string }) {
  if (o.flagged_at) {
    if (!canManage) return null;
    return (
      <form action={clearOrderFlag}>
        <input type="hidden" name="id" value={o.id} />
        <ActionButton variant="outline" size="sm" pendingLabel="Clearing..." icon="checkmark">
          Clear flag
        </ActionButton>
      </form>
    );
  }
  return (
    <Details summary={`Can't source it for $${budget}?`}>
      <form action={flagOrderOverBudget} className="fw-order-flag-form">
        <input type="hidden" name="id" value={o.id} />
        <Field label="What's the cheapest you found, and where?">
          <Input name="flagNote" maxLength={300} minLength={10} required placeholder="Cheapest is $95 at one shop, $88 refurbished at another" />
        </Field>
        <ActionButton variant="danger" pendingLabel="Flagging..." icon="flag">
          Flag over budget
        </ActionButton>
      </form>
    </Details>
  );
}

// Switches one order to the short grant flow. Only offered while nothing has
// been bought yet, for grant-shaped orders on items that aren't grants.
function ConvertToGrant({ order: o }: { order: ShopOrderRow }) {
  return (
    <form action={convertOrderToGrant}>
      <input type="hidden" name="id" value={o.id} />
      <ActionButton
        variant="outline"
        size="sm"
        pendingLabel="Converting..."
        icon="send"
        confirm="Switch this order to the grant flow? It skips the packing and tracking steps: you just send the grant to the builder and record its reference."
      >
        Convert to grant
      </ActionButton>
    </form>
  );
}

export function OrderActions({
  order: o,
  mine,
  ownOrder,
  canManage,
}: {
  order: ShopOrderRow;
  mine: boolean;
  ownOrder: boolean;
  canManage: boolean;
}) {
  // Reassign, cancel/refund and the final "mark delivered" stay owner-only:
  // fulfillers can work a claimed order but not override or refund one. Cancel
  // is offered until the order ships, claimed or not (cancelOrder in
  // actions-ops.ts enforces the same rule server-side).
  const claimed = o.status === "claimed" || o.status === "ordered" || o.status === "credited";
  const cancelForm =
    canManage && (o.status === "pending" || claimed) ? (
      <form action={cancelOrder}>
        <input type="hidden" name="id" value={o.id} />
        <input type="hidden" name="confirm" value="yes" />
        <input type="hidden" name="expectedStatus" value={o.status} />
        <ActionButton
          variant="danger"
          pendingLabel="Refunding..."
          confirm={
            claimed
              ? `${o.claimed_by || "A fulfiller"} already claimed this order${o.status === "credited" ? " and packed it" : ""}. Cancel it anyway and refund ${o.price} Ore to ${o.player_name}?`
              : `Cancel this order and refund ${o.price} Ore to ${o.player_name}?`
          }
        >
          Cancel &amp; refund
        </ActionButton>
      </form>
    ) : null;

  // Shipped: the only thing left is the final close.
  if (o.status === "shipped") {
    if (!canManage) return null;
    return (
      <form action={markOrderDone}>
        <input type="hidden" name="id" value={o.id} />
        <ActionButton variant="success" pendingLabel="Closing..." icon="checkmark">
          Mark delivered
        </ActionButton>
      </form>
    );
  }

  // Claimed by someone else: offer to take it over rather than acting on their queue.
  if (!mine && o.status !== "pending") {
    if (!canManage) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Muted className="w-full text-sm">
          Claimed by <b>{o.claimed_by || "another fulfiller"}</b>
          {o.status === "credited" ? ", already packed" : ""}.
        </Muted>
        <form action={reassignOrder}>
          <input type="hidden" name="id" value={o.id} />
          <ActionButton variant="outline" pendingLabel="Taking over..." icon="member-add">
            Reassign to me
          </ActionButton>
        </form>
        {cancelForm}
      </div>
    );
  }

  if (o.status === "pending") {
    // claimOrder refuses your own order server-side too, owners included.
    if (ownOrder) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Muted className="text-sm">This is your own order, so someone else has to fulfil it.</Muted>
          {cancelForm}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-end gap-2">
        <form action={claimOrder}>
          <input type="hidden" name="id" value={o.id} />
          <ActionButton pendingLabel="Claiming..." icon="member-add">
            {isGrantOrder(o) ? "Claim grant" : "Claim order"}
          </ActionButton>
        </form>
        {!isGrantOrder(o) && <ConvertToGrant order={o} />}
        {cancelForm}
      </div>
    );
  }

  // Grant flow: one form, then the order is delivered. No packing or tracking number.
  if (o.status === "claimed" && isGrantOrder(o)) {
    return (
      <div className="fw-order-action-stack">
        <Muted className="text-sm">
          Send the grant to the builder, then record its reference (a voucher code or a link) here.
        </Muted>
        <form action={sendGrant} className="fw-order-action-form">
          <input type="hidden" name="id" value={o.id} />
          <div className="fw-order-action-fields">
            <Field label="Grant reference" hint="The code or link you sent" className="fw-order-action-field-wide">
              <Input name="grantRef" maxLength={300} required placeholder="GRANT-0000" />
            </Field>
            <Field label="Amount ($)">
              <Input name="actualCostUsd" type="number" min="0" step="0.01" required defaultValue={usdBudget(o.price)} />
            </Field>
          </div>
          <div className="fw-order-action-buttons">
            <ActionButton pendingLabel="Sending..." icon="send">
              Grant sent
            </ActionButton>
          </div>
        </form>
        {cancelForm}
      </div>
    );
  }

  // Claimed -> packed: the item is sourced and packed, with its real cost.
  if (o.status === "claimed") {
    return (
      <div className="fw-order-action-stack">
        <Muted className="text-sm">Assigned to you. Source the item within budget, pack it, then record what it cost.</Muted>
        <form action={markOrderPacked} className="fw-order-action-form">
          <input type="hidden" name="id" value={o.id} />
          <div className="fw-order-action-fields">
            <Field label="Actual cost ($)">
              <Input name="actualCostUsd" type="number" min="0" step="0.01" required placeholder={usdBudget(o.price)} />
            </Field>
            <Field label="Bought from" hint="Optional, saved onto the item" className="fw-order-action-field-wide">
              <Input
                name="sourceUrl"
                type="url"
                maxLength={500}
                defaultValue={o.item_source_url ?? ""}
                placeholder="https://..."
              />
            </Field>
          </div>
          <div className="fw-order-action-buttons">
            <ActionButton pendingLabel="Saving..." icon="checkmark">
              Mark packed
            </ActionButton>
          </div>
        </form>
        <ConvertToGrant order={o} />
        {cancelForm}
      </div>
    );
  }

  // Packed -> shipped: the tracking number.
  return (
    <div className="fw-order-action-stack">
      <form action={shipOrder} className="fw-order-action-form">
        <input type="hidden" name="id" value={o.id} />
        <div className="fw-order-action-fields">
          <Field label="Tracking number" className="fw-order-action-field-wide">
            <Input name="tracking" maxLength={120} required placeholder="1Z..." />
          </Field>
        </div>
        <div className="fw-order-action-buttons">
          <ActionButton pendingLabel="Shipping..." icon="send">
            Mark shipped
          </ActionButton>
        </div>
      </form>
      {cancelForm}
    </div>
  );
}
