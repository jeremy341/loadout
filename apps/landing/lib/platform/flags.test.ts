import { describe, expect, test } from "bun:test";
import { createFlagReader, FLAG_CACHE_MS, KNOWN_FLAGS } from "./flags";

describe("createFlagReader", () => {
  test("reads through the cache within the TTL", async () => {
    let calls = 0;
    let clock = 0;
    const reader = createFlagReader(async () => {
      calls += 1;
      return true;
    }, FLAG_CACHE_MS, () => clock);

    expect(await reader.isOn("shop_voting")).toBe(true);
    clock += FLAG_CACHE_MS - 1;
    expect(await reader.isOn("shop_voting")).toBe(true);
    expect(calls).toBe(1);
  });

  test("reloads after the TTL and after forget", async () => {
    let calls = 0;
    let clock = 0;
    const reader = createFlagReader(async () => {
      calls += 1;
      return calls === 1 ? false : true;
    }, FLAG_CACHE_MS, () => clock);

    expect(await reader.isOn("workshops")).toBe(false);
    clock += FLAG_CACHE_MS;
    expect(await reader.isOn("workshops")).toBe(true);
    reader.forget("workshops");
    expect(await reader.isOn("workshops")).toBe(true);
    expect(calls).toBe(3);
  });
});

describe("KNOWN_FLAGS", () => {
  test("names only lowercase snake_case keys with a label", () => {
    for (const [name, label] of Object.entries(KNOWN_FLAGS)) {
      expect(name).toMatch(/^[a-z][a-z_]*$/);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
