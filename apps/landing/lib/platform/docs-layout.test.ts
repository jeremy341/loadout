import { describe, expect, test } from "bun:test";
import { DOCS_BACK, docsLayoutFor, isDocsPath } from "./docs-layout";
import { currentLink, isLinkCurrent } from "./nav";

describe("the docs layout choice", () => {
  test("a signed-in participant gets the platform shell", () => {
    expect(docsLayoutFor({ id: "person-1" })).toBe("platform");
  });

  test("a visitor gets the public docs layout", () => {
    expect(docsLayoutFor(null)).toBe("public");
    expect(docsLayoutFor(undefined)).toBe("public");
  });

  test("each layout has its own way back", () => {
    expect(DOCS_BACK.platform).toEqual({ href: "/dashboard/projects", label: "Back to projects" });
    expect(DOCS_BACK.public).toEqual({ href: "/", label: "Back to LOADOUT" });
  });

  test("only /docs and the pages under it count as docs", () => {
    for (const path of ["/docs", "/docs/start", "/docs/pricing", "/docs/faq"]) expect(isDocsPath(path)).toBe(true);
    for (const path of ["/", "/dashboard/projects", "/docsx", "/dashboard/docs"]) expect(isDocsPath(path)).toBe(false);
  });
});

describe("the Docs sidebar item", () => {
  test("is current on every docs page, and only there", () => {
    for (const path of ["/docs", "/docs/start", "/docs/pricing", "/docs/tracks", "/docs/faq", "/docs/faq/"]) {
      expect(isLinkCurrent(path, "/docs/start")).toBe(true);
      expect(currentLink(path)?.label).toBe("Docs");
    }
    expect(isLinkCurrent("/dashboard/explore", "/docs/start")).toBe(false);
    expect(isLinkCurrent("/docsx", "/docs/start")).toBe(false);
  });
});
