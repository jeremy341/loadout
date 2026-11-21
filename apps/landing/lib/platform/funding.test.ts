import { describe, expect, test } from "bun:test";
import { parseFundingAmount, usdToOre } from "./funding";
import { USD_PER_TEN_ORE } from "./review";

describe("parseFundingAmount", () => {
  test("empty is refused", () => {
    expect(parseFundingAmount("").ok).toBe(false);
    expect(parseFundingAmount("   ").ok).toBe(false);
  });
  test("zero is allowed", () => {
    expect(parseFundingAmount("0")).toEqual({ ok: true, usd: 0, cents: 0 });
  });
  test("negative is refused", () => {
    expect(parseFundingAmount("-5").ok).toBe(false);
    expect(parseFundingAmount("-0.01").ok).toBe(false);
  });
  test("more than two decimals is refused", () => {
    expect(parseFundingAmount("1.234").ok).toBe(false);
    expect(parseFundingAmount("1.23")).toEqual({ ok: true, usd: 1.23, cents: 123 });
    expect(parseFundingAmount("12.5")).toEqual({ ok: true, usd: 12.5, cents: 1250 });
  });
  test("not a number is refused", () => {
    expect(parseFundingAmount("abc").ok).toBe(false);
    expect(parseFundingAmount("1e3").ok).toBe(false);
  });
  test("cap parameter", () => {
    expect(parseFundingAmount("20", 20).ok).toBe(true);
    expect(parseFundingAmount("20.01", 20).ok).toBe(false);
    expect(parseFundingAmount("500").ok).toBe(true);
  });
});

describe("usdToOre", () => {
  test("the rate constant", () => {
    expect(USD_PER_TEN_ORE).toBe(4.35);
  });
  test("zero is zero Ore", () => {
    expect(usdToOre(0)).toBe(0);
  });
  test("exact multiples are not rounded up", () => {
    expect(usdToOre(4.35)).toBe(10);
    expect(usdToOre(43.5)).toBe(100);
  });
  test("rounds up", () => {
    expect(usdToOre(0.01)).toBe(1);
    expect(usdToOre(4.36)).toBe(11);
    expect(usdToOre(10)).toBe(Math.ceil((10 * 10) / 4.35));
  });
});
