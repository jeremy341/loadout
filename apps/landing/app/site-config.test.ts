import { describe, expect, test } from "bun:test";
import { createSiteConfig } from "./site-config";

describe("public site configuration", () => {
  test("the confirmed RSVP is the default while previews stay unindexed", () => {
    const config = createSiteConfig();
    expect(config.joinUrl).toBe("https://rsvp.soon.it/loadout");
    expect(config.loginUrl).toBeUndefined();
    expect(config.origin).toBeUndefined();
    expect(config.allowIndexing).toBe(false);
  });

  test("the IRL concept is visible by default and can be explicitly hidden", () => {
    expect(createSiteConfig().showIrlConcept).toBe(true);
    expect(createSiteConfig({ showIrlConcept: false }).showIrlConcept).toBe(false);
  });

  test("an explicit empty or unsafe override disables RSVP", () => {
    for (const joinUrl of ["", "http://example.com", "javascript:alert(1)", "https://user:password@example.com"]) {
      expect(createSiteConfig({ joinUrl }).joinUrl).toBeUndefined();
    }
  });

  test("only HTTPS destinations without credentials are accepted", () => {
    const config = createSiteConfig({ joinUrl: "javascript:alert(1)", loginUrl: "https://user:password@example.com", siteUrl: "invalid" });
    expect(config.joinUrl).toBeUndefined();
    expect(config.loginUrl).toBeUndefined();
    expect(config.origin).toBeUndefined();
  });

  test("a production origin still requires explicit indexing permission", () => {
    expect(createSiteConfig({ siteUrl: "https://loadout.example/path" }).allowIndexing).toBe(false);
    const config = createSiteConfig({ siteUrl: "https://loadout.example/path", joinUrl: "https://join.example/program", allowIndexing: true });
    expect(config.origin).toBe("https://loadout.example");
    expect(config.joinUrl).toBe("https://join.example/program");
    expect(config.allowIndexing).toBe(true);
  });
});
