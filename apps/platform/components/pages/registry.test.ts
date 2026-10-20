import { describe, expect, test } from "bun:test";
import { ROUTE_SLUGS } from "../shell/nav-data";
import { PAGES } from "./registry";

describe("page registry", () => {
  test("every routed tab has a page", () => {
    const missing = ROUTE_SLUGS.filter((slug) => !PAGES[slug]);
    expect(missing).toEqual([]);
  });

  test("no page is registered for an unknown tab", () => {
    const extra = Object.keys(PAGES).filter((slug) => !ROUTE_SLUGS.includes(slug));
    expect(extra).toEqual([]);
  });
});
