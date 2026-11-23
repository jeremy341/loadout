import { describe, expect, test } from "bun:test";
import { combineHits, moveCursor, pageHits, parseSearchBody, startsGroup } from "./paletteSearch";
import type { NavModel } from "./nav";

const nav: NavModel = {
  primary: [{ href: "/", label: "Overview", glyph: "dashboard-meter" }],
  groups: [{ label: "Queues", glyph: "view", items: [{ href: "/review", label: "Review", glyph: "view" }] }],
};

describe("pageHits", () => {
  test("lists every page for an empty term, labelled by group", () => {
    expect(pageHits(nav, "").map((h) => [h.label, h.group])).toEqual([
      ["Overview", "Pages"],
      ["Review", "Queues"],
    ]);
  });
  test("filters by a case-insensitive label match", () => {
    expect(pageHits(nav, "  REV ").map((h) => h.label)).toEqual(["Review"]);
  });
});

describe("combineHits", () => {
  test("maps builders and projects to their pages", () => {
    const hits = combineHits([], [{ id: "7", label: "Ada", sub: "ada" }], [{ id: 3, label: "Thing" }]);
    expect(hits.map((h) => [h.href, h.group])).toEqual([
      ["/players/7", "Builders"],
      ["/projects/3", "Projects"],
    ]);
  });
});

describe("moveCursor", () => {
  test("stays inside the list", () => {
    expect(moveCursor("ArrowDown", 2, 3)).toBe(2);
    expect(moveCursor("ArrowUp", 0, 3)).toBe(0);
    expect(moveCursor("ArrowDown", 0, 3)).toBe(1);
    expect(moveCursor("x", 1, 3)).toBe(1);
  });
});

describe("startsGroup", () => {
  test("is true on the first row and when the group changes", () => {
    const hits = pageHits(nav, "");
    expect(startsGroup(hits, 0)).toBe(true);
    expect(startsGroup([hits[0], hits[0]], 1)).toBe(false);
    expect(startsGroup(hits, 1)).toBe(true);
  });
});

describe("parseSearchBody", () => {
  test("reads builders first, then the legacy players key", () => {
    const p = [{ id: "1", label: "a", sub: "b" }];
    expect(parseSearchBody({ players: p }).builders).toBe(p);
    expect(parseSearchBody({ builders: [], players: p }).builders).toEqual([]);
    expect(parseSearchBody({}).projects).toEqual([]);
  });
});
