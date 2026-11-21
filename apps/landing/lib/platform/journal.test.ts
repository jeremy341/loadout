import { describe, expect, it } from "bun:test";
import { checkJournalBody, checkJournalHours, checkJournalTitle, entriesOwed, formatHours, journalDue, journalOpen, timelapseAdvice, wordCount } from "./journal";

describe("checkJournalTitle", () => {
  it("trims and collapses spaces", () => {
    const r = checkJournalTitle("  First   parser ");
    expect(r.ok && r.value).toBe("First parser");
  });
  it("rejects empty and non-strings", () => {
    expect(checkJournalTitle("   ").ok).toBe(false);
    expect(checkJournalTitle(null).ok).toBe(false);
    expect(checkJournalTitle(4).ok).toBe(false);
  });
  it("allows 120 characters and no more", () => {
    expect(checkJournalTitle("a".repeat(120)).ok).toBe(true);
    expect(checkJournalTitle("a".repeat(121)).ok).toBe(false);
  });
});

describe("checkJournalBody", () => {
  it("accepts markdown and normalises line endings", () => {
    const r = checkJournalBody("# Done\r\n- parsed\r\n");
    expect(r.ok && r.value).toBe("# Done\n- parsed");
  });
  it("rejects empty and non-strings", () => {
    expect(checkJournalBody("").ok).toBe(false);
    expect(checkJournalBody(undefined).ok).toBe(false);
  });
  it("allows 5000 characters and no more", () => {
    expect(checkJournalBody("a".repeat(5000)).ok).toBe(true);
    expect(checkJournalBody("a".repeat(5001)).ok).toBe(false);
  });
});

describe("checkJournalHours", () => {
  it("accepts quarter hour steps in range, as numbers or strings", () => {
    for (const v of [0.25, 0.5, 1, 1.75, 7.25, 12, "2.5", " 3 "]) expect(checkJournalHours(v).ok).toBe(true);
    const r = checkJournalHours("2.5");
    expect(r.ok && r.value).toBe(2.5);
  });
  it("rejects empty and non-numeric input", () => {
    expect(checkJournalHours("").ok).toBe(false);
    expect(checkJournalHours(null).ok).toBe(false);
    expect(checkJournalHours(undefined).ok).toBe(false);
    expect(checkJournalHours("abc").ok).toBe(false);
    expect(checkJournalHours(Number.NaN).ok).toBe(false);
  });
  it("rejects below 0.25 and above 12", () => {
    expect(checkJournalHours(0).ok).toBe(false);
    expect(checkJournalHours(0.2).ok).toBe(false);
    expect(checkJournalHours(-1).ok).toBe(false);
    expect(checkJournalHours(12.25).ok).toBe(false);
    expect(checkJournalHours(13).ok).toBe(false);
  });
  it("rejects steps that are not quarter hours", () => {
    expect(checkJournalHours(1.1).ok).toBe(false);
    expect(checkJournalHours("0.3").ok).toBe(false);
    expect(checkJournalHours(2.51).ok).toBe(false);
  });
  it("rejects booleans and arrays instead of coercing them to hours", () => {
    expect(checkJournalHours(true).ok).toBe(false);
    expect(checkJournalHours(false).ok).toBe(false);
    expect(checkJournalHours([2.5]).ok).toBe(false);
    expect(checkJournalHours(["12"]).ok).toBe(false);
  });
});

describe("wordCount", () => {
  it("counts words", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("   ")).toBe(0);
    expect(wordCount("one")).toBe(1);
    expect(wordCount(" a  b\nc\td ")).toBe(4);
  });
});

describe("timelapseAdvice", () => {
  it("is silent up to 7 hours", () => {
    expect(timelapseAdvice(0.25)).toBeNull();
    expect(timelapseAdvice(7)).toBeNull();
    expect(timelapseAdvice(Number.NaN)).toBeNull();
  });
  it("recommends a timelapse over 7 hours, in plain words with no dashes", () => {
    const advice = timelapseAdvice(7.25);
    expect(advice).toContain("timelapse");
    expect(advice).not.toMatch(/[–—]|\s-\s/);
    expect(timelapseAdvice(12)).toBe(advice);
  });
});

describe("journalDue", () => {
  it("is all the hours with no entries", () => expect(journalDue(5, 0)).toBe(5));
  it("subtracts 8 hours per entry", () => {
    expect(journalDue(20, 1)).toBe(12);
    expect(journalDue(20, 2)).toBe(4);
  });
  it("is never negative", () => {
    expect(journalDue(4, 3)).toBe(0);
    expect(journalDue(-5, 0)).toBe(0);
    expect(journalDue(Number.NaN, 0)).toBe(0);
    expect(journalDue(10, -2)).toBe(10);
  });
  it("is zero exactly at the boundary", () => expect(journalDue(8, 1)).toBe(0));
  it("treats a NaN entry count as no entries, not as a NaN result", () => {
    expect(journalDue(10, Number.NaN)).toBe(10);
    expect(entriesOwed(10, Number.NaN)).toBe(2);
  });
});

describe("entriesOwed", () => {
  it("rounds up to whole entries", () => {
    expect(entriesOwed(0, 0)).toBe(0);
    expect(entriesOwed(5, 0)).toBe(1);
    expect(entriesOwed(20, 1)).toBe(2);
    expect(entriesOwed(16, 2)).toBe(0);
    expect(entriesOwed(16.25, 2)).toBe(1);
  });
});

describe("journalOpen", () => {
  it("is open for draft, logging and needs-changes only", () => {
    for (const s of ["draft", "logging", "needs-changes"]) expect(journalOpen(s)).toBe(true);
    for (const s of ["in-review", "approved", "rejected", "submitted", ""]) expect(journalOpen(s)).toBe(false);
  });
});

describe("formatHours", () => {
  it("formats singular, plural and fractions", () => {
    expect(formatHours(1)).toBe("1 hour");
    expect(formatHours(2.25)).toBe("2.25 hours");
    expect(formatHours(0.5)).toBe("0.5 hours");
  });
  it("pluralises the rounded number it actually displays", () => {
    expect(formatHours(0.999)).toBe("1 hour");
    expect(formatHours(1.004)).toBe("1 hour");
  });
});
