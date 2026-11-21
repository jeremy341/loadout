import { describe, expect, test } from "bun:test";
import { filterOwnProjects, gridItems, paginate, parseProjectsQuery, projectsHref, stageCountLabel, stageTabs } from "./projects-view";

const p = (status: string, track: string | null = "Tools") => ({ status, track });

describe("parseProjectsQuery", () => {
  test("defaults", () => {
    expect(parseProjectsQuery({})).toEqual({ stage: "all", track: null, page: 1 });
  });
  test("reads stage, track and page", () => {
    expect(parseProjectsQuery({ stage: "in-review", track: "hardware", page: "3" })).toEqual({ stage: "in-review", track: "Hardware", page: 3 });
  });
  test("accepts needs_changes spelling and arrays", () => {
    expect(parseProjectsQuery({ stage: ["needs_changes", "draft"] }).stage).toBe("needs-changes");
  });
  test("unknown values fall back", () => {
    expect(parseProjectsQuery({ stage: "nope", track: "x", page: "-2" })).toEqual({ stage: "all", track: null, page: 1 });
    expect(parseProjectsQuery({ page: "0" }).page).toBe(1);
  });
});

describe("projectsHref", () => {
  test("leaves defaults out", () => {
    expect(projectsHref({ stage: "all", track: null, page: 1 })).toBe("/dashboard/projects");
    expect(projectsHref({ stage: "draft", track: "Tools", page: 2 })).toBe("/dashboard/projects?stage=draft&track=tools&page=2");
  });
});

describe("stageTabs and filter", () => {
  const list = [p("draft"), p("logging", "Systems"), p("needs_changes"), p("approved", null)];
  test("counts, zero kept", () => {
    const tabs = stageTabs(list);
    expect(tabs.map((t) => t.key)).toEqual(["all", "draft", "logging", "submitted", "in-review", "needs-changes", "approved"]);
    expect(tabs.map((t) => t.count)).toEqual([4, 1, 1, 0, 0, 1, 1]);
  });
  test("filters by stage and track", () => {
    expect(filterOwnProjects(list, { stage: "all", track: null })).toHaveLength(4);
    expect(filterOwnProjects(list, { stage: "needs-changes", track: null })).toHaveLength(1);
    expect(filterOwnProjects(list, { stage: "all", track: "Systems" })).toHaveLength(1);
    expect(filterOwnProjects(list, { stage: "draft", track: "Systems" })).toHaveLength(0);
  });
});

describe("paginate", () => {
  test("one page", () => expect(paginate(5, 1)).toEqual({ page: 1, pages: 1, from: 0, to: 5 }));
  test("clamps and slices", () => {
    expect(paginate(30, 2)).toEqual({ page: 2, pages: 2, from: 24, to: 30 });
    expect(paginate(30, 9).page).toBe(2);
    expect(paginate(0, 1)).toEqual({ page: 1, pages: 1, from: 0, to: 0 });
  });
});

test("stageCountLabel", () => {
  expect(stageCountLabel("Draft", 1)).toBe("Draft, 1 project");
  expect(stageCountLabel("Draft", 0)).toBe("Draft, 0 projects");
});

describe("gridItems", () => {
  const rows = Array.from({ length: 30 }, (_, index) => ({ id: `p${index}` }));
  const names = (items: ReturnType<typeof gridItems<{ id: string }>>["items"]) => items.map((item) => (item.kind === "new" ? "new" : item.project.id));
  test("the projects come in order, then the New project tile last", () => {
    const { items, paging } = gridItems(rows.slice(0, 3), 1);
    expect(names(items)).toEqual(["p0", "p1", "p2", "new"]);
    expect(paging.pages).toBe(1);
  });
  test("no projects still gives the tile", () => {
    expect(gridItems([], 1).items).toEqual([{ kind: "new" }]);
  });
  test("paging: the tile ends every page and the size counts projects", () => {
    const first = gridItems(rows, 1);
    expect(first.items).toHaveLength(25);
    expect(first.paging.pages).toBe(2);
    expect(names(gridItems(rows, 2).items)).toEqual(["p24", "p25", "p26", "p27", "p28", "p29", "new"]);
    expect(gridItems(rows, 99).paging.page).toBe(2);
  });
});
