import { describe, expect, test } from "bun:test";
import {
  EXPLORE_QUERY_MAX,
  emptyResultsKind,
  exploreHref,
  isFiltered,
  liveSearchUrl,
  pageWindow,
  parseExploreParams,
  parseExploreQuery,
  projectCountLine,
  railsToShow,
  usedMostRows,
} from "./explore";

describe("explore query", () => {
  test("an empty address shows everything", () => {
    expect(parseExploreQuery({})).toEqual({ q: "", track: null });
  });

  test("the search text is trimmed and capped", () => {
    expect(parseExploreQuery({ q: "  plotter  " }).q).toBe("plotter");
    expect(parseExploreQuery({ q: "x".repeat(500) }).q).toHaveLength(EXPLORE_QUERY_MAX);
  });

  test("a track is read from its slug, in any case", () => {
    expect(parseExploreQuery({ track: "tools" }).track).toBe("Tools");
    expect(parseExploreQuery({ track: "Hardware" }).track).toBe("Hardware");
  });

  test("an unknown track is ignored", () => {
    expect(parseExploreQuery({ track: "art" }).track).toBeNull();
  });

  test("a repeated parameter uses its first value", () => {
    expect(parseExploreQuery({ q: ["a", "b"], track: ["systems", "tools"] })).toEqual({ q: "a", track: "Systems" });
  });
});

describe("explore href", () => {
  test("the default view has no query", () => {
    expect(exploreHref({ q: "", track: null })).toBe("/dashboard/explore");
  });

  test("keeps the search text and the track", () => {
    expect(exploreHref({ q: "pen plotter", track: "Hardware" })).toBe("/dashboard/explore?q=pen+plotter&track=hardware");
    expect(exploreHref({ q: "", track: "Tools" })).toBe("/dashboard/explore?track=tools");
  });
});

describe("explore params", () => {
  test("defaults", () => {
    expect(parseExploreParams({})).toEqual({ q: "", track: null, saved: false, page: 1 });
  });
  test("saved reads 1 and true only", () => {
    expect(parseExploreParams({ saved: "1" }).saved).toBe(true);
    expect(parseExploreParams({ saved: "TRUE" }).saved).toBe(true);
    expect(parseExploreParams({ saved: "yes" }).saved).toBe(false);
  });
  test("a bad page is page 1 and a huge one is capped", () => {
    expect(parseExploreParams({ page: "0" }).page).toBe(1);
    expect(parseExploreParams({ page: "-3" }).page).toBe(1);
    expect(parseExploreParams({ page: "abc" }).page).toBe(1);
    expect(parseExploreParams({ page: "3" }).page).toBe(3);
    expect(parseExploreParams({ page: "99999" }).page).toBe(1000);
  });
  test("isFiltered", () => {
    expect(isFiltered({ q: "", track: null, saved: false })).toBe(false);
    expect(isFiltered({ q: "x", track: null, saved: false })).toBe(true);
    expect(isFiltered({ q: "", track: "Tools", saved: false })).toBe(true);
    expect(isFiltered({ q: "", track: null, saved: true })).toBe(true);
  });
  test("href carries saved and page", () => {
    expect(exploreHref({ q: "", track: null, saved: true })).toBe("/dashboard/explore?saved=1");
    expect(exploreHref({ q: "a", track: "Tools", saved: true, page: 2 })).toBe("/dashboard/explore?q=a&track=tools&saved=1&page=2");
    expect(exploreHref({ q: "", track: null, page: 1 })).toBe("/dashboard/explore");
  });
  test("live search url", () => {
    expect(liveSearchUrl({ q: "a b", track: "Tools", saved: true })).toBe("/platform-search?scope=explore&q=a+b&limit=12&track=tools&saved=1");
  });
});

describe("explore paging and rails", () => {
  test("page window", () => {
    expect(pageWindow(0, 1)).toEqual({ page: 1, pages: 1, offset: 0, hasPrev: false, hasNext: false });
    expect(pageWindow(25, 1)).toMatchObject({ pages: 2, hasNext: true, hasPrev: false });
    expect(pageWindow(25, 2)).toMatchObject({ offset: 24, hasNext: false, hasPrev: true });
    expect(pageWindow(25, 9).page).toBe(2);
  });
  test("count line", () => {
    expect(projectCountLine(0)).toBe("0 projects.");
    expect(projectCountLine(1)).toBe("1 project.");
    expect(projectCountLine(12)).toBe("12 projects.");
  });
  test("used most hides zero-use projects", () => {
    expect(usedMostRows([{ usedBy: 0 }, { usedBy: 2 }])).toEqual([{ usedBy: 2 }]);
    expect(usedMostRows([{ usedBy: 0 }])).toEqual([]);
  });
  test("rails with rows only", () => {
    expect(railsToShow([{ key: "saved", rows: [] }, { key: "new", rows: [1] }, { key: "tools", rows: [2, 3] }])).toEqual(["new", "tools"]);
  });
  test("empty kinds", () => {
    expect(emptyResultsKind({ q: "", saved: true }, false)).toBe("saved-none");
    expect(emptyResultsKind({ q: "x", saved: true }, false)).toBe("saved-no-match");
    expect(emptyResultsKind({ q: "x", saved: true }, true)).toBe("saved-no-match");
    expect(emptyResultsKind({ q: "x", saved: false }, true)).toBe("no-match");
  });
});
