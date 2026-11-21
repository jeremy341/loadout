import { describe, expect, test } from "bun:test";
import { MAX_COST_USD, MAX_ORE_PRICE, parseCostUsd, parseOrePrice } from "./amounts";

describe("parseOrePrice", () => {
  test("accepts whole and decimal numbers, rounding to whole Ore", () => {
    expect(parseOrePrice("120")).toBe(120);
    expect(parseOrePrice(" 120.4 ")).toBe(120);
    expect(parseOrePrice("0")).toBe(0);
    expect(parseOrePrice(55)).toBe(55);
    expect(parseOrePrice(String(MAX_ORE_PRICE))).toBe(MAX_ORE_PRICE);
  });
  test("rejects blank, non-finite, huge, negative and odd formats", () => {
    for (const raw of ["", "  ", "abc", "NaN", "Infinity", "-1", "1e999", "1e3", "0x10", "1,5", String(MAX_ORE_PRICE + 1), "99999999999999999999", null, undefined, {}, Number.NaN, Number.POSITIVE_INFINITY, -4]) {
      expect(parseOrePrice(raw)).toBeNull();
    }
  });
});

describe("parseCostUsd", () => {
  test("accepts a cost to the cent", () => {
    expect(parseCostUsd("12.5")).toBe(12.5);
    expect(parseCostUsd("12.345")).toBe(12.35);
    expect(parseCostUsd("0")).toBe(0);
    expect(parseCostUsd(String(MAX_COST_USD))).toBe(MAX_COST_USD);
  });
  test("rejects blank, non-finite, huge and negative", () => {
    for (const raw of ["", "x", "-0.01", "Infinity", "1e999", String(MAX_COST_USD + 1), "9".repeat(30), null, undefined, Number.NaN]) {
      expect(parseCostUsd(raw)).toBeNull();
    }
  });
});
