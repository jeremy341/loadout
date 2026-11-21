import { describe, expect, test } from "bun:test";
import { airbridgeBatchSize, airbridgeMappings, rotatingBatch } from "./airbridge-preview";
import { parseApproval } from "@/reviewer-dash/lib/eligibility/airbridgeApi";

const id = "rec12345678901234";

test("accepts explicit mappings and rejects duplicate or invalid IDs", () => {
  expect(airbridgeMappings(undefined).size).toBe(0);
  expect(airbridgeMappings(`42:${id}`).get(42)).toBe(id);
  expect(() => airbridgeMappings(`42:${id},43:${id}`)).toThrow();
  expect(() => airbridgeMappings(`42:${id},42:rec98765432109876`)).toThrow();
  expect(() => airbridgeMappings("42:invalid")).toThrow();
});

describe("rotating batches", () => {
  test("the batch size is configurable with a safe fallback and cap", () => {
    expect(airbridgeBatchSize(undefined)).toBe(10);
    expect(airbridgeBatchSize("25")).toBe(25);
    expect(airbridgeBatchSize("0")).toBe(10);
    expect(airbridgeBatchSize("nonsense")).toBe(10);
    expect(airbridgeBatchSize("1000")).toBe(100);
  });

  test("successive cursors visit different candidates and wrap around", () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(rotatingBatch(items, 2, 0)).toEqual([1, 2]);
    expect(rotatingBatch(items, 2, 1)).toEqual([2, 3]);
    expect(rotatingBatch(items, 2, 2)).toEqual([3, 4]);
    expect(rotatingBatch(items, 2, 5)).toEqual([6, 1]);
    expect(rotatingBatch(items, 10, 0)).toEqual(items);
    expect(rotatingBatch([], 10, 0)).toEqual([]);
  });
});

test("approvals must belong to the configured program", () => {
  const row = { id, fields: {
    "Record ID": id, "YSWS–Name": ["LOADOUT"], "Hours Spent": 2,
    "Code URL": "https://github.com/example/repo", "Approved At": "2025-01-01",
  } };
  expect(parseApproval(row, id, "LOADOUT").hours).toBe(2);
  expect(() => parseApproval(row, id, "Pixl")).toThrow("another YSWS");
});
