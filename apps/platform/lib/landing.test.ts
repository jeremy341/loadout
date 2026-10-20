import { describe, expect, test } from "bun:test";
import { landingHref, normalizeOrigin } from "./landing";

describe("landing links", () => {
  test("normalizeOrigin trims whitespace and trailing slashes", () => {
    expect(normalizeOrigin(undefined)).toBe("");
    expect(normalizeOrigin("  https://example.test// ")).toBe("https://example.test");
  });

  test("landingHref joins origin and path", () => {
    expect(landingHref("/docs", "https://example.test")).toBe("https://example.test/docs");
    expect(landingHref("accessibility", "https://example.test")).toBe("https://example.test/accessibility");
    expect(landingHref("/docs", "")).toBe("/docs");
  });
});
