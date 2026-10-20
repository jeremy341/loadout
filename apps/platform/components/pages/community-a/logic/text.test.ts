import { describe, expect, test } from "bun:test";
import { checkHttpsUrl, checkLength, cleanText, findSimilarTitle, normaliseTitle, parseHttpsUrl, textLength } from "./text";

describe("cleanText", () => {
  test("trims, normalises newlines and collapses blank runs", () => {
    expect(cleanText("  hi  \r\n\r\n\r\n\r\nthere \n")).toBe("hi\n\nthere");
  });
});

describe("length checks", () => {
  test("counts characters as people do", () => {
    expect(textLength("a\u{1F600}b")).toBe(3);
  });
  test("required, min and max messages", () => {
    expect(checkLength("", "Title", { max: 5 })).toBe("Title is required.");
    expect(checkLength("ab", "Body", { min: 5, max: 9 })).toContain("at least 5");
    expect(checkLength("abcdef", "Body", { max: 5 })).toContain("at most 5");
    expect(checkLength("abcde", "Body", { max: 5 })).toBeNull();
  });
  test("the limit is inclusive", () => {
    expect(checkLength("x".repeat(80), "Title", { max: 80 })).toBeNull();
    expect(checkLength("x".repeat(81), "Title", { max: 80 })).not.toBeNull();
  });
});

describe("https URL validation", () => {
  test("accepts normal https links", () => {
    expect(parseHttpsUrl("https://github.com/you/project")).toBe("https://github.com/you/project");
    expect(checkHttpsUrl("https://example.org/a?b=1#c", "Link", { required: true, max: 300 })).toBeNull();
  });
  test("rejects http, other schemes and junk", () => {
    expect(parseHttpsUrl("http://example.org")).toBeNull();
    expect(parseHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpsUrl("data:text/html,hi")).toBeNull();
    expect(parseHttpsUrl("ftp://example.org")).toBeNull();
    expect(parseHttpsUrl("example.org")).toBeNull();
    expect(parseHttpsUrl("https://localhost")).toBeNull();
    expect(parseHttpsUrl("https://exa mple.org")).toBeNull();
    expect(parseHttpsUrl("https://user:pw@example.org")).toBeNull();
  });
  test("gives a clear message for plain http", () => {
    expect(checkHttpsUrl("http://example.org", "Link", { required: true, max: 300 })).toContain("https://");
  });
  test("empty is only an error when required", () => {
    expect(checkHttpsUrl("  ", "Link", { required: true, max: 300 })).toBe("Link is required.");
    expect(checkHttpsUrl("  ", "Link", { required: false, max: 300 })).toBeNull();
  });
  test("over-long links are rejected", () => {
    expect(checkHttpsUrl(`https://example.org/${"a".repeat(300)}`, "Link", { required: true, max: 300 })).toContain("at most 300");
  });
});

describe("duplicate titles", () => {
  const existing = [
    { id: "1", title: "Printable 3D case templates" },
    { id: "2", title: "Short" },
  ];
  test("normalises case and punctuation", () => {
    expect(normaliseTitle("  Hello,   World! ")).toBe("hello world");
  });
  test("finds an exact match after normalising", () => {
    expect(findSimilarTitle("printable 3d CASE templates!", existing)?.id).toBe("1");
  });
  test("finds a near match by shared words", () => {
    expect(findSimilarTitle("Printable 3D case templates docs", existing)?.id).toBe("1");
  });
  test("ignores unrelated titles, the edited item itself and empty titles", () => {
    expect(findSimilarTitle("Weekly build streak badges", existing)).toBeNull();
    expect(findSimilarTitle("Printable 3D case templates", existing, "1")).toBeNull();
    expect(findSimilarTitle("   ", existing)).toBeNull();
  });
});
