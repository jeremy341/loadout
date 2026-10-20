import { describe, expect, test } from "bun:test";
import { allTags, filterIdeas, filterPosts, filterProjects, matchesQuery, paginate, sortIdeas, sortPosts, sortProjects } from "./query";
import type { Idea, SampleProject, ShowPost } from "./types";

const names: Record<string, string> = { ada: "Ada Cuts", bit: "Bit Ferry" };
const nameOf = (h: string) => names[h] ?? h;

function project(id: string, over: Partial<SampleProject> = {}): SampleProject {
  return { id, title: `Project ${id}`, summary: "summary", handle: "ada", track: "Tools", tags: ["cli"], repoText: "x", at: "2026-10-01T00:00:00.000Z", baseLikes: 1, journals: [], ...over };
}

describe("matchesQuery", () => {
  test("empty query matches everything", () => {
    expect(matchesQuery(["anything"], "  ")).toBe(true);
  });
  test("all words must match, case-insensitively, across fields", () => {
    expect(matchesQuery(["Quick Shell", "ada"], "quick ADA")).toBe(true);
    expect(matchesQuery(["Quick Shell", "ada"], "quick bit")).toBe(false);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 14 }, (_, i) => i + 1);
  test("first page of 12 then the rest", () => {
    const first = paginate(items, 1, 12);
    expect(first.items).toHaveLength(12);
    expect(first).toMatchObject({ page: 1, pageCount: 2, total: 14, from: 1, to: 12, hasPrev: false, hasNext: true });
    const second = paginate(items, 2, 12);
    expect(second.items).toEqual([13, 14]);
    expect(second).toMatchObject({ from: 13, to: 14, hasPrev: true, hasNext: false });
  });
  test("clamps out-of-range and invalid pages", () => {
    expect(paginate(items, 99, 12).page).toBe(2);
    expect(paginate(items, 0, 12).page).toBe(1);
    expect(paginate(items, Number.NaN, 12).page).toBe(1);
  });
  test("empty list has one empty page", () => {
    expect(paginate([], 3, 12)).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0, from: 0, to: 0, hasNext: false });
  });
  test("exact multiples do not add a blank page", () => {
    expect(paginate(Array.from({ length: 24 }, (_, i) => i), 1, 12).pageCount).toBe(2);
  });
});

describe("projects", () => {
  const list = [
    project("a", { title: "Quickshell", tags: ["cli", "rust"], at: "2026-10-12T00:00:00.000Z", baseLikes: 5 }),
    project("b", { title: "Shader lab", handle: "bit", track: "Compute", tags: ["gpu"], at: "2026-10-14T00:00:00.000Z", baseLikes: 9 }),
    project("c", { title: "Flame", track: "Systems", tags: ["rust"], at: "2026-10-14T00:00:00.000Z", baseLikes: 9 }),
  ];
  const all = { query: "", track: "all", tag: "all" } as const;
  test("filters by text including the builder's name", () => {
    expect(filterProjects(list, { ...all, query: "bit ferry" }, nameOf).map((p) => p.id)).toEqual(["b"]);
    expect(filterProjects(list, { ...all, query: "quick" }, nameOf).map((p) => p.id)).toEqual(["a"]);
  });
  test("filters by track and tag together", () => {
    expect(filterProjects(list, { ...all, tag: "rust" }, nameOf).map((p) => p.id)).toEqual(["a", "c"]);
    expect(filterProjects(list, { ...all, tag: "rust", track: "Systems" }, nameOf).map((p) => p.id)).toEqual(["c"]);
    expect(filterProjects(list, { ...all, track: "Hardware" }, nameOf)).toEqual([]);
  });
  test("lists tags once, sorted", () => {
    expect(allTags(list)).toEqual(["cli", "gpu", "rust"]);
  });
  test("sorts newest first, ties by id", () => {
    expect(sortProjects(list, "newest", (p) => p.baseLikes).map((p) => p.id)).toEqual(["c", "b", "a"]);
  });
  test("sorts by likes, ties by newest, without changing the input", () => {
    const copy = [...list];
    expect(sortProjects(list, "liked", (p) => p.baseLikes + (p.id === "a" ? 10 : 0)).map((p) => p.id)).toEqual(["a", "c", "b"]);
    expect(list).toEqual(copy);
  });
});

describe("ideas", () => {
  function idea(id: string, over: Partial<Idea> = {}): Idea {
    return { id, title: `Idea ${id.repeat(3)}`, body: "body", track: "Tools", status: "Open", handle: "ada", at: "2026-10-01T00:00:00.000Z", baseVotes: 0, ...over };
  }
  const list = [idea("a", { baseVotes: 3 }), idea("b", { status: "Planned", track: "Hardware", at: "2026-10-05T00:00:00.000Z", baseVotes: 3 }), idea("c", { status: "Withdrawn", track: "Any", baseVotes: 8 })];
  const none = { query: "", track: "all", status: "all" } as const;
  test("filters by status and track", () => {
    expect(filterIdeas(list, { ...none, status: "Planned" }, nameOf).map((i) => i.id)).toEqual(["b"]);
    expect(filterIdeas(list, { ...none, track: "Any" }, nameOf).map((i) => i.id)).toEqual(["c"]);
    expect(filterIdeas(list, { ...none, query: "idea aaa" }, nameOf).map((i) => i.id)).toEqual(["a"]);
  });
  test("top sorts by votes then newest; new sorts by date", () => {
    expect(sortIdeas(list, "top", (i) => i.baseVotes).map((i) => i.id)).toEqual(["c", "b", "a"]);
    expect(sortIdeas(list, "new", (i) => i.baseVotes).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
});

describe("posts", () => {
  function post(id: string, over: Partial<ShowPost> = {}): ShowPost {
    return { id, title: `Post ${id}`, built: "built", link: "https://example.org", track: "Tools", handle: "ada", at: "2026-10-01T00:00:00.000Z", baseLikes: 0, ...over };
  }
  const list = [post("a", { baseLikes: 1 }), post("b", { track: "Compute", learned: "caching", baseLikes: 5, at: "2026-10-03T00:00:00.000Z" })];
  test("filters by track and by the learned text", () => {
    expect(filterPosts(list, { query: "", track: "Compute" }, nameOf).map((p) => p.id)).toEqual(["b"]);
    expect(filterPosts(list, { query: "caching", track: "all" }, nameOf).map((p) => p.id)).toEqual(["b"]);
  });
  test("sorts", () => {
    expect(sortPosts(list, "new", (p) => p.baseLikes).map((p) => p.id)).toEqual(["b", "a"]);
    expect(sortPosts(list, "liked", (p) => p.baseLikes).map((p) => p.id)).toEqual(["b", "a"]);
  });
});
