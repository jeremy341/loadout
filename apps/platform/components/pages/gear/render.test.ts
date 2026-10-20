import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { findItem } from "../../shell/nav-data";
import { gearPages } from "./index";

// A server-render smoke test: every Gear page renders on the server (where there is no localStorage) without
// throwing, shows exactly one h1 equal to its nav label, and uses the nav purpose as its lead sentence.
describe("gear pages render on the server", () => {
  for (const [slug, Page] of Object.entries(gearPages)) {
    test(slug, () => {
      const item = findItem(slug);
      expect(item).toBeDefined();
      const html = renderToString(createElement(Page));
      const h1s = html.match(/<h1[^>]*>(.*?)<\/h1>/g) ?? [];
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toContain(`>${item!.label}</h1>`);
      expect(html).toContain("Gear");
      expect(html).toContain(item!.purpose.replace(/'/g, "&#x27;"));
      expect(html).toContain("Preview.");
    });
  }
});
