import { describe, expect, test } from "bun:test";
import { areaOf, buildExport, exportFileName, parseImport } from "./transfer";

const AT = "2026-10-20T10:30:00.000Z";
const ledger = [{ id: "a", amount: 100, reason: "Open", source: "preview", at: AT }];

describe("buildExport", () => {
  test("wraps every stored key in a marked file, sorted", () => {
    const { text, count, skipped } = buildExport({ "hub.profile": JSON.stringify({ a: 1 }), "ore-ledger": JSON.stringify(ledger) }, AT);
    const file = JSON.parse(text);
    expect(file.format).toBe("loadout-platform-preview");
    expect(file.version).toBe(1);
    expect(file.exportedAt).toBe(AT);
    expect(Object.keys(file.entries)).toEqual(["hub.profile", "ore-ledger"]);
    expect(count).toBe(2);
    expect(skipped).toBe(0);
  });

  test("skips a value that is not JSON and a key with a bad shape", () => {
    const { text, skipped } = buildExport({ ok: "1", broken: "{nope", "bad key!": "1" }, AT);
    expect(Object.keys(JSON.parse(text).entries)).toEqual(["ok"]);
    expect(skipped).toBe(2);
  });

  test("an empty store still produces a valid file", () => {
    const { text, count } = buildExport({}, AT);
    expect(count).toBe(0);
    expect(JSON.parse(text).entries).toEqual({});
  });

  test("file name uses the day", () => {
    expect(exportFileName(AT)).toBe("loadout-preview-2026-10-20.json");
    expect(exportFileName("junk")).toBe("loadout-preview-backup.json");
  });
});

describe("parseImport", () => {
  const good = (entries: Record<string, unknown>, over: Record<string, unknown> = {}) =>
    JSON.stringify({ format: "loadout-platform-preview", version: 1, exportedAt: AT, entries, ...over });

  test("round trip: what we export we can import", () => {
    const { text } = buildExport({ "hub.profile": JSON.stringify({ displayName: "Nova" }), "ore-ledger": JSON.stringify(ledger) }, AT);
    const result = parseImport(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.count).toBe(2);
    expect(result.exportedAt).toBe(AT);
    expect(result.areas).toEqual(["hub", "ore-ledger"]);
    expect(result.entries["hub.profile"]).toEqual({ displayName: "Nova" });
  });

  test("rejects text that is not JSON, not ours, or the wrong version", () => {
    expect(parseImport("{nope").ok).toBe(false);
    expect(parseImport("[]").ok).toBe(false);
    expect(parseImport(JSON.stringify({ entries: { a: 1 } })).ok).toBe(false);
    expect(parseImport(good({ a: 1 }, { version: 2 })).ok).toBe(false);
    expect(parseImport(good({ a: 1 }, { version: "1" })).ok).toBe(false);
  });

  test("rejects an empty or missing data section", () => {
    expect(parseImport(good({})).ok).toBe(false);
    expect(parseImport(good({}, { entries: [] })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ format: "loadout-platform-preview", version: 1 })).ok).toBe(false);
  });

  test("rejects unsafe or odd keys, including a prototype key", () => {
    expect(parseImport(good({ "bad key": 1 })).ok).toBe(false);
    expect(parseImport(`{"format":"loadout-platform-preview","version":1,"entries":{"__proto__":{"x":1}}}`).ok).toBe(false);
    expect(parseImport(good({ ["a".repeat(81)]: 1 })).ok).toBe(false);
  });

  test("rejects a malformed Ore ledger or notifications list", () => {
    expect(parseImport(good({ "ore-ledger": [{ id: "a", amount: 1.5, reason: "x", source: "y", at: AT }] })).ok).toBe(false);
    expect(parseImport(good({ "ore-ledger": "lots" })).ok).toBe(false);
    expect(parseImport(good({ notifications: [{ id: "n", title: "t", at: AT, read: false, kind: "weird" }] })).ok).toBe(false);
    expect(parseImport(good({ notifications: [{ id: "n", title: "t", at: AT, read: false, kind: "system" }] })).ok).toBe(true);
  });

  test("rejects a ledger whose balance would be negative", () => {
    const negative = [{ id: "a", amount: -5, reason: "x", source: "y", at: AT }];
    expect(parseImport(good({ "ore-ledger": negative })).ok).toBe(false);
  });

  test("rejects a file that is too big or has too many entries", () => {
    expect(parseImport("x".repeat(2_000_001)).ok).toBe(false);
    const many = Object.fromEntries(Array.from({ length: 201 }, (_, i) => [`k${i}`, i]));
    expect(parseImport(good(many)).ok).toBe(false);
  });

  test("areaOf", () => {
    expect(areaOf("hub.profile")).toBe("hub");
    expect(areaOf("ore-ledger")).toBe("ore-ledger");
  });
});
