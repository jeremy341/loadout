import { describe, expect, test } from "bun:test";
import {
  checkCostCents,
  checkFlaggable,
  checkGrantRef,
  checkShipmentEdit,
  checkStaffCancel,
  FLAG_CLEARED_STATUS,
  FLAG_STATUS,
  fulfilmentPayoutOre,
  fulfilmentStage,
  FULFILMENT_STAGE_LABELS,
  GRANT_CARRIER,
  isFlaggedFromEvents,
  itemCountOf,
  ORDER_TRACKING_MAX,
  PIXL_STAGE_KEY,
} from "./shop-rules";
import { checkLedgerEntry, LEDGER_KINDS, kindLabel } from "./ledger";

describe("LOADOUT stages over Pixl's keys", () => {
  test("a placed order without a claim is New; with an open claim it is Claimed", () => {
    expect(fulfilmentStage("placed", false)).toBe("new");
    expect(fulfilmentStage("placed", true)).toBe("claimed");
  });

  test("packed, shipped, delivered and cancelled keep their names", () => {
    expect(fulfilmentStage("packed", false)).toBe("packed");
    expect(fulfilmentStage("shipped", true)).toBe("shipped");
    expect(fulfilmentStage("delivered", false)).toBe("delivered");
    expect(fulfilmentStage("cancelled", false)).toBe("cancelled");
  });

  test("an unknown status is no stage at all", () => {
    expect(fulfilmentStage("lost", false)).toBeNull();
  });

  test("the reviewer pages' Pixl keys: Packed is credited, Delivered is done, New is pending", () => {
    expect(PIXL_STAGE_KEY).toEqual({ new: "pending", claimed: "claimed", packed: "credited", shipped: "shipped", delivered: "done", cancelled: "cancelled" });
    expect(FULFILMENT_STAGE_LABELS.packed).toBe("Packed");
    expect(FULFILMENT_STAGE_LABELS.shipped).toBe("Shipped");
    expect(FULFILMENT_STAGE_LABELS.delivered).toBe("Delivered");
  });
});

describe("flags", () => {
  const at = (ms: number) => new Date(1_700_000_000_000 + ms);

  test("no flag events means not flagged", () => {
    expect(isFlaggedFromEvents([{ status: "placed", at: at(0) }])).toBe(false);
  });

  test("the newest flag event decides", () => {
    expect(isFlaggedFromEvents([{ status: FLAG_STATUS, at: at(1) }])).toBe(true);
    expect(isFlaggedFromEvents([{ status: FLAG_STATUS, at: at(1) }, { status: FLAG_CLEARED_STATUS, at: at(2) }])).toBe(false);
    expect(isFlaggedFromEvents([{ status: FLAG_CLEARED_STATUS, at: at(1) }, { status: FLAG_STATUS, at: at(5) }])).toBe(true);
  });

  test("the order of the rows does not change the answer", () => {
    expect(isFlaggedFromEvents([{ status: FLAG_CLEARED_STATUS, at: at(9) }, { status: FLAG_STATUS, at: at(3) }])).toBe(false);
  });

  test("only a placed or packed order can be flagged", () => {
    expect(checkFlaggable("placed").ok).toBe(true);
    expect(checkFlaggable("packed").ok).toBe(true);
    expect(checkFlaggable("shipped").ok).toBe(false);
    expect(checkFlaggable("cancelled").ok).toBe(false);
  });
});

describe("staff cancel", () => {
  test("placed and packed can be cancelled and refunded; shipped and later cannot", () => {
    expect(checkStaffCancel("placed").ok).toBe(true);
    expect(checkStaffCancel("packed").ok).toBe(true);
    for (const status of ["shipped", "delivered", "cancelled"]) {
      const verdict = checkStaffCancel(status);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) expect(verdict.message).toContain(status);
    }
  });
});

describe("payouts", () => {
  test("2 Ore per item shipped, counting each unit", () => {
    expect(fulfilmentPayoutOre({ items: 1, grant: false })).toBe(2);
    expect(fulfilmentPayoutOre({ items: 3, grant: false })).toBe(6);
  });

  test("1 Ore per grant, whatever the number of items", () => {
    expect(fulfilmentPayoutOre({ items: 0, grant: true })).toBe(1);
    expect(fulfilmentPayoutOre({ items: 7, grant: true })).toBe(1);
  });

  test("nothing to pay is zero, never negative", () => {
    expect(fulfilmentPayoutOre({ items: 0, grant: false })).toBe(0);
    expect(fulfilmentPayoutOre({ items: -4, grant: false })).toBe(0);
  });

  test("items add up across lines", () => {
    expect(itemCountOf([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
    expect(itemCountOf([])).toBe(0);
  });

  test("a payout is a confirmed ledger earning, and the kind is known and labelled", () => {
    expect(LEDGER_KINDS).toContain("fulfilment_payout");
    expect(kindLabel("fulfilment_payout")).toBe("Fulfilment payout");
    const earned = checkLedgerEntry({ amountOre: 6, status: "confirmed", kind: "fulfilment_payout", reason: "Shipped LO-1101, 3 items" });
    expect(earned.ok).toBe(true);
    const spent = checkLedgerEntry({ amountOre: -6, status: "confirmed", kind: "fulfilment_payout", reason: "x" });
    expect(spent.ok).toBe(false);
  });
});

describe("grant reference", () => {
  test("a grant carries the reference as its tracking and the carrier Grant", () => {
    expect(GRANT_CARRIER).toBe("Grant");
    expect(checkGrantRef("  CODE-123  ")).toEqual({ ok: true, value: "CODE-123" });
  });

  test("it is required and bounded", () => {
    expect(checkGrantRef("   ").ok).toBe(false);
    expect(checkGrantRef(42).ok).toBe(false);
    expect(checkGrantRef("x".repeat(ORDER_TRACKING_MAX + 1)).ok).toBe(false);
  });
});

describe("shipment edits never clear a field", () => {
  test("a blank or missing field is left out of the update", () => {
    expect(checkShipmentEdit({ trackingNumber: "  ", carrier: "", supplier: null })).toEqual({ ok: true, value: {} });
    expect(checkShipmentEdit({})).toEqual({ ok: true, value: {} });
  });

  test("a filled field is trimmed and included", () => {
    expect(checkShipmentEdit({ trackingNumber: " 1Z9 ", carrier: "UPS", supplier: "Shop A" })).toEqual({
      ok: true,
      value: { trackingNumber: "1Z9", carrier: "UPS", supplier: "Shop A" },
    });
  });

  test("a field over its limit is refused", () => {
    expect(checkShipmentEdit({ trackingNumber: "x".repeat(ORDER_TRACKING_MAX + 1) }).ok).toBe(false);
  });
});

describe("cost", () => {
  test("a cost is a whole number of cents, zero or more", () => {
    expect(checkCostCents(0)).toEqual({ ok: true, value: 0 });
    expect(checkCostCents(1234)).toEqual({ ok: true, value: 1234 });
    expect(checkCostCents(-1).ok).toBe(false);
    expect(checkCostCents(12.5).ok).toBe(false);
    expect(checkCostCents(null).ok).toBe(false);
    expect(checkCostCents("12").ok).toBe(false);
  });
});
