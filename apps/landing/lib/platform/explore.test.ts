import { describe, expect, test } from "bun:test";
import { EXPLORE_QUERY_MAX, exploreHref, parseExploreQuery } from "./explore";

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
