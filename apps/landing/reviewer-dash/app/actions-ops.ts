"use server";
// Server actions for the Fulfilment and Settings pages: claim, reassign, pack, ship, deliver, cancel, flag and grant an order, edit
// its fulfilment info, and save a staff member's settings. They check the role and run the ownership rules (lib/fulfillmentAccess.ts:
// nobody fulfils their own order, owners included; only the claimer flags it), then move the order in the in-memory sample store
// (lib/sample/ops.ts), which is empty again after a restart. LOADOUT's stages are New, Claimed, Packed, Shipped, Delivered and
// Cancelled. No message is sent and no Ore or money moves. A handle stands in for an account id.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guardedAction } from "../lib/guard";
import { type AdminAccess } from "../lib/roles";
import { canFlagOrder, isOwnOrder } from "../lib/fulfillmentAccess";
import { isGrantOrder } from "../lib/fulfillmentGrant";
import { isSafeUrl } from "../lib/safeUrl";
import { parseStaffSettings, type StaffSettings } from "../lib/staffSettings";
import { saveStaffSettingsRow } from "../lib/db";
import { opsStore, patchOrder } from "../lib/sample/ops";

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
const costField = (formData: FormData): number | null => {
  const raw = String(formData.get("actualCostUsd") ?? "").trim();
  const value = Number(raw);
  return raw !== "" && Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null;
};
const claimerIs = (access: AdminAccess, claimed: string): boolean => claimed === access.session.slackId;

// Claim a new order for this fulfiller.
export const claimOrder = guardedAction("claimOrder", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || order.status !== "pending") return refresh();
  if (isOwnOrder({ player_slack: order.player_slack }, access.session.slackId, access.isOwner)) {
    throw new Error("Nobody fulfils their own shop order, owners included.");
  }
  patchOrder(id, { status: "claimed", claimed_by: access.session.name, claimed_by_slack: access.session.slackId, claimed_at: stamp() });
  refresh();
  redirect(`/fulfillment?mine=1&order=${id}`);
});

// An owner takes an order over from whoever has it.
export const reassignOrder = guardedAction("reassignOrder", "owner", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || ["pending", "done", "cancelled"].includes(order.status)) return refresh();
  patchOrder(id, { claimed_by: access.session.name, claimed_by_slack: access.session.slackId });
  refresh();
});

// Over budget: nothing gets ordered; the flag parks it for an owner.
export const flagOrderOverBudget = guardedAction("flagOrderOverBudget", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const note = String(formData.get("flagNote") ?? "").trim().slice(0, 300);
  const order = opsStore.orders.get(id);
  if (!order || !note) return;
  if (!canFlagOrder({ claimed_by_slack: order.claimed_by_slack }, access)) throw new Error("Only the fulfiller who claimed this order can flag it.");
  if (!["pending", "claimed", "ordered", "credited"].includes(order.status)) return refresh();
  patchOrder(id, { flagged_at: stamp(), flagged_by: access.session.name, flag_note: note });
  refresh();
});

export const clearOrderFlag = guardedAction("clearOrderFlag", "owner", async (_access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  if (!id) return;
  patchOrder(id, { flagged_at: null, flagged_by: "", flag_note: "" });
  refresh();
});

// Claimed -> packed: the item is sourced and packed. The real cost and where it was bought are recorded.
export const markOrderPacked = guardedAction("markOrderPacked", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  const cost = costField(formData);
  if (!order || cost === null) return refresh();
  if (order.status !== "claimed" || !claimerIs(access, order.claimed_by_slack)) return refresh();
  const sourceUrl = urlField(formData, "sourceUrl");
  patchOrder(id, {
    status: "credited",
    credited_at: stamp(),
    actual_cost_usd: cost,
    ...(sourceUrl ? { item_source_url: sourceUrl } : {}),
  });
  refresh();
});

// Packed -> shipped: the tracking number.
export const shipOrder = guardedAction("shipOrder", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const tracking = String(formData.get("tracking") ?? "").trim().slice(0, 120);
  const order = opsStore.orders.get(id);
  if (!order || !tracking) return refresh();
  if (order.status !== "credited" || !claimerIs(access, order.claimed_by_slack)) return refresh();
  if (isOwnOrder({ player_slack: order.player_slack }, access.session.slackId, access.isOwner)) {
    throw new Error("Nobody fulfils their own shop order, owners included.");
  }
  patchOrder(id, { status: "shipped", shipped_at: stamp(), tracking });
  refresh();
});

// Grants skip the item pipeline: claimed -> delivered in one step, with the grant reference and amount.
export const sendGrant = guardedAction("sendGrant", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  const ref = String(formData.get("grantRef") ?? "").trim().slice(0, 300);
  const cost = costField(formData);
  if (!order || !ref || cost === null) return refresh();
  if (order.status !== "claimed" || !isGrantOrder(order) || !claimerIs(access, order.claimed_by_slack)) return refresh();
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
  refresh();
});

// A fulfiller turns one claimed or new order into the grant flow.
export const convertOrderToGrant = guardedAction("convertOrderToGrant", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || !["pending", "claimed"].includes(order.status)) return refresh();
  if (order.status === "claimed" && !claimerIs(access, order.claimed_by_slack) && !access.isOwner) return refresh();
  patchOrder(id, { is_grant: true });
  refresh();
});

// Owner: shipped -> delivered.
export const markOrderDone = guardedAction("markOrderDone", "owner", async (access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || order.status !== "shipped") return refresh();
  patchOrder(id, { status: "done", done_at: stamp(), fulfilled_at: stamp(), fulfilled_by: access.session.name });
  refresh();
});

// Owner: cancel and refund, any time before it ships. The refund is not made here.
export const cancelOrder = guardedAction("cancelOrder", "owner", async (_access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || ["shipped", "done", "cancelled"].includes(order.status)) return refresh();
  patchOrder(id, { status: "cancelled", note: "Cancelled by an owner. Sample data, so no Ore were refunded." });
  refresh();
});

// Owner: correct the cost, tracking and source of an order at any stage after it was claimed.
export const updateOrderFulfillmentInfo = guardedAction("updateOrderFulfillmentInfo", "owner", async (_access, formData: FormData): Promise<void> => {
  const id = orderId(formData);
  const order = opsStore.orders.get(id);
  if (!order || order.status === "pending" || order.status === "cancelled") return refresh();
  const cost = costField(formData);
  const sourceUrl = urlField(formData, "sourceUrl");
  patchOrder(id, {
    ...(cost !== null ? { actual_cost_usd: cost } : {}),
    tracking: String(formData.get("tracking") ?? "").trim().slice(0, 120),
    ...(sourceUrl ? { item_source_url: sourceUrl } : {}),
  });
  refresh();
});

// Staff settings are kept for this process only, per handle.
export const saveStaffSettings = guardedAction("saveStaffSettings", "staff", async (access, input: StaffSettings): Promise<{ ok: boolean }> => {
  const ok = await saveStaffSettingsRow(access.session.slackId, parseStaffSettings(input));
  return { ok };
});
