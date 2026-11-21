import { describe, expect, test } from "bun:test";
import { ORDERS } from "./orders";
import { viewCount, viewLines, viewSummary, viewTotal, type ViewOrder } from "./orders-view";
import { sampleApprovedHours } from "./shop";

const approved = sampleApprovedHours();

describe("orders view", () => {
  test("a fixture order is priced by the catalog", () => {
    expect(viewTotal(ORDERS[0], approved)).toBeGreaterThan(0);
    expect(viewLines(ORDERS[0], approved).length).toBe(2);
  });

  test("a real order shows what was paid, not today's price", () => {
    const order: ViewOrder = {
      id: "lo-1101",
      number: "LO-1101",
      status: "placed",
      dates: {},
      lines: [{ itemId: "pico-w", quantity: 2 }],
      totalOre: 7,
      paid: [
        { itemId: "pico-w", option: "", quantity: 1, unitOre: 3 },
        { itemId: "pico-w", option: "", quantity: 1, unitOre: 4 },
      ],
    };
    expect(viewTotal(order, approved)).toBe(7);
    const lines = viewLines(order, approved);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
    expect(lines[0].total).toBe(7);
    expect(viewCount(order, approved)).toBe(2);
    expect(viewSummary(order, approved)).toContain("x2");
  });
});
