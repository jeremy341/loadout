import { describe, expect, test } from "bun:test";
import { createSiteConfig } from "./site-config";

describe("public site configuration", () => {
  test("missing program destinations stay absent and previews stay unindexed", () => {
    const config = createSiteConfig();
    expect(config.joinUrl).toBeUndefined();
    expect(config.loginUrl).toBeUndefined();
    expect(config.origin).toBeUndefined();
    expect(config.allowIndexing).toBe(false);
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
