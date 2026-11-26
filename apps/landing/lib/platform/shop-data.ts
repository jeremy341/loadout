// The shop catalog from the database. Server only (uses the database). Read only apart from the seed.
//   listShopItems()             -> ShopItemView[]   active items with their stock (units left, all options)
//   shopItemFromDb(id)          -> ShopItemView | null   null for an unknown or inactive item
//   seedShopFromStatic()        -> { items, stockRows }  upserts the static catalog and adds missing stock rows
//
// While no ShopItem rows exist at all, the reads fall back to the static catalog (stock null) so the shop still renders. Ordering
// needs rows: placeOrder refuses an item with no stock row, so nothing can be bought until the seed has run.
// The seed never resets stock or `active` on a re-run; it only fills in rows that are missing.
import type { Prisma } from "../generated/prisma/client";
import { db } from "./db";
import { RETIRED_SHOP_IDS, shopItemById, SHOP_ITEMS, type ShopItem } from "./shop";
import { shopItemFromRow, stockForNewItem } from "./shop-rules";

export type ShopItemView = ShopItem & { stock: number | null };

export async function listShopItems(): Promise<ShopItemView[]> {
  if ((await db().shopItem.count()) === 0) return SHOP_ITEMS.map((item) => ({ ...item, stock: null }));
  const rows = await db().shopItem.findMany({
    where: { active: true },
    include: { stock: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toView);
}

export async function shopItemFromDb(id: string): Promise<ShopItemView | null> {
  if ((await db().shopItem.count()) === 0) {
    const base = shopItemById(id);
    return base ? { ...base, stock: null } : null;
  }
  const row = await db().shopItem.findUnique({ where: { id }, include: { stock: true } });
  return row && row.active ? toView(row) : null;
}

type ItemWithStock = Prisma.ShopItemGetPayload<{ include: { stock: true } }>;

function toView(row: ItemWithStock): ShopItemView {
  const stock = row.stock.reduce((sum, entry) => sum + entry.stock, 0);
  return { ...shopItemFromRow(row, shopItemById(row.id)), stock };
}

// Writes the static catalog into the database. Run from scripts/seed-shop.ts. Catalog fields are overwritten to match the static
// list; stock rows are created only when missing, and `active` is left alone so a staff switch-off survives a re-seed. The one
// exception: rows for retired items are switched off.
export async function seedShopFromStatic(): Promise<{ items: number; stockRows: number }> {
  let stockRows = 0;
  await db().$transaction(
    async (tx) => {
      for (const item of SHOP_ITEMS) {
        const limited = Boolean(item.limited);
        const fields = { name: item.name, kind: item.kind, baseOre: item.baseOre, tracks: [...item.tracks], blurb: item.blurb, limited };
        await tx.shopItem.upsert({ where: { id: item.id }, create: { id: item.id, active: true, ...fields }, update: fields });

        const existing = await tx.shopOptionStock.findUnique({ where: { itemId_option: { itemId: item.id, option: "" } } });
        if (!existing) {
          await tx.shopOptionStock.create({ data: { itemId: item.id, option: "", stock: stockForNewItem(limited) } });
          stockRows += 1;
        }
      }
      await tx.shopItem.updateMany({ where: { id: { in: [...RETIRED_SHOP_IDS] } }, data: { active: false } });
    },
    { timeout: 60_000 },
  );
  return { items: SHOP_ITEMS.length, stockRows };
}
