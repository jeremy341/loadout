"use server";

// Server actions for the Shop item page. Each re-checks the signed-in viewer and the shop-ordering flag on the server.
//   placeOrderAction   form fields: itemId, quantity (1 to 10), requisition ("1" to use a Field Requisition).
//                      Prices come from the catalog and the viewer's approved hours (sampleApprovedHours until real hours exist),
//                      never from the form. On success it redirects to the new order. A refusal comes back as an error message.
//   toggleSaveAction   form field: itemId. Saves the item to the viewer's wishlist, or removes it if it is already saved.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/platform/actions";
import { placeOrder } from "@/lib/platform/orders-data";
import { requisitionOffer, requisitionsAvailable, requisitionsEarned } from "@/lib/platform/requisitions";
import { requireViewer } from "@/lib/platform/session";
import { priceFor, sampleApprovedHours, shopItemById } from "@/lib/platform/shop";
import { shopOrderingOn } from "@/lib/platform/shop-ordering";
import { ORDER_MAX_QUANTITY } from "@/lib/platform/shop-rules";
import { listSaved, saveItem, unsaveItem } from "@/lib/platform/wishlist-data";

const CLOSED: FormState = { status: "error", message: "Ordering opens later." };
const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

export async function placeOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!(await shopOrderingOn())) return CLOSED;

  const item = shopItemById(text(formData.get("itemId")));
  if (!item) return { status: "error", message: "That item is not in the shop." };
  const raw = text(formData.get("quantity"));
  const quantity = /^\d{1,2}$/.test(raw) ? Number(raw) : 0;
  if (quantity < 1 || quantity > ORDER_MAX_QUANTITY) return { status: "error", message: `Quantities are whole numbers from 1 to ${ORDER_MAX_QUANTITY}.` };

  const approved = sampleApprovedHours();
  let useRequisition;
  if (text(formData.get("requisition")) === "1") {
    const offer = requisitionOffer(item, priceFor(item, approved), requisitionsAvailable(requisitionsEarned(approved), []));
    if (offer.eligible && offer.track) useRequisition = offer.track;
  }

  const result = await placeOrder({ personId: viewer.id, lines: [{ itemId: item.id, quantity }], useRequisition, approved });
  if (!result.ok) return { status: "error", message: result.refusal.message };

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/shop", "layout");
  revalidatePath("/dashboard/ledger");
  redirect(`/dashboard/orders/${result.number.toLowerCase()}`);
}

export async function toggleSaveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!(await shopOrderingOn())) return CLOSED;
  const itemId = text(formData.get("itemId"));
  if (!shopItemById(itemId)) return { status: "error", message: "That item is not in the shop." };

  const saved = (await listSaved(viewer.id)).includes(itemId);
  let message: string;
  if (saved) {
    await unsaveItem(viewer.id, itemId);
    message = "Removed from your wishlist.";
  } else {
    const result = await saveItem(viewer.id, itemId);
    if (!result.ok) return { status: "error", message: result.message };
    message = "Saved to your wishlist.";
  }
  revalidatePath("/dashboard/orders");
  return { status: "saved", message };
}
