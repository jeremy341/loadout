import { describe, expect, test } from "bun:test";
import { blockHandle, fileReport, filterVisible, hasReported, hiddenCount, hideRef, isVisible, unblockHandle, unhideAll, unhideRef } from "./moderation";
import type { ModerationState } from "./types";

const empty: ModerationState = { reports: [], hidden: [], blocked: [] };
const input = { ref: "idea:i1", label: "An idea", reason: "spam", note: "", hide: true, id: "r1", at: "2026-10-20T10:00:00.000Z" };

describe("fileReport", () => {
  test("stores the report and hides the item when asked", () => {
    const result = fileReport(empty, input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.reports).toHaveLength(1);
      expect(result.state.reports[0]).toMatchObject({ ref: "idea:i1", reason: "spam", at: "2026-10-20T10:00:00.000Z" });
      expect(result.state.hidden).toEqual(["idea:i1"]);
      expect(hasReported(result.state, "idea:i1")).toBe(true);
    }
  });
  test("can report without hiding", () => {
    const result = fileReport(empty, { ...input, hide: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.hidden).toEqual([]);
  });
  test("one report per item", () => {
    const first = fileReport(empty, input);
    if (!first.ok) throw new Error("expected ok");
    const again = fileReport(first.state, { ...input, id: "r2" });
    expect(again.ok).toBe(false);
  });
  test("needs a known reason and a short note", () => {
    expect(fileReport(empty, { ...input, reason: "" }).ok).toBe(false);
    expect(fileReport(empty, { ...input, reason: "because" }).ok).toBe(false);
    expect(fileReport(empty, { ...input, note: "x".repeat(301) }).ok).toBe(false);
    expect(fileReport(empty, { ...input, note: "x".repeat(300) }).ok).toBe(true);
  });
});

describe("hide and block", () => {
  test("hide and unhide are idempotent", () => {
    const hidden = hideRef(empty, "post:s1");
    expect(hideRef(hidden, "post:s1")).toBe(hidden);
    expect(unhideRef(hidden, "post:s1").hidden).toEqual([]);
    expect(unhideRef(empty, "post:s1")).toBe(empty);
  });
  test("unhideAll by kind keeps the other kinds", () => {
    const state = { ...empty, hidden: ["idea:a", "idea:b", "post:c"] };
    expect(unhideAll(state, "idea").hidden).toEqual(["post:c"]);
    expect(unhideAll(state).hidden).toEqual([]);
    expect(hiddenCount(state, "idea")).toBe(2);
    expect(hiddenCount(state, "idea", ["idea:a"])).toBe(1);
  });
  test("block and unblock are idempotent", () => {
    const blocked = blockHandle(empty, "ada-cuts");
    expect(blockHandle(blocked, "ada-cuts")).toBe(blocked);
    expect(unblockHandle(blocked, "ada-cuts").blocked).toEqual([]);
  });
});

describe("visibility", () => {
  const state: ModerationState = { reports: [], hidden: ["idea:i2"], blocked: ["bit-ferry"] };
  test("hidden items and blocked authors are filtered out", () => {
    const items = [
      { ref: "idea:i1", by: "ada-cuts" },
      { ref: "idea:i2", by: "ada-cuts" },
      { ref: "idea:i3", by: "bit-ferry" },
    ];
    expect(filterVisible(items, state, (i) => i.ref, (i) => i.by).map((i) => i.ref)).toEqual(["idea:i1"]);
  });
  test("your own content is never hidden from you", () => {
    expect(isVisible({ ...state, hidden: ["idea:mine"] }, "idea:mine", "you")).toBe(true);
  });
  test("unblocking brings the content back", () => {
    expect(isVisible(unblockHandle(state, "bit-ferry"), "idea:i3", "bit-ferry")).toBe(true);
  });
});
