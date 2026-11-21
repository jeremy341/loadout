import { describe, expect, test } from "bun:test";
import { checkLinks, isStale, normaliseQuestion, overlap, pickFuzzy, QA_FUZZY_MIN, tokens } from "./qa";

describe("normaliseQuestion", () => {
  test("lower-cases, drops punctuation, collapses spaces", () => {
    expect(normaliseQuestion("  How do I   link my Slack?? ")).toBe("how do i link my slack");
  });

  test("keeps letters from other scripts and digits", () => {
    expect(normaliseQuestion("Größe 42!")).toBe("größe 42");
  });

  test("an empty or punctuation-only question normalises to empty", () => {
    expect(normaliseQuestion("?!...")).toBe("");
  });
});

describe("tokens", () => {
  test("unique words of the normalised question", () => {
    expect(tokens("how how do I")).toEqual(["how", "do", "i"]);
  });
});

describe("overlap", () => {
  test("identical questions score 1", () => {
    expect(overlap("Where is my Ore?", "where is my ore")).toBe(1);
  });

  test("the threshold is 0.8: a near copy passes, a different question fails", () => {
    expect(overlap("how do I link my slack account", "how do I link my slack account now")).toBeGreaterThanOrEqual(QA_FUZZY_MIN);
    expect(overlap("how do I link my slack account", "where do I see my ship history")).toBeLessThan(QA_FUZZY_MIN);
  });

  test("two empty questions score 0, never 1", () => {
    expect(overlap("?", "!")).toBe(0);
  });

  test("the score is symmetric", () => {
    expect(overlap("a b c", "b c d")).toBe(overlap("b c d", "a b c"));
  });
});

describe("pickFuzzy", () => {
  const rows = [
    { question: "how do i link slack", answer: "one" },
    { question: "how do i link my slack account", answer: "two" },
  ];

  test("returns the best row at or above the threshold", () => {
    expect(pickFuzzy("how do i link my slack account", rows)?.answer).toBe("two");
  });

  test("returns null when nothing is close enough", () => {
    expect(pickFuzzy("what is a ship", rows)).toBeNull();
  });

  test("a tie keeps the first (most recently confirmed) row", () => {
    const tied = [
      { question: "ore rate", answer: "new" },
      { question: "ore rate", answer: "old" },
    ];
    expect(pickFuzzy("ore rate", tied)?.answer).toBe("new");
  });
});

describe("isStale", () => {
  const now = new Date("2026-11-18T00:00:00.000Z");

  test("older than 30 days is stale, exactly 30 days is not", () => {
    expect(isStale(new Date("2026-10-19T00:00:00.000Z"), now)).toBe(false);
    expect(isStale(new Date("2026-10-18T23:59:59.000Z"), now)).toBe(true);
  });
});

describe("checkLinks", () => {
  test("site paths are accepted", () => {
    expect(checkLinks(["/docs/ore", "/docs/faq"])).toEqual({ ok: true, value: ["/docs/ore", "/docs/faq"] });
  });

  test("protocol-relative and absolute links are refused", () => {
    expect(checkLinks(["//evil.example/x"]).ok).toBe(false);
    expect(checkLinks(["https://example.com"]).ok).toBe(false);
  });

  test("at most 10 links", () => {
    expect(checkLinks(Array.from({ length: 11 }, () => "/docs")).ok).toBe(false);
  });

  test("a non-list is refused", () => {
    expect(checkLinks("/docs").ok).toBe(false);
  });
});
