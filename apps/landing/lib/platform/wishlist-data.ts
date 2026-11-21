// A builder's wishlist (ShopSave rows). Server only (uses the database). A save reserves nothing and locks no price.
//   saveItem(personId, itemId)   -> Result; the item must be an active shop row; at most WISHLIST_MAX items
//   unsaveItem(personId, itemId) -> void; removing an item that is not saved is not an error
//   listSaved(personId)          -> string[] catalog ids, in the order they were saved (same shape as WISHLIST_IDS in orders.ts)
// The caller must pass the signed-in person's own id; nothing here checks the session.
import { db } from "./db";
import { isActivePerson } from "./orders-data";
import { canSave } from "./shop-rules";

export type SaveResult = { ok: true } | { ok: false; message: string };

export async function saveItem(personId: string, itemId: string): Promise<SaveResult> {
  if (!(await isActivePerson(personId))) return { ok: false, message: "This account cannot save items right now." };

  const already = await db().shopSave.findUnique({ where: { personId_itemId: { personId, itemId } }, select: { itemId: true } });
  const count = already ? 0 : await db().shopSave.count({ where: { personId } });
  const verdict = canSave(count, Boolean(already));
  if (!verdict.ok) return verdict;

  const item = await db().shopItem.findFirst({ where: { id: itemId, active: true }, select: { id: true } });
  if (!item) return { ok: false, message: "That item is not in the shop." };

  await db().shopSave.upsert({
    where: { personId_itemId: { personId, itemId } },
    create: { personId, itemId },
    update: {},
  });
  return { ok: true };
}

export async function unsaveItem(personId: string, itemId: string): Promise<void> {
  await db().shopSave.deleteMany({ where: { personId, itemId } });
}

export async function listSaved(personId: string): Promise<string[]> {
  if (!(await isActivePerson(personId))) return [];
  const rows = await db().shopSave.findMany({
    where: { personId },
    orderBy: [{ createdAt: "asc" }, { itemId: "asc" }],
    select: { itemId: true },
  });
  return rows.map((row) => row.itemId);
}
