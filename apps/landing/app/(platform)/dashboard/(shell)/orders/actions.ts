"use server";

// Server actions for the Orders pages. Each one re-checks the signed-in viewer and the shop-ordering flag; no person id comes from the form.
//   cancelOrderAction   form field: number (the order number, e.g. LO-1101). Cancels the viewer's own order while it is placed.
//   removeSavedAction   form field: itemId. Takes an item off the viewer's wishlist. Removing one that is not saved is fine.
import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/platform/actions";
import { db } from "@/lib/platform/db";
import { cancelOrder } from "@/lib/platform/orders-data";
import { requireViewer } from "@/lib/platform/session";
import { shopOrderingOn } from "@/lib/platform/shop-ordering";
import { unsaveItem } from "@/lib/platform/wishlist-data";

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

export async function cancelOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (!(await shopOrderingOn())) return { status: "error", message: "Orders cannot be changed yet." };
  const number = text(formData.get("number")).toUpperCase();
  if (!/^LO-\d+$/.test(number)) return { status: "error", message: "That order does not exist." };
  const order = await db().shopOrder.findFirst({ where: { number, personId: viewer.id }, select: { id: true } });
  if (!order) return { status: "error", message: "That order does not exist." };
  const result = await cancelOrder(order.id, viewer.id);
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/shop", "layout");
  revalidatePath("/dashboard/ledger");
  return { status: "saved", message: "Order cancelled. Your Ore is back." };
}

export async function removeSavedAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!(await shopOrderingOn())) return;
  const itemId = text(formData.get("itemId"));
  if (itemId === "") return;
  await unsaveItem(viewer.id, itemId);
  revalidatePath("/dashboard/orders");
}
