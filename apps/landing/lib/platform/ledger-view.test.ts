import { describe, expect, test } from "bun:test";
import { clampPage, cleanReason, confirmedShare, earnedAndSpent, entryDateText, ledgerHref, ledgerKindOptions, ledgerRowView, oreChipTitle, pageCount, parseLedgerQuery } from "./ledger-view";

describe("ledger query", () => {
  test("reads a known kind and a page", () => {
    expect(parseLedgerQuery({ kind: "shop_purchase", page: "3" })).toEqual({ kind: "shop_purchase", page: 3 });
  });
  test("ignores unknown kinds and bad pages", () => {
    expect(parseLedgerQuery({ kind: "nope", page: "-2" })).toEqual({ kind: null, page: 1 });
    expect(parseLedgerQuery({ page: "0" }).page).toBe(1);
    expect(parseLedgerQuery({ page: "2.5" }).page).toBe(1);
    expect(parseLedgerQuery({ page: "abc" }).page).toBe(1);
    expect(parseLedgerQuery({})).toEqual({ kind: null, page: 1 });
  });
  test("takes the first of repeated values", () => {
    expect(parseLedgerQuery({ kind: ["adjustment", "dev_seed"], page: ["2", "5"] })).toEqual({ kind: "adjustment", page: 2 });
  });
});

describe("pages and links", () => {
  test("page count and clamp", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(50)).toBe(1);
    expect(pageCount(51)).toBe(2);
    expect(clampPage(9, 51)).toBe(2);
    expect(clampPage(0, 51)).toBe(1);
  });
  test("links keep the kind and drop page 1", () => {
    expect(ledgerHref({})).toBe("/dashboard/ledger");
    expect(ledgerHref({ kind: "dev_seed", page: 1 })).toBe("/dashboard/ledger?kind=dev_seed");
    expect(ledgerHref({ kind: "dev_seed", page: 2 })).toBe("/dashboard/ledger?kind=dev_seed&page=2");
    expect(ledgerHref({ page: 3 })).toBe("/dashboard/ledger?page=3");
  });
});

describe("totals", () => {
  const now = new Date();
  test("earned and spent count confirmed entries only", () => {
    const rows = [
      { amountOre: 240, status: "confirmed", createdAt: now },
      { amountOre: -120, status: "confirmed", createdAt: now },
      { amountOre: 50, status: "confirmed", createdAt: now },
      { amountOre: 80, status: "pending", createdAt: now },
    ];
    expect(earnedAndSpent(rows)).toEqual({ earned: 290, spent: 120 });
  });
  test("bar share", () => {
    expect(confirmedShare(170, 80)).toBe(68);
    expect(confirmedShare(0, 0)).toBe(0);
    expect(confirmedShare(0, 40)).toBe(0);
    expect(confirmedShare(40, 0)).toBe(100);
  });
  test("chip title", () => {
    expect(oreChipTitle(0)).toBe("Ore, confirmed.");
    expect(oreChipTitle(80)).toBe("Ore, confirmed. 80 pending.");
  });
});

describe("kind options", () => {
  test("hides the sample kind outside development", () => {
    expect(ledgerKindOptions({ development: false })).not.toContain("dev_seed");
    expect(ledgerKindOptions({ development: true })).toContain("dev_seed");
  });
  test("keeps the sample kind when the address asks for it", () => {
    expect(ledgerKindOptions({ development: false, current: "dev_seed" })).toContain("dev_seed");
  });
});

describe("reasons and rows", () => {
  test("removes internal Desk ids", () => {
    expect(cleanReason("Approved: 2 new hours on Desk approve 1794869784110.")).toBe("Approved: 2 new hours.");
    expect(cleanReason("Pending Ore released on final approval (Desk approve 1794869784110).")).toBe("Pending Ore released on final approval.");
    expect(cleanReason("Sample entry: a Toolbelt reward.")).toBe("Sample entry: a Toolbelt reward.");
  });
  test("formats the date in UTC", () => {
    expect(entryDateText(new Date("2026-11-16T22:57:00Z"))).toBe("16 Nov, 22:57");
    expect(entryDateText(new Date("2026-01-03T04:05:00Z"))).toBe("3 Jan, 04:05");
  });
  test("a confirmed spend is signed with a minus and carries the balance", () => {
    const view = ledgerRowView({ amountOre: -120, status: "confirmed", kind: "shop_purchase", reason: "Spent", createdAt: new Date("2026-11-10T16:43:00Z") }, 120);
    expect(view.amountText).toBe("−120 Ore");
    expect(view.sign).toBe("out");
    expect(view.balanceText).toBe("120 Ore");
    expect(view.kind).toBe("Shop purchase");
  });
  test("a pending gain is signed with a plus and has no balance", () => {
    const view = ledgerRowView({ amountOre: 20, status: "pending", kind: "approved_hours", reason: "Waiting", createdAt: new Date("2026-11-16T22:56:00Z") }, 210);
    expect(view.amountText).toBe("+20 Ore");
    expect(view.status).toBe("pending");
    expect(view.statusText).toBe("Pending");
    expect(view.balanceText).toBeNull();
  });
});
