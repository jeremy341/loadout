import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ICON_NAMES, ICON_RECTS, PixelIcon } from "./icons";
import { NAV_GROUPS } from "./nav-data";

const UTILITY_NAMES = ["more", "theme", "external", "ore", "accessibility"];
const NAV_SLUGS = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.slug));

/** 16x16 occupancy grid; counts how many rects touch each pixel. */
function occupancy(name: string): number[][] {
  const grid = Array.from({ length: 16 }, () => Array<number>(16).fill(0));
  for (const [x, y, w, h] of ICON_RECTS[name]) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) grid[j][i] += 1;
  }
  return grid;
}

function coveredPixels(name: string): number {
  return occupancy(name).flat().filter((count) => count > 0).length;
}

/** Every unordered pair of items, in index order. */
function namePairs<T>(items: readonly T[]): [T, T][] {
  return items.flatMap((first, a) => items.slice(a + 1).map((second): [T, T] => [first, second]));
}

/** Intersection over union of two covered-pixel masks. */
function overlapRatio(first: readonly boolean[], second: readonly boolean[]): number {
  const both = first.filter((cell, i) => cell && second[i]).length;
  const either = first.filter((cell, i) => cell || second[i]).length;
  return both / either;
}

describe("icon coverage", () => {
  test("every nav slug has artwork", () => {
    for (const slug of NAV_SLUGS) {
      expect(ICON_RECTS[slug], `missing icon for nav slug "${slug}"`).toBeDefined();
      expect(ICON_NAMES).toContain(slug);
    }
  });

  test("utility icons exist", () => {
    for (const name of UTILITY_NAMES) {
      expect(ICON_RECTS[name], `missing utility icon "${name}"`).toBeDefined();
      expect(ICON_NAMES).toContain(name);
    }
  });

  test("ICON_NAMES lists exactly the names that have artwork", () => {
    expect([...ICON_NAMES].sort()).toEqual(Object.keys(ICON_RECTS).sort());
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
  });
});

describe("icon geometry", () => {
  test("every rect is whole-pixel, non-empty and inside the 16x16 grid", () => {
    for (const name of ICON_NAMES) {
      expect(ICON_RECTS[name].length, `${name} has no rects`).toBeGreaterThan(0);
      for (const rect of ICON_RECTS[name]) {
        expect(rect.length).toBe(4);
        const [x, y, w, h] = rect;
        for (const value of rect) expect(Number.isInteger(value), `${name}: ${rect.join(",")}`).toBe(true);
        expect(w, `${name}: ${rect.join(",")}`).toBeGreaterThanOrEqual(1);
        expect(h, `${name}: ${rect.join(",")}`).toBeGreaterThanOrEqual(1);
        expect(x, `${name}: ${rect.join(",")}`).toBeGreaterThanOrEqual(0);
        expect(y, `${name}: ${rect.join(",")}`).toBeGreaterThanOrEqual(0);
        expect(x + w, `${name}: ${rect.join(",")}`).toBeLessThanOrEqual(16);
        expect(y + h, `${name}: ${rect.join(",")}`).toBeLessThanOrEqual(16);
      }
    }
  });

  test("each icon covers 12 to 160 of the 256 pixels", () => {
    for (const name of ICON_NAMES) {
      const covered = coveredPixels(name);
      expect(covered, `${name} covers ${covered}px`).toBeGreaterThanOrEqual(12);
      expect(covered, `${name} covers ${covered}px`).toBeLessThanOrEqual(160);
    }
  });

  test("no two icons are identical, by rect set or by covered pixels", () => {
    const byRects = new Map<string, string>();
    const byPixels = new Map<string, string>();
    for (const name of ICON_NAMES) {
      const rectKey = JSON.stringify([...ICON_RECTS[name]].map((r) => r.join(",")).sort());
      const pixelKey = occupancy(name)
        .map((row) => row.map((count) => (count > 0 ? "1" : "0")).join(""))
        .join("/");
      expect(byRects.get(rectKey), `${name} has the same rects as ${byRects.get(rectKey)}`).toBeUndefined();
      expect(byPixels.get(pixelKey), `${name} covers the same pixels as ${byPixels.get(pixelKey)}`).toBeUndefined();
      byRects.set(rectKey, name);
      byPixels.set(pixelKey, name);
    }
  });

  test("no icon is a near-duplicate of another (at most 90% pixel overlap)", () => {
    const grids = ICON_NAMES.map((name) => ({ name, cells: occupancy(name).flat().map((count) => count > 0) }));
    for (const [first, second] of namePairs(grids)) {
      const similarity = overlapRatio(first.cells, second.cells);
      expect(similarity, `${first.name} vs ${second.name} overlap ${similarity.toFixed(2)}`).toBeLessThanOrEqual(0.9);
    }
  });
});

describe("PixelIcon", () => {
  test("renders one <rect> per data entry inside a currentColor 16x16 svg", () => {
    for (const name of ICON_NAMES) {
      const markup = renderToStaticMarkup(createElement(PixelIcon, { name, className: "icon" }));
      expect(markup.startsWith("<svg")).toBe(true);
      expect(markup).toContain('viewBox="0 0 16 16"');
      expect(markup).toContain('fill="currentColor"');
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('focusable="false"');
      expect(markup).toContain('shape-rendering="crispEdges"');
      expect(markup).toContain('class="icon"');
      expect(markup.match(/<rect /g)?.length, name).toBe(ICON_RECTS[name].length);
      expect(markup).not.toContain("stroke");
      expect(markup).not.toContain("gradient");
    }
  });

  test("the element tree has one rect child per data entry", () => {
    const element = PixelIcon({ name: "overview" });
    const children = (element.props as { children: unknown[] }).children;
    expect(Array.isArray(children) ? children.length : 1).toBe(ICON_RECTS.overview.length);
  });

  test("an unknown name renders a neutral glyph instead of throwing", () => {
    for (const name of ["no-such-icon", "", "constructor", "__proto__", "toString"]) {
      expect(() => renderToStaticMarkup(createElement(PixelIcon, { name }))).not.toThrow();
      const markup = renderToStaticMarkup(createElement(PixelIcon, { name }));
      expect(markup).toContain("<svg");
      expect(markup).toContain("<rect");
    }
  });
});
