import { describe, expect, test } from "bun:test";
import { builderBalances, formatOre, formatUsd, openOrdersToBuy, oreByTrack, oreCents, ordersByMonth, PLATFORM_BUDGET_CENTS, platformCentsPerDay, reserves, RUN_DAYS, UNDECIDED } from "./budget";
import { FULFILMENT_ORDERS, oreTotal } from "./fulfilment";
import { PLAYERS } from "./people";

describe("the decided figures", () => {
  test("the platform costs $300 for an 80 day run, which is $3.75 a day", () => {
    expect(PLATFORM_BUDGET_CENTS).toBe(30_000);
    expect(RUN_DAYS).toBe(80);
    expect(platformCentsPerDay()).toBe(375);
    expect(formatUsd(PLATFORM_BUDGET_CENTS)).toBe("$300.00");
  });

  test("10 Ore is $4.35", () => {
    expect(oreCents(10)).toBe(435);
    expect(oreCents(0)).toBe(0);
    expect(oreCents(-5)).toBe(0);
    expect(oreCents(4)).toBe(174);
    expect(oreCents(1)).toBe(44);
    expect(formatUsd(oreCents(1000))).toBe("$435.00");
  });

  test("money and Ore read plainly", () => {
    expect(formatUsd(5)).toBe("$0.05");
    expect(formatUsd(123456)).toBe("$1,234.56");
    expect(formatUsd(-250)).toBe("−$2.50");
    expect(formatOre(1234)).toBe("1,234 Ore");
  });

  test("what is not decided is never given a number", () => {
    expect(UNDECIDED.length).toBeGreaterThanOrEqual(3);
    for (const item of UNDECIDED) {
      expect(item.value).toMatch(/^Not /);
      expect(`${item.label} ${item.value} ${item.note}`).not.toMatch(/\$\d/);
    }
  });
});

describe("what is still owed", () => {
  test("a balance is what was earned less what was spent, and never below zero", () => {
    const rows = builderBalances();
    for (const row of rows) {
      expect(row.balance).toBe(Math.max(0, row.earned - row.spent));
      expect(row.balance).toBeGreaterThanOrEqual(0);
    }
    const sorted = [...rows].sort((a, b) => b.balance - a.balance || a.handle.localeCompare(b.handle));
    expect(rows).toEqual(sorted);
  });

  test("a builder with orders has them taken off", () => {
    const buyer = FULFILMENT_ORDERS[3].buyer;
    const row = builderBalances().find((item) => item.handle === buyer);
    expect(row?.spent).toBe(FULFILMENT_ORDERS.filter((order) => order.buyer === buyer && (order.status as string) !== "cancelled").reduce((sum, order) => sum + oreTotal(order), 0));
  });

  test("only orders whose cost is not recorded yet are reserved", () => {
    const open = openOrdersToBuy();
    expect(open.length).toBeGreaterThan(0);
    expect(open.every((order) => ["new", "claimed"].includes(order.status))).toBe(true);
    expect(open.some((order) => order.status === "new")).toBe(true);
  });

  test("a cancelled order costs nothing", () => {
    const cancelled = FULFILMENT_ORDERS.find((order) => (order.status as string) === "cancelled");
    if (!cancelled) return;
    expect(openOrdersToBuy([cancelled])).toEqual([]);
    expect(ordersByMonth([cancelled])).toEqual([]);
    expect(builderBalances(PLAYERS, [cancelled]).find((row) => row.handle === cancelled.buyer)?.spent ?? 0).toBe(0);
  });

  test("the total is the two lines, counted once, and agrees with the dollar rate", () => {
    const owed = reserves();
    expect(owed.lines.map((line) => line.id)).toEqual(["balances", "open-orders"]);
    expect(owed.totalOre).toBe(owed.lines[0].ore + owed.lines[1].ore);
    expect(owed.totalCents).toBe(owed.lines[0].cents + owed.lines[1].cents);
    expect(owed.lines[1].ore).toBe(openOrdersToBuy().reduce((sum, order) => sum + oreTotal(order), 0));
    expect(reserves([], []).totalCents).toBe(0);
  });
});

describe("the tables", () => {
  test("orders by month are newest first and add up to every order", () => {
    const rows = ordersByMonth();
    const counted = FULFILMENT_ORDERS.filter((order) => (order.status as string) !== "cancelled");
    expect(rows.reduce((sum, row) => sum + row.orders, 0)).toBe(counted.length);
    expect(rows.reduce((sum, row) => sum + row.ore, 0)).toBe(counted.reduce((sum, order) => sum + oreTotal(order), 0));
    expect(rows[0].month).toBe("Nov 2026");
    expect(Math.max(...rows.map((row) => row.share))).toBe(100);
    expect(ordersByMonth([])).toEqual([]);
  });

  test("Ore by track covers the four tracks at ten Ore an hour", () => {
    const rows = oreByTrack();
    expect(rows.map((row) => row.track)).toEqual(["Tools", "Systems", "Compute", "Hardware"]);
    for (const row of rows) expect(row.ore).toBe(row.hours * 10);
    expect(Math.max(...rows.map((row) => row.share))).toBe(100);
    expect(oreByTrack([]).every((row) => row.share === 0 && row.ore === 0)).toBe(true);
  });
});
