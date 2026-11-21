import { describe, expect, test } from "bun:test";
import { getShopOrder, listShopOrders, opsStore, type ShopOrderRow } from "./ops";
import { BUYER_COUNTRY } from "./ops-data";

function seed(): ShopOrderRow {
  const row: ShopOrderRow = {
    id: 9_900_001,
    user_id: "u-privacytest",
    item_id: 1,
    item_name: "Privacy Test Item",
    option: "",
    price: 100,
    quantity: 1,
    status: "pending",
    note: "",
    buyer_note: "private-buyer-note",
    stock_choice: "",
    created_at: "2026-11-20T10:00:00.000Z",
    fulfilled_at: null,
    fulfilled_by: "",
    claimed_by: "",
    claimed_by_slack: "",
    claimed_at: null,
    ordered_at: null,
    credited_at: null,
    shipped_at: null,
    done_at: null,
    tracking: "",
    grant_ref: "",
    actual_cost_usd: null,
    flagged_at: null,
    flagged_by: "",
    flag_note: "",
    player_name: "Private Buyer",
    player_display_name: "buyerhandle",
    player_slack: "private-slack-handle",
    item_source_url: "https://supplier.example/item",
    item_alt_source_url: null,
    item_image_url: null,
  };
  opsStore.orders.set(row.id, row);
  BUYER_COUNTRY.set(row.user_id, "Testland");
  return row;
}

function cleanup(row: ShopOrderRow): void {
  opsStore.orders.delete(row.id);
  BUYER_COUNTRY.delete(row.user_id);
}

const view = (viewerSlack: string, allowPrivateNames = false) => ({ viewerSlack, allowPrivateNames });

describe("listShopOrders buyer privacy", () => {
  test("a fulfiller browsing the shared queue sees only the country, item and status", async () => {
    const row = seed();
    try {
      const [found] = await listShopOrders(undefined, 10, { ...view("other-fulfiller"), search: "Privacy Test Item" });
      expect(found).toBeDefined();
      expect(found.player_name).toBe("");
      expect(found.player_slack).toBeNull();
      expect(found.buyer_note).toBe("");
      expect(found.item_source_url).toBeNull();
      expect(found.buyer_country).toBeTruthy();
    } finally {
      cleanup(row);
    }
  });

  test("the claimer and an owner still see the buyer fields", async () => {
    const row = seed();
    opsStore.orders.set(row.id, { ...row, claimed_by_slack: "my-claimer", status: "claimed" });
    try {
      const [claimed] = await listShopOrders(undefined, 10, { ...view("my-claimer"), search: "Privacy Test Item" });
      expect(claimed.player_name).toBe("Private Buyer");
      expect(claimed.player_slack).toBe("private-slack-handle");
      const [owner] = await listShopOrders(undefined, 10, { ...view("boss", true), search: "Privacy Test Item" });
      expect(owner.buyer_note).toBe("private-buyer-note");
    } finally {
      cleanup(row);
    }
  });

  test("a fulfiller cannot search an unclaimed order by the buyer's private handle or note", async () => {
    const row = seed();
    try {
      expect(await listShopOrders(undefined, 10, { ...view("other-fulfiller"), search: "private-slack-handle" })).toEqual([]);
      expect(await listShopOrders(undefined, 10, { ...view("other-fulfiller"), search: "private-buyer-note" })).toEqual([]);
      expect(await listShopOrders(undefined, 10, { ...view("other-fulfiller"), search: "buyerhandle" })).toEqual([]);
      expect((await listShopOrders(undefined, 10, { ...view("boss", true), search: "private-slack-handle" })).some((o) => o.id === row.id)).toBe(true);
    } finally {
      cleanup(row);
    }
  });

  test("getShopOrder honours the same viewer options", async () => {
    const row = seed();
    try {
      const restricted = await getShopOrder(row.id, view("other-fulfiller"));
      expect(restricted?.player_slack).toBeNull();
      const owner = await getShopOrder(row.id, view("boss", true));
      expect(owner?.player_slack).toBe("private-slack-handle");
    } finally {
      cleanup(row);
    }
  });
});
