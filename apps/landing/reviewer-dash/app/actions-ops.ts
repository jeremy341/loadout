"use server";
// Server actions for the Fulfilment and Settings pages: claim, reassign, pack, ship, deliver, cancel, flag and grant an order, edit
// its fulfilment info, and save a staff member's settings. They check the role and run the ownership rules (lib/fulfillmentAccess.ts:
// nobody fulfils their own order, owners included; only the claimer flags it), then move the order in the in-memory sample store
// (lib/sample/ops.ts), which is empty again after a restart. LOADOUT's stages are New, Claimed, Packed, Shipped, Delivered and
// Cancelled. No message is sent and no Ore or money moves. A handle stands in for an account id.
//
// Every change and every refusal writes one dashboard audit row, and every accepted transition also writes one row to the
// shared audit_event table through the same recordAudit helper the fulfilment DB module uses. That row carries the server-derived
// actor, the order id, the status before and after, and a written reason (at least 10 characters when staff supply one).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guardedAction } from "../lib/guard";
import { type AdminAccess } from "../lib/roles";
import { audit } from "../lib/audit";
import { canFlagOrder, canPackOrder, canReassignOrder, fulfillmentAuditEntry, isOwnOrder } from "../lib/fulfillmentAccess";
import { canSendGrant } from "../lib/fulfillmentGrant";
import { isSafeUrl } from "../lib/safeUrl";
import { parseCostUsd } from "../lib/amounts";
import { parseStaffSettings, type StaffSettings } from "../lib/staffSettings";
import { saveStaffSettingsRow } from "../lib/db";
import { opsStore, patchOrder, type ShopOrderRow } from "../lib/sample/ops";
import { checkReason, recordAudit } from "@/lib/platform/audit";
import { databaseConfigured, db } from "@/lib/platform/db";

const refresh = (): void => revalidatePath("/", "layout");
const stamp = (): string => new Date().toISOString();
const orderId = (formData: FormData): number => {
  const id = Number(formData.get("id") ?? 0);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
};
const urlField = (formData: FormData, name: string): string => {
  const value = String(formData.get(name) ?? "").trim().slice(0, 300);
  return value && isSafeUrl(value) ? value : "";
};
// A dollar cost must be a plain, finite number within the recorded-cost maximum. parseCostUsd rejects NaN, Infinity,
// huge values and hex/decimal tricks before the value reaches the sample store.
const costField = (formData: FormData): number | null => parseCostUsd(formData.get("actualCostUsd"));
const claimerIs = (access: AdminAccess, claimed: string): boolean => claimed === access.session.slackId;
const OWN_ORDER = "Nobody fulfils their own shop order, owners included.";

// `slackId` (and so the audit actor) comes from the access object guardedAction derived from
// the session. FormData is never asked for an actor: a caller cannot attribute an action to
// someone else. `reason` is a short code, never buyer PII or a form value.
const auditOrder = (
  action: string,
  result: "ok" | "denied",
  access: AdminAccess,
  id: number,
  reason?: string,
): Promise<void> =>
  audit(fulfillmentAuditEntry(action, result, access.session.slackId, id, reason));

// The shared audit_event row. Before and after are complete status snapshots, the target is the order id,
// and the reason is either staff's checked note or a fixed sentence of at least 10 characters.
const recordStateAudit = async (
  action: string,
  access: AdminAccess,
  id: number,
  before: string,
  after: string,
  reason: string,
): Promise<void> => {
  if (!databaseConfigured()) return;
  try {
    await recordAudit(db(), {
      actorId: access.session.slackId,
      action: `fulfillment.${action}`,
      targetType: "ShopOrder",
      targetId: String(id),
      reason,
      before: { status: before },
      after: { status: after },
    });
  } catch (error) {
    // Auditing must never turn a completed state change into a failed request.
    console.error("[fulfillment] audit insert failed", action, (error as Error).message);
  }
};

// A written reason from the form is only used after the same check the other DB-backed staff writes use.
const staffReason = (raw: unknown, fallback: string): string => {
  const checked = checkReason(raw);
  return checked.ok ? checked.reason : fallback;
};

// Every transition re-checks the own-order rule, owners included. A short helper keeps that consistent and lets each
// action record the same denial reason without duplicating the session/buyer comparison.
function ownOrder(access: AdminAccess, order: ShopOrderRow): boolean {
  return isOwnOrder({ player_slack: order.player_slack }, access.session.slackId, access.isOwner);
}

// Claim a new order for this fulfiller.
export const claimOrder = guardedAction("claimOrder", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || order.status !== "pending") {
    await auditOrder("claim", "denied", access, id, order ? "wrong_status" : "not_found");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("claim", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  patchOrder(id, { status: "claimed", claimed_by: access.session.name, claimed_by_slack: access.session.slackId, claimed_at: stamp() });
  await auditOrder("claim", "ok", access, id);
  await recordStateAudit("claim", access, id, "pending", "claimed", "Fulfiller claimed the order.");
  refresh();
  redirect(`/fulfillment?mine=1&order=${id}`);
});

// An owner takes an order over from whoever has it. Own orders stay forbidden: taking over
// their own order would let the owner pack and deliver it themselves.
export const reassignOrder = guardedAction("reassignOrder", "owner", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || ["pending", "done", "cancelled"].includes(order.status)) {
    await auditOrder("reassign", "denied", access, id, order ? "wrong_status" : "not_found");
    return refresh();
  }
  if (ownOrder(access, order) || !canReassignOrder(order, access)) {
    await auditOrder("reassign", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  patchOrder(id, { claimed_by: access.session.name, claimed_by_slack: access.session.slackId });
  await auditOrder("reassign", "ok", access, id);
  await recordStateAudit("reassign", access, id, order.status, order.status, "Owner took over the order claim.");
  refresh();
});

// Over budget: nothing gets ordered; the flag parks it for an owner.
export const flagOrderOverBudget = guardedAction("flagOrderOverBudget", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const note = checkReason(formData.get("flagNote"));
  const order = opsStore.orders.get(id);
  if (!order || !note.ok) {
    await auditOrder("flag", "denied", access, id, note.ok ? "not_found" : "note_required");
    return;
  }
  if (ownOrder(access, order)) {
    await auditOrder("flag", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  if (!canFlagOrder({ claimed_by_slack: order.claimed_by_slack }, access)) {
    await auditOrder("flag", "denied", access, id, "not_claimer");
    throw new Error("Only the fulfiller who claimed this order can flag it.");
  }
  if (!["pending", "claimed", "ordered", "credited"].includes(order.status)) {
    await auditOrder("flag", "denied", access, id, "wrong_status");
    return refresh();
  }
  patchOrder(id, { flagged_at: stamp(), flagged_by: access.session.name, flag_note: note.reason });
  await auditOrder("flag", "ok", access, id);
  await recordStateAudit("flag", access, id, order.status, order.status, note.reason);
  refresh();
});

export const clearOrderFlag = guardedAction("clearOrderFlag", "owner", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order) {
    await auditOrder("flag_clear", "denied", access, id, "not_found");
    return;
  }
  if (ownOrder(access, order)) {
    await auditOrder("flag_clear", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  patchOrder(id, { flagged_at: null, flagged_by: "", flag_note: "" });
  await auditOrder("flag_clear", "ok", access, id);
  await recordStateAudit("flag_clear", access, id, order.status, order.status, "Owner cleared the over-budget flag.");
  refresh();
});

// Claimed -> packed: the item is sourced and packed. The real cost and where it was bought are recorded.
export const markOrderPacked = guardedAction("markOrderPacked", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  const cost = costField(formData);
  if (!order || cost === null) {
    await auditOrder("pack", "denied", access, id, cost === null ? "cost_required" : "not_found");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("pack", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  if (!canPackOrder(order, access)) {
    await auditOrder("pack", "denied", access, id, claimerIs(access, order.claimed_by_slack) ? "wrong_status" : "not_claimer");
    return refresh();
  }
  const sourceUrl = urlField(formData, "sourceUrl");
  patchOrder(id, {
    status: "credited",
    credited_at: stamp(),
    actual_cost_usd: cost,
    ...(sourceUrl ? { item_source_url: sourceUrl } : {}),
  });
  await auditOrder("pack", "ok", access, id);
  await recordStateAudit("pack", access, id, order.status, "credited", "Fulfiller packed and costed the order.");
  refresh();
});

// Packed -> shipped: the tracking number.
export const shipOrder = guardedAction("shipOrder", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const tracking = String(formData.get("tracking") ?? "").trim().slice(0, 120);
  const order = opsStore.orders.get(id);
  if (!order || !tracking) {
    await auditOrder("ship", "denied", access, id, tracking ? "not_found" : "tracking_required");
    return refresh();
  }
  if (order.status !== "credited" || !claimerIs(access, order.claimed_by_slack)) {
    await auditOrder("ship", "denied", access, id, claimerIs(access, order.claimed_by_slack) ? "wrong_status" : "not_claimer");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("ship", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  patchOrder(id, { status: "shipped", shipped_at: stamp(), tracking });
  await auditOrder("ship", "ok", access, id);
  await recordStateAudit("ship", access, id, order.status, "shipped", "Fulfiller recorded tracking and shipped the order.");
  refresh();
});

// Grants skip the item pipeline: claimed -> delivered in one step, with the grant reference and amount.
export const sendGrant = guardedAction("sendGrant", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  const ref = String(formData.get("grantRef") ?? "").trim().slice(0, 300);
  const cost = costField(formData);
  if (!order || !ref || cost === null) {
    await auditOrder("grant", "denied", access, id, !order ? "not_found" : !ref ? "ref_required" : "cost_required");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("grant", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  if (!canSendGrant(order, access)) {
    await auditOrder("grant", "denied", access, id, "not_claimable_grant");
    return refresh();
  }
  patchOrder(id, {
    status: "done",
    grant_ref: ref,
    actual_cost_usd: cost,
    credited_at: stamp(),
    shipped_at: stamp(),
    done_at: stamp(),
    fulfilled_at: stamp(),
    fulfilled_by: access.session.name,
  });
  await auditOrder("grant", "ok", access, id);
  await recordStateAudit("grant", access, id, order.status, "done", "Fulfiller sent the grant to the builder.");
  refresh();
});

// A fulfiller turns one claimed or new order into the grant flow.
export const convertOrderToGrant = guardedAction("convertOrderToGrant", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || !["pending", "claimed"].includes(order.status)) {
    await auditOrder("grant_convert", "denied", access, id, order ? "wrong_status" : "not_found");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("grant_convert", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  if (order.status === "claimed" && !claimerIs(access, order.claimed_by_slack) && !access.isOwner) {
    await auditOrder("grant_convert", "denied", access, id, "not_claimer");
    return refresh();
  }
  patchOrder(id, { is_grant: true });
  await auditOrder("grant_convert", "ok", access, id);
  await recordStateAudit("grant_convert", access, id, order.status, order.status, "Order converted to the grant flow.");
  refresh();
});

// Owner: shipped -> delivered.
export const markOrderDone = guardedAction("markOrderDone", "owner", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || order.status !== "shipped") {
    await auditOrder("deliver", "denied", access, id, order ? "wrong_status" : "not_found");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("deliver", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  patchOrder(id, { status: "done", done_at: stamp(), fulfilled_at: stamp(), fulfilled_by: access.session.name });
  await auditOrder("deliver", "ok", access, id);
  await recordStateAudit("deliver", access, id, "shipped", "done", "Owner marked the order delivered.");
  refresh();
});

// Owner: cancel and refund, any time before it ships. The refund is not made here. A client-side dialog is not a guard:
// both an explicit confirm field and the status the form was rendered for must match the current row.
export const cancelOrder = guardedAction("cancelOrder", "owner", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  const confirm = String(formData.get("confirm") ?? "") === "yes";
  const expected = String(formData.get("expectedStatus") ?? "");
  if (!order || ["shipped", "done", "cancelled"].includes(order.status)) {
    await auditOrder("cancel", "denied", access, id, order ? "wrong_status" : "not_found");
    return refresh();
  }
  if (!confirm) {
    await auditOrder("cancel", "denied", access, id, "confirm_required");
    return refresh();
  }
  if (!expected || expected !== order.status) {
    await auditOrder("cancel", "denied", access, id, "status_changed");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("cancel", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  patchOrder(id, { status: "cancelled", note: "Cancelled by an owner. Sample data, so no Ore were refunded." });
  await auditOrder("cancel", "ok", access, id);
  await recordStateAudit("cancel", access, id, expected, "cancelled", "Owner cancelled the order and refunded the Ore.");
  refresh();
});

// Owner: correct the cost, tracking and source of an order at any stage after it was claimed. Same confirm and
// expected-status guards as cancel, so a stale form cannot overwrite a newer tracking number.
export const updateOrderFulfillmentInfo = guardedAction("updateOrderFulfillmentInfo", "owner", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  const confirm = String(formData.get("confirm") ?? "") === "yes";
  const expected = String(formData.get("expectedStatus") ?? "");
  if (!order || order.status === "pending" || order.status === "cancelled") {
    await auditOrder("info_update", "denied", access, id, order ? "wrong_status" : "not_found");
    return refresh();
  }
  if (!confirm) {
    await auditOrder("info_update", "denied", access, id, "confirm_required");
    return refresh();
  }
  if (!expected || expected !== order.status) {
    await auditOrder("info_update", "denied", access, id, "status_changed");
    return refresh();
  }
  if (ownOrder(access, order)) {
    await auditOrder("info_update", "denied", access, id, "own_order");
    throw new Error(OWN_ORDER);
  }
  const cost = costField(formData);
  const sourceUrl = urlField(formData, "sourceUrl");
  const trackingField = formData.get("tracking");
  patchOrder(id, {
    ...(cost !== null ? { actual_cost_usd: cost } : {}),
    // An omitted tracking field means "leave it alone", not "clear it".
    ...(typeof trackingField === "string" ? { tracking: trackingField.trim().slice(0, 120) } : {}),
    ...(sourceUrl ? { item_source_url: sourceUrl } : {}),
  });
  await auditOrder("info_update", "ok", access, id);
  await recordStateAudit("info_update", access, id, expected, order.status, staffReason(formData.get("reason"), "Owner corrected the order cost or tracking."));
  refresh();
});

// Staff settings are kept for this process only, per handle.
export const saveStaffSettings = guardedAction("saveStaffSettings", "staff", async (access, input: StaffSettings): Promise<{ ok: boolean }> => {
  const ok = await saveStaffSettingsRow(access.session.slackId, parseStaffSettings(input));
  return { ok };
});
