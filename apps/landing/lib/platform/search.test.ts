import { describe, expect, test } from "bun:test";
import { highlightRanges, parseSearchQuery, rankResults, scoreProject, SEARCH_QUERY_MAX, SEARCH_TOKENS_MAX, type RankableRow } from "./search";

describe("parseSearchQuery", () => {
  test("non-strings and blanks", () => {
    expect(parseSearchQuery(undefined)).toEqual({ text: "", tokens: [], track: null, by: null });
    expect(parseSearchQuery(42).tokens).toEqual([]);
    expect(parseSearchQuery("   ").text).toBe("");
  });
  test("trims, collapses spaces and control characters, lower-cases tokens", () => {
    const p = parseSearchQuery("  Tiny \t\n  PARSER  ");
    expect(p.text).toBe("Tiny PARSER");
    expect(p.tokens).toEqual(["tiny", "parser"]);
  });
  test("cuts at 80 characters", () => {
    const p = parseSearchQuery("a".repeat(200));
    expect(p.text.length).toBe(SEARCH_QUERY_MAX);
    expect(parseSearchQuery(`${"a".repeat(79)} b`).text.endsWith("a")).toBe(true);
  });
  test("track filter", () => {
    const p = parseSearchQuery("track:Tools parser");
    expect(p.track).toBe("Tools");
    expect(p.tokens).toEqual(["parser"]);
  });
  test("unknown track stays a plain word; second track filter too", () => {
    expect(parseSearchQuery("track:nope").tokens).toEqual(["track:nope"]);
    const p = parseSearchQuery("track:tools track:compute");
    expect(p.track).toBe("Tools");
    expect(p.tokens).toEqual(["track:compute"]);
  });
  test("by filter with and without @", () => {
    expect(parseSearchQuery("by:juniper_dev").by).toBe("juniper_dev");
    expect(parseSearchQuery("by:@Juniper_Dev").by).toBe("juniper_dev");
    expect(parseSearchQuery("by:").tokens).toEqual(["by:"]);
    expect(parseSearchQuery("by:@").tokens).toEqual(["by:@"]);
    const twice = parseSearchQuery("by:a by:b");
    expect(twice.by).toBe("a");
    expect(twice.tokens).toEqual(["by:b"]);
  });
  test("leading @ dropped, duplicates removed, other colons kept", () => {
    expect(parseSearchQuery("@kestrel kestrel").tokens).toEqual(["kestrel"]);
    expect(parseSearchQuery("@ x").tokens).toEqual(["x"]);
    expect(parseSearchQuery("used:yes").tokens).toEqual(["used:yes"]);
    expect(parseSearchQuery(":x").tokens).toEqual([":x"]);
  });
  test("token count is capped", () => {
    const p = parseSearchQuery("a b c d e f g h");
    expect(p.tokens.length).toBe(SEARCH_TOKENS_MAX);
  });
});

const proj = (title: string, description: string | null = null, ownerHandle: string | null = null) => ({ title, description, ownerHandle });
const no = { saved: false, usedBy: 0 };

describe("scoreProject", () => {
  test("tier order", () => {
    const exact = scoreProject(proj("Tinyparse"), ["tinyparse"], no);
    const prefix = scoreProject(proj("Tinyparse"), ["tiny"], no);
    const contains = scoreProject(proj("Tinyparse"), ["parse"], no);
    const handleExact = scoreProject(proj("Zed", null, "kestrel"), ["kestrel"], no);
    const handleHas = scoreProject(proj("Zed", null, "kestrel_x"), ["kestr"], no);
    const desc = scoreProject(proj("Zed", "uses kestrel data"), ["kestrel"], no);
    const order = [exact, prefix, contains, handleExact, handleHas, desc];
    expect(order.every((n) => n > 0)).toBe(true);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
    expect(new Set(order).size).toBe(6);
  });
  test("no match is 0; every token must match", () => {
    expect(scoreProject(proj("Tinyparse"), ["zzz"], no)).toBe(0);
    expect(scoreProject(proj("Tinyparse", "config"), ["tiny", "zzz"], no)).toBe(0);
  });
  test("weakest token sets the tier", () => {
    const both = scoreProject(proj("Tinyparse", "config files"), ["tiny", "config"], no);
    const onlyTitle = scoreProject(proj("Tinyparse", "x"), ["tiny"], no);
    expect(both).toBeLessThan(onlyTitle);
  });
  test("a multi-word exact title is the top tier", () => {
    const exact = scoreProject(proj("Palette Forge"), ["palette", "forge"], no);
    const partial = scoreProject(proj("Palette Forge 2"), ["palette", "forge"], no);
    expect(exact).toBeGreaterThan(partial);
  });
  test("case-blind and null-safe", () => {
    expect(scoreProject(proj("TINYPARSE", null, null), ["tiny"], no)).toBeGreaterThan(0);
    expect(scoreProject(proj("x", null, null), ["kestrel"], no)).toBe(0);
  });
  test("saved and used-by break ties inside a tier, never across", () => {
    const base = scoreProject(proj("Tinyparse"), ["tiny"], no);
    const saved = scoreProject(proj("Tinyparse"), ["tiny"], { saved: true, usedBy: 0 });
    const used = scoreProject(proj("Tinyparse"), ["tiny"], { saved: false, usedBy: 5 });
    expect(saved).toBeGreaterThan(used);
    expect(used).toBeGreaterThan(base);
    const lowerTierSaved = scoreProject(proj("Zed", "tiny"), ["tiny"], { saved: true, usedBy: 99999 });
    expect(lowerTierSaved).toBeLessThan(base);
    expect(scoreProject(proj("a"), [], { saved: false, usedBy: -3 })).toBeGreaterThan(0);
  });
  test("browse mode matches everything", () => {
    expect(scoreProject(proj("Anything"), [], no)).toBeGreaterThan(0);
  });
});

const row = (id: string, title: string, over: Partial<RankableRow> = {}): RankableRow => ({
  id, title, description: null, ownerHandle: null, saved: false, usedBy: 0, createdAt: "2026-01-01T00:00:00Z", ...over,
});

describe("rankResults", () => {
  test("exact title, then prefix, then handle, then description", () => {
    const rows = [
      row("d", "Zed", { description: "about orbit" }),
      row("h", "Zed2", { ownerHandle: "orbit" }),
      row("p", "Orbit Sim"),
      row("e", "Orbit"),
      row("n", "Nothing"),
    ];
    expect(rankResults(rows, ["orbit"]).map((r) => r.id)).toEqual(["e", "p", "h", "d"]);
  });
  test("saved first on ties, then used-by, then newest, then id", () => {
    const rows = [
      row("a", "Orbit A", { createdAt: "2026-01-01T00:00:00Z" }),
      row("b", "Orbit B", { createdAt: "2026-03-01T00:00:00Z" }),
      row("c", "Orbit C", { usedBy: 2 }),
      row("d", "Orbit D", { saved: true }),
      row("e", "Orbit E", { createdAt: new Date("2026-03-01T00:00:00Z") }),
    ];
    expect(rankResults(rows, ["orbit"]).map((r) => r.id)).toEqual(["d", "c", "b", "e", "a"]);
  });
  test("browse mode keeps every row and orders by saved, used-by, newest", () => {
    const rows = [row("old", "A", { createdAt: "2025-01-01T00:00:00Z" }), row("new", "B"), row("sv", "C", { saved: true })];
    expect(rankResults(rows, []).map((r) => r.id)).toEqual(["sv", "new", "old"]);
  });
  test("bad dates sort as oldest", () => {
    const rows = [row("x", "Orbit", { createdAt: "nope" }), row("y", "Orbit")];
    expect(rankResults(rows, ["orbit"]).map((r) => r.id)).toEqual(["y", "x"]);
  });
});

describe("highlightRanges", () => {
  test("empty inputs", () => {
    expect(highlightRanges("", ["a"])).toEqual([]);
    expect(highlightRanges("abc", [])).toEqual([]);
    expect(highlightRanges("abc", ["", "  "])).toEqual([]);
  });
  test("case-blind, all occurrences", () => {
    expect(highlightRanges("Tiny tiny TINY", ["tiny"])).toEqual([{ start: 0, end: 4 }, { start: 5, end: 9 }, { start: 10, end: 14 }]);
  });
  test("overlapping and adjacent ranges merge", () => {
    expect(highlightRanges("abcdef", ["abc", "cde"])).toEqual([{ start: 0, end: 5 }]);
    expect(highlightRanges("abcdef", ["abc", "def"])).toEqual([{ start: 0, end: 6 }]);
    expect(highlightRanges("abcdef", ["bc", "abcdef"])).toEqual([{ start: 0, end: 6 }]);
  });
  test("separate tokens stay separate and sorted", () => {
    expect(highlightRanges("one two three", ["three", "one"])).toEqual([{ start: 0, end: 3 }, { start: 8, end: 13 }]);
  });
  test("no match", () => {
    expect(highlightRanges("abc", ["z"])).toEqual([]);
  });
  test("characters whose lower case changes length keep offsets", () => {
    expect(highlightRanges("İx x", ["x"])).toEqual([{ start: 1, end: 2 }, { start: 3, end: 4 }]);
  });
});
