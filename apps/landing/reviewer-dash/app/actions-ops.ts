"use server";
// Server actions for the fulfilment desk: claim, reassign, flag, pack, ship, send a grant, deliver, cancel and correct the shipment,
// plus a staff member's settings. Each action checks the role (guardedAction), takes the actor from the session (never from the form),
// and runs one transition in lib/platform/orders-data.ts or fulfilment-data.ts. Those functions lock the order row, check the claim
// and the own-order rule, move the status with a compare-and-set, and write the shared audit row in the same transaction.
// Payouts (2 Ore per item shipped, 1 Ore per grant) settle inside shipOrder and grantOrder. Refunds on an owner cancel go through the
// ledger inside cancelOrderAsStaff.
//
// Orders are found by their number ("LO-1101", any case) or row id, in the database. The in-memory sample store is no longer used here.
// Every outcome, accepted or refused, writes one dashboard audit row (lib/audit). A refusal is thrown back to the form with its reason.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guardedAction } from "../lib/guard";
import { type AdminAccess } from "../lib/roles";
import { audit } from "../lib/audit";
import { fulfillmentAuditEntry } from "../lib/fulfillmentAccess";
import { parseCostUsd } from "../lib/amounts";
import { parseStaffSettings, type StaffSettings } from "../lib/staffSettings";
import { saveStaffSettingsRow } from "../lib/db";
import { checkReason } from "@/lib/platform/audit";
import { databaseConfigured } from "@/lib/platform/db";
import * as fulfilment from "@/lib/platform/fulfilment-data";
import * as orders from "@/lib/platform/orders-data";

type Outcome = { ok: true } | { ok: false; code?: string; message: string };

const refresh = (): void => revalidatePath("/", "layout");
const ORDER_REF_MAX = 40;
const orderRef = (formData: FormData): string => String(formData.get("id") ?? "").trim().slice(0, ORDER_REF_MAX);
// Whole cents from the dollar field, or null when it is missing or not a plain amount.
const costCents = (formData: FormData): number | undefined => {
  const usd = parseCostUsd(formData.get("actualCostUsd"));
  return usd === null ? undefined : Math.round(usd * 100);
};
const confirmed = (formData: FormData): boolean => String(formData.get("confirm") ?? "") === "yes";
const expectedStatus = (formData: FormData): string => String(formData.get("expectedStatus") ?? "");
// The dashboard audit row is keyed by the order's public number ("LO-1101" becomes 1101).
const numberOf = (number: string): number => Number(number.replace(/^LO-/i, "")) || 0;

const auditOrder = (action: string, result: "ok" | "denied", access: AdminAccess, id: number, reason?: string): Promise<void> =>
  audit(fulfillmentAuditEntry(action, result, access.session.slackId, id, reason));

// Resolves the order, runs one transition for the signed-in person, and audits the outcome. Returns the order's number as a number.
// A refusal is audited as denied and thrown back to the form. A missing database is refused plainly, never shown as a success.
async function transition(
  action: string,
  access: AdminAccess,
  formData: FormData,
  run: (orderId: string, personId: string) => Promise<Outcome>,
): Promise<number> {
  if (!databaseConfigured()) throw new Error("The orders database is not connected in this environment.");
  const found = await orders.resolveOrderId(orderRef(formData));
  if (!found) {
    await auditOrder(action, "denied", access, 0, "not_found");
    throw new Error("That order does not exist.");
  }
  const id = numberOf(found.number);
  const outcome = await run(found.id, access.session.personId);
  if (!outcome.ok) {
    await auditOrder(action, "denied", access, id, outcome.code ?? "refused");
    throw new Error(outcome.message);
  }
  await auditOrder(action, "ok", access, id);
  refresh();
  return id;
}

// Claim a new order for this fulfiller. One open claim per order, taken under a row lock.
export const claimOrder = guardedAction("claimOrder", "fulfiller", async (access, formData: FormData): Promise<void> => {
  const id = await transition("claim", access, formData, (orderId, personId) => fulfilment.commitOrder(orderId, personId));
  redirect(`/fulfillment?mine=1&order=${id}`);
});

// An owner takes an order over from whoever holds the claim. The owner becomes the claim holder if they are a fulfiller.
export const reassignOrder = guardedAction("reassignOrder", "owner", async (access, formData: FormData): Promise<void> => {
  await transition("reassign", access, formData, (orderId, personId) => fulfilment.reassignCommitment(orderId, personId));
});

// Over budget: the claim holder flags the order. It cannot be packed until an owner clears the flag. The note is the audit reason.
export const flagOrderOverBudget = guardedAction("flagOrderOverBudget", "fulfiller", async (access, formData: FormData): Promise<void> => {
  await transition("flag", access, formData, (orderId, personId) => orders.flagOrder(orderId, personId, formData.get("flagNote")));
});

export const clearOrderFlag = guardedAction("clearOrderFlag", "owner", async (access, formData: FormData): Promise<void> => {
  await transition("flag_clear", access, formData, (orderId, personId) =>
    orders.clearOrderFlag(orderId, personId, "Owner cleared the over-budget flag."),
  );
});

// Claimed -> packed: the claim holder records the real cost (dollars, audited) and where the item was bought.
export const markOrderPacked = guardedAction("markOrderPacked", "fulfiller", async (access, formData: FormData): Promise<void> => {
  await transition("pack", access, formData, (orderId, personId) =>
    orders.packOrder(orderId, personId, { supplier: formData.get("supplier"), costCents: costCents(formData) ?? null }),
  );
});

// Packed -> shipped: the claim holder records the tracking number (required), the carrier and the supplier. Settles the payout.
export const shipOrder = guardedAction("shipOrder", "fulfiller", async (access, formData: FormData): Promise<void> => {
  await transition("ship", access, formData, (orderId, personId) =>
    orders.shipOrder(orderId, personId, {
      trackingNumber: formData.get("tracking"),
      carrier: formData.get("carrier"),
      supplier: formData.get("supplier"),
      costCents: costCents(formData),
    }),
  );
});

// A grant: the claim holder sends it as one step, with the grant reference. Settles the 1 Ore grant payout.
export const sendGrant = guardedAction("sendGrant", "fulfiller", async (access, formData: FormData): Promise<void> => {
  await transition("grant", access, formData, (orderId, personId) =>
    orders.grantOrder(orderId, personId, { grantRef: formData.get("grantRef"), costCents: costCents(formData) }),
  );
});

// There is no separate conversion step: a grant is sent from the order itself (sendGrant). Kept so the desk's import still resolves.
export const convertOrderToGrant = guardedAction("convertOrderToGrant", "fulfiller", async (access): Promise<void> => {
  await auditOrder("grant_convert", "denied", access, 0, "not_supported");
  throw new Error("There is no separate grant step. Send the grant from the order with its grant reference.");
});

// Owner: shipped -> delivered.
export const markOrderDone = guardedAction("markOrderDone", "owner", async (access, formData: FormData): Promise<void> => {
  await transition("deliver", access, formData, (orderId, personId) => orders.advanceOrder(orderId, personId, "delivered"));
});

// Owner: cancel and refund, any time before it ships. Needs the confirm field and the status the form was opened on.
export const cancelOrder = guardedAction("cancelOrder", "owner", async (access, formData: FormData): Promise<void> => {
  await transition("cancel", access, formData, (orderId, personId) => {
    if (!confirmed(formData)) return Promise.resolve<Outcome>({ ok: false, code: "confirm_required", message: "Confirm the cancellation first." });
    return orders.cancelOrderAsStaff(orderId, personId, expectedStatus(formData));
  });
});

// Owner: correct the tracking, carrier, supplier or cost after packing. A blank field is left alone. Same confirm and expected-status
// guards as cancel, so a stale form cannot overwrite a newer tracking number.
export const updateOrderFulfillmentInfo = guardedAction("updateOrderFulfillmentInfo", "owner", async (access, formData: FormData): Promise<void> => {
  await transition("info_update", access, formData, (orderId, personId) => {
    if (!confirmed(formData)) return Promise.resolve<Outcome>({ ok: false, code: "confirm_required", message: "Confirm the change first." });
    const reason = checkReason(formData.get("reason"));
    return orders.updateShipmentInfo(orderId, personId, {
      expectedStatus: expectedStatus(formData),
      trackingNumber: formData.get("tracking"),
      carrier: formData.get("carrier"),
      supplier: formData.get("supplier"),
      costCents: costCents(formData),
      reason: reason.ok ? reason.reason : "Owner corrected the shipment details.",
    });
  });
});

// Staff settings are kept per handle in the staff settings table.
export const saveStaffSettings = guardedAction("saveStaffSettings", "staff", async (access, input: StaffSettings): Promise<{ ok: boolean }> => {
  const ok = await saveStaffSettingsRow(access.session.slackId, parseStaffSettings(input));
  return { ok };
});
